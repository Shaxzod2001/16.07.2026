// DevCircle — feed page

document.addEventListener("devcircle:auth", (e) => {
  const btn = document.getElementById("new-post-btn");
  if (e.detail.user) {
    btn.hidden = false;
  } else {
    btn.hidden = true;
  }
});

async function loadFeed() {
  const status = document.getElementById("feed-status");
  const list = document.getElementById("feed-list");

  const { ok, data } = await Api.getPosts();

  if (!ok || !data || !Array.isArray(data.posts)) {
    status.textContent = "Postlarni yuklab bo'lmadi. Sahifani yangilab ko'ring.";
    status.classList.add("is-error");
    return;
  }

  const posts = data.posts;

  if (posts.length === 0) {
    status.textContent = "Hozircha postlar yo'q. Birinchi bo'lib yozing!";
    return;
  }

  status.hidden = true;
  list.hidden = false;
  list.innerHTML = "";

  posts.forEach((post) => {
    const li = document.createElement("li");
    li.className = "feed-row";

    const title = document.createElement("h2");
    title.className = "feed-row-title";
    const link = document.createElement("a");
    link.href = `post.html?id=${encodeURIComponent(post.id)}`;
    link.textContent = post.title;
    title.appendChild(link);

    const meta = document.createElement("p");
    meta.className = "feed-meta";
    meta.textContent = `${post.author} · ${timeAgo(post.createdAt)} · ${post.commentCount} izoh`;

    li.appendChild(title);
    li.appendChild(meta);
    list.appendChild(li);
  });
}

renderAuthArea();
loadFeed();
