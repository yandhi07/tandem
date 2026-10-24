/* auth.js — signup, login, session restore, profile editing (Member 1) */

async function fetchProfile(id){
  const {data,error}=await sb.from('profiles').select('*').eq('id',id).maybeSingle();
  if(error){console.error(error);return null}
  return data;
}

function onLogin(profile){
  window.currentUser=profile;
  closeModal();
  startRealtime();
  showApp();
}

function startRealtime(){
  sb.removeAllChannels();
  if(typeof subscribePosts==='function')subscribePosts();
  if(typeof subscribeConnections==='function')subscribeConnections();
  if(typeof subscribeChat==='function')subscribeChat();
}

function openSignup(){
  if(window.currentUser){showApp();return}
  modal(`<div class="eyebrow"><span></span> WELCOME TO CONNECTIIT</div><h2>Let's get to know you.</h2><p>Create your account and we'll help you find your people.</p>
  <div class="field"><label>Your name</label><input id="newName" placeholder="e.g. Aanya Sharma" maxlength="40"></div>
  <div class="field"><label>Email</label><input id="newEmail" type="email" placeholder="you@example.com"></div>
  <div class="field"><label>Password <span style="font-weight:400;color:var(--muted)">(6+ characters)</span></label><input id="newPassword" type="password" placeholder="Choose a password"></div>
  <div class="field"><label>Year and branch</label><input id="newDetail" placeholder="e.g. 2nd year · Computer Science" maxlength="55"></div>
  <div class="field"><label>What are you here for?</label><div class="chips"><button class="chip on" data-goal="friends" onclick="toggleChip(this)">☀ Make friends</button><button class="chip" data-goal="professional" onclick="toggleChip(this)">✳ Professional connections</button></div></div>
  <div class="field"><label>Interests <span style="font-weight:400;color:var(--muted)">(comma separated)</span></label><input id="newInterests" placeholder="e.g. music, robotics, design"></div>
  <div class="modal-actions"><button class="btn" id="signupBtn" onclick="finishSignup()">Create my account ↗</button></div>
  <p style="margin-top:14px;font-size:13px;text-align:center">Already have an account? <a href="#" onclick="openLogin();return false" style="color:var(--green);font-weight:700">Log in</a></p>`);
}

async function finishSignup(){
  const name=val('newName'),email=val('newEmail'),password=document.getElementById('newPassword').value;
  if(!name){document.getElementById('newName').focus();showToast('Add your name to continue');return}
  if(!email){document.getElementById('newEmail').focus();showToast('Add your email to continue');return}
  if(password.length<6){document.getElementById('newPassword').focus();showToast('Password must be at least 6 characters');return}
  const goals=[...document.querySelectorAll('[data-goal].on')].map(x=>x.dataset.goal);
  const btn=document.getElementById('signupBtn');btn.disabled=true;btn.textContent='Creating…';
  const {data,error}=await sb.auth.signUp({email,password});
  if(error){showToast(error.message);btn.disabled=false;btn.textContent='Create my account ↗';return}
  if(!data.session){showToast('Account created, but Supabase is asking for email confirmation. Turn off "Confirm email" in Auth settings, then log in.');btn.disabled=false;btn.textContent='Create my account ↗';return}
  const profile={id:data.user.id,name,detail:val('newDetail')||'IIT · Student',interests:parseList(val('newInterests')),goals:goals.length?goals:['friends'],emoji:'🙂',bio:''};
  const {error:e2}=await sb.from('profiles').insert(profile);
  if(e2){console.error(e2);showToast('Could not save your profile: '+e2.message);btn.disabled=false;btn.textContent='Create my account ↗';return}
  onLogin(profile);
  showToast(`Welcome to connectIIT, ${name.split(' ')[0]}!`);
}

function openLogin(){
  modal(`<div class="eyebrow"><span></span> WELCOME BACK</div><h2>Log in</h2><p>Pick up where you left off.</p>
  <div class="field"><label>Email</label><input id="loginEmail" type="email" placeholder="you@example.com"></div>
  <div class="field"><label>Password</label><input id="loginPassword" type="password" placeholder="Your password" onkeydown="if(event.key==='Enter')doLogin()"></div>
  <div class="modal-actions"><button class="btn" id="loginBtn" onclick="doLogin()">Log in ↗</button></div>
  <p style="margin-top:14px;font-size:13px;text-align:center">New here? <a href="#" onclick="openSignup();return false" style="color:var(--green);font-weight:700">Create an account</a></p>`);
}

async function doLogin(){
  const email=val('loginEmail'),password=document.getElementById('loginPassword').value;
  if(!email||!password){showToast('Enter your email and password');return}
  const btn=document.getElementById('loginBtn');btn.disabled=true;btn.textContent='Logging in…';
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  if(error){showToast(error.message);btn.disabled=false;btn.textContent='Log in ↗';return}
  const profile=await fetchProfile(data.user.id);
  if(!profile){showToast('No profile found for this account. Please sign up first.');await sb.auth.signOut();btn.disabled=false;btn.textContent='Log in ↗';return}
  onLogin(profile);
  showToast(`Welcome back, ${profile.name.split(' ')[0]}!`);
}

async function logout(){
  await sb.removeAllChannels();
  await sb.auth.signOut();
  window.currentUser=null;
  state.people=[];state.posts=[];state.connections=[];
  closeModal();returnToLanding();showToast('Logged out');
}

function editProfile(){
  const p=window.currentUser;if(!p)return;
  modal(`<h2>Edit your profile</h2><p>Keep it simple. You can change these details anytime.</p>
  <div class="field"><label>Name</label><input id="editName" value="${esc(p.name)}" maxlength="40"></div>
  <div class="field"><label>Year and branch</label><input id="editDetail" value="${esc(p.detail||'')}" maxlength="55"></div>
  <div class="field"><label>Emoji avatar</label><input id="editEmoji" value="${esc(p.emoji||'🙂')}" maxlength="4"></div>
  <div class="field"><label>Interests <span style="font-weight:400;color:var(--muted)">(comma separated)</span></label><input id="editInterests" value="${esc((p.interests||[]).join(', '))}"></div>
  <div class="field"><label>About you</label><textarea id="editBio" placeholder="A short intro">${esc(p.bio||'')}</textarea></div>
  <div class="modal-actions"><button class="btn light" onclick="logout()">Log out</button><button class="btn" onclick="saveProfile()">Save changes</button></div>`);
}

async function saveProfile(){
  const p=window.currentUser;
  const update={name:val('editName')||p.name,detail:val('editDetail'),emoji:val('editEmoji')||'🙂',interests:parseList(val('editInterests')),bio:val('editBio')};
  const {data,error}=await sb.from('profiles').update(update).eq('id',p.id).select().single();
  if(error){console.error(error);showToast('Could not save: '+error.message);return}
  window.currentUser=data;closeModal();renderApp();showToast('Profile updated');
}

async function restoreSession(){
  try{
    const {data}=await sb.auth.getSession();
    if(data.session){const profile=await fetchProfile(data.session.user.id);if(profile)onLogin(profile)}
  }catch(e){console.error('restoreSession',e)}
}
restoreSession();