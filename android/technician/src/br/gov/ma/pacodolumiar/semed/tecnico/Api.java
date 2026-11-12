package br.gov.ma.pacodolumiar.semed.tecnico;
import android.webkit.CookieManager;
import org.json.JSONObject;
import java.net.*;import java.io.*;
final class Api {
 static final String ORIGIN="https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev";
 static JSONObject call(String path,JSONObject body,String csrf) throws Exception {
  if(!path.startsWith("/api/technician/"))throw new SecurityException("Endpoint");
  HttpURLConnection c=(HttpURLConnection)new URL(ORIGIN+path).openConnection();c.setConnectTimeout(12000);c.setReadTimeout(12000);c.setInstanceFollowRedirects(false);
  String cookies=CookieManager.getInstance().getCookie(ORIGIN);if(cookies!=null)c.setRequestProperty("Cookie",cookies);
  c.setRequestProperty("Accept","application/json");
  try{if(body!=null){c.setRequestMethod("POST");c.setDoOutput(true);c.setRequestProperty("Origin",ORIGIN);c.setRequestProperty("Content-Type","application/json");c.setRequestProperty("X-CSRF-Token",csrf);try(OutputStream out=c.getOutputStream()){out.write(body.toString().getBytes("UTF-8"));}}
   int code=c.getResponseCode();InputStream in=code>=400?c.getErrorStream():c.getInputStream();ByteArrayOutputStream bytes=new ByteArrayOutputStream();if(in!=null)try(InputStream input=in){byte[] b=new byte[4096];int n;while((n=input.read(b))!=-1){if(bytes.size()>1048576)throw new IOException("Resposta muito grande");bytes.write(b,0,n);}}JSONObject r=new JSONObject(bytes.toString("UTF-8"));r.put("_http",code);return r;
  }finally{c.disconnect();}
 }
}
