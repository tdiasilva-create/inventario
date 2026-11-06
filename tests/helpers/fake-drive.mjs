// Simulação do Google Drive/OAuth para testes isolados. Nenhuma chamada externa; nenhum dado real.
export function fakeGoogle({refreshToken='REFRESH-ISOLADO',failRefresh=false,quotaExceeded=false,anyToken=false,email='teste@exemplo.invalid'}={}){
 const files=new Map(),calls=[];let tokenCounter=0,accessToken='ACCESS-0';
 const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
 const auth=request=>anyToken?!!request.headers.get('Authorization'):request.headers.get('Authorization')==='Bearer '+accessToken;
 const self={files,calls,get accessToken(){return accessToken;},revoked:false,
  fetch:async(input,init={})=>{
   const url=new URL(typeof input==='string'?input:input.url),method=(init.method||'GET').toUpperCase(),headers=new Headers(init.headers||{});
   const request={headers,url,method,body:init.body};calls.push({method,url:url.href});
   if(url.href.startsWith('https://oauth2.googleapis.com/token')){const form=new URLSearchParams(String(init.body));
    if(form.get('grant_type')==='authorization_code'){if(form.get('code')!=='CODE-VALIDO')return json({error:'invalid_grant'},400);accessToken='ACCESS-'+(++tokenCounter);return json({access_token:accessToken,refresh_token:refreshToken,expires_in:3600,scope:'https://www.googleapis.com/auth/drive.file',token_type:'Bearer'});}
    if(form.get('grant_type')==='refresh_token'){if(failRefresh||self.revoked||form.get('refresh_token')!==refreshToken)return json({error:'invalid_grant'},400);accessToken='ACCESS-'+(++tokenCounter);return json({access_token:accessToken,expires_in:3600,scope:'https://www.googleapis.com/auth/drive.file',token_type:'Bearer'});}
    return json({error:'unsupported'},400);}
   if(url.href.startsWith('https://oauth2.googleapis.com/revoke')){self.revoked=true;return new Response('',{status:200});}
   if(!auth(request))return json({error:{code:401,message:'Invalid Credentials'}},401);
   if(url.pathname==='/drive/v3/about')return json({user:{emailAddress:email,displayName:'Conta de teste'},storageQuota:{limit:'1',usage:'0'}});
   if(url.pathname==='/upload/drive/v3/files'&&method==='POST'){
    if(quotaExceeded)return json({error:{code:403,message:'The user\'s Drive storage quota has been exceeded.',errors:[{reason:'storageQuotaExceeded'}]}},403);
    const body=Buffer.from(init.body),text=body.toString('latin1'),boundary='--'+headers.get('Content-Type').split('boundary=')[1];
    const parts=text.split(boundary).filter(p=>p.trim()&&p.trim()!=='--');const meta=JSON.parse(parts[0].split('\r\n\r\n')[1].trim());const dataStart=parts[1].indexOf('\r\n\r\n')+4;const data=Buffer.from(parts[1].slice(dataStart,parts[1].length-2),'latin1');
    const id='drv-'+(files.size+1)+'-'+Math.random().toString(16).slice(2,8);files.set(id,{id,...meta,bytes:data,trashed:false});return json({id,name:meta.name,size:String(data.length)});}
   if(url.pathname==='/drive/v3/files'&&method==='POST'){const meta=JSON.parse(init.body);const id='fld-'+(files.size+1);files.set(id,{id,...meta,trashed:false});return json({id,name:meta.name});}
   if(url.pathname==='/drive/v3/files'&&method==='GET'){const q=url.searchParams.get('q')||'';const m=q.match(/appProperties has \{ key='([^']+)' and value='([^']+)' \}/);const folderOnly=q.includes("mimeType='application/vnd.google-apps.folder'");const found=[...files.values()].filter(f=>!f.trashed&&m&&f.appProperties?.[m[1]]===m[2]&&(!folderOnly||f.mimeType==='application/vnd.google-apps.folder'));return json({files:found.map(f=>({id:f.id,name:f.name,size:f.bytes?String(f.bytes.length):undefined,parents:f.parents}))});}
   const fileMatch=url.pathname.match(/^\/drive\/v3\/files\/([^/]+)$/);
   if(fileMatch){const file=files.get(decodeURIComponent(fileMatch[1]));
    if(method==='DELETE'){if(!file)return json({error:{code:404}},404);files.delete(file.id);return new Response(null,{status:204});}
    if(!file||file.trashed)return json({error:{code:404,message:'File not found'}},404);
    if(url.searchParams.get('alt')==='media')return new Response(file.bytes,{status:200,headers:{'Content-Type':file.mimeType}});
    return json({id:file.id,name:file.name,mimeType:file.mimeType,trashed:false});}
   return json({error:{code:404,message:'rota simulada inexistente '+url.pathname}},404);
  }};
 return self;
}
export const testEnv=overrides=>({PHOTO_STORAGE_PROVIDER:'google-drive',GOOGLE_CLIENT_ID:'cliente-isolado.apps.googleusercontent.com',GOOGLE_CLIENT_SECRET:'SEGREDO-ISOLADO',GOOGLE_TOKEN_KEY:Buffer.alloc(32,7).toString('base64'),...overrides});
