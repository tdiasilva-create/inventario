using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Semed.Agent.Crypto;
using Semed.Agent.Inventory;
using Semed.Agent.Protocol;
using Semed.Agent.Queue;
using Semed.Agent.Util;

namespace Semed.Agent.Engine;

public sealed partial class AgentEngine : IDisposable
{
	private sealed record CollectedInventory(Dictionary<string, Section> Sections, ContentHash.Result Hash, DateTimeOffset At)
	{
		public Dictionary<string, string> Qualities => Sections.ToDictionary((KeyValuePair<string, Section> k) => k.Key, (KeyValuePair<string, Section> v) => v.Value.Quality);
	}

	private sealed record Confirmation(CollectedInventory Candidate, IReadOnlyList<string> Sections, int Attempt, DateTimeOffset DueAt);

	private const string P = "api/agent/v1/";
	private const string CurrentAgentVersion = "0.1.9";

	private readonly EngineOptions _o;

	private readonly FileLog _log;

	private readonly IClock _clock;

	private readonly string _statePath;

	private readonly string _ticketPath;

	private readonly string _grantPath;

	private readonly string _devPairingPath;

	private readonly DurableQueue _queue;

	private readonly SemaphoreSlim _op = new SemaphoreSlim(1, 1);

	private readonly SemaphoreSlim _wake = new SemaphoreSlim(0, int.MaxValue);

	private readonly object _statusGate = new object();

	private readonly string _bootId = Guid.NewGuid().ToString("D");

	private readonly DateTimeOffset _startedAt;

	private ApiClient? _api;

	private AgentState _state;

	private ISigningKey? _key;

	private PairingTicket? _ticket;

	private string? _pendingGrant;

	private bool _renewRequested;

	private DateTimeOffset _renewAllowedAt;

	private CollectedInventory? _latest;

	private Confirmation? _confirmation;

	private bool _afterLink;

	private string _nextHeartbeatReason = "startup";

	private DateTimeOffset _nextHeartbeat;

	private DateTimeOffset _nextInventory;

	private DateTimeOffset _nextFlush;

	private DateTimeOffset _nextStatusPoll;

	private DateTimeOffset _nextConfig;

	private DateTimeOffset _nextEnroll;

	private DateTimeOffset _nextPerf;

	private PerformanceSample? _lastPerf;

	private int _failures;

	private TimeSpan _clockOffset = TimeSpan.Zero;

	private string? _lastErrorCode;

	private string? _lastErrorMessage;

	private string? _lastHbAck;

	private string? _lastInvAck;

	private bool _connected;

	private int? _lastHttpStatus;

	private string? _lastCorrelationId;

	private DateTimeOffset? _lastAttemptAt;

	private DateTimeOffset? _lastContactAt;

	private DateTimeOffset? _lastErrorAt;

	private DateTimeOffset? _nextAttemptAt;

	private string _activation = "activating";

	private GrantFileStatus _grantFileStatus = GrantFileStatus.Missing;

	private bool _grantFromUi;

	private IReadOnlyList<string> _securityIssues = Array.Empty<string>();

	private DateTimeOffset _nextSecurityCheck;

	public bool SecurityBlocked => _securityIssues.Count > 0;

	public AgentEngine(EngineOptions options)
	{
		_o = options;
		_log = options.Log;
		_clock = options.Clock;
		_startedAt = _clock.UtcNow;
		Directory.CreateDirectory(options.DataDirectory);
		AtomicFile.CleanupOrphans(options.DataDirectory);
		_statePath = Path.Combine(options.DataDirectory, "state.json");
		_ticketPath = Path.Combine(options.DataDirectory, "pairing.json");
		_grantPath = Path.Combine(options.DataDirectory, "install-grant.txt");
		_devPairingPath = Path.Combine(options.DataDirectory, "dev-pairing.json");
		_queue = new DurableQueue(Path.Combine(options.DataDirectory, "queue"), _log);
	}

	public string SubmitGrant(string code)
	{
		if (SecurityBlocked)
		{
			return "Agente bloqueado por proteção local insuficiente.";
		}
		code = code.Trim();
		if (!GrantFile.IsValidCode(code))
		{
			return "Formato de autorização inválido.";
		}
		if (_state == null)
		{
			return "Agente inicializando; tente novamente em instantes.";
		}
		lock (_statusGate)
		{
			if (_state.Phase != "awaiting_grant")
			{
				return "Este computador já possui cadastro; autorização não necessária.";
			}
			_pendingGrant = code;
			_grantFromUi = true;
			_activation = "activating";
			_nextEnroll = _clock.UtcNow;
		}
		Wake();
		return "Autorização recebida. Registrando…";
	}

	public string RequestRenew()
	{
		lock (_statusGate)
		{
			if (_state == null || _state.Phase != "pending_pairing")
			{
				return "Não há pareamento pendente.";
			}
			if (_clock.UtcNow < _renewAllowedAt)
			{
				return "Aguarde alguns segundos antes de gerar outro QR.";
			}
			_renewRequested = true;
		}
		Wake();
		return "Gerando novo QR…";
	}

	public void Wake()
	{
		_wake.Release();
	}

	public void TriggerNow(bool inventory, bool heartbeat)
	{
		if (inventory)
		{
			_nextInventory = _clock.UtcNow;
			if ((object)_confirmation != null)
			{
				_confirmation = _confirmation with
				{
					DueAt = _clock.UtcNow
				};
			}
		}
		if (heartbeat)
		{
			_nextHeartbeat = _clock.UtcNow;
		}
		_nextFlush = _clock.UtcNow;
		Wake();
	}

	public void NotifyResume()
	{
		_nextHeartbeatReason = "resume";
		_nextHeartbeat = _clock.UtcNow;
		_nextStatusPoll = _clock.UtcNow;
		_failures = 0;
		Wake();
	}

	public async Task SendLifecycleHeartbeatAsync(string reason, TimeSpan timeout)
	{
		if (SecurityBlocked || _state == null || _state.Phase != "linked" || _api == null || _key == null)
		{
			return;
		}
		using CancellationTokenSource cts = new CancellationTokenSource(timeout);
		_ = 1;
		try
		{
			await _op.WaitAsync(cts.Token).ConfigureAwait(continueOnCapturedContext: false);
			try
			{
				EnqueueHeartbeat(reason);
				await FlushQueueAsync(cts.Token).ConfigureAwait(continueOnCapturedContext: false);
			}
			finally
			{
				_op.Release();
			}
		}
		catch (OperationCanceledException)
		{
			_log.Info("lifecycle_heartbeat_timeout reason=" + reason);
		}
	}

	public StatusSnapshot GetStatus()
	{
		lock (_statusGate)
		{
			StatusSnapshot statusSnapshot = new StatusSnapshot
			{
				Phase = (_state?.Phase ?? "awaiting_grant"),
				AgentVersion = CurrentAgentVersion,
				Connected = _connected,
				ServerHost = _api?.Host,
				Summary = (((object)_latest == null) ? null : BuildSummary(_latest)),
				Link = _state?.Link,
				LastHeartbeatAckAt = _lastHbAck,
				LastInventoryAckAt = _lastInvAck,
				PendingMessages = SafeQueueCount(),
				DroppedMessages = _queue.Stats.DroppedInventories,
				LastErrorCode = _lastErrorCode,
				LastErrorMessage = _lastErrorMessage,
				ClockSkewNote = ((Math.Abs(_clockOffset.TotalSeconds) > 120.0) ? $"Relógio local difere do servidor em {(int)_clockOffset.TotalSeconds} s" : null),
				InventoryQualitySummary = (((object)_latest == null) ? null : string.Join(", ", _latest.Sections.Select((KeyValuePair<string, Section> kv) => kv.Key + "=" + kv.Value.Quality))),
				KeyStore = _o.KeyStore.Describe(),
				UpdatedAt = Iso.Format(_clock.UtcNow),
				ServerReachable = _connected
			};
			DateTimeOffset? lastContactAt = _lastContactAt;
			object lastContactAt2;
			if (lastContactAt.HasValue)
			{
				DateTimeOffset valueOrDefault = lastContactAt.GetValueOrDefault();
				lastContactAt2 = Iso.Format(valueOrDefault);
			}
			else
			{
				lastContactAt2 = null;
			}
			statusSnapshot.LastContactAt = (string?)lastContactAt2;
			statusSnapshot.LastHttpStatus = _lastHttpStatus;
			statusSnapshot.LastCorrelationId = _lastCorrelationId;
			lastContactAt = _lastAttemptAt;
			object lastAttemptAt;
			if (lastContactAt.HasValue)
			{
				DateTimeOffset valueOrDefault2 = lastContactAt.GetValueOrDefault();
				lastAttemptAt = Iso.Format(valueOrDefault2);
			}
			else
			{
				lastAttemptAt = null;
			}
			statusSnapshot.LastAttemptAt = (string?)lastAttemptAt;
			lastContactAt = _nextAttemptAt;
			object nextAttemptAt;
			if (lastContactAt.HasValue)
			{
				DateTimeOffset valueOrDefault3 = lastContactAt.GetValueOrDefault();
				if (valueOrDefault3 > _clock.UtcNow)
				{
					nextAttemptAt = Iso.Format(valueOrDefault3);
					goto IL_027c;
				}
			}
			nextAttemptAt = null;
			goto IL_027c;
			IL_027c:
			statusSnapshot.NextAttemptAt = (string?)nextAttemptAt;
			object lastErrorAt;
			if (_lastErrorCode != null)
			{
				lastContactAt = _lastErrorAt;
				if (lastContactAt.HasValue)
				{
					DateTimeOffset valueOrDefault4 = lastContactAt.GetValueOrDefault();
					lastErrorAt = Iso.Format(valueOrDefault4);
				}
				else
				{
					lastErrorAt = null;
				}
			}
			else
			{
				lastErrorAt = null;
			}
			statusSnapshot.LastErrorAt = (string?)lastErrorAt;
			statusSnapshot.CampaignLabel = _o.Config.CampaignLabel;
			AgentState state = _state;
			statusSnapshot.EnrollOutcomeUnknown = state != null && state.EnrollJournal?.OutcomeUnknown == true;
			StatusSnapshot statusSnapshot2 = statusSnapshot;
			if (statusSnapshot2.Phase == "awaiting_grant" && (_api == null || !_o.Config.IsConfigured))
			{
				statusSnapshot2.Phase = "not_configured";
			}
			if (_securityIssues.Count > 0)
			{
				statusSnapshot2.Phase = "security_blocked";
			}
			statusSnapshot2.LastAckedInventoryId = _state?.LastAckedInventoryId;
			statusSnapshot2.DroppedChangeMessages = _queue.Stats.DroppedChangeInventories;
			statusSnapshot2.PhaseLabel = PhaseLabel(statusSnapshot2.Phase);
			StatusSnapshot statusSnapshot3 = statusSnapshot2;
			string activation;
			switch (statusSnapshot2.Phase)
			{
			case "pending_pairing":
			case "linked":
				activation = "accepted";
				break;
			case "revoked":
				activation = "revoked";
				break;
			case "identity_conflict":
				activation = "identity_conflict";
				break;
			case "security_blocked":
				activation = "blocked";
				break;
			case "not_configured":
				activation = "not_configured";
				break;
			default:
				activation = _activation;
				break;
			}
			statusSnapshot3.Activation = activation;
			if (statusSnapshot2.Phase == "awaiting_grant")
			{
				statusSnapshot2.GrantFile = ((_grantFromUi && _pendingGrant != null) ? "informada_na_janela" : _grantFileStatus.ToString().ToLowerInvariant());
			}
			if (statusSnapshot2.Phase == "awaiting_grant" && statusSnapshot2.Activation == "refused")
			{
				ActivationRefusal activationRefusal = _state?.LastRefusal;
				if (activationRefusal != null && statusSnapshot2.LastErrorCode == null)
				{
					statusSnapshot2.LastErrorCode = activationRefusal.Code;
					statusSnapshot2.LastErrorMessage = ActivationMessage(activationRefusal.Code);
					statusSnapshot2.LastHttpStatus = activationRefusal.HttpStatus;
					statusSnapshot2.LastCorrelationId = activationRefusal.CorrelationId;
					statusSnapshot2.LastErrorAt = activationRefusal.At;
				}
			}
			statusSnapshot2.ActionHint = ActionHint(statusSnapshot2);
			if (_state?.Phase == "pending_pairing" && _ticket != null)
			{
				DateTimeOffset? dateTimeOffset = Iso.TryParse(_ticket.ExpiresAt);
				statusSnapshot2.PairingExpiresAt = _ticket.ExpiresAt;
				statusSnapshot2.PairingExpired = !dateTimeOffset.HasValue || dateTimeOffset <= _clock.UtcNow;
				if (!statusSnapshot2.PairingExpired)
				{
					statusSnapshot2.QrPayload = QrPayloadJson(_ticket);
					statusSnapshot2.VisualCode = _ticket.VisualCode;
				}
			}
			return statusSnapshot2;
		}
	}

	private int SafeQueueCount()
	{
		try
		{
			return _queue.Count;
		}
		catch
		{
			return -1;
		}
	}

	private static string PhaseLabel(string phase)
	{
		return phase switch
		{
			"not_configured" => "Não configurado (endereço do servidor pendente)", 
			"awaiting_grant" => "Ativação do computador pendente", 
			"pending_pairing" => "Aguardando vínculo pelo coletor", 
			"linked" => "Vinculado", 
			"revoked" => "Instalação revogada pelo administrador", 
			"identity_conflict" => "Conflito de identidade — reassociação controlada necessária", 
			"security_blocked" => "BLOQUEADO: proteção local insuficiente (permissões). Reparar a instalação como administrador", 
			_ => phase, 
		};
	}

	public static string QrPayloadJson(PairingTicket t)
	{
		return JsonSerializer.Serialize(new PairingQrPayload
		{
			EnrollmentId = t.EnrollmentId,
			PairingCode = t.PairingCode,
			ExpiresAt = t.ExpiresAt
		}, AgentJson.Options);
	}

	public async Task RunAsync(CancellationToken ct)
	{
		Initialize();
		_log.Info($"engine_started phase={_state.Phase} boot_id={_bootId} version={CurrentAgentVersion} keystore={_o.KeyStore.Describe()}");
		while (!ct.IsCancellationRequested)
		{
			await _op.WaitAsync(ct).ConfigureAwait(continueOnCapturedContext: false);
			try
			{
				await TickAsync(ct).ConfigureAwait(continueOnCapturedContext: false);
			}
			catch (OperationCanceledException) when (ct.IsCancellationRequested)
			{
				break;
			}
			catch (Exception ex2)
			{
				SetError("ENGINE_EXCEPTION", ex2.GetType().Name);
				_log.Error("tick_exception type=" + ex2.GetType().Name);
				_failures = Math.Min(_failures + 1, 10);
			}
			finally
			{
				_op.Release();
			}
			TimeSpan timeSpan = NextDue() - _clock.UtcNow;
			if (timeSpan < TimeSpan.FromMilliseconds(200L))
			{
				timeSpan = TimeSpan.FromMilliseconds(200L);
			}
			if (timeSpan > TimeSpan.FromSeconds(30L))
			{
				timeSpan = TimeSpan.FromSeconds(30L);
			}
			try
			{
				await _wake.WaitAsync(timeSpan, ct).ConfigureAwait(continueOnCapturedContext: false);
			}
			catch (OperationCanceledException)
			{
				break;
			}
		}
		_log.Info("engine_stopped");
	}

	private void Initialize()
	{
		_state = AgentState.LoadOrCreate(_statePath, _clock);
		_key = _o.KeyStore.Open(_state.KeyName);
		_ticket = LoadTicket();
		_lastInvAck = _state.LastAckedInventoryAt;
		DateTimeOffset utcNow = _clock.UtcNow;
		if (_state.Phase != "awaiting_grant" && File.Exists(_grantPath))
		{
			DiscardGrant();
			_log.Info("grant_file_ignored phase=" + _state.Phase + " (cadastro existente preservado)");
		}
		if (_state.Phase == "awaiting_grant")
		{
			_grantFileStatus = GrantFile.Read(_grantPath).Status;
			EnrollmentJournal? enrollJournal = _state.EnrollJournal;
			_activation = ((enrollJournal != null && enrollJournal.OutcomeUnknown) ? "unknown_result" : "activating");
			if (_state.LastRefusal != null)
			{
				_state.LastRefusal = null;
				_state.Save(_statePath);
			}
		}
		_nextHeartbeat = (_nextInventory = (_nextFlush = (_nextStatusPoll = (_nextConfig = (_nextEnroll = (_nextPerf = utcNow))))));
		string phase = _state.Phase;
		bool flag = ((phase == "pending_pairing" || phase == "linked") ? true : false);
		if (flag && _key == null)
		{
			_state.Phase = "identity_conflict";
			SetError("KEY_MISSING", "Chave local ausente; é necessária reassociação controlada pelo root.");
			_state.Save(_statePath);
		}
		MachineSignals machineSignals = SafeSignals();
		flag = _state.MachineGuidHash != null && machineSignals.MachineGuid != null && HashSignal(machineSignals.MachineGuid) != _state.MachineGuidHash;
		if (flag)
		{
			phase = _state.Phase;
			bool flag2 = ((phase == "linked" || phase == "pending_pairing") ? true : false);
			flag = flag2;
		}
		if (flag)
		{
			_state.Phase = "identity_conflict";
			SetError("CLONE_SUSPECTED", "Identidade da instalação não corresponde a esta máquina (possível imagem clonada).");
			_log.Warn("identity_conflict reason=machine_guid_changed");
			_state.Save(_statePath);
		}
		try
		{
			_api = new ApiClient(_o.Config, CurrentAgentVersion, _o.HttpHandler);
			if (!_o.Config.IsConfigured && _state.Phase == "awaiting_grant")
			{
				SetError("NOT_CONFIGURED", "Endereço do servidor não configurado.");
			}
		}
		catch (InvalidOperationException ex)
		{
			SetError("CONFIG_INVALID", ex.Message);
			_api = null;
		}
		RunSecurityCheck();
		_latest = Collect();
	}

	private void RunSecurityCheck()
	{
		_nextSecurityCheck = _clock.UtcNow.AddMinutes(10.0);
		if (_o.SecurityCheck == null)
		{
			return;
		}
		IReadOnlyList<string> readOnlyList;
		try
		{
			readOnlyList = _o.SecurityCheck();
		}
		catch (Exception ex)
		{
			readOnlyList = new _003C_003Ez__ReadOnlySingleElementList<string>("verificação falhou: " + ex.GetType().Name);
		}
		bool flag = _securityIssues.Count > 0;
		_securityIssues = readOnlyList;
		if (readOnlyList.Count > 0)
		{
			SetError("SECURITY_BLOCKED", "Proteção local insuficiente: " + string.Join("; ", readOnlyList.Take(3)));
			if (!flag)
			{
				_log.Error($"security_blocked issues={readOnlyList.Count}");
			}
		}
		else if (flag)
		{
			ClearError();
			_log.Info("security_restored");
		}
	}

	private DateTimeOffset NextDue()
	{
		List<DateTimeOffset> list = new List<DateTimeOffset>();
		switch (_state?.Phase)
		{
		case "awaiting_grant":
			list.Add(_nextEnroll);
			break;
		case "pending_pairing":
			list.Add(_nextStatusPoll);
			break;
		case "linked":
			list.Add(_nextHeartbeat);
			list.Add(_nextInventory);
			list.Add(_nextConfig);
			if (_queue.Count > 0)
			{
				list.Add(_nextFlush);
			}
			if ((object)_confirmation != null)
			{
				list.Add(_confirmation.DueAt);
			}
			break;
		}
		if (list.Count != 0)
		{
			return list.Min();
		}
		return _clock.UtcNow.AddSeconds(30.0);
	}

	private async Task TickAsync(CancellationToken ct)
	{
		DateTimeOffset now = _clock.UtcNow;
		if (now >= _nextSecurityCheck)
		{
			RunSecurityCheck();
		}
		if (SecurityBlocked || _api == null || !_o.Config.IsConfigured)
		{
			return;
		}
		switch (_state.Phase)
		{
		case "awaiting_grant":
			if (now >= _nextEnroll)
			{
				await ActivationTickAsync(ct).ConfigureAwait(continueOnCapturedContext: false);
			}
			break;
		case "pending_pairing":
			if (_renewRequested && now >= _renewAllowedAt)
			{
				await RenewAsync(ct).ConfigureAwait(continueOnCapturedContext: false);
			}
			if (now >= _nextStatusPoll)
			{
				await PollStatusAsync(ct).ConfigureAwait(continueOnCapturedContext: false);
			}
			break;
		case "linked":
			if (!_state.LinkConfirmedToServer)
			{
				await ConfirmDeviceAsync(ct).ConfigureAwait(continueOnCapturedContext: false);
			}
			if (now >= _nextConfig)
			{
				await FetchConfigAsync(ct).ConfigureAwait(continueOnCapturedContext: false);
			}
			if (((object)_confirmation != null) ? (now >= _confirmation.DueAt) : (now >= _nextInventory))
			{
				InventoryCycle();
			}
			if (now >= _nextHeartbeat)
			{
				EnqueueHeartbeat(_nextHeartbeatReason);
			}
			if (now >= _nextFlush && _queue.Count > 0)
			{
				await FlushQueueAsync(ct).ConfigureAwait(continueOnCapturedContext: false);
			}
			break;
		}
	}

	private void DiscardGrant()
	{
		_pendingGrant = null;
		_grantFromUi = false;
		try
		{
			if (File.Exists(_grantPath))
			{
				File.Delete(_grantPath);
			}
		}
		catch
		{
		}
		_grantFileStatus = GrantFileStatus.Missing;
	}

	private static bool IsGrantRefusal(string code)
	{
		switch (code)
		{
		case "INVALID_GRANT":
		case "GRANT_USED":
		case "GRANT_EXPIRED":
		case "GRANT_REVOKED":
			return true;
		default:
			return false;
		}
	}

	public static string ActivationMessage(string? code)
	{
		switch (code)
		{
		case "INVALID_GRANT":
			return "Servidor alcançável. Ativação recusada: autorização não reconhecida (ausente, malformada ou de outro sistema).";
		case "GRANT_USED":
			return "Servidor alcançável. Ativação recusada: autorização/lote esgotado (todas as instalações permitidas já foram usadas).";
		case "GRANT_EXPIRED":
			return "Servidor alcançável. Ativação recusada: prazo da autorização/lote encerrado.";
		case "GRANT_REVOKED":
			return "Servidor alcançável. Ativação recusada: autorização revogada pelo administrador.";
		case "GRANT_FILE_EMPTY":
			return "Arquivo de autorização vazio neste computador. Nada foi enviado ao servidor.";
		case "GRANT_FILE_INVALID":
			return "Arquivo de autorização com conteúdo inválido neste computador. Nada foi enviado ao servidor.";
		case "GRANT_FILE_UNREADABLE":
			return "Arquivo de autorização sem permissão de leitura neste computador. Nada foi enviado ao servidor.";
		case "NO_GRANT":
			return "Sem autorização de instalação neste computador: a ativação não começou.";
		case "SERVER_REQUIRES_GRANT":
			return "Servidor alcançável, mas o sistema ainda exige a autorização de instalação antiga. Quando o sistema for atualizado, este computador se ativa sozinho (nova tentativa a cada 10 minutos). Não é preciso reinstalar.";
		case "ENROLL_RESULT_UNKNOWN":
			return "Cadastro enviado, mas a resposta do servidor não chegou: ele pode ter sido aceito. A identidade deste computador foi preservada.";
		case "ENROLL_REJECTED":
			return "Servidor alcançável. Cadastro recusado (dados inválidos).";
		case "IDENTITY_CONFLICT":
			return "Servidor detectou conflito de identidade (instalação ou chave já registradas — possível imagem clonada).";
		case "CLOCK_SKEW":
			return "Data/hora deste computador difere da do servidor.";
		case "HTTP_429":
		case "RATE_LIMITED":
			return "Servidor pediu para aguardar (muitas tentativas). Nova tentativa automática.";
		default:
			return "Falha temporária na ativação. Nova tentativa automática.";
		}
	}

	private void Refuse(ApiResult res, string code)
	{
		DateTimeOffset utcNow = _clock.UtcNow;
		lock (_statusGate)
		{
			_activation = "refused";
			_state.LastRefusal = new ActivationRefusal
			{
				Code = code,
				HttpStatus = res.Status,
				CorrelationId = res.Error?.CorrelationId,
				At = Iso.Format(utcNow)
			};
			_state.Save(_statePath);
		}
		SetError(code, ActivationMessage(code));
		_log.Warn($"activation_refused code={code} http={res.Status} correlation={res.Error?.CorrelationId ?? "-"}");
	}

	private async Task ActivationTickAsync(CancellationToken ct)
	{
		DateTimeOffset utcNow = _clock.UtcNow;
		EnrollmentJournal j = _state.EnrollJournal;
		if (j?.ChallengeId != null)
		{
			if ((Iso.TryParse(j.ChallengeExpiresAt) ?? DateTimeOffset.MinValue) - TimeSpan.FromSeconds(20L) > utcNow)
			{
				await SendEnrollmentAsync(j, ct).ConfigureAwait(continueOnCapturedContext: false);
				return;
			}
			EnrollmentJournal enrollmentJournal = j;
			EnrollmentJournal enrollmentJournal2 = j;
			string text = (j.ChallengeExpiresAt = null);
			string challengeId = (enrollmentJournal2.Challenge = text);
			enrollmentJournal.ChallengeId = challengeId;
			_state.Save(_statePath);
		}
		string text4 = _pendingGrant;
		if (text4 == null)
		{
			(GrantFileStatus Status, string? Code) tuple = GrantFile.Read(_grantPath);
			GrantFileStatus item = tuple.Status;
			string? item2 = tuple.Code;
			_grantFileStatus = item;
			text4 = item2;
			if (((uint)(item - 2) <= 1u || item == GrantFileStatus.TooLarge) ? true : false)
			{
				_log.Warn($"grant_file_ignored status={item}");
				DiscardGrant();
			}
		}
		bool sentGrant = text4 != null;
		lock (_statusGate)
		{
			_activation = ((j?.OutcomeUnknown ?? false) ? "unknown_result" : "activating");
		}
		_lastAttemptAt = utcNow;
		if (_key == null)
		{
			_key = _o.KeyStore.Create(_state.KeyName);
		}
		Uri item3 = _api.Resolve("api/agent/v1/enrollment-challenge").Uri;
		byte[] body = AgentJson.SerializeToUtf8(new ChallengeRequest
		{
			RequestId = NewId(),
			AgentVersion = CurrentAgentVersion
		});
		Dictionary<string, string> chHeaders = new Dictionary<string, string>();
		if (sentGrant)
		{
			chHeaders["Authorization"] = "SEMED-Install-Grant " + text4;
		}
		ApiResult apiResult = await _api.PostAsync(item3, body, chHeaders, ct).ConfigureAwait(continueOnCapturedContext: false);
		chHeaders.Clear();
		Observe(apiResult);
		if (!apiResult.IsSuccess)
		{
			bool flag = apiResult.TransportError == null;
			if (flag)
			{
				int status = apiResult.Status;
				bool flag2 = ((status == 401 || status == 403 || (uint)(status - 409) <= 1u) ? true : false);
				flag = flag2;
			}
			if (flag && IsGrantRefusal(apiResult.Code))
			{
				if (sentGrant)
				{
					DiscardGrant();
					_log.Info("old_grant_refused code=" + apiResult.Code + "; tentando sem autorizacao");
					_nextEnroll = _clock.UtcNow.AddSeconds(2.0);
					return;
				}
				lock (_statusGate)
				{
					_activation = ((j?.OutcomeUnknown ?? false) ? "unknown_result" : "waiting_server");
				}
				SetError("SERVER_REQUIRES_GRANT", ActivationMessage("SERVER_REQUIRES_GRANT"));
				_nextEnroll = _clock.UtcNow.AddMinutes(10.0);
				_nextAttemptAt = _nextEnroll;
				_log.Warn("server_requires_grant code=" + apiResult.Code + " retry_min=10");
			}
			else
			{
				ScheduleRetry(apiResult, ref _nextEnroll);
			}
			return;
		}
		ChallengeResponse challengeResponse = TryParse<ChallengeResponse>(apiResult);
		if (challengeResponse == null || string.IsNullOrEmpty(challengeResponse.ChallengeId) || string.IsNullOrEmpty(challengeResponse.Challenge))
		{
			ScheduleRetry(apiResult with
			{
				TransportError = "RESPONSE_INVALID"
			}, ref _nextEnroll);
			return;
		}
		if (j == null)
		{
			j = new EnrollmentJournal();
		}
		j.ChallengeId = challengeResponse.ChallengeId;
		j.Challenge = challengeResponse.Challenge;
		DateTimeOffset? dateTimeOffset = Iso.TryParse(challengeResponse.ExpiresAt);
		DateTimeOffset? dateTimeOffset2 = Iso.TryParse(challengeResponse.ServerTime);
		TimeSpan timeSpan;
		if (dateTimeOffset.HasValue)
		{
			DateTimeOffset valueOrDefault = dateTimeOffset.GetValueOrDefault();
			if (dateTimeOffset2.HasValue)
			{
				DateTimeOffset valueOrDefault2 = dateTimeOffset2.GetValueOrDefault();
				timeSpan = valueOrDefault - valueOrDefault2;
				goto IL_05b0;
			}
		}
		timeSpan = TimeSpan.FromMinutes(5L);
		goto IL_05b0;
		IL_05b0:
		TimeSpan timeSpan2 = timeSpan;
		if (timeSpan2 > TimeSpan.FromMinutes(10L) || timeSpan2 < TimeSpan.Zero)
		{
			timeSpan2 = TimeSpan.FromMinutes(5L);
		}
		j.ChallengeExpiresAt = Iso.Format(_clock.UtcNow + timeSpan2);
		_state.EnrollJournal = j;
		_state.Save(_statePath);
		await SendEnrollmentAsync(j, ct).ConfigureAwait(continueOnCapturedContext: false);
	}

	private async Task SendEnrollmentAsync(EnrollmentJournal j, CancellationToken ct)
	{
		if (_key == null)
		{
			_key = _o.KeyStore.Create(_state.KeyName);
		}
		CollectedInventory inv = _latest ?? Collect();
		byte[] array = AgentJson.SerializeToUtf8(new EnrollmentRequest
		{
			RequestId = NewId(),
			InstallationId = _state.InstallationId,
			ChallengeId = j.ChallengeId,
			Challenge = j.Challenge,
			PublicKeyJwk = new JwkDto
			{
				X = _key.PublicJwk.X,
				Y = _key.PublicJwk.Y
			},
			AgentVersion = CurrentAgentVersion,
			Summary = BuildSummary(inv)
		});
		(Uri Uri, string SignPath) tuple = _api.Resolve("api/agent/v1/enrollments");
		Uri item = tuple.Uri;
		string item2 = tuple.SignPath;
		bool wasUnknown = j.OutcomeUnknown;
		DateTimeOffset utcNow = _clock.UtcNow;
		j.Attempts++;
		EnrollmentJournal enrollmentJournal = j;
		if (enrollmentJournal.FirstSentAt == null)
		{
			enrollmentJournal.FirstSentAt = Iso.Format(utcNow);
		}
		j.LastSentAt = Iso.Format(utcNow);
		j.OutcomeUnknown = true;
		_state.EnrollJournal = j;
		_state.Save(_statePath);
		_lastAttemptAt = utcNow;
		if (wasUnknown)
		{
			_log.Info($"enroll_resend attempt={j.Attempts} (mesma identidade, mesmo desafio)");
		}
		SignedHeaders signedHeaders = RequestSigner.Sign(_key, "POST", item2, array, SignTimestamp());
		ApiResult apiResult = await _api.PostAsync(item, array, new Dictionary<string, string>
		{
			["Authorization"] = "SEMED-Enroll " + j.ChallengeId,
			["X-SEMED-Key-Id"] = _key.KeyId,
			["X-SEMED-Timestamp"] = signedHeaders.Timestamp,
			["X-SEMED-Nonce"] = signedHeaders.Nonce,
			["X-SEMED-Signature"] = signedHeaders.Signature
		}, ct).ConfigureAwait(continueOnCapturedContext: false);
		Observe(apiResult);
		if (apiResult.IsSuccess)
		{
			EnrollmentResponse enrollmentResponse = TryParse<EnrollmentResponse>(apiResult);
			if (enrollmentResponse == null || !Guid.TryParse(enrollmentResponse.DeviceId, out var _))
			{
				_queueAckInvalid("ENROLL_RESPONSE_INVALID");
				ScheduleRetry(apiResult with
				{
					TransportError = "RESPONSE_INVALID"
				}, ref _nextEnroll);
				return;
			}
			MachineSignals machineSignals = SafeSignals();
			lock (_statusGate)
			{
				_state.DeviceId = enrollmentResponse.DeviceId;
				_state.EnrollmentId = enrollmentResponse.EnrollmentId;
				_state.Phase = "pending_pairing";
				_state.MachineGuidHash = ((machineSignals.MachineGuid == null) ? null : HashSignal(machineSignals.MachineGuid));
				_state.SmbiosUuidHash = ((machineSignals.SmbiosUuid == null) ? null : HashSignal(machineSignals.SmbiosUuid));
				_state.EnrollJournal = null;
				_state.LastRefusal = null;
				_state.Save(_statePath);
				if (enrollmentResponse.PairingCode != null)
				{
					SaveTicket(new PairingTicket
					{
						EnrollmentId = enrollmentResponse.EnrollmentId,
						PairingCode = enrollmentResponse.PairingCode,
						VisualCode = (enrollmentResponse.VisualCode ?? ""),
						ExpiresAt = (enrollmentResponse.ExpiresAt ?? "")
					});
				}
				else
				{
					DeleteTicket();
					if (enrollmentResponse.State != "linked")
					{
						_renewRequested = true;
						_renewAllowedAt = _clock.UtcNow;
					}
				}
				_activation = "accepted";
			}
			DiscardGrant();
			ClearError();
			_nextStatusPoll = ((enrollmentResponse.PairingCode == null) ? _clock.UtcNow : _clock.UtcNow.AddSeconds(Math.Clamp(enrollmentResponse.PollAfterSeconds ?? 10, 5, 60)));
			_log.Info($"enrolled state=pending_pairing http={apiResult.Status} reconciled={((apiResult.Status == 200) ? "sim" : "nao")} attempts={j.Attempts}");
			return;
		}
		bool flag = apiResult.TransportError != null;
		int status;
		if (!flag)
		{
			status = apiResult.Status;
			bool flag2 = ((status == 0 || status == 408) ? true : false);
			flag = flag2;
		}
		if (flag || apiResult.Status >= 500)
		{
			lock (_statusGate)
			{
				_activation = "unknown_result";
			}
			ScheduleRetry(apiResult, ref _nextEnroll);
			SetError("ENROLL_RESULT_UNKNOWN", ActivationMessage("ENROLL_RESULT_UNKNOWN") + " Nova tentativa automática com a mesma identidade (última falha: " + apiResult.Code + ").");
			return;
		}
		if (apiResult.Status == 429)
		{
			NotProcessed();
			ScheduleRetry(apiResult, ref _nextEnroll);
			return;
		}
		if (apiResult.Code == "IDENTITY_CONFLICT")
		{
			NotProcessed();
			lock (_statusGate)
			{
				_state.Phase = "identity_conflict";
				_state.Save(_statePath);
			}
			SetError(apiResult.Code, ActivationMessage(apiResult.Code));
			return;
		}
		switch (apiResult.Code)
		{
		case "CHALLENGE_EXPIRED":
		case "CHALLENGE_USED":
		case "AUTH_FAILED":
		case "CHALLENGE_MISMATCH":
			flag = true;
			break;
		default:
			flag = false;
			break;
		}
		if (flag)
		{
			DropChallenge();
			_nextEnroll = _clock.UtcNow.AddSeconds(2.0);
			return;
		}
		if (IsGrantRefusal(apiResult.Code))
		{
			DropChallenge();
			DiscardGrant();
			_nextEnroll = _clock.UtcNow.AddSeconds(2.0);
			return;
		}
		if (apiResult.Status == 401 && apiResult.Code == "CLOCK_SKEW")
		{
			NotProcessed();
			SetError("CLOCK_SKEW", ActivationMessage("CLOCK_SKEW"));
			_nextEnroll = _clock.UtcNow.AddSeconds(Math.Min(60, 1 + j.Attempts));
			return;
		}
		status = apiResult.Status;
		if ((status == 400 || status == 422) ? true : false)
		{
			DropChallenge();
			Refuse(apiResult, "ENROLL_REJECTED");
			_nextEnroll = _clock.UtcNow.AddMinutes(30.0);
		}
		else
		{
			NotProcessed();
			ScheduleRetry(apiResult, ref _nextEnroll);
		}
		void DropChallenge()
		{
			EnrollmentJournal enrollmentJournal2 = j;
			EnrollmentJournal enrollmentJournal3 = j;
			string text = (j.ChallengeExpiresAt = null);
			string challengeId = (enrollmentJournal3.Challenge = text);
			enrollmentJournal2.ChallengeId = challengeId;
			NotProcessed();
		}
		void NotProcessed()
		{
			j.OutcomeUnknown = wasUnknown;
			_state.Save(_statePath);
		}
	}

	private async Task RenewAsync(CancellationToken ct)
	{
		_renewRequested = false;
		_renewAllowedAt = _clock.UtcNow.AddSeconds(30.0);
		ApiResult apiResult = await PostDeviceAsync("enrollment-renew", new SimpleDeviceRequest
		{
			RequestId = NewId(),
			InstallationId = _state.InstallationId
		}, ct).ConfigureAwait(continueOnCapturedContext: false);
		if (apiResult.IsSuccess)
		{
			EnrollmentResponse enrollmentResponse = TryParse<EnrollmentResponse>(apiResult);
			if (enrollmentResponse == null)
			{
				_renewRequested = true;
				ScheduleRetry(apiResult with
				{
					TransportError = "RESPONSE_INVALID"
				}, ref _nextStatusPoll);
				return;
			}
			lock (_statusGate)
			{
				SaveTicket(new PairingTicket
				{
					EnrollmentId = enrollmentResponse.EnrollmentId,
					PairingCode = (enrollmentResponse.PairingCode ?? ""),
					VisualCode = (enrollmentResponse.VisualCode ?? ""),
					ExpiresAt = (enrollmentResponse.ExpiresAt ?? "")
				});
			}
			ClearError();
			_nextStatusPoll = _clock.UtcNow.AddSeconds(10.0);
		}
		else if (!HandleTerminal(apiResult))
		{
			if (apiResult.Code == "ALREADY_LINKED")
			{
				_nextStatusPoll = _clock.UtcNow;
			}
			else
			{
				SetError(apiResult.Code, (apiResult.Code == "RENEWAL_LIMIT") ? "Limite de renovações atingido; contate o root." : "Não foi possível renovar o QR agora.");
			}
		}
	}

	private async Task PollStatusAsync(CancellationToken ct)
	{
		ApiResult apiResult = await PostDeviceAsync("enrollment-status", new SimpleDeviceRequest
		{
			RequestId = NewId(),
			InstallationId = _state.InstallationId
		}, ct).ConfigureAwait(continueOnCapturedContext: false);
		if (!apiResult.IsSuccess)
		{
			if (!HandleTerminal(apiResult))
			{
				ScheduleRetry(apiResult, ref _nextStatusPoll);
			}
			return;
		}
		StatusResponse statusResponse = TryParse<StatusResponse>(apiResult);
		if (statusResponse == null)
		{
			ScheduleRetry(apiResult with
			{
				TransportError = "RESPONSE_INVALID"
			}, ref _nextStatusPoll);
		}
		else if (statusResponse.State == "linked" && statusResponse.Link != null)
		{
			lock (_statusGate)
			{
				_state.Link = statusResponse.Link;
				_state.Phase = "linked";
				_state.LinkConfirmedToServer = false;
				_state.Save(_statePath);
				DeleteTicket();
			}
			_afterLink = true;
			_nextInventory = (_nextHeartbeat = (_nextConfig = _clock.UtcNow));
			_nextHeartbeatReason = "startup";
			ClearError();
			_log.Info("linked");
		}
		else
		{
			bool flag = _ticket != null && Iso.TryParse(_ticket.ExpiresAt) > _clock.UtcNow;
			_nextStatusPoll = _clock.UtcNow.AddSeconds(flag ? 10 : 300);
		}
	}

	private async Task ConfirmDeviceAsync(CancellationToken ct)
	{
		if (_state.Link != null)
		{
			ApiResult apiResult = await PostDeviceAsync("pairings/confirm-device", new ConfirmDeviceRequest
			{
				RequestId = NewId(),
				InstallationId = _state.InstallationId,
				LinkId = _state.Link.LinkId
			}, ct).ConfigureAwait(continueOnCapturedContext: false);
			if (apiResult.IsSuccess)
			{
				_state.LinkConfirmedToServer = true;
				_state.Save(_statePath);
			}
			else
			{
				HandleTerminal(apiResult);
			}
		}
	}

	private async Task FetchConfigAsync(CancellationToken ct)
	{
		ApiResult apiResult = await PostDeviceAsync("config", new ConfigRequest
		{
			RequestId = NewId(),
			InstallationId = _state.InstallationId,
			CurrentConfigVersion = _state.Policy.ConfigVersion
		}, ct).ConfigureAwait(continueOnCapturedContext: false);
		if (apiResult.IsSuccess)
		{
			try
			{
				ConfigResponse configResponse = apiResult.Parse<ConfigResponse>();
				_state.Policy = configResponse.Policy.Clamped();
				_state.LastConfigFetchAt = Iso.Format(_clock.UtcNow);
				_state.Save(_statePath);
			}
			catch (Exception ex) when ((ex is JsonException || ex is InvalidDataException) ? true : false)
			{
				_log.Warn("config_parse_failed");
			}
			_nextConfig = _clock.UtcNow.AddHours(6.0);
		}
		else if (!HandleTerminal(apiResult))
		{
			_nextConfig = _clock.UtcNow.AddMinutes(30.0);
		}
	}

	private CollectedInventory Collect()
	{
		CollectionOptions options = new CollectionOptions(_state?.Policy.CollectNetworkAddresses ?? false, _state?.Policy.CollectDomainName ?? false, TimeSpan.FromSeconds(20L));
		Dictionary<string, Section> sections;
		try
		{
			sections = _o.Inventory.Collect(options, CancellationToken.None);
		}
		catch (Exception ex)
		{
			_log.Error("collector_exception type=" + ex.GetType().Name);
			sections = new Dictionary<string, Section> { ["system"] = new Section
			{
				Quality = "error",
				CollectedAt = Iso.Format(_clock.UtcNow),
				ErrorCode = "COLLECTOR_EXCEPTION"
			} };
		}
		CollectedInventory collectedInventory = new CollectedInventory(sections, ContentHash.Compute(sections), _clock.UtcNow);
		lock (_statusGate)
		{
			_latest = collectedInventory;
			return collectedInventory;
		}
	}

	private void InventoryCycle()
	{
		CollectedInventory cur = Collect();
		AgentPolicy agentPolicy = _state.Policy.Clamped();
		DateTimeOffset utcNow = _clock.UtcNow;
		if ((object)_confirmation != null)
		{
			Confirmation conf = _confirmation;
			bool flag = conf.Sections.All((string s) => cur.Hash.SectionHashes.GetValueOrDefault(s) == conf.Candidate.Hash.SectionHashes.GetValueOrDefault(s) && cur.Sections.GetValueOrDefault(s)?.Quality == "ok");
			bool flag2 = conf.Sections.All((string s) => cur.Hash.SectionHashes.GetValueOrDefault(s) == _state.LastEnqueuedSectionHashes.GetValueOrDefault(s));
			_confirmation = null;
			if (flag)
			{
				EnqueueInventory(cur, "change_confirmed");
				_log.Info("hardware_change_confirmed sections=" + string.Join('+', conf.Sections));
			}
			else if (flag2)
			{
				_log.Info("hardware_change_not_confirmed (voltou ao anterior)");
			}
			else
			{
				if (conf.Attempt < 3)
				{
					_confirmation = conf with
					{
						Candidate = cur,
						Attempt = conf.Attempt + 1,
						DueAt = utcNow.AddSeconds(agentPolicy.ChangeConfirmationDelaySeconds)
					};
					return;
				}
				EnqueueInventory(cur, "periodic");
			}
			_nextInventory = utcNow.AddSeconds(agentPolicy.InventoryIntervalSeconds);
			return;
		}
		if (_state.LastEnqueuedInventoryId == null || _afterLink)
		{
			EnqueueInventory(cur, _afterLink ? "after_link" : "startup");
			_afterLink = false;
		}
		else
		{
			IReadOnlyList<string> readOnlyList = ContentHash.SuspectedHardwareChanges(_state.LastEnqueuedSectionHashes, _state.LastEnqueuedSectionQuality, cur.Hash.SectionHashes, cur.Qualities);
			if (readOnlyList.Count > 0)
			{
				_confirmation = new Confirmation(cur, readOnlyList, 1, utcNow.AddSeconds(agentPolicy.ChangeConfirmationDelaySeconds));
				_log.Info("hardware_change_suspected sections=" + string.Join('+', readOnlyList));
				return;
			}
			DateTimeOffset dateTimeOffset = Iso.TryParse(_state.LastEnqueuedAt) ?? DateTimeOffset.MinValue;
			if (cur.Hash.ContentHash != _state.LastEnqueuedContentHash || utcNow - dateTimeOffset >= TimeSpan.FromSeconds(agentPolicy.InventoryForceSendSeconds))
			{
				EnqueueInventory(cur, "periodic");
			}
		}
		_nextInventory = utcNow.AddSeconds(agentPolicy.InventoryIntervalSeconds);
	}

	private void EnqueueInventory(CollectedInventory inv, string reason)
	{
		InventoryMessage inventoryMessage = new InventoryMessage
		{
			MessageId = NewId(),
			InventoryId = NewId(),
			InstallationId = _state.InstallationId,
			BootId = _bootId,
			Sequence = NextSequence(),
			CollectedAt = Iso.Format(inv.At),
			PreviousInventoryId = _state.LastEnqueuedInventoryId,
			AgentVersion = CurrentAgentVersion,
			CollectorVersion = _o.Inventory.CollectorVersion,
			Reason = reason,
			ContentHash = inv.Hash.ContentHash
		};
		List<QueueGap> list = _queue.GapsForAttach();
		inventoryMessage.QueueGaps = ((list != null && list.Count > 0) ? list : null);
		inventoryMessage.Sections = inv.Sections;
		InventoryMessage inventoryMessage2 = inventoryMessage;
		byte[] array = AgentJson.SerializeToUtf8(inventoryMessage2);
		if (array.Length > 65536)
		{
			string[] array2 = new string[3] { "network", "gpu", "storage" };
			foreach (string key in array2)
			{
				if (array.Length <= 65536)
				{
					break;
				}
				inventoryMessage2.Sections[key] = new Section
				{
					Quality = "error",
					CollectedAt = Iso.Format(inv.At),
					ErrorCode = "PAYLOAD_LIMIT",
					Source = inventoryMessage2.Sections.GetValueOrDefault(key)?.Source
				};
				array = AgentJson.SerializeToUtf8(inventoryMessage2);
			}
			_log.Warn("inventory_payload_limit_applied");
		}
		_queue.Enqueue("inventory", "api/agent/v1/inventory", inventoryMessage2.MessageId, Encoding.UTF8.GetString(array), _clock.UtcNow, new InventoryMeta(reason, inv.Hash.ContentHash, inventoryMessage2.CollectedAt), inventoryMessage2.QueueGaps?.Select((QueueGap g) => g.GapId).ToList());
		if (inventoryMessage2.QueueGaps != null)
		{
			_log.Warn($"queue_gaps_attached count={inventoryMessage2.QueueGaps.Count}");
		}
		_state.LastEnqueuedInventoryId = inventoryMessage2.InventoryId;
		_state.LastEnqueuedContentHash = inv.Hash.ContentHash;
		_state.LastEnqueuedAt = Iso.Format(_clock.UtcNow);
		_state.LastEnqueuedSectionHashes = new Dictionary<string, string>(inv.Hash.SectionHashes);
		_state.LastEnqueuedSectionQuality = inv.Qualities;
		_state.Save(_statePath);
		_nextFlush = _clock.UtcNow;
	}

	private void EnqueueHeartbeat(string reason)
	{
		AgentPolicy agentPolicy = _state.Policy.Clamped();
		DateTimeOffset utcNow = _clock.UtcNow;
		if (agentPolicy.PerformanceEnabled && utcNow >= _nextPerf)
		{
			try
			{
				_lastPerf = _o.Inventory.SamplePerformance(CancellationToken.None);
			}
			catch
			{
				_lastPerf = null;
			}
			_nextPerf = utcNow.AddSeconds(agentPolicy.PerformanceIntervalSeconds);
		}
		QueueStats stats = _queue.Stats;
		HeartbeatMessage heartbeatMessage = new HeartbeatMessage
		{
			MessageId = NewId(),
			InstallationId = _state.InstallationId,
			BootId = _bootId,
			Sequence = NextSequence(),
			CollectedAt = Iso.Format(utcNow),
			AgentVersion = CurrentAgentVersion,
			UptimeSeconds = Math.Max(0L, Environment.TickCount64 / 1000),
			Reason = reason,
			Health = new HeartbeatHealth
			{
				Inventory = (((object)_latest == null) ? "not_run" : WorstQuality(_latest.Sections.Values.Select((Section s) => s.Quality))),
				PendingMessages = Math.Max(0, SafeQueueCount()),
				DroppedMessages = stats.DroppedInventories,
				LastErrorCode = _lastErrorCode
			},
			LatestInventoryId = _state.LastEnqueuedInventoryId,
			Performance = (agentPolicy.PerformanceEnabled ? _lastPerf : null)
		};
		byte[] bytes = AgentJson.SerializeToUtf8(heartbeatMessage);
		_queue.Enqueue("heartbeat", "api/agent/v1/heartbeat", heartbeatMessage.MessageId, Encoding.UTF8.GetString(bytes), utcNow);
		_state.Save(_statePath);
		_nextHeartbeatReason = "periodic";
		double num = 1.0 + (Random.Shared.NextDouble() * 2.0 - 1.0) * (double)agentPolicy.HeartbeatJitterPercent / 100.0;
		_nextHeartbeat = utcNow.AddSeconds((double)agentPolicy.HeartbeatIntervalSeconds * num);
		_nextFlush = utcNow;
	}

	private static string WorstQuality(IEnumerable<string> qs)
	{
		List<string> list = qs.ToList();
		if (list.Count == 0)
		{
			return "not_run";
		}
		if (list.All((string q) => q == "ok"))
		{
			return "ok";
		}
		return "partial";
	}

	private async Task FlushQueueAsync(CancellationToken ct)
	{
		foreach (QueueItem item in _queue.Pending(20))
		{
			ct.ThrowIfCancellationRequested();
			ApiResult apiResult = await PostSignedAsync(item.Path, Encoding.UTF8.GetBytes(item.Body), ct).ConfigureAwait(continueOnCapturedContext: false);
			if (apiResult.Status == 401 && apiResult.Code == "CLOCK_SKEW")
			{
				apiResult = await PostSignedAsync(item.Path, Encoding.UTF8.GetBytes(item.Body), ct).ConfigureAwait(continueOnCapturedContext: false);
			}
			if (apiResult.IsSuccess)
			{
				Ack ack;
				try
				{
					ack = apiResult.Parse<Ack>();
				}
				catch (Exception ex) when ((ex is JsonException || ex is InvalidDataException) ? true : false)
				{
					ack = null;
				}
				if (ack != null && ack.Accepted && ack.MessageId == item.MessageId)
				{
					_queue.Acknowledge(item, ack.MessageId);
					string text = ack.ServerReceivedAt ?? Iso.Format(_clock.UtcNow);
					lock (_statusGate)
					{
						if (item.Kind == "heartbeat")
						{
							_lastHbAck = text;
						}
						else
						{
							_lastInvAck = text;
							_state.LastAckedInventoryId = ack.StoredInventoryId;
							_state.LastAckedInventoryAt = text;
							_state.Save(_statePath);
						}
					}
					_failures = 0;
					ClearError();
					if (item.Kind == "heartbeat") await HandleNetworkAsync(ack.NetworkTest, ct);
					continue;
				}
				_queueAckInvalid("ACK_INVALID");
				_queue.RecordAttempt(item, "ACK_INVALID");
				ScheduleRetry(apiResult with
				{
					TransportError = "ACK_INVALID"
				}, ref _nextFlush);
				return;
			}
			if (apiResult.TransportError != null)
			{
				_queue.RecordAttempt(item, apiResult.Code);
				ScheduleRetry(apiResult, ref _nextFlush);
				return;
			}
			string code = apiResult.Code;
			if ((code == "MESSAGE_ID_CONFLICT" || code == "INVENTORY_ID_CONFLICT") ? true : false)
			{
				_queue.Quarantine(item, conflict: true, apiResult.Code);
				continue;
			}
			int status = apiResult.Status;
			if ((status == 400 || status == 413 || status == 422) ? true : false)
			{
				_queue.Quarantine(item, conflict: false, apiResult.Code);
				SetError(apiResult.Code, "Mensagem recusada pelo servidor (formato).");
				continue;
			}
			if (!HandleTerminal(apiResult))
			{
				_queue.RecordAttempt(item, apiResult.Code);
				ScheduleRetry(apiResult, ref _nextFlush);
			}
			return;
		}
		_nextFlush = _clock.UtcNow.AddSeconds((_queue.Count > 0) ? 1 : 3600);
	}

	private static T? TryParse<T>(ApiResult res) where T : class
	{
		try
		{
			return res.Parse<T>();
		}
		catch (Exception ex) when ((ex is JsonException || ex is InvalidDataException) ? true : false)
		{
			return null;
		}
	}

	private void _queueAckInvalid(string code)
	{
		_log.Warn("response_invalid code=" + code);
	}

	private bool HandleTerminal(ApiResult res)
	{
		if (res.Status == 403 && res.Code == "REVOKED")
		{
			lock (_statusGate)
			{
				_state.Phase = "revoked";
				_state.Save(_statePath);
				DeleteTicket();
			}
			SetError("REVOKED", "Instalação revogada pelo administrador. O agente parou de enviar dados.");
			_log.Warn("revoked");
			return true;
		}
		if (res.Status == 403 && res.Code == "DEVICE_NOT_LINKED" && _state.Phase == "linked")
		{
			lock (_statusGate)
			{
				_state.Phase = "pending_pairing";
				_state.Link = null;
				_state.Save(_statePath);
			}
			SetError(res.Code, "Servidor informa que o dispositivo não está vinculado.");
			_nextStatusPoll = _clock.UtcNow;
			return true;
		}
		if (res.Status == 401 && res.Code != "CLOCK_SKEW")
		{
			_failures = Math.Min(_failures + 1, 10);
			TimeSpan timeSpan = TimeSpan.FromMinutes(Math.Min(360.0, 15.0 * Math.Pow(2.0, _failures - 1)));
			_nextFlush = (_nextStatusPoll = (_nextConfig = _clock.UtcNow + timeSpan));
			_nextHeartbeat = _clock.UtcNow + timeSpan;
			SetError(res.Code, "Falha de autenticação do dispositivo.");
			_log.Warn($"auth_failed code={res.Code} wait_min={(int)timeSpan.TotalMinutes}");
			return true;
		}
		return false;
	}

	private void ScheduleRetry(ApiResult res, ref DateTimeOffset next)
	{
		_failures = Math.Min(_failures + 1, 10);
		TimeSpan timeSpan = TimeSpan.FromSeconds(Math.Min(1800.0, 15.0 * Math.Pow(2.0, _failures - 1)));
		double num = 0.8 + Random.Shared.NextDouble() * 0.4;
		TimeSpan timeSpan2 = timeSpan * num;
		TimeSpan? retryAfter = res.RetryAfter;
		if (retryAfter.HasValue)
		{
			TimeSpan valueOrDefault = retryAfter.GetValueOrDefault();
			if (valueOrDefault > timeSpan2)
			{
				timeSpan2 = ((valueOrDefault > TimeSpan.FromHours(6)) ? TimeSpan.FromHours(6) : valueOrDefault);
			}
		}
		next = _clock.UtcNow + timeSpan2;
		_nextAttemptAt = next;
		if (res.Status == 0)
		{
			_connected = false;
		}
		string code = res.Code;
		int status = res.Status;
		string message;
		if (status < 300)
		{
			if (status < 200)
			{
				if (status != 0)
				{
					goto IL_014f;
				}
				message = "Servidor inalcançável (" + res.Code + "): verifique rede, DNS ou proxy da escola.";
			}
			else
			{
				message = "Resposta do servidor ilegível (proxy ou filtro de rede?).";
			}
		}
		else if (status < 500)
		{
			if (status != 429)
			{
				goto IL_014f;
			}
			message = "Servidor pediu para aguardar (muitas tentativas).";
		}
		else
		{
			message = "Servidor indisponível temporariamente.";
		}
		goto IL_0187;
		IL_014f:
		message = $"Falha temporária (HTTP {res.Status}).";
		goto IL_0187;
		IL_0187:
		SetError(code, message);
	}

	private Task<ApiResult> PostDeviceAsync(string route, object body, CancellationToken ct)
	{
		return PostSignedAsync("api/agent/v1/" + route, AgentJson.SerializeToUtf8(body), ct);
	}

	private async Task<ApiResult> PostSignedAsync(string relPath, byte[] body, CancellationToken ct)
	{
		if (_key == null || _state.DeviceId == null)
		{
			return new ApiResult(0, Array.Empty<byte>(), null, null, null, "NO_IDENTITY");
		}
		(Uri Uri, string SignPath) tuple = _api.Resolve(relPath);
		Uri item = tuple.Uri;
		string item2 = tuple.SignPath;
		SignedHeaders signedHeaders = RequestSigner.Sign(_key, "POST", item2, body, SignTimestamp());
		ApiResult apiResult = await _api.PostAsync(item, body, new Dictionary<string, string>
		{
			["Authorization"] = "SEMED-Device " + _state.DeviceId,
			["X-SEMED-Installation"] = _state.InstallationId,
			["X-SEMED-Key-Id"] = _key.KeyId,
			["X-SEMED-Timestamp"] = signedHeaders.Timestamp,
			["X-SEMED-Nonce"] = signedHeaders.Nonce,
			["X-SEMED-Signature"] = signedHeaders.Signature
		}, ct).ConfigureAwait(continueOnCapturedContext: false);
		Observe(apiResult);
		return apiResult;
	}

	private void Observe(ApiResult res)
	{
		_connected = res.Status != 0;
		_lastHttpStatus = ((res.Status == 0) ? ((int?)null) : new int?(res.Status));
		_lastCorrelationId = res.Error?.CorrelationId;
		if (res.Status != 0)
		{
			_lastContactAt = _clock.UtcNow;
		}
		DateTimeOffset? dateTimeOffset = Iso.TryParse(res.Error?.ServerTime) ?? res.ServerDate;
		if (dateTimeOffset.HasValue)
		{
			DateTimeOffset valueOrDefault = dateTimeOffset.GetValueOrDefault();
			TimeSpan timeSpan = valueOrDefault - _clock.UtcNow;
			_clockOffset = ((Math.Abs(timeSpan.TotalSeconds) > 60.0) ? timeSpan : TimeSpan.Zero);
			if (res.Code == "CLOCK_SKEW")
			{
				_log.Warn($"clock_skew offset_s={(int)timeSpan.TotalSeconds}");
			}
		}
	}

	private long SignTimestamp()
	{
		return (_clock.UtcNow + _clockOffset).ToUnixTimeSeconds();
	}

	private long NextSequence()
	{
		_state.Sequence++;
		return _state.Sequence;
	}

	private EnrollmentSummary BuildSummary(CollectedInventory inv)
	{
		SystemData systemData = inv.Sections.GetValueOrDefault("system")?.Data as SystemData;
		CpuData cpuData = inv.Sections.GetValueOrDefault("cpu")?.Data as CpuData;
		MemoryData memoryData = inv.Sections.GetValueOrDefault("memory")?.Data as MemoryData;
		OsData osData = inv.Sections.GetValueOrDefault("os")?.Data as OsData;
		EnrollmentSummary enrollmentSummary = new EnrollmentSummary
		{
			Hostname = (systemData?.Hostname ?? Environment.MachineName),
			Manufacturer = systemData?.Manufacturer,
			Model = systemData?.Model,
			SerialHint = ((systemData == null) ? null : Normalization.SerialHint(systemData.Serial)),
			CpuName = cpuData?.Processors.FirstOrDefault()?.Name
		};
		long? num = cpuData?.Processors.Sum((ProcessorData p) => p.LogicalProcessors.GetValueOrDefault());
		long? logicalProcessors;
		if (num.HasValue)
		{
			long valueOrDefault = num.GetValueOrDefault();
			if (valueOrDefault > 0)
			{
				logicalProcessors = valueOrDefault;
				goto IL_0172;
			}
		}
		logicalProcessors = null;
		goto IL_0172;
		IL_0172:
		enrollmentSummary.LogicalProcessors = logicalProcessors;
		enrollmentSummary.InstalledMemoryBytes = memoryData?.InstalledBytes;
		enrollmentSummary.OsCaption = osData?.Caption;
		enrollmentSummary.OsBuild = osData?.BuildNumber;
		return enrollmentSummary;
	}

	private MachineSignals SafeSignals()
	{
		try
		{
			return _o.Inventory.ReadMachineSignals();
		}
		catch
		{
			return new MachineSignals(null, null);
		}
	}

	private static string HashSignal(string v)
	{
		return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes("semed-signal-v1:" + v.Trim().ToUpperInvariant())));
	}

	private static string NewId()
	{
		return Guid.NewGuid().ToString("D");
	}

	private PairingTicket? LoadTicket()
	{
		try
		{
			if (!File.Exists(_ticketPath))
			{
				return null;
			}
			return AgentJson.Deserialize<PairingTicket>(File.ReadAllBytes(_ticketPath));
		}
		catch
		{
			return null;
		}
	}

	private void SaveTicket(PairingTicket t)
	{
		_ticket = t;
		AtomicFile.WriteAllBytes(_ticketPath, AgentJson.SerializeToUtf8(t));
		if (_o.DevWritePairingFile)
		{
			AtomicFile.WriteAllText(_devPairingPath, QrPayloadJson(t));
		}
	}

	private void DeleteTicket()
	{
		_ticket = null;
		string[] array = new string[2] { _ticketPath, _devPairingPath };
		foreach (string path in array)
		{
			try
			{
				if (File.Exists(path))
				{
					File.Delete(path);
				}
			}
			catch
			{
			}
		}
	}

	private void SetError(string code, string message)
	{
		lock (_statusGate)
		{
			_lastErrorCode = code;
			_lastErrorMessage = message;
			_lastErrorAt = _clock.UtcNow;
		}
	}

	private static string? ActionHint(StatusSnapshot s)
	{
		switch (s.Activation)
		{
		case "not_configured":
			return "Reinstale com o instalador do sistema (ele já traz o endereço).";
		case "no_grant":
			return "Execute o pacote da campanha neste computador (não é preciso desinstalar), ou abra esta janela como administrador e informe a autorização.";
		case "refused":
		{
			string result;
			switch (s.LastErrorCode)
			{
			case "GRANT_USED":
				result = "Peça ao root um novo lote (ou um pacote de campanha atualizado) e execute-o aqui. Não é preciso reinstalar tudo.";
				break;
			case "GRANT_EXPIRED":
				result = "Peça ao root um pacote de campanha atualizado (prazo novo) e execute-o aqui.";
				break;
			case "GRANT_REVOKED":
				result = "Autorização revogada: fale com o root antes de continuar.";
				break;
			case "INVALID_GRANT":
				result = "Confira se o pacote é desta campanha e deste sistema; peça ao root um pacote válido.";
				break;
			case "GRANT_FILE_EMPTY":
			case "GRANT_FILE_INVALID":
			case "GRANT_FILE_UNREADABLE":
				result = "Execute de novo o pacote da campanha (o arquivo de autorização está com problema).";
				break;
			case "ENROLL_REJECTED":
				result = "Copie o diagnóstico e envie ao desenvolvedor.";
				break;
			default:
				result = "Copie o diagnóstico e envie ao responsável.";
				break;
			}
			return result;
		}
		case "waiting_server":
			return "Nada a fazer neste computador. Quando o sistema de inventário for atualizado (cadastro sem autorização), a ativação acontece sozinha.";
		case "unknown_result":
			return "Aguarde a nova tentativa automática. Se persistir, peça ao root para conferir o cadastro no painel. Não reinstale nem use outro pacote.";
		case "activating":
			if (s.LastErrorCode == "CLOCK_SKEW")
			{
				return "Acerte data, hora e fuso horário do Windows.";
			}
			if (!s.ServerReachable && s.LastErrorCode != null)
			{
				return "Verifique a internet da escola (rede, DNS, proxy). O agente tenta de novo sozinho.";
			}
			break;
		case "accepted":
			if (s.Phase == "pending_pairing")
			{
				return "No celular, leia o QR pelo coletor e confira o código.";
			}
			break;
		case "revoked":
			return "Instalação revogada. Execute o instalador atualizado e escolha Recuperar instalação revogada. Ele preserva os dados antigos e prepara nova identidade para outro QR. Não use /PURGE.";
		case "identity_conflict":
			return "Possível imagem clonada: o root revoga e a máquina é reinstalada com /PURGE.";
		case "blocked":
			return "Reinstale como administrador (o instalador corrige as permissões).";
		}
		return null;
	}

	private void ClearError()
	{
		lock (_statusGate)
		{
			_lastErrorCode = null;
			_lastErrorMessage = null;
			_nextAttemptAt = null;
		}
	}

	public void Dispose()
	{
		_api?.Dispose();
		_key?.Dispose();
		_op.Dispose();
		_wake.Dispose();
	}
}
