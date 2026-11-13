package br.gov.ma.pacodolumiar.semed.tecnico;
import android.Manifest;import android.app.*;import android.content.*;import android.content.pm.*;import android.location.*;import android.os.*;
import java.util.concurrent.*;import org.json.JSONObject;

/** Native queue tracking; survives closing the Activity. No location is persisted. */
public class LocationService extends Service implements LocationListener {
 private final Handler main=new Handler(Looper.getMainLooper());
 private ScheduledExecutorService executor;private volatile Location last;private volatile JSONObject credential;
 private volatile int generation=0;private boolean listening=false;private PowerManager.WakeLock wake;
 @Override public IBinder onBind(Intent i){return null;}
 static void resume(Context c){
  JSONObject saved=TrackingStore.read(c);if(saved==null)return;
  if(saved.optBoolean("stopping")){TrackingStopJob.schedule(c);return;}
  try{c.startForegroundService(new Intent(c,LocationService.class));}
  catch(Exception e){android.widget.Toast.makeText(c,"Abra o app e permita a localização para retomar o acompanhamento.",android.widget.Toast.LENGTH_LONG).show();}
 }
 static void signOut(Context c){
  JSONObject saved=TrackingStore.read(c);if(saved==null)return;
  TrackingStore.requestStop(c);
  // Stop GPS immediately, even offline. Keep only the revocation receipt to retry.
  c.stopService(new Intent(c,LocationService.class));
  TrackingStopJob.schedule(c);
  new Thread(()->retryStop(c),"tracking-stop").start();
 }
 static void retryStop(Context c){
  JSONObject saved=TrackingStore.read(c);if(saved==null||!saved.optBoolean("stopping"))return;
  try{JSONObject r=Api.tracking(saved,new JSONObject(),true);if(r.optInt("_http")==200||TrackingPolicy.terminal(r.optInt("_http")))TrackingStore.clear(c,saved.optString("id"));}catch(Exception ignored){}
 }
 @Override public int onStartCommand(Intent intent,int flags,int startId){
  JSONObject next=TrackingStore.read(this);
  if(next==null||next.optBoolean("stopping")){stopSelf();new Thread(()->retryStop(this)).start();return START_NOT_STICKY;}
  if(credential!=null&&next.optString("id").equals(credential.optString("id")))return START_STICKY;
  final int epoch=++generation;credential=next;last=null;
  if(executor!=null)executor.shutdownNow();
  try{
   NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
   nm.createNotificationChannel(new NotificationChannel("location","Localização durante roteiro",NotificationManager.IMPORTANCE_LOW));
   Notification n=notification("Verificando acompanhamento da fila…");
   if(Build.VERSION.SDK_INT>=29)startForeground(105,n,ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);else startForeground(105,n);
   if(wake==null){wake=((PowerManager)getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"SEMED:roteiro");wake.setReferenceCounted(false);wake.acquire();}
  }catch(Exception e){stopSelf();return START_NOT_STICKY;}
  executor=Executors.newSingleThreadScheduledExecutor();schedule(epoch,0,0);
  return START_STICKY;
 }
 private Notification notification(String text){
  PendingIntent open=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class),PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
  return new Notification.Builder(this,"location").setSmallIcon(android.R.drawable.ic_menu_mylocation).setContentTitle("SEMED · localização do roteiro").setContentText(text).setContentIntent(open).setOngoing(true).setOnlyAlertOnce(true).build();
 }
 private void notice(int epoch,String text){main.post(()->{if(epoch==generation)((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(105,notification(text));});}
 private void schedule(int epoch,int failures,long delay){if(epoch==generation&&executor!=null&&!executor.isShutdown())try{executor.schedule(()->send(epoch,failures),delay,TimeUnit.MILLISECONDS);}catch(RejectedExecutionException ignored){}}
 private void finish(int epoch,boolean clear){main.post(()->{if(epoch!=generation)return;if(clear&&credential!=null)TrackingStore.clear(this,credential.optString("id"));stopSelf();});}
 private void listen(int epoch){main.post(()->{
  if(epoch!=generation||listening)return;
  if(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED&&checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)!=PackageManager.PERMISSION_GRANTED){finish(epoch,false);return;}
  LocationManager lm=(LocationManager)getSystemService(LOCATION_SERVICE);
  for(String provider:new String[]{LocationManager.GPS_PROVIDER,LocationManager.NETWORK_PROVIDER})try{
   // Distance zero also refreshes a stationary technician's timestamp.
   if(lm.getAllProviders().contains(provider)){lm.requestLocationUpdates(provider,15000,0,this,Looper.getMainLooper());listening=true;}
  }catch(SecurityException e){finish(epoch,false);}catch(IllegalArgumentException ignored){}
 });}
 private void send(int epoch,int failures){
  if(epoch!=generation)return;
  JSONObject saved=TrackingStore.read(this);
  if(saved==null||saved.optBoolean("stopping")||!saved.optString("id").equals(credential.optString("id"))){finish(epoch,false);return;}
  try{
   JSONObject body=new JSONObject();Location l=last;
   if(l!=null&&TrackingPolicy.currentFix(System.currentTimeMillis(),l.getTime(),l.getAccuracy()))body.put("position",new JSONObject().put("latitude",l.getLatitude()).put("longitude",l.getLongitude()).put("accuracy",l.getAccuracy()).put("observedAt",l.getTime()));
   JSONObject response=Api.tracking(saved,body,false);if(epoch!=generation)return;
   int code=response.optInt("_http");
   if(TrackingPolicy.terminal(code)){finish(epoch,true);return;}
   if(code==200&&response.optBoolean("active")){
    TrackingStore.authorized(this,saved.optString("id"));
    listen(epoch);notice(epoch,body.has("position")?"Compartilhando até concluir sua fila. Toque para abrir.":"Aguardando GPS. Ative a localização do aparelho.");schedule(epoch,0,25000);return;
   }
   notice(epoch,"Sem confirmação do servidor. Tentando reconectar…");schedule(epoch,failures+1,TrackingPolicy.delay(failures+1,response.optLong("_retryAfterMs")));
  }catch(Exception e){notice(epoch,"Sem conexão. O envio será retomado automaticamente.");schedule(epoch,failures+1,TrackingPolicy.delay(failures+1,0));}
 }
 public void onLocationChanged(Location l){if(TrackingPolicy.currentFix(System.currentTimeMillis(),l.getTime(),l.getAccuracy()))last=l;}
 public void onStatusChanged(String p,int s,Bundle b){}public void onProviderEnabled(String p){}public void onProviderDisabled(String p){last=null;}
 @Override public void onDestroy(){generation++;if(executor!=null)executor.shutdownNow();main.removeCallbacksAndMessages(null);((LocationManager)getSystemService(LOCATION_SERVICE)).removeUpdates(this);if(wake!=null&&wake.isHeld())wake.release();last=null;credential=null;stopForeground(true);super.onDestroy();}
}
