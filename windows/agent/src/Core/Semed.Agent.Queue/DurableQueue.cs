using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Semed.Agent.Protocol;
using Semed.Agent.Util;

namespace Semed.Agent.Queue;

public sealed class DurableQueue
{
	private static readonly string[] QuarantineDirs = new string[3] { "rejected", "conflict", "corrupt" };

	private readonly string _dir;

	private readonly string _statsPath;

	private readonly object _gate = new object();

	private readonly FileLog? _log;

	public int MaxInventories { get; init; } = 100;

	public long MaxBytes { get; init; } = 16777216L;

	public int MaxQuarantineFiles { get; init; } = 200;

	public long MaxQuarantineBytes { get; init; } = 4194304L;

	public QueueStats Stats
	{
		get
		{
			lock (_gate)
			{
				return LoadStats();
			}
		}
	}

	internal bool SimulateCrashAfterItemWrite { get; set; }

	public int Count
	{
		get
		{
			lock (_gate)
			{
				return ItemFiles().Count();
			}
		}
	}

	public DurableQueue(string directory, FileLog? log = null)
	{
		_dir = directory;
		_log = log;
		Directory.CreateDirectory(_dir);
		string[] quarantineDirs = QuarantineDirs;
		foreach (string path in quarantineDirs)
		{
			Directory.CreateDirectory(Path.Combine(_dir, path));
		}
		_statsPath = Path.Combine(_dir, "stats.json");
		AtomicFile.CleanupOrphans(_dir);
		lock (_gate)
		{
			MigrateLegacyStats();
			ReconcileGaps();
		}
	}

	private void MigrateLegacyStats()
	{
		if (!File.Exists(_statsPath))
		{
			return;
		}
		QueueStats queueStats;
		try
		{
			queueStats = AgentJson.Deserialize<QueueStats>(File.ReadAllBytes(_statsPath));
		}
		catch
		{
			return;
		}
		if (queueStats?.PendingGap == null)
		{
			return;
		}
		QueueStats s = LoadStats();
		try
		{
			SaveStats(s);
			_log?.Info("queue_stats_migrated legacy_pending_gap=1");
		}
		catch (Exception ex)
		{
			_log?.Warn("queue_stats_migration_save_failed type=" + ex.GetType().Name);
		}
	}

	internal static string LegacyGapId(LegacyGap g)
	{
		byte[] array = SHA256.HashData(Encoding.UTF8.GetBytes($"semed-legacy-gap-v1|{g.DroppedCount}|{g.DroppedChangeCount}|{g.FirstDroppedCollectedAt}|{g.LastDroppedCollectedAt}")).AsSpan(0, 16).ToArray();
		array[6] = (byte)((array[6] & 0xF) | 0x50);
		array[8] = (byte)((array[8] & 0x3F) | 0x80);
		string text = Convert.ToHexStringLower(array);
		DefaultInterpolatedStringHandler defaultInterpolatedStringHandler = new DefaultInterpolatedStringHandler(4, 5);
		defaultInterpolatedStringHandler.AppendFormatted(text.Substring(0, 8));
		defaultInterpolatedStringHandler.AppendLiteral("-");
		defaultInterpolatedStringHandler.AppendFormatted(text.Substring(8, 4));
		defaultInterpolatedStringHandler.AppendLiteral("-");
		defaultInterpolatedStringHandler.AppendFormatted(text.Substring(12, 4));
		defaultInterpolatedStringHandler.AppendLiteral("-");
		defaultInterpolatedStringHandler.AppendFormatted(text.Substring(16, 4));
		defaultInterpolatedStringHandler.AppendLiteral("-");
		string text2 = text;
		defaultInterpolatedStringHandler.AppendFormatted(text2.Substring(20, text2.Length - 20));
		return defaultInterpolatedStringHandler.ToStringAndClear();
	}

	private void ReconcileGaps()
	{
		QueueStats queueStats = LoadStats();
		if (queueStats.Gaps.Count == 0)
		{
			return;
		}
		Dictionary<string, string> dictionary = new Dictionary<string, string>(StringComparer.Ordinal);
		HashSet<string> hashSet = new HashSet<string>(StringComparer.Ordinal);
		foreach (string item in ItemFiles())
		{
			QueueItem queueItem = TryRead(item);
			if (queueItem == null)
			{
				continue;
			}
			hashSet.Add(queueItem.MessageId);
			foreach (string gapId in queueItem.GapIds)
			{
				dictionary[gapId] = queueItem.MessageId;
			}
		}
		bool flag = false;
		foreach (GapRecord gap in queueStats.Gaps)
		{
			if (dictionary.TryGetValue(gap.GapId, out var value) && gap.CarrierMessageId != value)
			{
				gap.CarrierMessageId = value;
				gap.EverAttached = true;
				flag = true;
			}
			else if (gap.CarrierMessageId != null && !hashSet.Contains(gap.CarrierMessageId))
			{
				gap.CarrierMessageId = null;
				flag = true;
			}
		}
		if (flag)
		{
			SaveStats(queueStats);
			_log?.Warn("queue_gaps_reconciled");
		}
	}

	private static void ReleaseGaps(QueueStats stats, string messageId)
	{
		foreach (GapRecord item in stats.Gaps.Where((GapRecord g) => g.CarrierMessageId == messageId))
		{
			item.CarrierMessageId = null;
		}
	}

	private QueueStats LoadStats()
	{
		try
		{
			if (File.Exists(_statsPath))
			{
				QueueStats queueStats = AgentJson.Deserialize<QueueStats>(File.ReadAllBytes(_statsPath)) ?? new QueueStats();
				LegacyGap pendingGap = queueStats.PendingGap;
				if (pendingGap != null)
				{
					string id = LegacyGapId(pendingGap);
					if (!queueStats.Gaps.Any((GapRecord g) => g.GapId == id))
					{
						queueStats.Gaps.Add(new GapRecord
						{
							GapId = id,
							DroppedCount = pendingGap.DroppedCount,
							DroppedChangeCount = pendingGap.DroppedChangeCount,
							FirstDroppedCollectedAt = pendingGap.FirstDroppedCollectedAt,
							LastDroppedCollectedAt = pendingGap.LastDroppedCollectedAt
						});
					}
					queueStats.PendingGap = null;
				}
				return queueStats;
			}
		}
		catch
		{
			_log?.Warn("queue_stats_corrupt");
		}
		return new QueueStats();
	}

	private void SaveStats(QueueStats s)
	{
		AtomicFile.WriteAllBytes(_statsPath, AgentJson.SerializeToUtf8(s));
	}

	private IEnumerable<string> ItemFiles()
	{
		return Directory.EnumerateFiles(_dir, "*.msg.json").OrderBy((string f) => Path.GetFileName(f), StringComparer.Ordinal);
	}

	private static QueueItem? TryRead(string f)
	{
		try
		{
			QueueItem queueItem = JsonSerializer.Deserialize<QueueItem>(File.ReadAllBytes(f), AgentJson.Options);
			if (queueItem == null || string.IsNullOrEmpty(queueItem.MessageId) || string.IsNullOrEmpty(queueItem.Body))
			{
				return null;
			}
			queueItem.FileName = f;
			return queueItem;
		}
		catch
		{
			return null;
		}
	}

	public List<QueueGap> GapsForAttach(int max = 16)
	{
		lock (_gate)
		{
			ReconcileGaps();
			return (from g in LoadStats().Gaps.Where((GapRecord g) => g.CarrierMessageId == null).Take(max)
				select g.ToWire()).ToList();
		}
	}

	public List<GapRecord> GapLedger()
	{
		lock (_gate)
		{
			return LoadStats().Gaps;
		}
	}

	public void Enqueue(string kind, string path, string messageId, string body, DateTimeOffset now, InventoryMeta? meta = null, IReadOnlyList<string>? gapIds = null)
	{
		lock (_gate)
		{
			QueueStats queueStats = LoadStats();
			if (kind == "heartbeat")
			{
				foreach (string item2 in (from f in ItemFiles()
					where f.Contains(".heartbeat.", StringComparison.Ordinal)
					select f).ToList())
				{
					File.Delete(item2);
					queueStats.CompactedHeartbeats++;
				}
			}
			QueueItem item = new QueueItem
			{
				MessageId = messageId,
				Kind = kind,
				Path = path,
				Body = body,
				CreatedAt = Iso.Format(now),
				Reason = meta?.Reason,
				ContentHash = meta?.ContentHash,
				CollectedAt = meta?.CollectedAt,
				GapIds = (gapIds?.ToList() ?? new List<string>())
			};
			string path2 = $"{now.UtcTicks:D20}.{kind}.{messageId}.msg.json";
			AtomicFile.WriteAllBytes(Path.Combine(_dir, path2), AgentJson.SerializeToUtf8(item));
			if (SimulateCrashAfterItemWrite)
			{
				throw new IOException("queda simulada");
			}
			foreach (GapRecord item3 in queueStats.Gaps.Where((GapRecord g) => item.GapIds.Contains(g.GapId)))
			{
				item3.CarrierMessageId = messageId;
				item3.EverAttached = true;
			}
			EnforceLimits(queueStats);
			SaveStats(queueStats);
		}
	}

	private void EnforceLimits(QueueStats stats)
	{
		while (true)
		{
			List<QueueItem> inv = (from f in ItemFiles()
				where f.Contains(".inventory.", StringComparison.Ordinal)
				select TryRead(f) ?? new QueueItem
				{
					FileName = f
				}).ToList();
			long num = ItemFiles().Sum((string f) => new FileInfo(f).Length);
			if ((inv.Count <= MaxInventories && num <= MaxBytes) || inv.Count < 3)
			{
				break;
			}
			IEnumerable<int> source = Enumerable.Range(1, inv.Count - 2);
			int num2 = source.Where((int i) => inv[i].ContentHash != null && inv[i].ContentHash == inv[i - 1].ContentHash).Select((Func<int, int?>)((int i) => i)).FirstOrDefault() ?? source.Where((int i) => !inv[i].IsChange).Select((Func<int, int?>)((int i) => i)).FirstOrDefault() ?? 1;
			QueueItem queueItem = inv[num2];
			ReleaseGaps(stats, queueItem.MessageId);
			bool flag = queueItem.IsChange && queueItem.ContentHash != inv[num2 - 1].ContentHash;
			string text = queueItem.CollectedAt ?? queueItem.CreatedAt;
			GapRecord gapRecord = stats.Gaps.FirstOrDefault((GapRecord g) => !g.EverAttached && g.CarrierMessageId == null);
			if (gapRecord == null)
			{
				gapRecord = new GapRecord
				{
					FirstDroppedCollectedAt = text,
					LastDroppedCollectedAt = text
				};
				stats.Gaps.Add(gapRecord);
			}
			gapRecord.DroppedCount++;
			if (flag)
			{
				gapRecord.DroppedChangeCount++;
			}
			if (string.CompareOrdinal(text, gapRecord.FirstDroppedCollectedAt) < 0)
			{
				gapRecord.FirstDroppedCollectedAt = text;
			}
			if (string.CompareOrdinal(text, gapRecord.LastDroppedCollectedAt) > 0)
			{
				gapRecord.LastDroppedCollectedAt = text;
			}
			SaveStats(stats);
			File.Delete(queueItem.FileName);
			stats.DroppedInventories++;
			if (flag)
			{
				stats.DroppedChangeInventories++;
			}
			_log?.Warn($"queue_inventory_dropped change={flag} total={stats.DroppedInventories}");
		}
	}

	public List<QueueItem> Pending(int max = 50)
	{
		lock (_gate)
		{
			ReconcileGaps();
			List<QueueItem> list = new List<QueueItem>();
			foreach (string item in ItemFiles())
			{
				if (list.Count >= max)
				{
					break;
				}
				QueueItem queueItem = TryRead(item);
				if (queueItem != null)
				{
					list.Add(queueItem);
					continue;
				}
				QueueStats queueStats = LoadStats();
				queueStats.Corrupt++;
				string[] array = Path.GetFileName(item).Split('.');
				if (array.Length >= 3)
				{
					ReleaseGaps(queueStats, array[2]);
				}
				SaveStats(queueStats);
				MoveToQuarantine(item, "corrupt", queueStats);
				SaveStats(queueStats);
				_log?.Warn("queue_item_corrupt_moved");
			}
			return list;
		}
	}

	public void Acknowledge(QueueItem item, string ackMessageId)
	{
		if (!string.Equals(item.MessageId, ackMessageId, StringComparison.Ordinal))
		{
			throw new InvalidOperationException("ACK não corresponde ao item");
		}
		lock (_gate)
		{
			QueueStats queueStats = LoadStats();
			if (queueStats.Gaps.RemoveAll((GapRecord g) => g.CarrierMessageId == item.MessageId) > 0)
			{
				SaveStats(queueStats);
			}
			if (File.Exists(item.FileName))
			{
				File.Delete(item.FileName);
			}
		}
	}

	public void RecordAttempt(QueueItem item, string? errorCode)
	{
		lock (_gate)
		{
			if (File.Exists(item.FileName))
			{
				item.Attempts++;
				item.LastErrorCode = errorCode;
				AtomicFile.WriteAllBytes(item.FileName, AgentJson.SerializeToUtf8(item));
			}
		}
	}

	public void Quarantine(QueueItem item, bool conflict, string code)
	{
		lock (_gate)
		{
			QueueStats queueStats = LoadStats();
			if (conflict)
			{
				queueStats.Conflicts++;
			}
			else
			{
				queueStats.Rejected++;
			}
			ReleaseGaps(queueStats, item.MessageId);
			SaveStats(queueStats);
			item.LastErrorCode = code;
			if (File.Exists(item.FileName))
			{
				AtomicFile.WriteAllBytes(item.FileName, AgentJson.SerializeToUtf8(item));
				MoveToQuarantine(item.FileName, conflict ? "conflict" : "rejected", queueStats);
			}
			SaveStats(queueStats);
			_log?.Warn("queue_item_quarantined kind=" + item.Kind + " code=" + code);
		}
	}

	private void MoveToQuarantine(string file, string sub, QueueStats stats)
	{
		try
		{
			File.Move(file, Path.Combine(_dir, sub, Path.GetFileName(file)), overwrite: true);
			List<FileInfo> list = (from f in QuarantineDirs.SelectMany((string q) => Directory.EnumerateFiles(Path.Combine(_dir, q)))
				select new FileInfo(f)).OrderBy((FileInfo f) => f.Name, StringComparer.Ordinal).ToList();
			long num = list.Sum((FileInfo f) => f.Length);
			int num2 = list.Count;
			foreach (FileInfo item in list)
			{
				if (num2 > MaxQuarantineFiles || num > MaxQuarantineBytes)
				{
					num -= item.Length;
					num2--;
					item.Delete();
					stats.QuarantineRotated++;
					_log?.Warn("queue_quarantine_rotated");
					continue;
				}
				break;
			}
		}
		catch
		{
		}
	}

	public (int Files, long Bytes) QuarantineUsage()
	{
		lock (_gate)
		{
			List<FileInfo> list = (from f in QuarantineDirs.SelectMany((string q) => Directory.EnumerateFiles(Path.Combine(_dir, q)))
				select new FileInfo(f)).ToList();
			return (Files: list.Count, Bytes: list.Sum((FileInfo f) => f.Length));
		}
	}
}
