const postList = document.getElementById("post-list");
const btnNew = document.getElementById("btn-new");
const filterTopic = document.getElementById("filterTopic");
const modal = document.getElementById("modal");
const saveBtn = document.getElementById("save");
const closeBtn = document.getElementById("close");
const modalC = document.getElementById("modal-comment");
const cSaveBtn = document.getElementById("commentSave");
const cCloseBtn = document.getElementById("commentClose");

let currentPostId = null;

function loadPosts(){
  cleanupExpired();
  const posts = JSON.parse(localStorage.getItem("posts") || "[]");
  renderPosts(posts);
}

function cleanupExpired(){
  let posts = JSON.parse(localStorage.getItem("posts") || "[]");
  const now = Date.now();
  posts = posts.filter(p => now - p.created < 86400000);
  localStorage.setItem("posts", JSON.stringify(posts));
}

function savePost(post){
  let posts = JSON.parse(localStorage.getItem("posts") || "[]");
  posts.unshift(post);
  localStorage.setItem("posts", JSON.stringify(posts));
}

function renderPosts(posts){
  postList.innerHTML = "";
  posts.forEach((p, index)=>{
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="meta">${p.nick} — ${p.topic}</div>
      <div class="content">${p.text}</div>
      <button class="btn" onclick="openComment(${index})">Comentar</button>
      <div class="comments">${p.comments.map(c=>`<div class='comment'><b>${c.nick}</b>: ${c.text}</div>`).join("")}</div>
    `;
    postList.appendChild(div);
  });
}

btnNew.onclick = ()=> modal.classList.remove("hidden");
closeBtn.onclick = ()=> modal.classList.add("hidden");

saveBtn.onclick = ()=>{
  const nick = document.getElementById("nick").value;
  const topic = document.getElementById("topic").value;
  const text = document.getElementById("text").value;
  if(!nick || !topic || !text) return;
  savePost({ nick, topic, text, comments:[], created:Date.now() });
  modal.classList.add("hidden");
  loadPosts();
};

function openComment(idx){
  currentPostId = idx;
  modalC.classList.remove("hidden");
}

cCloseBtn.onclick = ()=> modalC.classList.add("hidden");

cSaveBtn.onclick = ()=>{
  const nick = document.getElementById("commentNick").value;
  const text = document.getElementById("commentText").value;
  if(!nick || !text) return;
  let posts = JSON.parse(localStorage.getItem("posts") || "[]");
  posts[currentPostId].comments.push({ nick, text });
  localStorage.setItem("posts", JSON.stringify(posts));
  modalC.classList.add("hidden");
  loadPosts();
};

loadPosts();