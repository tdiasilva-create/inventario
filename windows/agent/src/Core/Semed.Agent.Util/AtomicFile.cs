using System;
using System.IO;
using System.Text;

namespace Semed.Agent.Util;

public static class AtomicFile
{
	public static void WriteAllBytes(string path, ReadOnlySpan<byte> data)
	{
		string? directoryName = Path.GetDirectoryName(Path.GetFullPath(path));
		Directory.CreateDirectory(directoryName);
		string text = Path.Combine(directoryName, $".tmp-{Guid.NewGuid():N}");
		try
		{
			using (FileStream fileStream = new FileStream(text, FileMode.CreateNew, FileAccess.Write, FileShare.None, 4096, FileOptions.WriteThrough))
			{
				fileStream.Write(data);
				fileStream.Flush(flushToDisk: true);
			}
			File.Move(text, path, overwrite: true);
		}
		catch
		{
			try
			{
				if (File.Exists(text))
				{
					File.Delete(text);
				}
			}
			catch
			{
			}
			throw;
		}
	}

	public static void WriteAllText(string path, string text)
	{
		WriteAllBytes(path, Encoding.UTF8.GetBytes(text));
	}

	public static int CleanupOrphans(string dir)
	{
		if (!Directory.Exists(dir))
		{
			return 0;
		}
		int num = 0;
		foreach (string item in Directory.EnumerateFiles(dir, ".tmp-*"))
		{
			try
			{
				File.Delete(item);
				num++;
			}
			catch
			{
			}
		}
		return num;
	}
}
