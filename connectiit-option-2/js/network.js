/* network.js — people suggestions, matching, connection requests (Member 3) */

function matched(person){
  const mine=(window.currentUser.interests||[]).map(x=>x.toLowerCase());
  return (person.interests||[]).filter(i=>mine.includes(String(i).toLowerCase()));
}
function connFor(id){return state.connections.find(c=>c.requester_id===id||c.addressee_id===id)}
function personById(id){return state.people.find(p=>p.id===id)}

async function ensurePeople(ids){
  const missing=ids.filter(id=>!personById(id));
  if(!missing.length)return;
  const {data}=await sb.from('profiles').select('*').in('id',missing);
  state.people.push(...(data||[]));
}

async function loadSuggestions(){
  const me=window.currentUser;if(!me)return;
  const {data,error}=await sb.from('profiles').select('*').neq('id',me.id).limit(200);
  if(error){console.error(error);showToast('Could not load people');return}
  state.people=data||[];
  renderSuggestions();
}

function renderSuggestions(){
  const me=window.currentUser;if(!me)return;
  const box=document.getElementById('suggestions');
  const list=state.people
    .filter(p=>p.id!==me.id&&(p.goals||[]).includes(state.mode))
    .filter(p=>{const c=connFor(p.id);return !(c&&c.status==='declined'&&c.addressee_id===me.id)})
    .map(p=>({p,m:matched(p)}))
    .sort((a,b)=>b.m.length-a.m.length||a.p.name.localeCompare(b.p.name))
    .slice(0,6);
  if(!list.length){box.innerHTML='<div class="empty">No one here yet. Invite a friend to join!</div>';return}
  box.innerHTML=list.map(({p,m})=>{
    const c=connFor(p.id);
    let btn=`<button class="sugg-btn" onclick="connectTo('${p.id}')">+ Connect</button>`;
    if(c){
      if(c.status==='accepted')btn=`<button class="sugg-btn" onclick="openChat('${p.id}')">Message</button>`;
      else if(c.addressee_id===me.id&&c.status==='pending')btn=`<button class="sugg-btn" onclick="respondRequest('${c.id}','accepted')">Accept</button>`;
      else btn=`<button class="sugg-btn" disabled>Requested</button>`;
    }
    const why=m.length?`You both like ${m.slice(0,2).map(esc).join(' and ')}`:state.mode==='friends'?'A student in your community':'Open to professional connections';
    return `<div class="suggestion">${avatarHTML(p)}<div><div class="sugg-name">${esc(p.name)}</div><div class="sugg-detail">${esc(p.detail||'IIT student')}</div></div>${btn}</div><div class="why">${why}</div>`;
  }).join('');
}

async function loadRequests(){
  const me=window.currentUser;if(!me)return;
  const {data,error}=await sb.from('connections').select('*').or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`);
  if(error){console.error(error);return}
  state.connections=data||[];
  await ensurePeople(state.connections.map(c=>c.requester_id===me.id?c.addressee_id:c.requester_id));
  document.getElementById('connectionCount').textContent=state.connections.filter(c=>c.status==='accepted').length;
  renderRequests();
  renderSuggestions();
  if(typeof renderChatList==='function')renderChatList();
}

function renderRequests(){
  const me=window.currentUser;
  const incoming=state.connections.filter(c=>c.addressee_id===me.id&&c.status==='pending');
  const panel=ensurePanel('requestsPanel','Connection requests');
  panel.style.display=incoming.length?'block':'none';
  panel.querySelector('.extra-body').innerHTML=incoming.map(c=>{
    const p=personById(c.requester_id)||{id:c.requester_id,name:'IIT student'};
    return `<div class="suggestion">${avatarHTML(p)}<div><div class="sugg-name">${esc(p.name)}</div><div class="sugg-detail">${esc(p.detail||'IIT student')}</div></div><div class="req-btns"><button class="sugg-btn" onclick="respondRequest('${c.id}','accepted')">Accept</button><button class="sugg-btn decline" onclick="respondRequest('${c.id}','declined')">Decline</button></div></div>`;
  }).join('');
}

async function connectTo(id){
  const me=window.currentUser;if(!me)return;
  const existing=connFor(id);
  if(existing){
    if(existing.status==='pending'&&existing.addressee_id===me.id)return respondRequest(existing.id,'accepted');
    showToast(existing.status==='accepted'?'You are already connected':'Request already sent');return;
  }
  const {error}=await sb.from('connections').insert({requester_id:me.id,addressee_id:id});
  if(error){console.error(error);showToast('Could not send request: '+error.message);return}
  await loadRequests();
  showToast('Connection request sent!');
}

async function respondRequest(connId,status){
  const {error}=await sb.from('connections').update({status}).eq('id',connId);
  if(error){console.error(error);showToast('Could not update: '+error.message);return}
  await loadRequests();
  showToast(status==='accepted'?'You are now connected!':'Request declined');
}

function getAcceptedConnections(){
  const me=window.currentUser;
  return state.connections.filter(c=>c.status==='accepted')
    .map(c=>personById(c.requester_id===me.id?c.addressee_id:c.requester_id)).filter(Boolean);
}

function subscribeConnections(){
  sb.channel('connections-live').on('postgres_changes',{event:'*',schema:'public',table:'connections'},payload=>{
    const me=window.currentUser;
    if(payload.eventType==='INSERT'&&payload.new.addressee_id===me.id)showToast('You have a new connection request!');
    loadRequests();
  }).subscribe();
}