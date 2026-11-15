using System;
using System.Collections.Generic;
using System.Text;

namespace Semed.Agent.Qr;

public sealed class QrCode
{
	public enum Ecc
	{
		L = 1,
		M = 0,
		Q = 3,
		H = 2
	}

	private readonly bool[,] _modules;

	private readonly bool[,] _isFunction;

	private static readonly int[][] EccPerBlock = new int[4][]
	{
		new int[41]
		{
			-1, 10, 16, 26, 18, 24, 16, 18, 22, 22,
			26, 30, 22, 22, 24, 24, 28, 28, 26, 26,
			26, 26, 28, 28, 28, 28, 28, 28, 28, 28,
			28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
			28
		},
		new int[41]
		{
			-1, 7, 10, 15, 20, 26, 18, 20, 24, 30,
			18, 20, 24, 26, 30, 22, 24, 28, 30, 28,
			28, 28, 28, 30, 30, 26, 28, 30, 30, 30,
			30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
			30
		},
		new int[41]
		{
			-1, 17, 28, 22, 16, 22, 28, 26, 26, 24,
			28, 24, 28, 22, 24, 24, 30, 28, 28, 26,
			28, 30, 24, 30, 30, 30, 30, 30, 30, 30,
			30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
			30
		},
		new int[41]
		{
			-1, 13, 22, 18, 26, 18, 24, 18, 22, 20,
			24, 28, 26, 24, 20, 30, 24, 28, 28, 26,
			30, 28, 30, 30, 30, 30, 28, 30, 30, 30,
			30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
			30
		}
	};

	private static readonly int[][] NumBlocks = new int[4][]
	{
		new int[41]
		{
			-1, 1, 1, 1, 2, 2, 4, 4, 4, 5,
			5, 5, 8, 9, 9, 10, 10, 11, 13, 14,
			16, 17, 17, 18, 20, 21, 23, 25, 26, 28,
			29, 31, 33, 35, 37, 38, 40, 43, 45, 47,
			49
		},
		new int[41]
		{
			-1, 1, 1, 1, 1, 1, 2, 2, 2, 2,
			4, 4, 4, 4, 4, 6, 6, 6, 6, 7,
			8, 8, 9, 9, 10, 12, 12, 12, 13, 14,
			15, 16, 17, 18, 19, 19, 20, 21, 22, 24,
			25
		},
		new int[41]
		{
			-1, 1, 1, 2, 4, 4, 4, 5, 6, 8,
			8, 11, 11, 16, 16, 18, 16, 19, 21, 25,
			25, 25, 34, 30, 32, 35, 37, 40, 42, 45,
			48, 51, 54, 57, 60, 63, 66, 70, 74, 77,
			81
		},
		new int[41]
		{
			-1, 1, 1, 2, 2, 4, 4, 6, 6, 8,
			8, 8, 10, 12, 16, 12, 17, 16, 18, 21,
			20, 23, 23, 25, 27, 29, 34, 34, 35, 38,
			40, 43, 45, 48, 51, 53, 56, 59, 62, 65,
			68
		}
	};

	private readonly Ecc _ecc;

	public int Version { get; }

	public int Size { get; }

	public int Mask { get; private set; }

	public bool this[int x, int y] => _modules[y, x];

	private QrCode(int version, Ecc ecc, byte[] dataCodewords, int mask)
	{
		Version = version;
		_ecc = ecc;
		Size = version * 4 + 17;
		_modules = new bool[Size, Size];
		_isFunction = new bool[Size, Size];
		DrawFunctionPatterns();
		byte[] data = AddEccAndInterleave(dataCodewords);
		DrawCodewords(data);
		if (mask < 0)
		{
			int num = 0;
			int num2 = int.MaxValue;
			for (int i = 0; i < 8; i++)
			{
				ApplyMask(i);
				DrawFormatBits(i);
				int num3 = Penalty();
				if (num3 < num2)
				{
					num = i;
					num2 = num3;
				}
				ApplyMask(i);
			}
			mask = num;
		}
		Mask = mask;
		ApplyMask(mask);
		DrawFormatBits(mask);
	}

	public static QrCode EncodeText(string text, Ecc ecc = Ecc.M, int minVersion = 1, int maxVersion = 40, int mask = -1)
	{
		return EncodeBytes(Encoding.UTF8.GetBytes(text), ecc, minVersion, maxVersion, mask);
	}

	public static QrCode EncodeBytes(byte[] data, Ecc ecc = Ecc.M, int minVersion = 1, int maxVersion = 40, int mask = -1)
	{
		int num = 0;
		int num2 = minVersion;
		while (true)
		{
			int num3 = ((num2 <= 9) ? 8 : 16);
			num = 4 + num3 + data.Length * 8;
			if (data.Length < 1 << num3 && num <= NumDataCodewords(num2, ecc) * 8)
			{
				break;
			}
			if (num2 >= maxVersion)
			{
				throw new ArgumentException("Dados longos demais para QR");
			}
			num2++;
		}
		int num4 = NumDataCodewords(num2, ecc) * 8;
		List<bool> bits = new List<bool>(num4);
		Append(4, 4);
		Append(data.Length, (num2 <= 9) ? 8 : 16);
		for (int i = 0; i < data.Length; i++)
		{
			Append(data[i], 8);
		}
		Append(0, Math.Min(4, num4 - bits.Count));
		Append(0, (8 - bits.Count % 8) % 8);
		int num5 = 236;
		while (bits.Count < num4)
		{
			Append(num5, 8);
			num5 ^= 0xFD;
		}
		byte[] array = new byte[bits.Count / 8];
		for (int j = 0; j < bits.Count; j++)
		{
			if (bits[j])
			{
				array[j >> 3] |= (byte)(1 << 7 - (j & 7));
			}
		}
		return new QrCode(num2, ecc, array, mask);
		void Append(int val, int len)
		{
			for (int num6 = len - 1; num6 >= 0; num6--)
			{
				bits.Add(((val >> num6) & 1) != 0);
			}
		}
	}

	private static int NumRawDataModules(int ver)
	{
		int num = (16 * ver + 128) * ver + 64;
		if (ver >= 2)
		{
			int num2 = ver / 7 + 2;
			num -= (25 * num2 - 10) * num2 - 55;
			if (ver >= 7)
			{
				num -= 36;
			}
		}
		return num;
	}

	private static int NumDataCodewords(int ver, Ecc ecc)
	{
		return NumRawDataModules(ver) / 8 - EccPerBlock[(int)ecc][ver] * NumBlocks[(int)ecc][ver];
	}

	private void SetFunction(int x, int y, bool dark)
	{
		_modules[y, x] = dark;
		_isFunction[y, x] = true;
	}

	private void DrawFunctionPatterns()
	{
		for (int i = 0; i < Size; i++)
		{
			SetFunction(6, i, i % 2 == 0);
			SetFunction(i, 6, i % 2 == 0);
		}
		DrawFinder(3, 3);
		DrawFinder(Size - 4, 3);
		DrawFinder(3, Size - 4);
		int[] array = AlignmentPositions();
		int num = array.Length;
		for (int j = 0; j < num; j++)
		{
			for (int k = 0; k < num; k++)
			{
				if ((j != 0 || k != 0) && (j != 0 || k != num - 1) && (j != num - 1 || k != 0))
				{
					DrawAlignment(array[j], array[k]);
				}
			}
		}
		DrawFormatBits(0);
		DrawVersion();
	}

	private void DrawFinder(int x, int y)
	{
		for (int i = -4; i <= 4; i++)
		{
			for (int j = -4; j <= 4; j++)
			{
				int num = Math.Max(Math.Abs(j), Math.Abs(i));
				int num2 = x + j;
				int num3 = y + i;
				if (num2 >= 0 && num2 < Size && num3 >= 0 && num3 < Size)
				{
					SetFunction(num2, num3, num != 2 && num != 4);
				}
			}
		}
	}

	private void DrawAlignment(int x, int y)
	{
		for (int i = -2; i <= 2; i++)
		{
			for (int j = -2; j <= 2; j++)
			{
				SetFunction(x + j, y + i, Math.Max(Math.Abs(j), Math.Abs(i)) != 1);
			}
		}
	}

	private int[] AlignmentPositions()
	{
		if (Version == 1)
		{
			return Array.Empty<int>();
		}
		int num = Version / 7 + 2;
		int num2 = (Version * 8 + num * 3 + 5) / (num * 4 - 4) * 2;
		int[] array = new int[num];
		array[0] = 6;
		int num3 = num - 1;
		int num4 = Size - 7;
		while (num3 >= 1)
		{
			array[num3] = num4;
			num3--;
			num4 -= num2;
		}
		return array;
	}

	private void DrawFormatBits(int mask)
	{
		int num = ((int)_ecc << 3) | mask;
		int num2 = num;
		for (int i = 0; i < 10; i++)
		{
			num2 = (num2 << 1) ^ ((num2 >> 9) * 1335);
		}
		int bits = ((num << 10) | num2) ^ 0x5412;
		for (int j = 0; j <= 5; j++)
		{
			SetFunction(8, j, Bit(j));
		}
		SetFunction(8, 7, Bit(6));
		SetFunction(8, 8, Bit(7));
		SetFunction(7, 8, Bit(8));
		for (int k = 9; k < 15; k++)
		{
			SetFunction(14 - k, 8, Bit(k));
		}
		for (int l = 0; l < 8; l++)
		{
			SetFunction(Size - 1 - l, 8, Bit(l));
		}
		for (int m = 8; m < 15; m++)
		{
			SetFunction(8, Size - 15 + m, Bit(m));
		}
		SetFunction(8, Size - 8, dark: true);
		bool Bit(int num3)
		{
			return ((bits >> num3) & 1) != 0;
		}
	}

	private void DrawVersion()
	{
		if (Version >= 7)
		{
			int num = Version;
			for (int i = 0; i < 12; i++)
			{
				num = (num << 1) ^ ((num >> 11) * 7973);
			}
			int num2 = (Version << 12) | num;
			for (int j = 0; j < 18; j++)
			{
				bool dark = ((num2 >> j) & 1) != 0;
				int num3 = Size - 11 + j % 3;
				int num4 = j / 3;
				SetFunction(num3, num4, dark);
				SetFunction(num4, num3, dark);
			}
		}
	}

	private byte[] AddEccAndInterleave(byte[] data)
	{
		int num = NumBlocks[(int)_ecc][Version];
		int num2 = EccPerBlock[(int)_ecc][Version];
		int num3 = NumRawDataModules(Version) / 8;
		int num4 = num - num3 % num;
		int num5 = num3 / num;
		List<byte[]> list = new List<byte[]>();
		byte[] divisor = ReedSolomonDivisor(num2);
		int i = 0;
		int num6 = 0;
		for (; i < num; i++)
		{
			int num7 = num5 - num2 + ((i >= num4) ? 1 : 0);
			byte[] array = data.AsSpan(num6, num7).ToArray();
			num6 += num7;
			byte[] collection = ReedSolomonRemainder(array, divisor);
			List<byte> list2 = new List<byte>(array);
			if (i < num4)
			{
				list2.Add(0);
			}
			list2.AddRange(collection);
			list.Add(list2.ToArray());
		}
		List<byte> list3 = new List<byte>(num3);
		for (int j = 0; j < list[0].Length; j++)
		{
			for (int k = 0; k < list.Count; k++)
			{
				if (j != num5 - num2 || k >= num4)
				{
					list3.Add(list[k][j]);
				}
			}
		}
		return list3.ToArray();
	}

	private static byte[] ReedSolomonDivisor(int degree)
	{
		byte[] array = new byte[degree];
		array[degree - 1] = 1;
		int num = 1;
		for (int i = 0; i < degree; i++)
		{
			for (int j = 0; j < degree; j++)
			{
				array[j] = (byte)GfMul(array[j], num);
				if (j + 1 < degree)
				{
					array[j] ^= array[j + 1];
				}
			}
			num = GfMul(num, 2);
		}
		return array;
	}

	private static byte[] ReedSolomonRemainder(byte[] data, byte[] divisor)
	{
		byte[] array = new byte[divisor.Length];
		for (int i = 0; i < data.Length; i++)
		{
			int y = data[i] ^ array[0];
			Array.Copy(array, 1, array, 0, array.Length - 1);
			array[^1] = 0;
			for (int j = 0; j < array.Length; j++)
			{
				array[j] ^= (byte)GfMul(divisor[j], y);
			}
		}
		return array;
	}

	private static int GfMul(int x, int y)
	{
		int num = 0;
		for (int num2 = 7; num2 >= 0; num2--)
		{
			num = (num << 1) ^ ((num >> 7) * 285);
			num ^= ((y >> num2) & 1) * x;
		}
		return num & 0xFF;
	}

	private void DrawCodewords(byte[] data)
	{
		int num = 0;
		for (int num2 = Size - 1; num2 >= 1; num2 -= 2)
		{
			if (num2 == 6)
			{
				num2 = 5;
			}
			for (int i = 0; i < Size; i++)
			{
				for (int j = 0; j < 2; j++)
				{
					int num3 = num2 - j;
					int num4 = ((((num2 + 1) & 2) == 0) ? (Size - 1 - i) : i);
					if (!_isFunction[num4, num3] && num < data.Length * 8)
					{
						_modules[num4, num3] = ((data[num >> 3] >> 7 - (num & 7)) & 1) != 0;
						num++;
					}
				}
			}
		}
	}

	private void ApplyMask(int mask)
	{
		for (int i = 0; i < Size; i++)
		{
			for (int j = 0; j < Size; j++)
			{
				if (mask switch
				{
					0 => (j + i) % 2 == 0, 
					1 => i % 2 == 0, 
					2 => j % 3 == 0, 
					3 => (j + i) % 3 == 0, 
					4 => (j / 3 + i / 2) % 2 == 0, 
					5 => j * i % 2 + j * i % 3 == 0, 
					6 => (j * i % 2 + j * i % 3) % 2 == 0, 
					_ => ((j + i) % 2 + j * i % 3) % 2 == 0, 
				} && !_isFunction[i, j])
				{
					_modules[i, j] = !_modules[i, j];
				}
			}
		}
	}

	private int Penalty()
	{
		int num = 0;
		for (int i = 0; i < 2; i++)
		{
			for (int j = 0; j < Size; j++)
			{
				int num2 = 1;
				for (int k = 1; k < Size; k++)
				{
					bool flag = ((i == 0) ? _modules[j, k] : _modules[k, j]);
					bool flag2 = ((i == 0) ? _modules[j, k - 1] : _modules[k - 1, j]);
					if (flag == flag2)
					{
						num2++;
						if (num2 == 5)
						{
							num += 3;
						}
						else if (num2 > 5)
						{
							num++;
						}
					}
					else
					{
						num2 = 1;
					}
				}
			}
		}
		for (int l = 0; l < Size - 1; l++)
		{
			for (int m = 0; m < Size - 1; m++)
			{
				bool flag3 = _modules[l, m];
				if (flag3 == _modules[l, m + 1] && flag3 == _modules[l + 1, m] && flag3 == _modules[l + 1, m + 1])
				{
					num += 3;
				}
			}
		}
		bool[] array = new bool[11]
		{
			true, false, true, true, true, false, true, false, false, false,
			false
		};
		bool[] array2 = new bool[11]
		{
			false, false, false, false, true, false, true, true, true, false,
			true
		};
		for (int n = 0; n < 2; n++)
		{
			for (int num3 = 0; num3 < Size; num3++)
			{
				for (int num4 = 0; num4 + 11 <= Size; num4++)
				{
					bool flag4 = true;
					bool flag5 = true;
					for (int num5 = 0; num5 < 11; num5++)
					{
						bool flag6 = ((n == 0) ? _modules[num3, num4 + num5] : _modules[num4 + num5, num3]);
						if (flag6 != array[num5])
						{
							flag4 = false;
						}
						if (flag6 != array2[num5])
						{
							flag5 = false;
						}
					}
					if (flag4)
					{
						num += 40;
					}
					if (flag5)
					{
						num += 40;
					}
				}
			}
		}
		int num6 = 0;
		bool[,] modules = _modules;
		int upperBound = modules.GetUpperBound(0);
		int upperBound2 = modules.GetUpperBound(1);
		for (int num7 = modules.GetLowerBound(0); num7 <= upperBound; num7++)
		{
			for (int num8 = modules.GetLowerBound(1); num8 <= upperBound2; num8++)
			{
				if (modules[num7, num8])
				{
					num6++;
				}
			}
		}
		int num9 = Size * Size;
		int val = (Math.Abs(num6 * 20 - num9 * 10) + num9 - 1) / num9 - 1;
		return num + Math.Max(0, val) * 10;
	}

	public string[] ToRows()
	{
		string[] array = new string[Size];
		for (int i = 0; i < Size; i++)
		{
			StringBuilder stringBuilder = new StringBuilder(Size);
			for (int j = 0; j < Size; j++)
			{
				stringBuilder.Append(_modules[i, j] ? '1' : '0');
			}
			array[i] = stringBuilder.ToString();
		}
		return array;
	}
}
