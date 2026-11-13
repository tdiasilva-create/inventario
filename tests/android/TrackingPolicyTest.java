package br.gov.ma.pacodolumiar.semed.tecnico;
public final class TrackingPolicyTest {
 private static int checks;
 private static void check(boolean value){checks++;if(!value)throw new AssertionError("check "+checks);}
 public static void main(String[] args){
  for(int code:new int[]{401,403,409,410})check(TrackingPolicy.terminal(code));
  for(int code:new int[]{0,200,422,429,500,503})check(!TrackingPolicy.terminal(code));
  check(TrackingPolicy.currentFix(200000,200000,12));check(TrackingPolicy.currentFix(200000,110000,12));
  check(!TrackingPolicy.currentFix(200000,109999,12));check(!TrackingPolicy.currentFix(200000,230001,12));
  check(!TrackingPolicy.currentFix(200000,200000,0));check(!TrackingPolicy.currentFix(200000,200000,5001));
  check(TrackingPolicy.delay(0,0)==25000);check(TrackingPolicy.delay(1,0)==50000);check(TrackingPolicy.delay(100,0)==300000);
  check(TrackingPolicy.delay(0,120000)==120000);check(TrackingPolicy.delay(0,3600000)==300000);
  System.out.println("TrackingPolicy: "+checks+" checks passed (JVM; does not emulate Android lifecycle or GPS)");
 }
}
