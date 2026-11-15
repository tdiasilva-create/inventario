using System;
using System.Collections.Generic;
using System.Threading;

namespace Semed.Agent.Util;

public sealed class BoundedRunner
{
	private sealed class SourceState
	{
		public bool InFlight;

		public int Failures;

		public DateTimeOffset CooldownUntil;
	}

	private readonly object _gate = new object();

	private readonly Dictionary<string, SourceState> _sources = new Dictionary<string, SourceState>(StringComparer.OrdinalIgnoreCase);

	private readonly int _maxInFlight;

	private readonly TimeSpan _baseCooldown;

	private readonly TimeSpan _maxCooldown;

	private readonly IClock _clock;

	private int _inFlight;

	private int _threadsCreated;

	public int InFlight
	{
		get
		{
			lock (_gate)
			{
				return _inFlight;
			}
		}
	}

	public int ThreadsCreated
	{
		get
		{
			lock (_gate)
			{
				return _threadsCreated;
			}
		}
	}

	public BoundedRunner(int maxInFlight = 3, TimeSpan? baseCooldown = null, TimeSpan? maxCooldown = null, IClock? clock = null)
	{
		_maxInFlight = Math.Max(1, maxInFlight);
		_baseCooldown = baseCooldown ?? TimeSpan.FromMinutes(10L);
		_maxCooldown = maxCooldown ?? TimeSpan.FromHours(6);
		_clock = clock ?? SystemClock.Instance;
	}

	public RunResult<T> Run<T>(string source, Func<T> work, TimeSpan timeout)
	{
		SourceState st;
		lock (_gate)
		{
			if (!_sources.TryGetValue(source, out st))
			{
				_sources[source] = (st = new SourceState());
			}
			if (st.InFlight)
			{
				return new RunResult<T>(RunStatus.SourceStuck, default);
			}
			if (_clock.UtcNow < st.CooldownUntil)
			{
				return new RunResult<T>(RunStatus.CircuitOpen, default);
			}
			if (_inFlight >= _maxInFlight)
			{
				return new RunResult<T>(RunStatus.Busy, default);
			}
			st.InFlight = true;
			_inFlight++;
			_threadsCreated++;
		}
		T value = default;
		ManualResetEventSlim done = new ManualResetEventSlim(initialState: false);
		Thread thread = new Thread(() =>
		{
			try
			{
				value = work();
			}
			catch
			{
			}
			finally
			{
				lock (_gate)
				{
					st.InFlight = false;
					_inFlight--;
				}
				done.Set();
			}
		})
		{
			IsBackground = true,
			Name = "bounded:" + source
		};
		if (OperatingSystem.IsWindows())
		{
			thread.SetApartmentState(ApartmentState.MTA);
		}
		thread.Start();
		if (done.Wait(timeout))
		{
			lock (_gate)
			{
				st.Failures = 0;
				st.CooldownUntil = DateTimeOffset.MinValue;
			}
			return new RunResult<T>(RunStatus.Ok, value);
		}
		lock (_gate)
		{
			st.Failures++;
			long value2 = Math.Min(_maxCooldown.Ticks, _baseCooldown.Ticks * (1L << Math.Min(st.Failures - 1, 20)));
			st.CooldownUntil = _clock.UtcNow + TimeSpan.FromTicks(value2);
		}
		return new RunResult<T>(RunStatus.Timeout, default);
	}
}
