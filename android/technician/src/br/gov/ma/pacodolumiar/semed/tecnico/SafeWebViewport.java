package br.gov.ma.pacodolumiar.semed.tecnico;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Insets;
import android.os.Build;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.WebView;
import android.widget.FrameLayout;

/** Sizes the actual WebView, including its iframes, inside Android's usable area.
 * No pixel/dp guesses or CSS propagation into each iframe. No tracking/session changes.
 */
final class SafeWebViewport {
 private SafeWebViewport() {}

 static void install(Activity activity, WebView web) {
  FrameLayout root = new FrameLayout(activity);
  root.setBackgroundColor(Color.rgb(22,25,29));
  root.addView(web, new FrameLayout.LayoutParams(
    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
  if (Build.VERSION.SDK_INT >= 30) {
   // Android 15 enforces edge-to-edge for target 35. Use the same ownership on 11+.
   activity.getWindow().setDecorFitsSystemWindows(false);
   installInsets(root);
  }
  // Android 8–10 keeps the platform's fitted content area + manifest adjustResize.
  activity.setContentView(root);
  root.requestApplyInsets();
 }

 @android.annotation.TargetApi(30)
 private static void installInsets(FrameLayout root) {
  final int types = WindowInsets.Type.systemBars()
    | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime();
  root.setOnApplyWindowInsetsListener((view, insets) -> {
   // getInsets(union) takes the MAX per edge, not nav + keyboard (double space).
   Insets safe = insets.getInsets(types);
   if (view.getPaddingLeft()!=safe.left || view.getPaddingTop()!=safe.top
       || view.getPaddingRight()!=safe.right || view.getPaddingBottom()!=safe.bottom) {
    view.setPadding(safe.left,safe.top,safe.right,safe.bottom);
   }
   // Deliver zeroed handled insets, NOT CONSUMED: WebView must also receive the
   // keyboard-hide update, without adding native/CSS/visual-viewport space twice.
   return new WindowInsets.Builder(insets).setInsets(types,Insets.NONE)
     .setInsetsIgnoringVisibility(WindowInsets.Type.systemBars()
       | WindowInsets.Type.displayCutout(),Insets.NONE)
     .setDisplayCutout(null).build();
  });
 }
}
