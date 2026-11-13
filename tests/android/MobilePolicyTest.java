package br.gov.ma.pacodolumiar.semed.tecnico;
public class MobilePolicyTest {
 static int count=0;static void ok(boolean b){count++;if(!b)throw new AssertionError("case "+count);}
 public static void main(String[] args){
  for(String p:new String[]{"/app","/app/coleta","/app/coleta/v3","/tecnico","/tecnico/login"})ok(MobilePolicy.internalPath(p));
  for(String p:new String[]{"/app/../usuarios","/app-malicioso","/tecnico/arquivo.apk","/usuarios","/configuracoes",null})ok(!MobilePolicy.internalPath(p));
  ok(MobilePolicy.imageType("image/jpeg"));ok(!MobilePolicy.imageType("text/html"));ok(!MobilePolicy.imageType(null));
  ok(MobilePolicy.photoName("capture-77ba7fbf-430f-4fc7-87b0-8a91baac0c5f.jpg"));ok(!MobilePolicy.photoName("../credentials"));ok(!MobilePolicy.photoName("capture-other.jpg"));
  ok(MobilePolicy.imageSize(10));ok(!MobilePolicy.imageSize(0));ok(!MobilePolicy.imageSize(41L*1024*1024));
  System.out.println(count+" mobile navigation/file policy checks passed");
 }
}
