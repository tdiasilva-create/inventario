using System.Collections.Generic;

namespace Semed.Agent.Util;

public static class AclPolicy
{
	public enum Target
	{
		DataDirectory,
		Config,
		Binaries
	}

	public static readonly IReadOnlyDictionary<string, string> BroadSids = new Dictionary<string, string>
	{
		["S-1-1-0"] = "Todos",
		["S-1-5-11"] = "Usuários autenticados",
		["S-1-5-32-545"] = "Usuários",
		["S-1-5-4"] = "Interativo",
		["S-1-5-32-546"] = "Convidados",
		["S-1-5-7"] = "Anônimo",
		["S-1-5-2"] = "Rede"
	};

	private const int ReadData = 1;

	private const int WriteData = 2;

	private const int AppendData = 4;

	private const int WriteEa = 16;

	private const int DeleteChild = 64;

	private const int WriteAttributes = 256;

	private const int Delete = 65536;

	private const int WriteDac = 262144;

	private const int WriteOwner = 524288;

	private const int GenericAll = 268435456;

	private const int GenericWrite = 1073741824;

	private const int GenericRead = int.MinValue;

	public const int WriteMask = 1343029590;

	public const int ReadMask = -1879048191;

	public static List<string> Evaluate(Target target, IEnumerable<AceInfo> aces)
	{
		List<string> list = new List<string>();
		foreach (AceInfo ace in aces)
		{
			if (ace.Allow && BroadSids.TryGetValue(ace.Sid, out string value))
			{
				if ((ace.Rights & 0x500D0156) != 0)
				{
					list.Add($"{target}: escrita permitida para {value} ({ace.Sid})");
				}
				if (target == Target.DataDirectory && (ace.Rights & -1879048191) != 0)
				{
					list.Add($"{target}: leitura permitida para {value} ({ace.Sid})");
				}
			}
		}
		return list;
	}
}
