using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Authentication;
using System.Threading;
using System.Threading.Tasks;
using Semed.Agent.Protocol;

namespace Semed.Agent.Engine;

public sealed class ApiClient : IDisposable
{
	public const string UserAgent = "SEMED-Inventory-Agent";

	private readonly HttpClient _http;

	private readonly Uri _base;

	private readonly TimeSpan _operationTimeout;

	public const int MaxResponseBytes = 262144;

	public TimeSpan OperationTimeout => _operationTimeout;

	public string Host => _base.Host;

	public ApiClient(AgentConfig config, string agentVersion, HttpMessageHandler? handler = null, TimeSpan? operationTimeout = null)
	{
		_operationTimeout = operationTimeout ?? TimeSpan.FromSeconds(Math.Clamp(config.HttpTimeoutSeconds, 5, 120));
		_base = config.ValidatedBaseUri();
		if (handler == null)
		{
			SocketsHttpHandler socketsHttpHandler = new SocketsHttpHandler
			{
				AllowAutoRedirect = false,
				AutomaticDecompression = DecompressionMethods.None,
				PooledConnectionLifetime = TimeSpan.FromMinutes(10L),
				ConnectTimeout = TimeSpan.FromSeconds(15L),
				MaxConnectionsPerServer = 2
			};
			if (!string.IsNullOrWhiteSpace(config.ProxyUrl))
			{
				socketsHttpHandler.Proxy = new WebProxy(config.ProxyUrl);
				socketsHttpHandler.UseProxy = true;
			}
			handler = socketsHttpHandler;
		}
		_http = new HttpClient(handler, disposeHandler: true)
		{
			Timeout = Timeout.InfiniteTimeSpan
		};
		_http.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("SEMED-Inventory-Agent", agentVersion.Replace(' ', '_')));
	}

	public static async Task<byte[]?> ReadLimitedAsync(HttpContent content, int limit, CancellationToken ct)
	{
		byte[] result;
		await using (Stream stream = await content.ReadAsStreamAsync(ct).ConfigureAwait(continueOnCapturedContext: false))
		{
			byte[] buffer = new byte[Math.Min(limit + 1, 65536)];
			using MemoryStream ms = new MemoryStream();
			while (true)
			{
				int num = await stream.ReadAsync(buffer, ct).ConfigureAwait(continueOnCapturedContext: false);
				if (num != 0)
				{
					if (ms.Length + num > limit)
					{
						result = null;
						break;
					}
					ms.Write(buffer, 0, num);
					continue;
				}
				result = ms.ToArray();
				break;
			}
		}
		return result;
	}

	public (Uri Uri, string SignPath) Resolve(string relativePath)
	{
		Uri uri = new Uri(_base, relativePath.TrimStart('/'));
		if (uri.Host != _base.Host || uri.Scheme != _base.Scheme)
		{
			throw new InvalidOperationException("Caminho resolve para outro host");
		}
		return (Uri: uri, SignPath: uri.AbsolutePath);
	}

	public async Task<ApiResult> PostAsync(Uri uri, byte[] body, IReadOnlyDictionary<string, string> headers, CancellationToken ct)
	{
		using HttpRequestMessage req = new HttpRequestMessage(HttpMethod.Post, uri);
		req.Content = new ByteArrayContent(body);
		req.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
		foreach (var (name, value) in headers)
		{
			req.Headers.TryAddWithoutValidation(name, value);
		}
		using CancellationTokenSource op = CancellationTokenSource.CreateLinkedTokenSource(ct);
		op.CancelAfter(_operationTimeout);
		CancellationToken token = op.Token;
		try
		{
			using HttpResponseMessage res = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, token).ConfigureAwait(continueOnCapturedContext: false);
			long? contentLength = res.Content.Headers.ContentLength;
			if (contentLength.HasValue)
			{
				long valueOrDefault = contentLength.GetValueOrDefault();
				if (valueOrDefault > 262144)
				{
					return new ApiResult((int)res.StatusCode, Array.Empty<byte>(), null, null, res.Headers.Date, "RESPONSE_TOO_LARGE");
				}
			}
			byte[] array = await ReadLimitedAsync(res.Content, 262144, token).ConfigureAwait(continueOnCapturedContext: false);
			if (array == null)
			{
				return new ApiResult((int)res.StatusCode, Array.Empty<byte>(), null, null, res.Headers.Date, "RESPONSE_TOO_LARGE");
			}
			ErrorEnvelope error = null;
			if (!res.IsSuccessStatusCode)
			{
				try
				{
					error = AgentJson.Deserialize<ErrorEnvelope>(array);
				}
				catch
				{
				}
			}
			TimeSpan? retryAfter = null;
			TimeSpan? timeSpan = res.Headers.RetryAfter?.Delta;
			if (timeSpan.HasValue)
			{
				TimeSpan valueOrDefault2 = timeSpan.GetValueOrDefault();
				retryAfter = valueOrDefault2;
			}
			else
			{
				DateTimeOffset? dateTimeOffset = res.Headers.RetryAfter?.Date;
				if (dateTimeOffset.HasValue)
				{
					DateTimeOffset valueOrDefault3 = dateTimeOffset.GetValueOrDefault();
					retryAfter = valueOrDefault3 - DateTimeOffset.UtcNow;
				}
			}
			return new ApiResult((int)res.StatusCode, array, retryAfter, error, res.Headers.Date, null);
		}
		catch (OperationCanceledException) when (!ct.IsCancellationRequested)
		{
			return new ApiResult(0, Array.Empty<byte>(), null, null, null, "TIMEOUT");
		}
		catch (IOException) when (!ct.IsCancellationRequested)
		{
			return new ApiResult(0, Array.Empty<byte>(), null, null, null, "BODY_READ_ERROR");
		}
		catch (HttpRequestException ex3) when (ex3.InnerException is AuthenticationException)
		{
			return new ApiResult(0, Array.Empty<byte>(), null, null, null, "TLS_ERROR");
		}
		catch (HttpRequestException ex4)
		{
			byte[] body2 = Array.Empty<byte>();
			return new ApiResult(0, body2, null, null, null, ex4.HttpRequestError switch
			{
				HttpRequestError.NameResolutionError => "DNS_ERROR", 
				HttpRequestError.ProxyTunnelError => "PROXY_ERROR", 
				HttpRequestError.ConnectionError => "CONNECTION_ERROR", 
				HttpRequestError.SecureConnectionError => "TLS_ERROR", 
				_ => "NETWORK_ERROR", 
			});
		}
	}

	public void Dispose()
	{
		_http.Dispose();
	}
}
