using System;
using System.IO.Pipes;
using System.Threading;
using System.Threading.Tasks;
using Semed.Agent.Engine;
using Semed.Agent.Util;

namespace Semed.Agent.Ipc;

public static class PipeDispatcher
{
	private static PipeResponse Denied(AgentEngine engine)
	{
		return new PipeResponse
		{
			Ok = false,
			Code = "ADMIN_REQUIRED",
			Status = engine.GetStatus(),
			Message = "Esta ação exige o Agente aberto como administrador local."
		};
	}

	public static PipeResponse Handle(AgentEngine engine, PipeRequest? req, PipeCaller caller, PipePolicy policy)
	{
		switch (req?.Type)
		{
		case "status":
			return new PipeResponse
			{
				Ok = true,
				Status = engine.GetStatus()
			};
		case "renew_pairing":
			if (!policy.Allows(policy.RenewRequires, caller))
			{
				return Denied(engine);
			}
			return new PipeResponse
			{
				Ok = true,
				Message = engine.RequestRenew(),
				Status = engine.GetStatus()
			};
		case "submit_grant":
		{
			if (!policy.Allows(policy.GrantRequires, caller))
			{
				return Denied(engine);
			}
			string grantCode = req.GrantCode;
			if (grantCode != null)
			{
				int length = grantCode.Length;
				if (length > 0 && length <= 128)
				{
					return new PipeResponse
					{
						Ok = true,
						Message = engine.SubmitGrant(grantCode),
						Status = engine.GetStatus()
					};
				}
			}
			break;
		}
		}
		return new PipeResponse
		{
			Ok = false,
			Code = "UNSUPPORTED",
			Message = "Requisição não suportada."
		};
	}

	public static async Task ServeAsync(AgentEngine engine, Func<NamedPipeServerStream> createServer, Func<NamedPipeServerStream, PipeCaller> identify, PipePolicy policy, FileLog log, CancellationToken ct)
	{
		DateTimeOffset lastErrorLog = DateTimeOffset.MinValue;
		int suppressed = 0;
		while (!ct.IsCancellationRequested)
		{
			NamedPipeServerStream server = null;
			try
			{
				server = createServer();
				await server.WaitForConnectionAsync(ct).ConfigureAwait(continueOnCapturedContext: false);
				using CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
				timeout.CancelAfter(TimeSpan.FromSeconds(5L));
				PipeRequest pipeRequest = await PipeProtocol.ReadMessageAsync<PipeRequest>(server, timeout.Token).ConfigureAwait(continueOnCapturedContext: false);
				_ = PipeCaller.Unknown;
				PipeCaller caller;
				try
				{
					caller = identify(server);
				}
				catch
				{
					caller = PipeCaller.Unknown;
				}
				PipeResponse pipeResponse = Handle(engine, pipeRequest, caller, policy);
				if (pipeResponse.Code == "ADMIN_REQUIRED")
				{
					log.Warn($"pipe_denied type={pipeRequest?.Type} identified={caller.Identified}");
				}
				await PipeProtocol.WriteMessageAsync(server, pipeResponse, timeout.Token).ConfigureAwait(continueOnCapturedContext: false);
			}
			catch (OperationCanceledException) when (ct.IsCancellationRequested)
			{
				break;
			}
			catch (Exception ex2)
			{
				suppressed++;
				DateTimeOffset utcNow = DateTimeOffset.UtcNow;
				if (utcNow - lastErrorLog >= TimeSpan.FromMinutes(10L))
				{
					log.Warn($"pipe_error type={ex2.GetType().Name} ocorrencias={suppressed}");
					lastErrorLog = utcNow;
					suppressed = 0;
				}
				await Task.Delay(200, CancellationToken.None).ConfigureAwait(continueOnCapturedContext: false);
			}
			finally
			{
				if (server != null)
				{
					await server.DisposeAsync().ConfigureAwait(continueOnCapturedContext: false);
				}
			}
		}
	}
}
