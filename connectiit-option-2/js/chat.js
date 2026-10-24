/* chat.js — one-to-one messaging with live updates (Member 4) */
let activeChat=null;
const chatSeen=new Set();

function renderChatList(){
  const panel=ensurePanel('chatListPanel','Your connections');
  const people=getAcceptedConnections();
  panel.querySelector('.extra-body').innerHTML=people.length
    ?people.map(p=>`<div class="suggestion">${avatarHTML(p)}<div><div class="sugg-name">${esc(p.name)}</div><div class="sugg-detail">${esc(p.detail||'IIT student')}</div></div><button class="sugg-btn" onclick="openChat('${p.id}')">Message</button></div>`).join('')
    :'<div class="empty" style="padding:12px">Connect with someone to start chatting.</div>';
}

async function openChat(userId){
  const me=window.currentUser;if(!me)return;
  await ensurePeople([userId]);
  const p=personById(userId);
  const c=connFor(userId);
  if(!p||!c||c.status!=='accepted'){showToast('You can message people once you are connected');return}
  activeChat=userId;chatSeen.clear();
  modal(`<div class="chat-head">${avatarHTML(p)}<div><div class="sugg-name">${esc(p.name)}</div><div class="sugg-detail">${esc(p.detail||'IIT student')}</div></div><button class="chat-close" onclick="closeChat()" aria-label="Close">✕</button></div>
  <div id="chatBody" class="chat-body"><div class="empty" style="padding:20px">Loading…</div></div>
  <div class="chat-input"><input id="chatInput" placeholder="Write a message…" maxlength="1000" onkeydown="if(event.key==='Enter')sendMessage()"><button class="btn small" onclick="sendMessage()">Send</button></div>`);
  const {data,error}=await sb.from('messages').select('*')
    .or(`and(sender_id.eq.${me.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${me.id})`)
    .order('created_at',{ascending:true}).limit(200);
  const body=document.getElementById('chatBody');if(!body)return;
  if(error){console.error(error);body.innerHTML='<div class="empty">Could not load messages.</div>';return}
  body.innerHTML='';
  if(!data.length)body.innerHTML='<div class="empty" id="chatEmpty" style="padding:20px">Say hello 👋</div>';
  data.forEach(appendMessage);
}

function closeChat(){activeChat=null;closeModal()}

function appendMessage(m){
  const body=document.getElementById('chatBody');
  if(!body||chatSeen.has(m.id))return;
  chatSeen.add(m.id);
  document.getElementById('chatEmpty')?.remove();
  const mine=m.sender_id===window.currentUser.id;
  const div=document.createElement('div');
  div.className='bubble '+(mine?'mine':'theirs');
  div.innerHTML=`${esc(m.body)}<span class="bubble-time">${timeAgo(m.created_at)}</span>`;
  body.appendChild(div);
  body.scrollTop=body.scrollHeight;
}

async function sendMessage(){
  const me=window.currentUser;
  const input=document.getElementById('chatInput');if(!input||!activeChat)return;
  const text=input.value.trim();if(!text)return;
  input.value='';
  const {data,error}=await sb.from('messages').insert({sender_id:me.id,recipient_id:activeChat,body:text}).select().single();
  if(error){console.error(error);showToast('Message not sent: '+error.message);input.value=text;return}
  appendMessage(data);
}

function subscribeChat(){
  sb.channel('messages-live').on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},payload=>{
    const m=payload.new,me=window.currentUser;
    if(!me||(m.sender_id!==me.id&&m.recipient_id!==me.id))return;
    const other=m.sender_id===me.id?m.recipient_id:m.sender_id;
    if(activeChat===other&&document.getElementById('chatBody'))appendMessage(m);
    else if(m.recipient_id===me.id)showToast(`New message from ${personById(m.sender_id)?.name||'a connection'}`);
  }).subscribe();
}