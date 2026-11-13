package br.gov.ma.pacodolumiar.semed.tecnico;
// Pure rules exercised by the JVM tests as well as the Android shell.
final class MobilePolicy {
 static boolean internalPath(String path){return "/app".equals(path)||"/app/coleta".equals(path)||"/app/coleta/v3".equals(path)||"/app/coleta/v2".equals(path)||"/app/coleta/visita".equals(path)||"/tecnico".equals(path)||"/tecnico/login".equals(path)||"/tecnico/conta".equals(path);}
 static boolean imageType(String mime){return mime!=null&&mime.startsWith("image/");}
 static boolean photoName(String name){return name!=null&&name.matches("capture-[a-f0-9-]{36}\\.jpg");}
 static boolean imageSize(long size){return size>0&&size<=40L*1024*1024;}
}
