using System;
using System.Collections.Generic;
using System.Globalization;
using System.Runtime.CompilerServices;
using System.Text;
using Semed.Agent.Protocol;
using Semed.Agent.Util;

namespace Semed.Agent.Engine;

public sealed class StatusView
{
	public enum StepState
	{
		Todo,
		Current,
		Done,
		Failed
	}

	public enum Severity
	{
		Info,
		Ok,
		Warning,
		Error
	}

	public sealed record Step(string Label, StepState State, string? Detail);

	public required IReadOnlyList<Step> Steps { get; init; }

	public required string Headline { get; init; }

	public required string Body { get; init; }

	public string? Hint { get; init; }

	public required Severity Level { get; init; }

	public bool ShowQr { get; init; }

	public bool ShowRenew { get; init; }

	public bool ShowGrantEntry { get; init; }

	public required string MachineSummary { get; init; }

	public required string Diagnostics { get; init; }

	public static string Local(string? iso, bool seconds = false)
	{
		DateTimeOffset? dateTimeOffset = Iso.TryParse(iso);
		if (!dateTimeOffset.HasValue)
		{
			return "—";
		}
		return TimeZoneInfo.ConvertTime(dateTimeOffset.Value, TimeZoneInfo.Local).ToString(seconds ? "dd'/'MM'/'yyyy HH':'mm':'ss" : "dd'/'MM'/'yyyy HH':'mm", CultureInfo.InvariantCulture);
	}

	private static string Bytes(long? b)
	{
		if (b.HasValue)
		{
			return ((double)b.Value / 1073741824.0).ToString("0.#", CultureInfo.InvariantCulture) + " GiB";
		}
		return "—";
	}

	public static StatusView Build(StatusSnapshot? s, bool serviceUnreachable)
	{
		if (serviceUnreachable || s == null)
		{
			return new StatusView
			{
				Steps = new _003C_003Ez__ReadOnlyArray<Step>(new Step[5]
				{
					new Step("Serviço instalado e em execução", StepState.Failed, "não respondeu"),
					new Step("Ativação do computador", StepState.Todo, null),
					new Step("QR pronto para leitura", StepState.Todo, null),
					new Step("Vinculado à unidade / ambiente / posição", StepState.Todo, null),
					new Step("Último inventário recebido", StepState.Todo, null)
				}),
				Headline = "O serviço do agente não está respondendo.",
				Body = "Esta janela só mostra o que o serviço informa. Ele pode estar iniciando (aguarde alguns segundos) ou parado.",
				Hint = "Em services.msc, confira se \"Agente de Inventário SEMED\" está em execução. Log: C:\\ProgramData\\SEMED\\Agent\\logs\\agent.log (abrir como administrador).",
				Level = Severity.Error,
				MachineSummary = "",
				Diagnostics = "Serviço do agente não respondeu à janela."
			};
		}
		string activation = s.Activation;
		bool flag = s.Phase == "linked";
		bool flag2 = s.Phase == "pending_pairing";
		_ = activation == "accepted";
		object obj;
		if (s.LastErrorCode != null)
		{
			DefaultInterpolatedStringHandler defaultInterpolatedStringHandler = new DefaultInterpolatedStringHandler(18, 4);
			defaultInterpolatedStringHandler.AppendLiteral("Detalhe técnico: ");
			defaultInterpolatedStringHandler.AppendFormatted(s.LastErrorCode);
			int? lastHttpStatus = s.LastHttpStatus;
			string value;
			if (lastHttpStatus.HasValue)
			{
				int valueOrDefault = lastHttpStatus.GetValueOrDefault();
				value = $", HTTP {valueOrDefault}";
			}
			else
			{
				value = "";
			}
			defaultInterpolatedStringHandler.AppendFormatted(value);
			defaultInterpolatedStringHandler.AppendFormatted((s.LastErrorAt == null) ? "" : (", " + Local(s.LastErrorAt, seconds: true)));
			defaultInterpolatedStringHandler.AppendFormatted((s.LastCorrelationId == null) ? "" : (", correlação " + s.LastCorrelationId));
			defaultInterpolatedStringHandler.AppendLiteral(".");
			obj = defaultInterpolatedStringHandler.ToStringAndClear();
		}
		else
		{
			obj = null;
		}
		string text = (string)obj;
		string text2 = ((s.NextAttemptAt == null) ? "" : (" Próxima tentativa: " + Local(s.NextAttemptAt, seconds: true) + "."));
		StepState stepState;
		switch (activation)
		{
		case "accepted":
			stepState = StepState.Done;
			break;
		case "activating":
		case "unknown_result":
		case "waiting_server":
			stepState = StepState.Current;
			break;
		default:
			stepState = StepState.Failed;
			break;
		}
		StepState state = stepState;
		string detail = activation switch
		{
			"accepted" => "cadastro aceito pelo servidor", 
			"activating" => s.ServerReachable ? "aguardando o servidor" : "tentando alcançar o servidor", 
			"unknown_result" => "resposta não confirmada — tentando de novo", 
			"waiting_server" => "aguardando a atualização do sistema", 
			"no_grant" => "sem autorização de instalação", 
			"refused" => "recusada" + ((s.LastErrorCode == null) ? "" : (" (" + s.LastErrorCode + ")")), 
			"revoked" => "instalação revogada", 
			"identity_conflict" => "conflito de identidade", 
			"blocked" => "bloqueada (permissões locais)", 
			"not_configured" => "endereço do sistema não configurado", 
			_ => activation, 
		};
		StepState state2 = (flag ? StepState.Done : ((flag2 && s.QrPayload != null) ? StepState.Current : (flag2 ? StepState.Current : StepState.Todo)));
		string detail2;
		if (flag)
		{
			detail2 = "usado no vínculo";
		}
		else if (flag2 && s.QrPayload != null)
		{
			detail2 = "válido até " + Local(s.PairingExpiresAt);
		}
		else if (flag2 && s.PairingExpired)
		{
			detail2 = "expirou — gerar novo";
		}
		else
		{
			detail2 = (flag2 ? "preparando" : null);
		}
		string detail3 = ((flag && s.Link != null) ? $"{s.Link.UnitName ?? "—"} / {s.Link.EnvironmentName ?? "—"} / {s.Link.PositionLabel ?? "—"}" : null);
		StepState state3 = ((s.LastInventoryAckAt != null) ? StepState.Done : (flag ? StepState.Current : StepState.Todo));
		string detail4;
		if (s.LastInventoryAckAt != null)
		{
			detail4 = Local(s.LastInventoryAckAt);
		}
		else
		{
			detail4 = (flag ? "aguardando o primeiro envio" : null);
		}
		List<Step> steps = new List<Step>
		{
			new Step("Serviço instalado e em execução", StepState.Done, "versão " + s.AgentVersion),
			new Step("Ativação do computador", state, detail),
			new Step("QR pronto para leitura", state2, detail2),
			new Step("Vinculado à unidade / ambiente / posição", flag ? StepState.Done : StepState.Todo, detail3),
			new Step("Último inventário recebido", state3, detail4)
		};
		string hint = s.ActionHint;
		string headline;
		string text3;
		Severity severity;
		switch (activation)
		{
		case "accepted":
			if (flag)
			{
				headline = "Vinculado — este computador está no inventário.";
				text3 = $"Equipamento {s.Link?.EquipmentId ?? "—"}. Unidade: {s.Link?.UnitName ?? "—"}. Ambiente: {s.Link?.EnvironmentName ?? "—"}. Posição: {s.Link?.PositionLabel ?? "—"}. Vinculado em {Local(s.Link?.LinkedAt)}." + ((s.LastInventoryAckAt == null) ? " Aguardando o primeiro inventário ser recebido." : (" Último inventário recebido em " + Local(s.LastInventoryAckAt) + "."));
				if (s.LastErrorMessage != null)
				{
					text3 = text3 + " Atenção: " + s.LastErrorMessage + text2;
				}
				severity = ((s.LastErrorCode == null) ? Severity.Ok : Severity.Warning);
				hint = null;
			}
			else if (flag2 && s.QrPayload != null)
			{
				headline = "Pronto para vincular.";
				text3 = "No celular, abra o coletor (Vincular computador), leia o QR e confira se o código de conferência é o mesmo desta tela. Depois escolha unidade, ambiente e posição.";
				hint = null;
				severity = Severity.Ok;
			}
			else if (flag2 && s.PairingExpired)
			{
				headline = "O QR expirou.";
				text3 = "Clique em \"Gerar novo QR\" (exige abrir esta janela como administrador). O cadastro do computador continua válido; nenhum uso novo de autorização é consumido.";
				hint = null;
				severity = Severity.Warning;
			}
			else
			{
				headline = "Ativação aceita — preparando o QR…";
				text3 = (s.LastErrorMessage ?? "Aguarde alguns segundos.") + text2;
				severity = Severity.Info;
			}
			break;
		case "activating":
			headline = ((s.ServerReachable || s.LastErrorCode == null) ? "Ativando este computador…" : "Ativando: servidor ainda não alcançado.");
			text3 = (s.LastErrorMessage ?? "Enviando o cadastro ao servidor.") + text2;
			severity = ((s.LastErrorCode != null) ? Severity.Warning : Severity.Info);
			break;
		case "waiting_server":
			headline = "Aguardando a atualização do sistema de inventário.";
			text3 = s.LastErrorMessage + text2;
			severity = Severity.Warning;
			break;
		case "unknown_result":
			headline = "Aguardando a confirmação do cadastro.";
			text3 = s.LastErrorMessage + text2;
			severity = Severity.Warning;
			break;
		case "no_grant":
			headline = "Falta a autorização de instalação.";
			text3 = "Servidor: " + (s.ServerHost ?? "—") + ". " + (s.LastErrorMessage ?? "A ativação não começou.");
			severity = Severity.Error;
			break;
		case "refused":
			headline = "Ativação recusada.";
			text3 = s.LastErrorMessage ?? "O servidor recusou o cadastro.";
			severity = Severity.Error;
			break;
		case "revoked":
			headline = "Instalação revogada pelo administrador.";
			text3 = "O agente parou de enviar dados.";
			severity = Severity.Error;
			break;
		case "identity_conflict":
			headline = "Conflito de identidade.";
			text3 = s.LastErrorMessage ?? "Instalação ou chave já registradas por outra máquina (possível imagem clonada).";
			severity = Severity.Error;
			break;
		case "blocked":
			headline = "Agente bloqueado: proteção local insuficiente.";
			text3 = s.LastErrorMessage ?? "Permissões da pasta do agente foram alteradas.";
			severity = Severity.Error;
			break;
		default:
			headline = "Endereço do sistema não configurado.";
			text3 = "Este computador não sabe para qual sistema enviar.";
			severity = Severity.Error;
			break;
		}
		bool flag3 = text != null;
		if (flag3)
		{
			bool flag4 = (uint)(severity - 2) <= 1u;
			flag3 = flag4;
		}
		if (flag3)
		{
			text3 = text3 + " " + text;
		}
		EnrollmentSummary summary = s.Summary;
		string machineSummary = $"Computador: {summary?.Hostname ?? "—"}   Modelo: {((summary == null) ? "—" : (summary.Manufacturer + " " + summary.Model).Trim())}\nProcessador: {summary?.CpuName ?? "—"} ({summary?.LogicalProcessors?.ToString(CultureInfo.InvariantCulture) ?? "—"} lógicos)   RAM: {Bytes(summary?.InstalledMemoryBytes)}\n" + $"Série (parcial): {summary?.SerialHint ?? "não exposta"}   Sistema: {summary?.OsCaption ?? "—"} {summary?.OsBuild}".TrimEnd();
		return new StatusView
		{
			Steps = steps,
			Headline = headline,
			Body = text3,
			Hint = hint,
			Level = severity,
			ShowQr = (flag2 && s.QrPayload != null),
			ShowRenew = flag2,
			ShowGrantEntry = false,
			MachineSummary = machineSummary,
			Diagnostics = DiagnosticsText(s)
		};
	}

	public static string DiagnosticsText(StatusSnapshot s)
	{
		StringBuilder stringBuilder = new StringBuilder();
		StringBuilder stringBuilder2 = stringBuilder;
		StringBuilder stringBuilder3 = stringBuilder2;
		StringBuilder.AppendInterpolatedStringHandler handler = new StringBuilder.AppendInterpolatedStringHandler(27, 1, stringBuilder2);
		handler.AppendLiteral("Agente de Inventário SEMED ");
		handler.AppendFormatted(s.AgentVersion);
		stringBuilder3.AppendLine(ref handler);
		stringBuilder2 = stringBuilder;
		StringBuilder stringBuilder4 = stringBuilder2;
		handler = new StringBuilder.AppendInterpolatedStringHandler(19, 3, stringBuilder2);
		handler.AppendLiteral("Fase: ");
		handler.AppendFormatted(s.Phase);
		handler.AppendLiteral("   Ativação: ");
		handler.AppendFormatted(s.Activation);
		handler.AppendFormatted(s.EnrollOutcomeUnknown ? " (resultado do cadastro não confirmado)" : "");
		stringBuilder4.AppendLine(ref handler);
		stringBuilder2 = stringBuilder;
		StringBuilder stringBuilder5 = stringBuilder2;
		handler = new StringBuilder.AppendInterpolatedStringHandler(44, 3, stringBuilder2);
		handler.AppendLiteral("Servidor: ");
		handler.AppendFormatted(s.ServerHost ?? "não configurado");
		handler.AppendLiteral(" — alcançável: ");
		handler.AppendFormatted(s.ServerReachable ? "sim" : "não");
		handler.AppendLiteral(" (último contato: ");
		handler.AppendFormatted(Local(s.LastContactAt, seconds: true));
		handler.AppendLiteral(")");
		stringBuilder5.AppendLine(ref handler);
		stringBuilder.AppendLine("Conexão ≠ ativação: \"alcançável\" só indica que o servidor respondeu.");
		stringBuilder2 = stringBuilder;
		StringBuilder stringBuilder6 = stringBuilder2;
		handler = new StringBuilder.AppendInterpolatedStringHandler(40, 2, stringBuilder2);
		handler.AppendLiteral("Última tentativa: ");
		handler.AppendFormatted(Local(s.LastAttemptAt, seconds: true));
		handler.AppendLiteral("   Próxima tentativa: ");
		handler.AppendFormatted(Local(s.NextAttemptAt, seconds: true));
		stringBuilder6.AppendLine(ref handler);
		if (s.LastErrorCode != null)
		{
			stringBuilder2 = stringBuilder;
			StringBuilder stringBuilder7 = stringBuilder2;
			handler = new StringBuilder.AppendInterpolatedStringHandler(39, 4, stringBuilder2);
			handler.AppendLiteral("Código: ");
			handler.AppendFormatted(s.LastErrorCode);
			handler.AppendLiteral("   HTTP: ");
			handler.AppendFormatted(s.LastHttpStatus?.ToString(CultureInfo.InvariantCulture) ?? "—");
			handler.AppendLiteral("   Em: ");
			handler.AppendFormatted(Local(s.LastErrorAt, seconds: true));
			handler.AppendLiteral("   Correlação: ");
			handler.AppendFormatted(s.LastCorrelationId ?? "—");
			stringBuilder7.AppendLine(ref handler);
		}
		else if (s.LastHttpStatus.HasValue)
		{
			stringBuilder2 = stringBuilder;
			StringBuilder stringBuilder8 = stringBuilder2;
			handler = new StringBuilder.AppendInterpolatedStringHandler(37, 2, stringBuilder2);
			handler.AppendLiteral("Última resposta HTTP: ");
			handler.AppendFormatted(s.LastHttpStatus);
			handler.AppendLiteral("   Correlação: ");
			handler.AppendFormatted(s.LastCorrelationId ?? "—");
			stringBuilder8.AppendLine(ref handler);
		}
		if (s.LastErrorMessage != null)
		{
			stringBuilder2 = stringBuilder;
			StringBuilder stringBuilder9 = stringBuilder2;
			handler = new StringBuilder.AppendInterpolatedStringHandler(10, 1, stringBuilder2);
			handler.AppendLiteral("Mensagem: ");
			handler.AppendFormatted(s.LastErrorMessage);
			stringBuilder9.AppendLine(ref handler);
		}
		if (s.GrantFile != null)
		{
			stringBuilder2 = stringBuilder;
			StringBuilder stringBuilder10 = stringBuilder2;
			handler = new StringBuilder.AppendInterpolatedStringHandler(30, 1, stringBuilder2);
			handler.AppendLiteral("Autorização neste computador: ");
			handler.AppendFormatted(s.GrantFile);
			stringBuilder10.AppendLine(ref handler);
		}
		if (s.CampaignLabel != null)
		{
			stringBuilder2 = stringBuilder;
			StringBuilder stringBuilder11 = stringBuilder2;
			handler = new StringBuilder.AppendInterpolatedStringHandler(20, 1, stringBuilder2);
			handler.AppendLiteral("Pacote de campanha: ");
			handler.AppendFormatted(s.CampaignLabel);
			stringBuilder11.AppendLine(ref handler);
		}
		if (s.Link != null)
		{
			stringBuilder2 = stringBuilder;
			StringBuilder stringBuilder12 = stringBuilder2;
			handler = new StringBuilder.AppendInterpolatedStringHandler(39, 5, stringBuilder2);
			handler.AppendLiteral("Vínculo: equipamento ");
			handler.AppendFormatted(s.Link.EquipmentId);
			handler.AppendLiteral(" — ");
			handler.AppendFormatted(s.Link.UnitName ?? "—");
			handler.AppendLiteral(" / ");
			handler.AppendFormatted(s.Link.EnvironmentName ?? "—");
			handler.AppendLiteral(" / ");
			handler.AppendFormatted(s.Link.PositionLabel ?? "—");
			handler.AppendLiteral(" (desde ");
			handler.AppendFormatted(Local(s.Link.LinkedAt));
			handler.AppendLiteral(")");
			stringBuilder12.AppendLine(ref handler);
		}
		if (s.Phase == "pending_pairing")
		{
			stringBuilder2 = stringBuilder;
			StringBuilder stringBuilder13 = stringBuilder2;
			handler = new StringBuilder.AppendInterpolatedStringHandler(28, 1, stringBuilder2);
			handler.AppendLiteral("QR: ");
			string? value;
			if (s.QrPayload != null)
			{
				value = "válido até " + Local(s.PairingExpiresAt, seconds: true);
			}
			else
			{
				value = (s.PairingExpired ? "expirado" : "preparando");
			}
			handler.AppendFormatted(value);
			handler.AppendLiteral(" (conteúdo não incluído)");
			stringBuilder13.AppendLine(ref handler);
		}
		stringBuilder2 = stringBuilder;
		StringBuilder stringBuilder14 = stringBuilder2;
		handler = new StringBuilder.AppendInterpolatedStringHandler(54, 2, stringBuilder2);
		handler.AppendLiteral("Último heartbeat aceito: ");
		handler.AppendFormatted(Local(s.LastHeartbeatAckAt, seconds: true));
		handler.AppendLiteral("   Último inventário aceito: ");
		handler.AppendFormatted(Local(s.LastInventoryAckAt, seconds: true));
		stringBuilder14.AppendLine(ref handler);
		stringBuilder2 = stringBuilder;
		StringBuilder stringBuilder15 = stringBuilder2;
		handler = new StringBuilder.AppendInterpolatedStringHandler(51, 2, stringBuilder2);
		handler.AppendLiteral("Mensagens pendentes: ");
		handler.AppendFormatted(s.PendingMessages);
		handler.AppendLiteral("   Descartadas pela política: ");
		handler.AppendFormatted(s.DroppedMessages);
		stringBuilder15.AppendLine(ref handler);
		if (s.InventoryQualitySummary != null)
		{
			stringBuilder2 = stringBuilder;
			StringBuilder stringBuilder16 = stringBuilder2;
			handler = new StringBuilder.AppendInterpolatedStringHandler(21, 1, stringBuilder2);
			handler.AppendLiteral("Qualidade da coleta: ");
			handler.AppendFormatted(s.InventoryQualitySummary);
			stringBuilder16.AppendLine(ref handler);
		}
		if (s.KeyStore != null)
		{
			stringBuilder2 = stringBuilder;
			StringBuilder stringBuilder17 = stringBuilder2;
			handler = new StringBuilder.AppendInterpolatedStringHandler(7, 1, stringBuilder2);
			handler.AppendLiteral("Chave: ");
			handler.AppendFormatted(s.KeyStore);
			stringBuilder17.AppendLine(ref handler);
		}
		if (s.ClockSkewNote != null)
		{
			stringBuilder.AppendLine(s.ClockSkewNote);
		}
		stringBuilder2 = stringBuilder;
		StringBuilder stringBuilder18 = stringBuilder2;
		handler = new StringBuilder.AppendInterpolatedStringHandler(15, 2, stringBuilder2);
		handler.AppendLiteral("Atualizado: ");
		handler.AppendFormatted(Local(s.UpdatedAt, seconds: true));
		handler.AppendLiteral(" (");
		handler.AppendFormatted(s.UpdatedAt);
		handler.AppendLiteral(")");
		stringBuilder18.Append(ref handler);
		return stringBuilder.ToString();
	}
}
