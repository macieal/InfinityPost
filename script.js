const btnNew = document.getElementById("btn-new");
const modal = document.getElementById("modal");
const saveBtn = document.getElementById("save");
const closeBtn = document.getElementById("close");
const postList = document.getElementById("post-list");

function getPosts() {
  return JSON.parse(localStorage.getItem("posts") || "[]");
}

function savePosts(posts) {
  localStorage.setItem("posts", JSON.stringify(posts));
}

function render() {
  const posts = getPosts();
  postList.innerHTML = "";

  posts.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `<h3>${p.nick} — ${p.topic}</h3><p>${p.text}</p>`;
    postList.appendChild(div);
  });
}

btnNew.onclick = () => {
  modal.classList.remove("hidden");
};

closeBtn.onclick = () => {
  modal.classList.add("hidden");
};

saveBtn.onclick = () => {
  const nick = document.getElementById("nick").value;
  const topic = document.getElementById("topic").value;
  const text = document.getElementById("text").value;

  if (!nick || !topic || !text) return alert("Preencha tudo!");

  const posts = getPosts();
  posts.push({ nick, topic, text });
  savePosts(posts);
  render();
  modal.classList.add("hidden");
};

render();