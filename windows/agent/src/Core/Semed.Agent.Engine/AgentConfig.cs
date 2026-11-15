using System;
using System.IO;
using Semed.Agent.Protocol;

namespace Semed.Agent.Engine;

public sealed class AgentConfig
{
	public string ApiBaseUrl { get; set; } = "https://host-pendente.invalid";

	public bool AllowInsecureLoopback { get; set; }

	public int HttpTimeoutSeconds { get; set; } = 30;

	public string? ProxyUrl { get; set; }

	public string KeyScope { get; set; } = "service_account";

	public bool UseTpm { get; set; }

	public string PipeRenewRequires { get; set; } = "administrators";

	public string PipeGrantRequires { get; set; } = "administrators";

	public string? CampaignLabel { get; set; }

	public bool IsConfigured => !ApiBaseUrl.Contains(".invalid", StringComparison.OrdinalIgnoreCase);

	public static AgentConfig Load(string path)
	{
		if (!File.Exists(path))
		{
			return new AgentConfig();
		}
		AgentConfig? obj = AgentJson.Deserialize<AgentConfig>(File.ReadAllBytes(path)) ?? new AgentConfig();
		obj.Validate();
		return obj;
	}

	public Uri ValidatedBaseUri()
	{
		Validate();
		return new Uri(ApiBaseUrl.TrimEnd('/') + "/");
	}

	public void Validate()
	{
		if (!Uri.TryCreate(ApiBaseUrl, UriKind.Absolute, out Uri result))
		{
			throw new InvalidOperationException("api_base_url inválida");
		}
		if (!string.IsNullOrEmpty(result.Query) || !string.IsNullOrEmpty(result.Fragment) || !string.IsNullOrEmpty(result.UserInfo))
		{
			throw new InvalidOperationException("api_base_url não pode ter query, fragmento ou credenciais");
		}
		string campaignLabel = CampaignLabel;
		if (campaignLabel != null && campaignLabel.Length > 80)
		{
			CampaignLabel = CampaignLabel.Substring(0, 80);
		}
		string[] array = new string[2] { PipeRenewRequires, PipeGrantRequires };
		foreach (string text in array)
		{
			if ((!(text == "administrators") && !(text == "interactive")) || 1 == 0)
			{
				throw new InvalidOperationException("pipe_*_requires deve ser administrators ou interactive");
			}
		}
		if (result.Scheme == Uri.UriSchemeHttps || (result.Scheme == Uri.UriSchemeHttp && AllowInsecureLoopback && result.IsLoopback))
		{
			return;
		}
		throw new InvalidOperationException("api_base_url deve ser https:// (http só para loopback com allow_insecure_loopback)");
	}
}
