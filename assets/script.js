// script.js - versão corrigida: modal inicia fechado, botão fechar funciona, comentários funcionam e proteção contra spam
document.addEventListener('DOMContentLoaded', () => {
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
  let lastPostTime = 0; // anti-spam
  const MIN_POST_INTERVAL = 2000; // 2s between clicks
  const DUPLICATE_BLOCK_MS = 30 * 1000; // bloqueia posts idênticos por 30s

  // inicializa modais fechados
  modal.classList.add('hidden');
  modalC.classList.add('hidden');

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
      p.comments = p.comments || [];
      const div = document.createElement("div");
      div.className = "card";

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = `${p.nick} — ${p.topic}`;

      const content = document.createElement('div');
      content.className = 'content';
      content.textContent = p.text;

      const commentBtn = document.createElement('button');
      commentBtn.className = 'btn';
      commentBtn.textContent = 'Comentar';
      commentBtn.addEventListener('click', () => openComment(index));

      const commentsWrap = document.createElement('div');
      commentsWrap.className = 'comments';
      p.comments.forEach(c => {
        const cDiv = document.createElement('div');
        cDiv.className = 'comment';
        cDiv.innerHTML = `<b>${escapeHtml(c.nick)}</b>: ${escapeHtml(c.text)}`;
        commentsWrap.appendChild(cDiv);
      });

      div.appendChild(meta);
      div.appendChild(content);
      div.appendChild(commentBtn);
      div.appendChild(commentsWrap);
      postList.appendChild(div);
    });
  }

  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]; }); }

  // eventos modal criar
  btnNew.addEventListener('click', ()=> modal.classList.remove('hidden'));
  closeBtn.addEventListener('click', ()=> modal.classList.add('hidden'));

  saveBtn.addEventListener('click', ()=>{
    const nick = document.getElementById("nick").value.trim();
    const topic = document.getElementById("topic").value.trim();
    const text = document.getElementById("text").value.trim();
    if(!nick || !topic || !text) return alert('Preencha todos os campos');

    const now = Date.now();
    if(now - lastPostTime < MIN_POST_INTERVAL) return alert('Aguarde um instante antes de postar novamente');

    // checar duplicate recente
    const posts = JSON.parse(localStorage.getItem("posts") || "[]");
    const recentSame = posts.find(p => p.nick === nick && p.topic === topic && p.text === text && (now - p.created) < DUPLICATE_BLOCK_MS);
    if(recentSame) return alert('Você acabou de publicar um post igual. Espere um pouco.');

    lastPostTime = now;
    savePost({ nick, topic, text, comments:[], created: now });
    modal.classList.add('hidden');
    // limpa campos
    document.getElementById("nick").value = '';
    document.getElementById("topic").value = '';
    document.getElementById("text").value = '';
    loadPosts();
  });

  // comentários
  function openComment(idx){
    currentPostId = idx;
    // preenche nick se possível
    const posts = JSON.parse(localStorage.getItem("posts") || "[]");
    const existing = posts[idx];
    if(existing && existing.lastCommentNick) document.getElementById('commentNick').value = existing.lastCommentNick;
    else document.getElementById('commentNick').value = '';
    document.getElementById('commentText').value = '';
    modalC.classList.remove('hidden');
  }

  cCloseBtn.addEventListener('click', ()=> modalC.classList.add('hidden'));

  cSaveBtn.addEventListener('click', ()=>{
    const nick = document.getElementById('commentNick').value.trim();
    const text = document.getElementById('commentText').value.trim();
    if(!nick || !text) return alert('Preencha nick e comentário');

    let posts = JSON.parse(localStorage.getItem("posts") || "[]");
    if(typeof currentPostId !== 'number' || !posts[currentPostId]) return alert('Post inválido');

    posts[currentPostId].comments = posts[currentPostId].comments || [];
    posts[currentPostId].comments.push({ nick, text });
    posts[currentPostId].lastCommentNick = nick;
    localStorage.setItem('posts', JSON.stringify(posts));

    modalC.classList.add('hidden');
    loadPosts();
  });

  filterTopic.addEventListener('change', ()=>{
    const topic = filterTopic.value;
    const posts = JSON.parse(localStorage.getItem("posts") || "[]");
    const filtered = topic ? posts.filter(p=>p.topic === topic) : posts;
    renderPosts(filtered);
  });

  // inicializar
  loadPosts();
});