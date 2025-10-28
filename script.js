const postsContainer = document.getElementById("posts");
const modal = document.getElementById("modal");
const postBtn = document.getElementById("postBtn");
const cancelBtn = document.getElementById("cancelBtn");
const createBtn = document.getElementById("createBtn");
const errorMsg = document.getElementById("error");

let currentIP = "";
async function getIP() {
  const res = await fetch("https://api.ipify.org?format=json");
  const data = await res.json();
  currentIP = data.ip;
}

async function fetchPosts() {
  const res = await fetch("/api/posts");
  const posts = await res.json();
  renderPosts(posts);
}

function renderPosts(posts) {
  postsContainer.innerHTML = "";
  if (posts.length === 0) {
    postsContainer.innerHTML = "<p>Nenhum post ainda.</p>";
    return;
  }

  posts.forEach((p) => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `
      <h3>${p.topic}</h3>
      <p>${p.content}</p>
      <p class="meta">por ${p.nick} • ${new Date(p.createdAt).toLocaleString()}</p>
      <div class="comments">
        ${p.comments
          .map(
            (c) =>
              `<div class='comment'><strong>${c.nick}</strong>: ${c.content}</div>`
          )
          .join("")}
        <textarea placeholder='Comente...' class='comment-input'></textarea>
        <button class='comment-btn'>Enviar</button>
      </div>
    `;

    const btn = div.querySelector(".comment-btn");
    btn.onclick = async () => {
      const content = div.querySelector(".comment-input").value.trim();
      if (!content) return;
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: p.id,
          parentId: null,
          nick: p.nick,
          content,
          ip: currentIP,
        }),
      });
      fetchPosts();
    };

    postsContainer.appendChild(div);
  });
}

createBtn.onclick = () => (modal.style.display = "flex");
cancelBtn.onclick = () => (modal.style.display = "none");

postBtn.onclick = async () => {
  const nick = document.getElementById("nick").value.trim();
  const topic = document.getElementById("topic").value.trim();
  const content = document.getElementById("content").value.trim();
  if (!nick || !topic || !content) {
    errorMsg.textContent = "Preencha todos os campos!";
    return;
  }

  const res = await fetch("/api/validate-nick", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nick, ip: currentIP }),
  });
  const { allowed } = await res.json();
  if (!allowed) {
    errorMsg.textContent = "Esse nick já é usado por outro IP!";
    return;
  }

  await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nick, topic, content, ip: currentIP }),
  });

  modal.style.display = "none";
  fetchPosts();
};

getIP().then(fetchPosts);
