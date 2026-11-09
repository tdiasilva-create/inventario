// Call only AFTER session, scope, photo state and provider checks.
// Every reuse requires online authorization; no shared or fresh 24-hour cache.
function headersFor(row){
 const headers=new Headers({'Cache-Control':/^[a-f0-9]{64}$/i.test(row.sha256||'')?'private, no-cache':'private, no-store','Vary':'Cookie','Content-Type':row.mime_type,'Content-Disposition':'inline','X-Content-Type-Options':'nosniff'});
 if(/^[a-f0-9]{64}$/i.test(row.sha256||''))headers.set('ETag','"'+row.sha256+'"');
 return headers;
}
export function photoNotModified(request,row){
 const headers=headersFor(row),etag=headers.get('ETag');
 if(!etag||!['GET','HEAD'].includes(request.method))return null;
 const condition=request.headers.get('If-None-Match');
 if(condition?.split(',').some(tag=>tag.trim()==='*'||tag.trim().replace(/^W\//,'')===etag))return new Response(null,{status:304,headers});
 return null;
}
export function photoResponse(row,object){
 const headers=headersFor(row);
 if(object.contentLength!=null&&/^\d+$/.test(String(object.contentLength)))headers.set('Content-Length',String(object.contentLength));
 return new Response(object.body,{headers});
}
