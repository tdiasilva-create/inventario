using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using Semed.Agent.Protocol;
using Semed.Agent.Util;

namespace Semed.Agent.Inventory;

public sealed class SimulatedInventorySource : IInventorySource
{
	private sealed class Overrides
	{
		public List<int>? MemoryModulesGb { get; set; }

		public string? StorageQuality { get; set; }

		public bool Reorder { get; set; }
	}

	private readonly string? _overridesPath;

	private readonly IClock _clock;

	public string CollectorVersion => "0.1.0-sim";

	public SimulatedInventorySource(string? overridesPath, IClock? clock = null)
	{
		_overridesPath = overridesPath;
		_clock = clock ?? SystemClock.Instance;
	}

	private Overrides LoadOverrides()
	{
		try
		{
			if (_overridesPath != null && File.Exists(_overridesPath))
			{
				return AgentJson.Deserialize<Overrides>(File.ReadAllBytes(_overridesPath)) ?? new Overrides();
			}
		}
		catch
		{
		}
		return new Overrides();
	}

	public Dictionary<string, Section> Collect(CollectionOptions options, CancellationToken ct)
	{
		Overrides overrides = LoadOverrides();
		string now = Iso.Format(_clock.UtcNow);
		List<int> list = overrides.MemoryModulesGb;
		int num;
		int index;
		if (list == null)
		{
			num = 1;
			list = new List<int>(num);
			CollectionsMarshal.SetCount(list, num);
			Span<int> span = CollectionsMarshal.AsSpan(list);
			index = 0;
			span[index] = 8;
		}
		List<MemoryModuleData> list2 = list.Select((int gb, int i) => new MemoryModuleData
		{
			Slot = $"SLOT-SIM-{(char)(ushort)(65 + i)}",
			CapacityBytes = (long)gb * 1073741824L,
			Serial = Normalization.Identifier((i == 0) ? "SIM0000A" : null),
			MemoryType = "DDR4",
			SpeedMhz = 3200L
		}).ToList();
		if (overrides.Reorder)
		{
			list2.Reverse();
		}
		List<PhysicalDiskData> list3 = new List<PhysicalDiskData>
		{
			new PhysicalDiskData
			{
				Model = "DISCO-SIMULADO-A",
				Serial = Normalization.Identifier("SIM-DISK-0001"),
				SizeBytes = 256060514304L,
				BusType = "NVMe",
				MediaType = "ssd",
				Location = "internal"
			},
			new PhysicalDiskData
			{
				Model = "DISCO-SIMULADO-B",
				Serial = Normalization.Identifier("0000000000000000"),
				SizeBytes = 1000204886016L,
				BusType = "SATA",
				MediaType = "hdd",
				Location = "internal"
			}
		};
		if (overrides.Reorder)
		{
			list3.Reverse();
		}
		string text = overrides.StorageQuality ?? "ok";
		Dictionary<string, Section> dictionary = new Dictionary<string, Section>();
		SystemData systemData = new SystemData
		{
			Hostname = "PC-SIMULADO",
			DnsHostname = "PC-SIMULADO",
			Manufacturer = "FABRICANTE-SIMULADO",
			Model = "MODELO-SIMULADO"
		};
		index = 1;
		List<int> list4 = new List<int>(index);
		CollectionsMarshal.SetCount(list4, index);
		Span<int> span2 = CollectionsMarshal.AsSpan(list4);
		num = 0;
		span2[num] = 3;
		systemData.ChassisTypes = list4;
		systemData.ChassisKind = "desktop";
		systemData.Serial = Normalization.Identifier("SIM-SERIE-0001");
		systemData.SmbiosUuid = Normalization.Identifier("03000200-0400-0500-0006-000700080009");
		systemData.Baseboard = new BaseboardData
		{
			Manufacturer = "FABRICANTE-SIMULADO",
			Product = "PLACA-SIM",
			Serial = Normalization.Identifier("Default string")
		};
		systemData.Bios = new BiosData
		{
			Manufacturer = "BIOS-SIM",
			Version = "1.0",
			SmbiosVersion = "3.4",
			ReleaseDate = "2025-01-15",
			FirmwareType = "uefi"
		};
		VirtualMachineData virtualMachineData = new VirtualMachineData
		{
			IsVm = null,
			Confidence = "low"
		};
		num = 1;
		List<string> list5 = new List<string>(num);
		CollectionsMarshal.SetCount(list5, num);
		Span<string> span3 = CollectionsMarshal.AsSpan(list5);
		index = 0;
		span3[index] = "simulado";
		virtualMachineData.Evidence = list5;
		systemData.VirtualMachine = virtualMachineData;
		systemData.Architecture = "x64";
		dictionary["system"] = S("ok", "simulated", systemData);
		CpuData cpuData = new CpuData
		{
			ProcessorCount = 1L
		};
		index = 1;
		List<ProcessorData> list6 = new List<ProcessorData>(index);
		CollectionsMarshal.SetCount(list6, index);
		Span<ProcessorData> span4 = CollectionsMarshal.AsSpan(list6);
		num = 0;
		span4[num] = new ProcessorData
		{
			Socket = "SOCKET-SIM",
			Manufacturer = "FABRICANTE-SIM",
			Name = "CPU-SIMULADA",
			Architecture = "x64",
			Cores = 4L,
			LogicalProcessors = 8L,
			MaxClockMhz = 3000L
		};
		cpuData.Processors = list6;
		dictionary["cpu"] = S("ok", "simulated", cpuData);
		dictionary["memory"] = S("ok", "simulated", new MemoryData
		{
			InstalledBytes = list2.Sum((MemoryModuleData m) => m.CapacityBytes.GetValueOrDefault()),
			VisibleBytes = list2.Sum((MemoryModuleData m) => m.CapacityBytes.GetValueOrDefault()) - 134217728,
			SlotCount = 2L,
			SlotCountReliability = "reported",
			Modules = list2
		});
		Section value;
		if (!(text == "ok"))
		{
			value = S(text, "simulated", null, "SIMULATED_FAILURE");
		}
		else
		{
			StorageData storageData = new StorageData
			{
				PhysicalDisks = list3
			};
			num = 1;
			List<VolumeData> list7 = new List<VolumeData>(num);
			CollectionsMarshal.SetCount(list7, num);
			Span<VolumeData> span5 = CollectionsMarshal.AsSpan(list7);
			index = 0;
			span5[index] = new VolumeData
			{
				Mount = "C:",
				FileSystem = "NTFS",
				DriveType = "fixed",
				SizeBytes = 255000000000L,
				FreeBytes = 100000000000L + Random.Shared.Next(1000000)
			};
			storageData.Volumes = list7;
			value = S("ok", "simulated", storageData);
		}
		dictionary["storage"] = value;
		GpuData gpuData = new GpuData();
		index = 1;
		List<GpuAdapterData> list8 = new List<GpuAdapterData>(index);
		CollectionsMarshal.SetCount(list8, index);
		Span<GpuAdapterData> span6 = CollectionsMarshal.AsSpan(list8);
		num = 0;
		span6[num] = new GpuAdapterData
		{
			Name = "GPU-SIMULADA",
			Manufacturer = "FABRICANTE-SIM",
			DriverVersion = "1.0.0.0",
			ReportedMemoryBytes = 1073741824L,
			ReportedMemoryReliability = "reported_unreliable"
		};
		gpuData.Adapters = list8;
		dictionary["gpu"] = S("ok", "simulated", gpuData);
		NetworkData networkData = new NetworkData
		{
			AddressesCollected = options.CollectNetworkAddresses
		};
		num = 1;
		List<NetworkAdapterData> list9 = new List<NetworkAdapterData>(num);
		CollectionsMarshal.SetCount(list9, num);
		Span<NetworkAdapterData> span7 = CollectionsMarshal.AsSpan(list9);
		index = 0;
		span7[index] = new NetworkAdapterData
		{
			Name = "Ethernet SIM",
			Description = "Adaptador simulado",
			Kind = "physical",
			InterfaceType = "Ethernet 802.3",
			Mac = "02:00:00:00:00:01",
			Status = "up"
		};
		networkData.Adapters = list9;
		dictionary["network"] = S("ok", "simulated", networkData);
		dictionary["os"] = S("ok", "simulated", new OsData
		{
			Caption = "Sistema Simulado",
			Version = "10.0.00000",
			BuildNumber = "00000",
			Architecture = "x64",
			InstallDate = "2025-02-01T12:00:00Z",
			LastBootAt = Iso.Format(_clock.UtcNow.AddMinutes(-20.0)),
			PartOfDomain = false,
			DomainName = null
		});
		dictionary["accounts"] = S("ok", "simulated", new AccountsData
		{
			EnabledLocalCount = 1L,
			DisabledLocalCount = 3L,
			InteractiveSessionCount = 1L,
			ConsoleSessionCount = 1L,
			RemoteSessionCount = 0L
		});
		return dictionary;
		Section S(string q, string src, object? data, string? err = null)
		{
			return new Section
			{
				Quality = q,
				Source = src,
				CollectedAt = now,
				DurationMs = 1L,
				ErrorCode = err,
				Data = data
			};
		}
	}

	public PerformanceSample? SamplePerformance(CancellationToken ct)
	{
		return new PerformanceSample
		{
			CpuPercent = 12.5,
			SampleSeconds = 1.0,
			MemoryTotalBytes = 8589934592L,
			MemoryAvailableBytes = 4294967296L
		};
	}

	public MachineSignals ReadMachineSignals()
	{
		return new MachineSignals("SIMULATED-MACHINE-GUID", "03000200-0400-0500-0006-000700080009");
	}
}
