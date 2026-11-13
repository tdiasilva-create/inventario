package br.gov.ma.pacodolumiar.semed.tecnico;
import android.content.*;import android.database.*;import android.net.Uri;import android.os.*;import android.provider.OpenableColumns;import java.io.*;
/** Only explicitly granted, randomly named camera output files in private cache. */
public class CaptureProvider extends ContentProvider {
 static final String AUTHORITY="br.gov.ma.pacodolumiar.semed.tecnico.photos";
 static File directory(Context c){return new File(c.getCacheDir(),"captures");}
 private File file(Uri uri)throws FileNotFoundException{
  if(!"content".equals(uri.getScheme())||!AUTHORITY.equals(uri.getAuthority())||uri.getPathSegments().size()!=1||!MobilePolicy.photoName(uri.getLastPathSegment()))throw new FileNotFoundException("Invalid capture");
  File f=new File(directory(getContext()),uri.getLastPathSegment());
  try{if(!f.getCanonicalFile().getParentFile().equals(directory(getContext()).getCanonicalFile()))throw new FileNotFoundException("Invalid directory");}catch(IOException e){throw new FileNotFoundException();}return f;
 }
 @Override public boolean onCreate(){return true;}
 @Override public String getType(Uri u){return "image/jpeg";}
 @Override public ParcelFileDescriptor openFile(Uri u,String mode)throws FileNotFoundException{if(!mode.equals("r")&&!mode.equals("w")&&!mode.equals("rw")&&!mode.equals("wt"))throw new FileNotFoundException();return ParcelFileDescriptor.open(file(u),ParcelFileDescriptor.parseMode(mode));}
 @Override public Cursor query(Uri u,String[] projection,String selection,String[] args,String order){try{File f=file(u);String[] columns=projection==null?new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE}:projection;MatrixCursor c=new MatrixCursor(columns);Object[] values=new Object[columns.length];for(int i=0;i<columns.length;i++)values[i]=OpenableColumns.DISPLAY_NAME.equals(columns[i])?f.getName():OpenableColumns.SIZE.equals(columns[i])?f.length():null;c.addRow(values);return c;}catch(FileNotFoundException e){return null;}}
 @Override public Uri insert(Uri u,ContentValues v){throw new UnsupportedOperationException();}
 @Override public int update(Uri u,ContentValues v,String s,String[] a){throw new UnsupportedOperationException();}
 @Override public int delete(Uri u,String s,String[] a){throw new UnsupportedOperationException();}
}
