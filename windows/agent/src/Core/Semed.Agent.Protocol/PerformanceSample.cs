namespace Semed.Agent.Protocol;

public sealed class PerformanceSample
{
	public double CpuPercent { get; set; }

	public double SampleSeconds { get; set; }

	public long MemoryTotalBytes { get; set; }

	public long MemoryAvailableBytes { get; set; }
}
