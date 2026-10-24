/* app.js — shared state + helpers. Everyone uses these; don't rename them. */
const state = { people: [], posts: [], connections: [], mode: 'friends' };
let selectedFile = null;

function initials(n){return (n||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function colorFor(id){const cs=['#f5c7ad','#cad9f5','#ecd5ef','#f0dfaa','#bde0d3','#f0c5c5','#dce9ce'];let h=0;for(const c of String(id||''))h=(h*31+c.charCodeAt(0))>>>0;return cs[h%cs.length]}
function avatarHTML(person,cls='mini-avatar'){return `<div class="${cls}" style="background:${person.color||colorFor(person.id)}">${esc(person.emoji||initials(person.name))}</div>`}
function timeAgo(t){const m=Math.max(1,Math.floor((Date.now()-new Date(t).getTime())/60000));return m<60?`${m}m ago`:m<1440?`${Math.floor(m/60)}h ago`:`${Math.floor(m/1440)}d ago`}
function parseList(s){return String(s||'').split(',').map(x=>x.trim()).filter(Boolean)}
function val(id){const el=document.getElementById(id);return el?el.value.trim():''}

function modal(html){document.getElementById('modalRoot').innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal">${html}</div></div>`;const input=document.querySelector('.modal input');if(input)input.focus()}
function closeModal(){document.getElementById('modalRoot').innerHTML=''}
function showToast(msg){const root=document.getElementById('toastRoot');root.innerHTML=`<div class="toast">${esc(msg)}</div>`;clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>root.innerHTML='',2800)}
function toggleChip(el){el.classList.toggle('on')}
function skipIntro(){document.getElementById('introScreen')?.classList.add('dismissed')}
document.getElementById('introScreen')?.addEventListener('animationend',e=>{if(e.animationName==='intro-out')e.currentTarget.remove()});

function ensurePanel(id,title){
  let el=document.getElementById(id);
  if(el)return el;
  const side=document.querySelector('.right-sidebar');
  let box=document.getElementById('extraPanels');
  if(!box){box=document.createElement('div');box.id='extraPanels';side.insertAdjacentElement('afterbegin',box)}
  el=document.createElement('div');el.className='panel extra-panel';el.id=id;
  el.innerHTML=`<h3 class="side-title">${esc(title)}</h3><div class="extra-body"></div>`;
  box.appendChild(el);
  return el;
}

function showApp(){document.getElementById('landing').style.display='none';document.getElementById('app').style.display='block';renderApp();window.scrollTo(0,0)}
function returnToLanding(){document.getElementById('app').style.display='none';document.getElementById('landing').style.display='block';window.scrollTo(0,0)}

function renderApp(){
  const p=window.currentUser; if(!p)return;
  const emoji=p.emoji||'🙂';
  document.getElementById('topName').textContent=p.name;
  document.getElementById('topAvatar').textContent=emoji;
  document.getElementById('profileAvatar').textContent=emoji;
  document.getElementById('profileName').textContent=p.name;
  document.getElementById('profileDetail').textContent=p.detail||'IIT · Student';
  document.getElementById('composerAvatar').textContent=emoji;
  setMode(state.mode,false);
  loadFeed();
  loadSuggestions();
  loadRequests();
}

function setMode(mode,rerender=true){
  state.mode=mode;
  document.getElementById('friendsMode').classList.toggle('selected',mode==='friends');
  document.getElementById('proMode').classList.toggle('selected',mode==='professional');
  if(rerender&&typeof renderSuggestions==='function')renderSuggestions();
}