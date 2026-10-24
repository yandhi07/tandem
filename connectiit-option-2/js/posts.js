/* posts.js — feed, creating posts, photo upload (Member 2) */

async function loadFeed(){
  const me=window.currentUser;if(!me)return;
  const {data,error}=await sb.from('posts').select('*, author:profiles(id,name,emoji)').order('created_at',{ascending:false}).limit(50);
  if(error){console.error(error);showToast('Could not load posts');return}
  state.posts=data||[];
  renderPosts();
  const {count}=await sb.from('posts').select('id',{count:'exact',head:true}).eq('author_id',me.id);
  document.getElementById('postCount').textContent=count??0;
}

function renderPosts(){
  const root=document.getElementById('feed');if(!root)return;
  const me=window.currentUser;
  const f=document.getElementById('feedFilter').value;
  const list=state.posts.filter(p=>f==='all'||p.type===f);
  if(!list.length){root.innerHTML='<div class="panel empty">No updates yet. Be the first to share something!</div>';return}
  root.innerHTML=list.map(p=>{
    const a=p.author||{id:p.author_id,name:'IIT student',emoji:'🙂'};
    const mine=me&&p.author_id===me.id;
    return `<article class="panel post"><div class="post-head">${avatarHTML(a)}<div><div class="post-author">${esc(a.name)}${mine?' (you)':''}</div><div class="post-meta">${timeAgo(p.created_at)} · IIT</div></div><span class="post-kind">${p.type==='professional'?'✳ Professional':'☀ Personal'}</span></div>
    ${p.body?`<div class="post-copy">${esc(p.body)}</div>`:''}
    ${p.photo_url?`<img class="post-photo" src="${esc(p.photo_url)}" alt="Photo shared by ${esc(a.name)}">`:''}
    <div class="post-actions"><button onclick="showToast('Likes are coming soon')">♡ Like</button>${mine?'':`<button onclick="connectTo('${esc(p.author_id)}')">↗ Connect</button>`}</div></article>`;
  }).join('');
}

function photoChosen(e){
  const f=e.target.files[0];if(!f)return;
  if(f.size>2*1024*1024){showToast('Choose an image under 2 MB');e.target.value='';return}
  selectedFile=f;showToast('Photo added — write a caption and share');
}

async function createPost(){
  const me=window.currentUser;if(!me)return;
  const text=document.getElementById('postText').value.trim();
  if(!text&&!selectedFile){showToast('Write something or add a photo first');return}
  let photo_url=null;
  if(selectedFile){
    const ext=(selectedFile.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
    const path=`${me.id}/${Date.now()}.${ext}`;
    const {error:upErr}=await sb.storage.from('post-photos').upload(path,selectedFile,{contentType:selectedFile.type});
    if(upErr){console.error(upErr);showToast('Photo upload failed: '+upErr.message);return}
    photo_url=sb.storage.from('post-photos').getPublicUrl(path).data.publicUrl;
  }
  const {error}=await sb.from('posts').insert({author_id:me.id,body:text,type:document.getElementById('postType').value,photo_url});
  if(error){console.error(error);showToast('Could not post: '+error.message);return}
  selectedFile=null;document.getElementById('photoInput').value='';document.getElementById('postText').value='';
  await loadFeed();showToast('Your update is live!');
}

function subscribePosts(){
  sb.channel('posts-feed').on('postgres_changes',{event:'INSERT',schema:'public',table:'posts'},()=>loadFeed()).subscribe();
}