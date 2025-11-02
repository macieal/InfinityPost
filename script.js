const SUPABASE_URL = "https://ryjwocfnfcwimwbgecnp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5andvY2ZuZmN3aW13YmdlY25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMzI2OTMsImV4cCI6MjA3NzYwODY5M30.MQjhu19bGzwpTWogfNwqTCWPs4-N95iORwlaJ0p-BX0";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const btnNew = document.getElementById("btn-new");
const modal = document.getElementById("modal");
const saveBtn = document.getElementById("save");
const closeBtn = document.getElementById("close");

const modalC = document.getElementById("modal-comment");
const cSaveBtn = document.getElementById("commentSave");
const cCloseBtn = document.getElementById("commentClose");

const postList = document.getElementById("post-list");
let currentPostId = null;

async function getPosts() {
  const { data } = await client.from("posts").select();
  return data || [];
}

async function getComments(postId) {
  const { data } = await client.from("comments").select().eq("post_id", postId);
  return data || [];
}

async function addPost(p) {
  await client.from("posts").insert(p);
}

async function addComment(c) {
  await client.from("comments").insert(c);
}

async function render() {
  const posts = await getPosts();
  postList.innerHTML = "";

  for (const p of posts) {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `
      <h3>${p.nick} — ${p.topic}</h3>
      <p>${p.text}</p>
      <button data-id="${p.id}" class="btn-comment">Comentar</button>
      <div id="c-${p.id}"></div>
    `;
    postList.appendChild(div);

    const comments = await getComments(p.id);
    const cBox = div.querySelector(`#c-${p.id}`);

    comments.forEach((c) => {
      const cDiv = document.createElement("div");
      cDiv.className = "comment";
      cDiv.innerHTML = `<b>${c.nick}</b>: ${c.text}`;
      cBox.appendChild(cDiv);
    });
  }

  document.querySelectorAll(".btn-comment").forEach((btn) => {
    btn.onclick = () => {
      currentPostId = btn.dataset.id;
      modalC.classList.remove("hidden");
    };
  });
}

btnNew.onclick = () => modal.classList.remove("hidden");
closeBtn.onclick = () => modal.classList.add("hidden");
cCloseBtn.onclick = () => modalC.classList.add("hidden");

saveBtn.onclick = async () => {
  const nick = document.getElementById("nick").value;
  const topic = document.getElementById("topic").value;
  const text = document.getElementById("text").value;

  if (!nick || !topic || !text) return alert("Preencha tudo!");

  await addPost({ nick, topic, text });
  await render();
  modal.classList.add("hidden");
};

cSaveBtn.onclick = async () => {
  const nick = document.getElementById("commentNick").value;
  const text = document.getElementById("commentText").value;
  if (!nick || !text) return alert("Preencha tudo!");

  await addComment({ nick, text, post_id: currentPostId });
  await render();
  modalC.classList.add("hidden");
};

render();