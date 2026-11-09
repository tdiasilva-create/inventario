let me;
const $=id=>document.getElementById(id),note=$('note');
async function api(path,data){
 const r=await fetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json','X-CSRF-Token':me?.csrf||''}:{},body:data?JSON.stringify(data):undefined}),value=await r.json();
 if(r.status===401){location.replace('/login');throw Error('Sessão encerrada. Entre novamente com sua senha atual.');}
 if(!r.ok)throw Error(value.error||'Operação não confirmada.');return value;
}
try{
 me=await api('/api/auth/me');$('identity').textContent=me.displayName||me.username;
 $('change-password').hidden=!me.mustChange;
 $('account-access').hidden=me.mustChange;
 if(me.mustChange)note.textContent='Defina sua senha pessoal para concluir o primeiro acesso ou a redefinição feita pela administração.';
 else{
  note.textContent='Sua senha já está definida. Não é necessário trocá-la novamente.';
  $('sessions').hidden=false;
  const data=await api('/api/auth/sessions');
  for(const session of data.sessions){
   const row=document.createElement('div');row.className='summary-card';const label=document.createElement('p');label.textContent=(session.current?'Esta sessão':'Outra sessão')+' · expira em '+new Date(session.expiresAt).toLocaleString('pt-BR');
   const button=document.createElement('button');button.className='secondary';button.textContent='Encerrar';
   button.onclick=async()=>{if(!confirm('Encerrar a sessão selecionada?'))return;try{await api('/api/auth/revoke',{id:session.id});if(session.current)location.replace('/login');else row.remove();}catch(error){note.textContent=error.message;}};
   row.append(label,button);$('session-list').append(row);
  }
 }
}catch(error){note.textContent=error.message;}
$('password-toggle').onclick=()=>{const form=$('change-password');form.hidden=!form.hidden;$('password-toggle').setAttribute('aria-expanded',String(!form.hidden));if(form.hidden)form.reset();else form.elements.currentPassword.focus();};
$('change-password').onsubmit=async event=>{
 event.preventDefault();const data=Object.fromEntries(new FormData(event.target));if(data.password!==data.confirm){note.textContent='A confirmação não coincide.';return;}
 const b=event.target.querySelector('button');b.disabled=true;
 try{const result=await api('/api/auth/password',data);event.target.reset();location.replace(result.redirect||'/login?senha=alterada');}catch(error){note.textContent=error.message;}finally{b.disabled=false;}
};
$('logout').onclick=async()=>{try{await api('/api/auth/logout',{});location.replace('/login');}catch(error){note.textContent=error.message;}};
// A restored first-access form may hold a stale mustChange flag and revoked CSRF token.
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
