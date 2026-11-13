package br.gov.ma.pacodolumiar.semed.tecnico;
import android.Manifest;import android.app.*;import android.content.*;import android.content.pm.PackageManager;import android.net.Uri;import android.provider.MediaStore;import android.webkit.*;import android.widget.Toast;import java.io.*;import java.util.*;
/** Explicit camera/gallery actions; no storage or microphone permission. */
final class CollectionCamera extends WebChromeClient {
 private final MainActivity activity;private ValueCallback<Uri[]> files;private PermissionRequest video;private Uri capture;private boolean multiple;
 CollectionCamera(MainActivity a){activity=a;}
 private boolean trusted(){return activity.trusted();}
 @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){
  cancelFiles();if(!trusted()){callback.onReceiveValue(null);return true;}
  files=callback;multiple=params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE;
  if(params.isCaptureEnabled()){
   if(activity.checkSelfPermission(Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED)activity.requestPermissions(new String[]{Manifest.permission.CAMERA},20);else photograph();
  }else gallery();return true;
 }
 private void gallery(){try{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("image/*");i.addCategory(Intent.CATEGORY_OPENABLE);i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,multiple);activity.startActivityForResult(i,30);}catch(Exception e){fail("Não foi possível abrir a galeria.");}}
 private void photograph(){if(files==null||!trusted())return;try{
  File dir=CaptureProvider.directory(activity);dir.mkdirs();File[] old=dir.listFiles();if(old!=null)for(File f:old)if(MobilePolicy.photoName(f.getName())&&System.currentTimeMillis()-f.lastModified()>86400000L)f.delete();
  File f=new File(dir,"capture-"+UUID.randomUUID()+".jpg");if(!f.createNewFile())throw new IOException();capture=Uri.parse("content://"+CaptureProvider.AUTHORITY+"/"+f.getName());
  Intent i=new Intent(MediaStore.ACTION_IMAGE_CAPTURE);i.putExtra(MediaStore.EXTRA_OUTPUT,capture);i.setClipData(ClipData.newRawUri("Foto SEMED",capture));i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);activity.startActivityForResult(i,31);
 }catch(Exception e){fail("Câmera indisponível. Você pode escolher uma imagem da galeria.");}}
 @Override public void onPermissionRequest(PermissionRequest request){activity.runOnUiThread(()->{
  if(!trusted()||!Api.ORIGIN.equals(request.getOrigin().toString().replaceAll("/$",""))||request.getResources().length!=1||!PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(request.getResources()[0])){request.deny();return;}
  if(video!=null)video.deny();video=request;
  if(activity.checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED)grantVideo();else activity.requestPermissions(new String[]{Manifest.permission.CAMERA},21);
 });}
 @Override public void onPermissionRequestCanceled(PermissionRequest request){if(video==request)video=null;}
 private void grantVideo(){if(video==null)return;PermissionRequest r=video;video=null;if(trusted())r.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});else r.deny();}
 void permission(int code){if(code!=20&&code!=21)return;boolean ok=activity.checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED;if(code==20){if(ok)photograph();else fail("Permita a câmera ou utilize a galeria.");}else if(ok)grantVideo();else if(video!=null){video.deny();video=null;}}
 void result(int request,int result,Intent data){if(request!=30&&request!=31)return;if(files==null)return;
  if(result!=Activity.RESULT_OK||!trusted()){cancelFiles();return;}
  try{
   List<Uri> selected=new ArrayList<>();
   if(request==31&&capture!=null){File f=new File(CaptureProvider.directory(activity),capture.getLastPathSegment());if(!MobilePolicy.imageSize(f.length()))throw new IOException();selected.add(capture);}
   else if(data!=null){ClipData clip=data.getClipData();if(clip!=null){for(int i=0;i<clip.getItemCount();i++)selected.add(clip.getItemAt(i).getUri());}else if(data.getData()!=null)selected.add(data.getData());}
   if(selected.size()>(multiple?5:1))throw new IOException();
   for(Uri uri:selected){if(!"content".equals(uri.getScheme())||!MobilePolicy.imageType(activity.getContentResolver().getType(uri)))throw new IOException();try(android.content.res.AssetFileDescriptor f=activity.getContentResolver().openAssetFileDescriptor(uri,"r")){if(f==null||f.getLength()>40L*1024*1024)throw new IOException();}}
   ValueCallback<Uri[]> callback=files;files=null;if(capture!=null)activity.revokeUriPermission(capture,Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);capture=null;
   callback.onReceiveValue(selected.isEmpty()?null:selected.toArray(new Uri[0]));
  }catch(Exception e){fail("Escolha até cinco imagens válidas, de até 40 MB cada.");}
 }
 private void fail(String message){Toast.makeText(activity,message,Toast.LENGTH_LONG).show();cancelFiles();}
 void cancelFiles(){if(files!=null){ValueCallback<Uri[]> old=files;files=null;old.onReceiveValue(null);}if(capture!=null){activity.revokeUriPermission(capture,Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);File f=new File(CaptureProvider.directory(activity),capture.getLastPathSegment());if(MobilePolicy.photoName(f.getName()))f.delete();capture=null;}}
 void destroy(){cancelFiles();if(video!=null){video.deny();video=null;}}
}
