// script.js - frontend
const API_BASE = '/api';
const DEMO_KEY = 'infinitypost_demo_v1';

async function getPublicIP(){
  if(localStorage.getItem('infinity_ip')) return localStorage.getItem('infinity_ip');
  try{
    const res = await fetch('https://api.ipify.org?format=json');
    if(!res.ok) throw new Error('no ip');
    const j = await res.json();
    localStorage.setItem('infinity_ip', j.ip);
    return j.ip;
  }catch(e){
    let sid = localStorage.getItem('infinity_session') || Math.random().toString(36).slice(2,9);
    localStorage.setItem('infinity_session', sid);
    const fake = 'local-' + sid;
    localStorage.setItem('infinity_ip', fake);
    return fake;
  }
}

async function apiFetch(path, opts){
  try{
    const res = await fetch(API_BASE + path, opts);
    if(!res.ok) throw new Error('api-fail');
    return await res.json();
  }catch(e){
    throw e;
  }
}

function loadDemo(){ const raw = localStorage.getItem(DEMO_KEY); return raw ? JSON.parse(raw) : {posts:[], usedNicks:{}}; }
function saveDemo(data){ localStorage.setItem(DEMO_KEY, JSON.stringify(data)); }

let STATE = {posts:[], usedNicks:{}};
let IS_DEMO = false;
let currentIP = null;

(async function init(){
  currentIP = await getPublicIP();
  try{
    const posts = await apiFetch('/posts');
    STATE.posts = posts;
    IS_DEMO = false;
  }catch(e){
    console.warn('Backend indisponível — modo demo');
    STATE = loadDemo();
    IS_DEMO = true;
  }
  renderPosts();
})();

const postsEl = document.getElementById('posts');

function renderPosts(){
  postsEl.innerHTML = '';
  if(STATE.posts.length === 0){
    postsEl.innerHTML = '<p class="small">Nenhum post ainda. Seja o primeiro!</p>';
    return;
  }
  STATE.posts.forEach(post => {
    const card = document.createElement('div'); card.className='card';
    const topic = document.createElement('h3'); topic.className='topic'; topic.textContent = post.topic;
    const meta = document.createElement('div'); meta.className='meta'; meta.textContent = `por ${post.nick} · ${new Date(post.createdAt||Date.now()).toLocaleString()}`;
    const content = document.createElement('div'); content.className='content'; content.textContent = post.content || '';

    card.appendChild(topic); card.appendChild(meta); card.appendChild(content);

    const commentsWrap = document.createElement('div'); commentsWrap.className='comments';
    if(post.comments && post.comments.length){
      const tree = buildCommentTree(post.comments);
      tree.forEach(node => commentsWrap.appendChild(renderCommentNode(node, post)));
    }
    const cb = createCommentBox(post.id, null);
    commentsWrap.appendChild(cb);

    card.appendChild(commentsWrap);
    postsEl.appendChild(card);
  });
}

function buildCommentTree(comments){
  const map = {}; const roots = [];
  comments.forEach(c => { c.children = []; map[c.id] = c; });
  comments.forEach(c => { if(c.parentId){ if(map[c.parentId]) map[c.parentId].children.push(c); else roots.push(c); } else roots.push(c); });
  return roots;
}

function renderCommentNode(node, post){
  const el = document.createElement('div'); el.className='comment';
  const meta = document.createElement('div'); meta.className='meta'; meta.textContent = `${node.nick} · ${new Date(node.createdAt||Date.now()).toLocaleString()}`;
  const body = document.createElement('div'); body.textContent = node.content;
  el.appendChild(meta); el.appendChild(body);

  const actions = document.createElement('div'); actions.style.marginTop='6px';
  const replyBtn = document.createElement('button'); replyBtn.className='reply-btn'; replyBtn.textContent='Responder';
  replyBtn.onclick = ()=>{
    if(el.querySelector('.reply-box')) return;
    const box = createCommentBox(post.id, node.id);
    box.classList.add('reply-box');
    el.appendChild(box);
  };
  actions.appendChild(replyBtn);
  el.appendChild(actions);

  if(node.children && node.children.length){
    const childWrap = document.createElement('div'); childWrap.className='comments'; childWrap.style.marginTop='8px';
    node.children.forEach(c=> childWrap.appendChild(renderCommentNode(c, post)));
    el.appendChild(childWrap);
  }

  return el;
}

function createCommentBox(postId, parentId){
  const wrap = document.createElement('div'); wrap.style.marginTop='8px';
  wrap.innerHTML = `
    <input class="c-nick" placeholder="seu nick" />
    <textarea class="c-content" rows="2" placeholder="Escreva um comentário..."></textarea>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
      <button class="c-cancel">Cancelar</button>
      <button class="c-send">Enviar</button>
    </div>
    <p class="c-error error" style="display:none"></p>
  `;
  const nickEl = wrap.querySelector('.c-nick');
  const contentEl = wrap.querySelector('.c-content');
  const cancelBtn = wrap.querySelector('.c-cancel');
  const sendBtn = wrap.querySelector('.c-send');
  const err = wrap.querySelector('.c-error');

  cancelBtn.onclick = ()=>{ wrap.remove(); };
  sendBtn.onclick = async ()=>{
    const nick = nickEl.value.trim();
    const content = contentEl.value.trim();
    if(!nick || !content){ err.style.display='block'; err.textContent='Preencha nick e comentário'; return; }
    err.style.display='none';
    try{
      const allowed = await validateNickForIP(nick, currentIP);
      if(!allowed){ err.style.display='block'; err.textContent='Este nick está sendo usado por outro IP.'; return; }

      const newComment = { postId, parentId: parentId || null, nick, content, createdAt: Date.now(), ip: currentIP };

      if(IS_DEMO){
        const post = STATE.posts.find(p=>p.id===postId);
        if(!post.comments) post.comments = [];
        newComment.id = 'c'+Math.random().toString(36).slice(2,9);
        post.comments.push(newComment);
        STATE.usedNicks[nick] = currentIP;
        saveDemo(STATE);
        renderPosts();
        return;
      }

      await apiFetch('/comments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newComment)});
      const posts = await apiFetch('/posts'); STATE.posts = posts; renderPosts();

    }catch(e){
      console.error(e);
      err.style.display='block'; err.textContent='Erro ao validar/enviar. (modo demo ativado se backend offline)';
    }
  };

  return wrap;
}

async function validateNickForIP(nick, ip){
  try{
    const res = await apiFetch('/validate-nick',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick, ip})});
    return !!res.allowed;
  }catch(e){
    const used = STATE.usedNicks[nick];
    if(!used) return true;
    return used === ip;
  }
}

// modal events
document.getElementById('createBtn').addEventListener('click', ()=>{ document.getElementById('modal').style.display='flex'; });
document.getElementById('cancelPost').addEventListener('click', ()=>{ document.getElementById('modal').style.display='none'; });

document.getElementById('submitPost').addEventListener('click', async ()=>{
  const nick = document.getElementById('postNick').value.trim();
  const topic = document.getElementById('postTopic').value;
  const content = document.getElementById('postContent').value.trim();
  const errEl = document.getElementById('postError'); errEl.style.display='none';
  if(!nick || !topic || !content){ errEl.style.display='block'; errEl.textContent='Preencha todos os campos'; return; }

  try{
    const allowed = await validateNickForIP(nick, currentIP);
    if(!allowed){ errEl.style.display='block'; errEl.textContent='Este nick já foi usado por outro IP.'; return; }

    const payload = { nick, topic, content, ip: currentIP, createdAt: Date.now() };
    if(IS_DEMO){
      payload.id = 'p'+Math.random().toString(36).slice(2,9);
      payload.comments = [];
      STATE.posts.unshift(payload);
      STATE.usedNicks[nick] = currentIP;
      saveDemo(STATE);
      document.getElementById('modal').style.display='none';
      renderPosts();
      return;
    }

    await apiFetch('/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const posts = await apiFetch('/posts'); STATE.posts = posts; renderPosts();
    document.getElementById('modal').style.display='none';

  }catch(e){
    console.error(e);
    errEl.style.display='block'; errEl.textContent='Erro ao criar post (backend indisponível)';
  }
});

// dev helper: seed demo data
window._seedDemo = function(){
  STATE.posts = [
    { id:'p1', nick:'maciel', topic:'Jogos', content:'Fala galera, alguem jogando?', createdAt:Date.now()-1000*60*60, comments:[
      {id:'c1', parentId:null, nick:'amigo', content:'To sim!', createdAt:Date.now()-1000*60*50},
      {id:'c2', parentId:'c1', nick:'maciel', content:'Bora uma partida?', createdAt:Date.now()-1000*60*40}
    ] }
  ];
  STATE.usedNicks = { maciel: currentIP, amigo: 'local-xyz' };
  saveDemo(STATE); renderPosts();
};
