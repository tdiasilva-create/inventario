using System;
using System.CodeDom.Compiler;
using System.IO;
using System.Security;
using System.Text;
using System.Text.RegularExpressions;
using System.Text.RegularExpressions.Generated;

namespace Semed.Agent.Engine;

public static class GrantFile
{
	public const int MaxBytes = 4096;
	[GeneratedCode("System.Text.RegularExpressions.Generator", "10.0.15.2326")]
	private static Regex CodeRegex()
	{
		return _003CRegexGenerator_g_003EFB3494DEA89434C47501E6B5A53F0234B4DCF1D6B3F064B63C5D4AEE45BB309E1__CodeRegex_0.Instance;
	}

	public static bool IsValidCode(string? code)
	{
		if (code != null)
		{
			return CodeRegex().IsMatch(code);
		}
		return false;
	}

	public static (GrantFileStatus Status, string? Code) Read(string path)
	{
		byte[] bytes;
		try
		{
			FileInfo fileInfo = new FileInfo(path);
			if (!fileInfo.Exists)
			{
				return (Status: GrantFileStatus.Missing, Code: null);
			}
			if (fileInfo.Length > 4096)
			{
				return (Status: GrantFileStatus.TooLarge, Code: null);
			}
			bytes = File.ReadAllBytes(path);
		}
		catch (FileNotFoundException)
		{
			return (Status: GrantFileStatus.Missing, Code: null);
		}
		catch (DirectoryNotFoundException)
		{
			return (Status: GrantFileStatus.Missing, Code: null);
		}
		catch (Exception ex3) when ((ex3 is IOException || ex3 is UnauthorizedAccessException || ex3 is SecurityException) ? true : false)
		{
			return (Status: GrantFileStatus.Unreadable, Code: null);
		}
		return Parse(bytes);
	}

	public static (GrantFileStatus Status, string? Code) Parse(byte[] bytes)
	{
		if (bytes.Length > 4096)
		{
			return (Status: GrantFileStatus.TooLarge, Code: null);
		}
		string[] array = Decode(bytes).Split('\n');
		for (int i = 0; i < array.Length; i++)
		{
			string text = array[i].Trim().Trim(new char[2] { '\ufeff', '\0' }).Trim();
			if (text.Length == 0 || text.StartsWith('#') || text.StartsWith(';'))
			{
				continue;
			}
			int num = text.IndexOf('=');
			if (num > 0)
			{
				bool flag;
				switch (text.Substring(0, num).Trim().ToLowerInvariant())
				{
				case "autorizacao":
				case "autorização":
				case "codigo":
				case "código":
				case "grant":
					flag = true;
					break;
				default:
					flag = false;
					break;
				}
				if (flag)
				{
					string text2 = text;
					int num2 = num + 1;
					text = text2.Substring(num2, text2.Length - num2).Trim();
				}
			}
			if (!IsValidCode(text))
			{
				return (Status: GrantFileStatus.Invalid, Code: null);
			}
			return (Status: GrantFileStatus.Ok, Code: text);
		}
		return (Status: GrantFileStatus.Empty, Code: null);
	}

	private static string Decode(byte[] b)
	{
		if (b.Length >= 2 && b[0] == byte.MaxValue && b[1] == 254)
		{
			return Encoding.Unicode.GetString(b, 2, b.Length - 2);
		}
		if (b.Length >= 2 && b[0] == 254 && b[1] == byte.MaxValue)
		{
			return Encoding.BigEndianUnicode.GetString(b, 2, b.Length - 2);
		}
		if (b.Length >= 3 && b[0] == 239 && b[1] == 187 && b[2] == 191)
		{
			return Encoding.UTF8.GetString(b, 3, b.Length - 3);
		}
		if (b.Length >= 4 && b.Length % 2 == 0)
		{
			int num = 0;
			for (int i = 1; i < b.Length; i += 2)
			{
				if (b[i] == 0)
				{
					num++;
				}
			}
			if (num * 2 >= b.Length / 2)
			{
				return Encoding.Unicode.GetString(b);
			}
		}
		return Encoding.UTF8.GetString(b);
	}

	public static string Describe(GrantFileStatus s)
	{
		return s switch
		{
			GrantFileStatus.Ok => "autorização presente (código não exibido)", 
			GrantFileStatus.Missing => "nenhum arquivo de autorização neste computador", 
			GrantFileStatus.Empty => "arquivo de autorização VAZIO", 
			GrantFileStatus.Invalid => "arquivo de autorização com conteúdo INVÁLIDO (não é um código de autorização)", 
			GrantFileStatus.Unreadable => "arquivo de autorização SEM PERMISSÃO de leitura ou com erro de leitura", 
			GrantFileStatus.TooLarge => "arquivo de autorização grande demais (não é um código de autorização)", 
			_ => s.ToString(), 
		};
	}

	public static int ExitCode(GrantFileStatus s)
	{
		return s switch
		{
			GrantFileStatus.Ok => 0, 
			GrantFileStatus.Missing => 10, 
			GrantFileStatus.Empty => 11, 
			GrantFileStatus.Invalid => 12, 
			GrantFileStatus.Unreadable => 13, 
			GrantFileStatus.TooLarge => 12, 
			_ => 19, 
		};
	}
}
