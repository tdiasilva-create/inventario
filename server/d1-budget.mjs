// Classify only the provider's daily D1 quota error, not timeouts, Drive quotas
// or a busy database. Never expose the SQL or the original exception to clients.
export function d1DailyQuotaResponse(error,now=Date.now()){
 const chain=[];let current=error;for(let i=0;current&&i<5;i++,current=current.cause)chain.push(String(current.message||current));
 const detail=chain.join(' ');
 if(!/D1/i.test(detail)||!/(\[code:\s*7500\]|\b(?:error code|code)\s*[:=]\s*7500\b|(?:daily|diári[ao]).*(?:limit|quota|cota)|(?:limit|quota|cota).*(?:daily|diári[ao]))/i.test(detail))return null;
 const d=new Date(now),retryAt=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1);
 return Response.json({code:'D1_DAILY_QUOTA',error:'O banco atingiu o limite diário do plano gratuito. A cota é renovada às 21h de Fortaleza. Os dados já salvos permanecem preservados; esta operação não foi confirmada.',retryAt},
  {status:503,headers:{'Cache-Control':'no-store','Retry-After':String(Math.max(1,Math.ceil((retryAt-now)/1000)))}});
}
