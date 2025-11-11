const postList = document.getElementById("post-list");
const btnNew = document.getElementById("btn-new");
const filterTopic = document.getElementById("filterTopic");
const modal = document.getElementById("modal");
const modalC = document.getElementById("modal-comment");
const saveBtn = document.getElementById("save");
const closeBtn = document.getElementById("close");
const cSaveBtn = document.getElementById("commentSave");
const cCloseBtn = document.getElementById("commentClose");

let currentPostId = null;
const EXPIRATION = 86400000;

function getPosts(){return JSON.parse(localStorage.getItem("posts")||"[]")}
function setPosts(p){localStorage.setItem("posts",JSON.stringify(p))}

function cleanup(){
  const now = Date.now();
  setPosts(getPosts().filter(p=>now-p.created < EXPIRATION));
}

function render(posts){
  postList.innerHTML = "";
  posts.forEach((p,i)=>{
    const card = document.createElement("div");
    card.className="card";

    card.innerHTML = `
      <div class="meta">${p.nick} — ${p.topic}</div>
      <div class="content">${escape(p.text)}</div>
      <button class="btn" data-id="${i}">Comentar</button>
      <div class="comments"></div>
    `;

    const commentsWrap = card.querySelector('.comments');
    p.comments.forEach(c=>{
      const el=document.createElement('div');
      el.className='comment';
      el.innerHTML = `<b>${escape(c.nick)}</b>: ${escape(c.text)}`;
      commentsWrap.appendChild(el);
    });

    card.querySelector('button').onclick = ()=>openComment(i);
    postList.appendChild(card);
  })
}

function escape(s){return String(s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]))}

function load(){cleanup();render(getPosts());updateTopics();}

function updateTopics(){
  const topics=[...new Set(getPosts().map(p=>p.topic))];
  filterTopic.innerHTML = `<option value="">Todos</option>` + topics.map(t=>`<option>${t}</option>`).join("");
}

btnNew.onclick=()=>modal.classList.remove("hidden");
closeBtn.onclick=()=>modal.classList.add("hidden");

saveBtn.onclick=()=>{
  const nick=document.getElementById("nick").value.trim();
  const topic=document.getElementById("topic").value.trim();
  const text=document.getElementById("text").value.trim();
  if(!nick||!topic||!text)return alert("Preencha tudo!");
  const posts=getPosts();
  posts.unshift({nick,topic,text,comments:[],created:Date.now()});
  setPosts(posts);
  modal.classList.add("hidden");
  load();
}

function openComment(i){
  currentPostId=i;
  modalC.classList.remove("hidden");
}

cCloseBtn.onclick=()=>modalC.classList.add("hidden");

cSaveBtn.onclick=()=>{
  const nick=document.getElementById('commentNick').value.trim();
  const text=document.getElementById('commentText').value.trim();
  if(!nick||!text)return alert("Preencha tudo!");
  const posts=getPosts();
  posts[currentPostId].comments.push({nick,text});
  setPosts(posts);
  modalC.classList.add("hidden");
  load();
}

filterTopic.onchange=()=>{
  const t=filterTopic.value;
  const p=getPosts();
  render(t? p.filter(x=>x.topic===t):p);
}

load();