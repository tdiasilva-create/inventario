// Mutable filenames must revalidate so a release never serves day-old JS/CSS.
// Called only by existing static-asset routes, never by API data handlers.
export async function assetResponse(request,env){
 const asset=await env.ASSETS.fetch(request),response=new Response(asset.body,asset);
 const path=new URL(request.url).pathname,staticFile=/\.(?:css|js|svg|woff2?|ttf|png|jpe?g|webp|ico)$/.test(path);
 const cacheable=['GET','HEAD'].includes(request.method)&&[200,304].includes(response.status)&&staticFile&&!path.startsWith('/api/')&&!response.headers.get('Content-Type')?.includes('text/html')&&!response.headers.has('Set-Cookie');
 const versioned=/^\/bundles\/(?:[a-z-]+-[A-Z0-9]{8}\.js|painel-[a-f0-9]{16}\.css)$/.test(path);
 response.headers.set('Cache-Control',cacheable?(versioned?'private, max-age=31536000, immutable':'public, no-cache'):'no-store');
 if(cacheable&&versioned)response.headers.set('Vary','Cookie');
 return response;
}
