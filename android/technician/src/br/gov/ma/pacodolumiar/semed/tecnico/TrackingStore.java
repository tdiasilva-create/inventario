package br.gov.ma.pacodolumiar.semed.tecnico;
import android.content.Context;import android.security.keystore.*;import android.util.Base64;
import java.security.*;import javax.crypto.*;import javax.crypto.spec.GCMParameterSpec;import org.json.JSONObject;

/** Device-private credential, no passwords, coordinates or location history. */
final class TrackingStore {
 private static final String ALIAS="semed_tracking_v1";
 private static SecretKey key() throws Exception {
  KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);
  if(ks.containsAlias(ALIAS))return (SecretKey)ks.getKey(ALIAS,null);
  KeyGenerator g=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
  g.init(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());return g.generateKey();
 }
 static synchronized JSONObject read(Context c){
  String value=c.getSharedPreferences("tracking",Context.MODE_PRIVATE).getString("sealed",null);if(value==null)return null;
  try{JSONObject data=new JSONObject(value);Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.decode(data.getString("iv"),Base64.NO_WRAP)));return new JSONObject(new String(cipher.doFinal(Base64.decode(data.getString("data"),Base64.NO_WRAP)),"UTF-8"));}
  catch(Exception e){return null;}
 }
 static synchronized void write(Context c,JSONObject data) throws Exception {
  Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key());
  JSONObject sealed=new JSONObject().put("iv",Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP)).put("data",Base64.encodeToString(cipher.doFinal(data.toString().getBytes("UTF-8")),Base64.NO_WRAP));
  if(!c.getSharedPreferences("tracking",Context.MODE_PRIVATE).edit().putString("sealed",sealed.toString()).commit())throw new Exception("storage");
 }
 static synchronized void clear(Context c,String id){JSONObject old=read(c);if(old!=null&&id.equals(old.optString("id")))c.getSharedPreferences("tracking",Context.MODE_PRIVATE).edit().clear().commit();}
 static synchronized void authorized(Context c,String id) throws Exception {JSONObject old=read(c);if(old!=null&&id.equals(old.optString("id"))&&!old.optBoolean("stopping")&&!old.optBoolean("authorized")){old.put("authorized",true);write(c,old);}}
 static synchronized void requestStop(Context c){JSONObject old=read(c);if(old==null)return;try{old.put("stopping",true);write(c,old);}catch(Exception e){clear(c,old.optString("id"));}}
 static synchronized String prepare(Context c,String user) throws Exception {
  JSONObject old=read(c);if(old!=null&&old.optBoolean("stopping"))throw new Exception("pending stop");
  if(old!=null&&!user.equals(old.optString("user")))throw new Exception("different account");
  if(old==null){byte[] bytes=new byte[32];new SecureRandom().nextBytes(bytes);StringBuilder token=new StringBuilder();for(byte b:bytes)token.append(String.format("%02x",b&255));old=new JSONObject().put("id",java.util.UUID.randomUUID().toString()).put("token",token.toString()).put("user",user);write(c,old);}
  return new JSONObject().put("id",old.getString("id")).put("token",old.getString("token")).toString();
 }
}
