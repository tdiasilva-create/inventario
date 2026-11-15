namespace Semed.Agent.Protocol;

public sealed class Ack
{
	public Semed.Agent.Engine.NetworkOffer? NetworkTest { get; set; }
	public string MessageId { get; set; } = "";

	public bool Accepted { get; set; }

	public bool Duplicate { get; set; }

	public string? ServerReceivedAt { get; set; }

	public string? StoredInventoryId { get; set; }

	public bool? PresenceUpdated { get; set; }

	public bool? BecameCurrent { get; set; }

	public bool? BaselineSet { get; set; }

	public int? ConfigVersion { get; set; }
}
