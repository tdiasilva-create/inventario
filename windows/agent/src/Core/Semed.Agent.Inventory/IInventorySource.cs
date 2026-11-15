using System.Collections.Generic;
using System.Threading;
using Semed.Agent.Protocol;

namespace Semed.Agent.Inventory;

public interface IInventorySource
{
	string CollectorVersion { get; }

	Dictionary<string, Section> Collect(CollectionOptions options, CancellationToken ct);

	PerformanceSample? SamplePerformance(CancellationToken ct);

	MachineSignals ReadMachineSignals();
}
