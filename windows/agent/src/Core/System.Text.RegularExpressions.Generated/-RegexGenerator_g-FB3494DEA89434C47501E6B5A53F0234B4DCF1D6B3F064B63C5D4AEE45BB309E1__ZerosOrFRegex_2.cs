using System.CodeDom.Compiler;

namespace System.Text.RegularExpressions.Generated;

[GeneratedCode("System.Text.RegularExpressions.Generator", "10.0.15.2326")]
internal sealed class _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__ZerosOrFRegex_2 : Regex
{
	private sealed class RunnerFactory : RegexRunnerFactory
	{
		private sealed class Runner : RegexRunner
		{
			protected override void Scan(ReadOnlySpan<char> inputSpan)
			{
				if (TryFindNextPossibleStartingPosition(inputSpan) && !TryMatchAtCurrentPosition(inputSpan))
				{
					runtextpos = inputSpan.Length;
				}
			}

			private bool TryFindNextPossibleStartingPosition(ReadOnlySpan<char> inputSpan)
			{
				int num = runtextpos;
				if ((uint)num < (uint)inputSpan.Length && num == 0)
				{
					return true;
				}
				runtextpos = inputSpan.Length;
				return false;
			}

			private bool TryMatchAtCurrentPosition(ReadOnlySpan<char> inputSpan)
			{
				int num = runtextpos;
				int start = num;
				int num2 = 0;
				int num3 = 0;
				ReadOnlySpan<char> readOnlySpan = inputSpan.Slice(num);
				if (num != 0)
				{
					return false;
				}
				num2 = num;
				int i;
				for (i = 0; (uint)i < (uint)readOnlySpan.Length; i++)
				{
					char c;
					if (!(((c = readOnlySpan[i]) < '\u0080') ? (("㸀\0\u2001\u0001@\0@\0"[(int)c >> 4] & (1 << (c & 0xF))) != 0) : RegexRunner.CharInClass(c, "\0\b\u0001-.01FGfgd")))
					{
						break;
					}
				}
				if (i == 0)
				{
					return false;
				}
				readOnlySpan = readOnlySpan.Slice(i);
				num += i;
				num3 = num;
				num2++;
				while (num < inputSpan.Length - 1 || ((uint)num < (uint)inputSpan.Length && inputSpan[num] != '\n'))
				{
					if (_003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__Utilities.s_hasTimeout)
					{
						CheckTimeout();
					}
					if (num2 >= num3)
					{
						return false;
					}
					num = --num3;
					readOnlySpan = inputSpan.Slice(num);
				}
				runtextpos = num;
				Capture(0, start, num);
				return true;
			}
		}

		protected override RegexRunner CreateInstance()
		{
			return new Runner();
		}
	}

	internal static readonly _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__ZerosOrFRegex_2 Instance = new _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__ZerosOrFRegex_2();

	private _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__ZerosOrFRegex_2()
	{
		pattern = "^[0F\\-\\s]+$";
		roptions = RegexOptions.IgnoreCase;
		Regex.ValidateMatchTimeout(_003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__Utilities.s_defaultTimeout);
		internalMatchTimeout = _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__Utilities.s_defaultTimeout;
		factory = new RunnerFactory();
		capsize = 1;
	}
}
