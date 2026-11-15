namespace Semed.Agent.Engine;

public static class ActivationReport
{
	public sealed record Result(int ExitCode, bool Terminal, string Title, string Detail);

	public static Result Evaluate(StatusSnapshot? s)
	{
		if (s == null)
		{
			return new Result(6, Terminal: false, "Serviço do agente não respondeu", "O serviço pode estar iniciando. Abra a janela do Agente para acompanhar.");
		}
		string text2;
		if (s.LastErrorCode != null)
		{
			string? lastErrorCode = s.LastErrorCode;
			int? lastHttpStatus = s.LastHttpStatus;
			string text;
			if (lastHttpStatus.HasValue)
			{
				int valueOrDefault = lastHttpStatus.GetValueOrDefault();
				text = $", HTTP {valueOrDefault}";
			}
			else
			{
				text = "";
			}
			text2 = " [" + lastErrorCode + text + "]";
		}
		else
		{
			text2 = "";
		}
		string text3 = text2;
		switch (s.Activation)
		{
		case "accepted":
			if (s.Phase == "linked")
			{
				return new Result(1, Terminal: true, "Computador já vinculado", $"Vínculo existente preservado ({s.Link?.UnitName ?? "unidade"} / {s.Link?.EnvironmentName ?? "ambiente"} / {s.Link?.PositionLabel ?? "posição"}).");
			}
			if (s.QrPayload != null)
			{
				return new Result(0, Terminal: true, "Ativação aceita — QR pronto para leitura", "Leia o QR na janela do Agente pelo coletor no celular e confira o código.");
			}
			return new Result(5, Terminal: false, "Ativação aceita — preparando o QR", "O QR aparece na janela do Agente em instantes.");
		case "no_grant":
			return new Result(3, Terminal: true, "Instalado, mas SEM autorização de instalação", "A ativação não começou. Execute o pacote da campanha (contém a autorização) ou informe a autorização na janela do Agente como administrador.");
		case "refused":
			return new Result(4, Terminal: true, "Instalado, mas a ATIVAÇÃO FOI RECUSADA" + text3, s.LastErrorMessage + ((s.ActionHint == null) ? "" : (" " + s.ActionHint)));
		case "waiting_server":
			return new Result(3, Terminal: true, "Instalado — aguardando a atualização do sistema para ativar", s.LastErrorMessage ?? "");
		case "unknown_result":
			return new Result(5, Terminal: false, "Resultado da ativação ainda desconhecido" + text3, s.LastErrorMessage + " O agente continua tentando com a mesma identidade.");
		case "activating":
			return new Result(5, Terminal: false, "Ativando o computador…" + text3, s.LastErrorMessage ?? "Aguardando resposta do servidor.");
		case "not_configured":
			return new Result(7, Terminal: true, "Endereço do sistema não configurado", "Reinstale com o instalador do sistema (ele já traz o endereço).");
		case "blocked":
			return new Result(7, Terminal: true, "Agente bloqueado: proteção local insuficiente", s.LastErrorMessage ?? "");
		case "revoked":
			return new Result(7, Terminal: true, "Instalação revogada pelo administrador", s.ActionHint ?? "");
		case "identity_conflict":
			return new Result(7, Terminal: true, "Conflito de identidade (possível imagem clonada)", s.ActionHint ?? "");
		default:
			return new Result(5, Terminal: false, "Situação: " + s.Activation, s.LastErrorMessage ?? "");
		}
	}
}
