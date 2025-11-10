const modal = document.getElementById("modal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");
const saveBtn = document.getElementById("savePostBtn");
const postsDiv = document.getElementById("posts");

// Abrir modal
openBtn.onclick = () => {
    modal.classList.remove("hidden");
};

// Fechar modal
closeBtn.onclick = () => {
    modal.classList.add("hidden");
};

// Salvar post
saveBtn.onclick = async () => {
    const nick = document.getElementById("nick").value;
    const topic = document.getElementById("topic").value;
    const text = document.getElementById("text").value;

    if (!nick || !topic || !text) {
        alert("Preencha tudo!");
        return;
    }

    // ✅ Mostra no site (somente exibição)
    addPost({ nick, topic, text });

    // ✅ FECHA MODAL
    modal.classList.add("hidden");

    // ✅ Aqui você chama o backend
    /*
    await fetch("/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nick, topic, text })
    });
    */
};

// Exibir post
function addPost(data) {
    const div = document.createElement("div");
    div.innerHTML = `
        <p><b>${data.topic}</b> — ${data.nick}</p>
        <p>${data.text}</p>
        <hr>
    `;
    postsDiv.prepend(div);
}