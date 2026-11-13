package br.gov.ma.pacodolumiar.semed.tecnico;
import android.webkit.CookieManager;
import org.json.JSONObject;
import java.net.*;import java.io.*;
final class Api {
 static final String ORIGIN="https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev";
 static JSONObject call(String path,JSONObject body,String csrf) throws Exception {
  return call(path,body,csrf,null);
 }
 static JSONObject tracking(JSONObject credential,JSONObject data,boolean stop) throws Exception {
  return call("/api/technician/tracking-"+(stop?"stop":"heartbeat"),data,null,"SEMED-Tracking "+credential.getString("id")+"."+credential.getString("token"));
 }
 private static JSONObject call(String path,JSONObject body,String csrf,String authorization) throws Exception {
  if(!path.startsWith("/api/technician/"))throw new SecurityException("Endpoint");
  HttpURLConnection c=(HttpURLConnection)new URL(ORIGIN+path).openConnection();c.setConnectTimeout(12000);c.setReadTimeout(12000);c.setInstanceFollowRedirects(false);
  if(authorization!=null)c.setRequestProperty("Authorization",authorization);
  else {String cookies=CookieManager.getInstance().getCookie(ORIGIN);if(cookies!=null)c.setRequestProperty("Cookie",cookies);}
  c.setRequestProperty("Accept","application/json");
  try{if(body!=null){c.setRequestMethod("POST");c.setDoOutput(true);c.setRequestProperty("Origin",ORIGIN);c.setRequestProperty("Content-Type","application/json");if(csrf!=null)c.setRequestProperty("X-CSRF-Token",csrf);try(OutputStream out=c.getOutputStream()){out.write(body.toString().getBytes("UTF-8"));}}
   int code=c.getResponseCode();InputStream in=code>=400?c.getErrorStream():c.getInputStream();ByteArrayOutputStream bytes=new ByteArrayOutputStream();if(in!=null)try(InputStream input=in){byte[] b=new byte[4096];int n;while((n=input.read(b))!=-1){if(bytes.size()>1048576)throw new IOException("Resposta muito grande");bytes.write(b,0,n);}}JSONObject r;try{r=new JSONObject(bytes.toString("UTF-8"));}catch(Exception e){r=new JSONObject();}r.put("_http",code);try{r.put("_retryAfterMs",Long.parseLong(c.getHeaderField("Retry-After"))*1000);}catch(Exception ignored){}return r;
  }finally{c.disconnect();}
 }
}
