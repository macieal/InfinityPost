async function loadPosts() {
    const res = await fetch("/posts");
    const data = await res.json();

    const area = document.getElementById("posts");
    area.innerHTML = "";

    data.forEach(p => {
        const box = document.createElement("div");
        box.className = "post";
        box.innerHTML = `
            <h3>${p.topic}</h3>
            <span>por ${p.nick}</span>
            <p>${p.text}</p>
        `;
        area.appendChild(box);
    });
}

async function sendPost() {
    const nick = document.getElementById("nick").value;
    const topic = document.getElementById("topic").value;
    const text = document.getElementById("text").value;

    await fetch("/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nick, topic, text })
    });

    loadPosts();
}

loadPosts();