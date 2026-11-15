using System;
using System.Security.Cryptography;

namespace Semed.Agent.Crypto;

public static class Base64Url
{
	public static string Encode(ReadOnlySpan<byte> data)
	{
		return Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-')
			.Replace('/', '_');
	}

	public static byte[] Decode(string s)
	{
		ArgumentNullException.ThrowIfNull(s, "s");
		for (int i = 0; i < s.Length; i++)
		{
			bool flag;
			switch (s[i])
			{
			case '-':
			case '0':
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
			case 'A':
			case 'B':
			case 'C':
			case 'D':
			case 'E':
			case 'F':
			case 'G':
			case 'H':
			case 'I':
			case 'J':
			case 'K':
			case 'L':
			case 'M':
			case 'N':
			case 'O':
			case 'P':
			case 'Q':
			case 'R':
			case 'S':
			case 'T':
			case 'U':
			case 'V':
			case 'W':
			case 'X':
			case 'Y':
			case 'Z':
			case '_':
			case 'a':
			case 'b':
			case 'c':
			case 'd':
			case 'e':
			case 'f':
			case 'g':
			case 'h':
			case 'i':
			case 'j':
			case 'k':
			case 'l':
			case 'm':
			case 'n':
			case 'o':
			case 'p':
			case 'q':
			case 'r':
			case 's':
			case 't':
			case 'u':
			case 'v':
			case 'w':
			case 'x':
			case 'y':
			case 'z':
				flag = true;
				break;
			default:
				flag = false;
				break;
			}
			if (!flag)
			{
				throw new FormatException("base64url inválido");
			}
		}
		if (s.Length % 4 == 1)
		{
			throw new FormatException("base64url com tamanho inválido");
		}
		string text = s.Replace('-', '+').Replace('_', '/');
		text = text.PadRight(text.Length + (4 - text.Length % 4) % 4, '=');
		byte[] array = Convert.FromBase64String(text);
		if (Encode(array) != s)
		{
			throw new FormatException("base64url não canônico");
		}
		return array;
	}

	public static string RandomToken(int nBytes)
	{
		Span<byte> span = stackalloc byte[nBytes];
		RandomNumberGenerator.Fill(span);
		return Encode(span);
	}
}
