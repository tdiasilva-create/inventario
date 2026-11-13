package br.gov.ma.pacodolumiar.semed.tecnico;
import android.app.job.*;import android.content.*;import org.json.JSONObject;
/** Retries revocation only. Never starts GPS or sends a stored location. */
public class TrackingStopJob extends JobService {
 static void schedule(Context c){((JobScheduler)c.getSystemService(JOB_SCHEDULER_SERVICE)).schedule(new JobInfo.Builder(107,new ComponentName(c,TrackingStopJob.class)).setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setBackoffCriteria(30000,JobInfo.BACKOFF_POLICY_EXPONENTIAL).build());}
 @Override public boolean onStartJob(JobParameters p){new Thread(()->{LocationService.retryStop(this);JSONObject saved=TrackingStore.read(this);jobFinished(p,saved!=null&&saved.optBoolean("stopping"));},"tracking-revoke").start();return true;}
 @Override public boolean onStopJob(JobParameters p){return true;}
}
