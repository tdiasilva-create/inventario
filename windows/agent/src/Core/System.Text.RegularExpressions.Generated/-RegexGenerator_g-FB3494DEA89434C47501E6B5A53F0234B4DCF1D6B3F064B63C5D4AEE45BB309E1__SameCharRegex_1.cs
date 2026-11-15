using System.CodeDom.Compiler;
using System.Runtime.CompilerServices;

namespace System.Text.RegularExpressions.Generated;

[GeneratedCode("System.Text.RegularExpressions.Generator", "10.0.15.2326")]
internal sealed class _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__SameCharRegex_1 : Regex
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
				int num4 = 0;
				int num5 = 0;
				int pos = 0;
				ReadOnlySpan<char> readOnlySpan = inputSpan.Slice(num);
				if (num != 0)
				{
					UncaptureUntil(0);
					return false;
				}
				num2 = num;
				if (readOnlySpan.IsEmpty || readOnlySpan[0] == '\n')
				{
					UncaptureUntil(0);
					return false;
				}
				num++;
				readOnlySpan = inputSpan.Slice(num);
				Capture(1, num2, num);
				num4 = num;
				num3 = 0;
				while (true)
				{
					_003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__Utilities.StackPush(ref runstack, ref pos, Crawlpos(), num4, num);
					num4 = num;
					num3++;
					if (IsMatched(1))
					{
						num5 = MatchLength(1);
						if (readOnlySpan.Length >= num5 && inputSpan.Slice(MatchIndex(1), num5).SequenceEqual(readOnlySpan.Slice(0, num5)))
						{
							num += num5;
							readOnlySpan = inputSpan.Slice(num);
							if (num != num4)
							{
								continue;
							}
							goto IL_011a;
						}
					}
					goto IL_00da;
					IL_011a:
					if (num >= inputSpan.Length - 1 && ((uint)num >= (uint)inputSpan.Length || inputSpan[num] == '\n'))
					{
						break;
					}
					goto IL_00da;
					IL_00da:
					if (--num3 < 0)
					{
						UncaptureUntil(0);
						return false;
					}
					_003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__Utilities.StackPop(runstack, ref pos, out num, out num4);
					UncaptureUntil(runstack[--pos]);
					readOnlySpan = inputSpan.Slice(num);
					goto IL_011a;
				}
				runtextpos = num;
				Capture(0, start, num);
				return true;
				[MethodImpl(MethodImplOptions.AggressiveInlining)]
				void UncaptureUntil(int capturePosition)
				{
					while (Crawlpos() > capturePosition)
					{
						Uncapture();
					}
				}
			}
		}

		protected override RegexRunner CreateInstance()
		{
			return new Runner();
		}
	}

	internal static readonly _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__SameCharRegex_1 Instance = new _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__SameCharRegex_1();

	private _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__SameCharRegex_1()
	{
		pattern = "^(.)\\1*$";
		roptions = RegexOptions.None;
		Regex.ValidateMatchTimeout(_003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__Utilities.s_defaultTimeout);
		internalMatchTimeout = _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__Utilities.s_defaultTimeout;
		factory = new RunnerFactory();
		capsize = 2;
	}
}
