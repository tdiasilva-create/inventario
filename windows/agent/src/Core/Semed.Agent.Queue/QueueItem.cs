using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Semed.Agent.Queue;

public sealed class QueueItem
{
	public string MessageId { get; set; } = "";

	public string Kind { get; set; } = "";

	public string Path { get; set; } = "";

	public string Body { get; set; } = "";

	public string CreatedAt { get; set; } = "";

	public int Attempts { get; set; }

	public string? LastErrorCode { get; set; }

	public string? Reason { get; set; }

	public string? ContentHash { get; set; }

	public string? CollectedAt { get; set; }

	public List<string> GapIds { get; set; } = new List<string>();

	[JsonIgnore]
	public string FileName { get; set; } = "";

	[JsonIgnore]
	public bool IsChange
	{
		get
		{
			switch (Reason)
			{
			case "change_confirmed":
			case "after_link":
			case "startup":
				return true;
			default:
				return false;
			}
		}
	}
}
