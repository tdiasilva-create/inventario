package br.gov.ma.pacodolumiar.semed.tecnico;
/** Pure policy also exercised on the JVM, separately from Android/GPS tests. */
final class TrackingPolicy {
 static boolean terminal(int code){return code==401||code==403||code==409||code==410;}
 static boolean currentFix(long now,long observed,float accuracy){return observed>=now-90000&&observed<=now+30000&&accuracy>0&&accuracy<=5000;}
 static long delay(int failures,long retryAfterMs){return Math.min(300000,Math.max(retryAfterMs,25000L*(1L<<Math.min(Math.max(failures,0),4))));}
}
