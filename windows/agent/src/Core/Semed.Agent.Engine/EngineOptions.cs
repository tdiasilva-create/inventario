using System;
using System.Collections.Generic;
using System.Net.Http;
using Semed.Agent.Crypto;
using Semed.Agent.Inventory;
using Semed.Agent.Util;

namespace Semed.Agent.Engine;

public sealed class EngineOptions
{
	public required string DataDirectory { get; init; }

	public required AgentConfig Config { get; init; }

	public required IKeyStore KeyStore { get; init; }

	public required IInventorySource Inventory { get; init; }

	public required FileLog Log { get; init; }

	public string AgentVersion { get; init; } = "0.1.0-test";

	public IClock Clock { get; init; } = SystemClock.Instance;

	public HttpMessageHandler? HttpHandler { get; init; }

	public Func<IReadOnlyList<string>>? SecurityCheck { get; init; }

	public bool DevWritePairingFile { get; init; }
}
