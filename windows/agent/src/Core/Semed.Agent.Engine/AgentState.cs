using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Nodes;
using Semed.Agent.Protocol;
using Semed.Agent.Util;

namespace Semed.Agent.Engine;

public sealed class AgentState
{
	public int SchemaVersion { get; set; } = 2;

	public string InstallationId { get; set; } = "";

	public string KeyName { get; set; } = "";

	public string? DeviceId { get; set; }

	public string? EnrollmentId { get; set; }

	public string Phase { get; set; } = "awaiting_grant";

	public LinkInfo? Link { get; set; }

	public bool LinkConfirmedToServer { get; set; }

	public long Sequence { get; set; }

	public string? MachineGuidHash { get; set; }

	public string? SmbiosUuidHash { get; set; }

	public string? LastEnqueuedInventoryId { get; set; }

	public string? LastEnqueuedContentHash { get; set; }

	public string? LastEnqueuedAt { get; set; }

	public Dictionary<string, string> LastEnqueuedSectionHashes { get; set; } = new Dictionary<string, string>();

	public Dictionary<string, string> LastEnqueuedSectionQuality { get; set; } = new Dictionary<string, string>();

	public string? LastAckedInventoryId { get; set; }

	public string? LastAckedInventoryAt { get; set; }

	public AgentPolicy Policy { get; set; } = new AgentPolicy();

	public string? LastConfigFetchAt { get; set; }

	public string? CreatedAt { get; set; }

	public EnrollmentJournal? EnrollJournal { get; set; }

	public ActivationRefusal? LastRefusal { get; set; }

	public static AgentState LoadOrCreate(string path, IClock clock)
	{
		if (File.Exists(path))
		{
			byte[] array = File.ReadAllBytes(path);
			AgentState agentState = AgentJson.Deserialize<AgentState>(array);
			if (agentState != null && Guid.TryParse(agentState.InstallationId, out var _))
			{
				if (agentState.SchemaVersion < 2)
				{
					MigrateV1(agentState, array, path);
				}
				return agentState;
			}
			throw new InvalidDataException("state.json corrompido; restaure backup ou faça reassociação controlada");
		}
		string text = Guid.NewGuid().ToString("D");
		AgentState agentState2 = new AgentState();
		agentState2.InstallationId = text;
		agentState2.KeyName = "SEMED-Agent-" + text;
		agentState2.CreatedAt = Iso.Format(clock.UtcNow);
		agentState2.Save(path);
		return agentState2;
	}

	private static void MigrateV1(AgentState s, byte[] raw, string path)
	{
		JsonObject jsonObject = JsonNode.Parse(raw).AsObject();
		s.LastEnqueuedInventoryId = (string?)jsonObject["last_sent_inventory_id"];
		s.LastEnqueuedContentHash = (string?)jsonObject["last_sent_content_hash"];
		s.LastEnqueuedAt = (string?)jsonObject["last_sent_at"];
		JsonNode? jsonNode = jsonObject["last_sent_section_hashes"];
		s.LastEnqueuedSectionHashes = ((jsonNode != null) ? jsonNode.Deserialize<Dictionary<string, string>>() : null) ?? new Dictionary<string, string>();
		JsonNode? jsonNode2 = jsonObject["last_sent_section_quality"];
		s.LastEnqueuedSectionQuality = ((jsonNode2 != null) ? jsonNode2.Deserialize<Dictionary<string, string>>() : null) ?? new Dictionary<string, string>();
		s.SchemaVersion = 2;
		s.Save(path);
	}

	public void Save(string path)
	{
		AtomicFile.WriteAllBytes(path, AgentJson.SerializeToUtf8(this));
	}
}
