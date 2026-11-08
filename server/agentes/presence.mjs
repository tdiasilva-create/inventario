// A mesma interpretação de presença na ficha, lista e notificações. Nunca infere energia elétrica.
export function presenceState(device, p, now=Date.now(), thresholdSeconds=1020){
 if(!device)return 'unknown';
 if(device.state==='revoked')return 'revoked';
 if(!p?.last_live_contact_at||!Number.isFinite(Date.parse(p.last_live_contact_at)))return 'never_communicated';
 if(['shutdown','suspend'].includes(p.last_reason)&&p.last_reason_at>=p.last_live_contact_at)return p.last_reason==='shutdown'?'reported_shutdown':'reported_suspend';
 if(now-Date.parse(p.last_live_contact_at)>thresholdSeconds*1000)return 'no_recent_communication';
 return ['error','timeout'].includes(p.last_health_inventory)?'communicating_with_failure':'communicating';
}
export function presenceThreshold(env={}){return 3*Math.min(3600,Math.max(60,Number(env.AGENTES_INTERVALO_HEARTBEAT??300)||300))+120;}
