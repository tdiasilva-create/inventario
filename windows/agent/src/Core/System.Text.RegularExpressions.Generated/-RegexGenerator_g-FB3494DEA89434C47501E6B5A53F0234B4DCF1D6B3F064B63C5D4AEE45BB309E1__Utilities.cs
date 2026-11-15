using System.CodeDom.Compiler;
using System.Runtime.CompilerServices;

namespace System.Text.RegularExpressions.Generated;

[GeneratedCode("System.Text.RegularExpressions.Generator", "10.0.15.2326")]
internal static class _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__Utilities
{
	internal static readonly TimeSpan s_defaultTimeout = ((AppContext.GetData("REGEX_DEFAULT_MATCH_TIMEOUT") is TimeSpan timeSpan) ? timeSpan : Regex.InfiniteMatchTimeout);

	internal static readonly bool s_hasTimeout = s_defaultTimeout != Regex.InfiniteMatchTimeout;

	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	internal static void StackPop(int[] stack, ref int pos, out int arg0, out int arg1)
	{
		arg0 = stack[--pos];
		arg1 = stack[--pos];
	}

	[MethodImpl(MethodImplOptions.AggressiveInlining)]
	internal static void StackPush(ref int[] stack, ref int pos, int arg0, int arg1, int arg2)
	{
		int[] array = stack;
		int num = pos;
		if ((uint)(num + 2) < (uint)array.Length)
		{
			array[num] = arg0;
			array[num + 1] = arg1;
			array[num + 2] = arg2;
			pos += 3;
		}
		else
		{
			WithResize(ref stack, ref pos, arg0, arg1, arg2);
		}
		[MethodImpl(MethodImplOptions.NoInlining)]
		static void WithResize(ref int[] reference, ref int reference2, int arg3, int arg4, int arg5)
		{
			Array.Resize(ref reference, (reference2 + 2) * 2);
			StackPush(ref reference, ref reference2, arg3, arg4, arg5);
		}
	}
}
