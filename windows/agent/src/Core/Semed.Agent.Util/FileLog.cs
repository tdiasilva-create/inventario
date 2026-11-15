using System;
using System.IO;

namespace Semed.Agent.Util;

public sealed class FileLog
{
	private readonly string _path;

	private readonly long _maxBytes;

	private readonly int _keep;

	private readonly object _gate = new object();

	private readonly bool _echo;

	public FileLog(string path, long maxBytes = 1048576L, int keep = 3, bool echoToConsole = false)
	{
		_path = path;
		_maxBytes = maxBytes;
		_keep = keep;
		_echo = echoToConsole;
		Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path)));
	}

	public void Info(string msg)
	{
		Write("INFO", msg);
	}

	public void Warn(string msg)
	{
		Write("WARN", msg);
	}

	public void Error(string msg)
	{
		Write("ERRO", msg);
	}

	private void Write(string level, string msg)
	{
		string text = $"{Iso.Format(DateTimeOffset.UtcNow)} {level} {Sanitize(msg)}";
		lock (_gate)
		{
			try
			{
				if (File.Exists(_path) && new FileInfo(_path).Length > _maxBytes)
				{
					Rotate();
				}
				File.AppendAllText(_path, text + Environment.NewLine);
			}
			catch
			{
			}
			if (_echo)
			{
				Console.WriteLine(text);
			}
		}
	}

	private void Rotate()
	{
		for (int num = _keep - 1; num >= 1; num--)
		{
			string text = $"{_path}.{num}";
			if (File.Exists(text))
			{
				File.Move(text, $"{_path}.{num + 1}", overwrite: true);
			}
		}
		File.Move(_path, _path + ".1", overwrite: true);
		string path = $"{_path}.{_keep + 1}";
		if (File.Exists(path))
		{
			File.Delete(path);
		}
	}

	public static string Sanitize(string s)
	{
		s = s.Replace('\r', ' ').Replace('\n', ' ');
		if (s.Length <= 600)
		{
			return s;
		}
		return s.Substring(0, 600) + "…";
	}
}
