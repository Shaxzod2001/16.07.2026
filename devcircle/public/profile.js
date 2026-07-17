// DevCircle — profile page

function getUsername() {
  const params = new URLSearchParams(window.location.search);
  return params.get("username");
}

async function loadProfile(username) {
  const status = document.getElementById("profile-status");
  const content = document.getElementById("profile-content");

  const { ok, status: httpStatus, data } = await Api.getUser(username);

  if (httpStatus === 404 || !data || !data.user) {
    status.textContent = "Bunday foydalanuvchi topilmadi.";
    status.classList.add("is-error");
    return;
  }

  if (!ok) {
    status.textContent = "Profilni yuklab bo'lmadi. Sahifani yangilab ko'ring.";
    status.classList.add("is-error");
    return;
  }

  const { user, posts } = data;

  document.title = `${user.username} — DevCircle`;
  document.getElementById("profile-username").textContent = user.username;
  document.getElementById("profile-meta").textContent =
    `${formatDate(user.createdAt)} sanasida qo'shilgan`;

  status.hidden = true;
  content.hidden = false;

  const postsStatus = document.getElementById("profile-posts-status");
  const postsList = document.getElementById("profile-posts-list");

  if (!posts || posts.length === 0) {
    postsStatus.textContent = "Bu foydalanuvchi hali post yozmagan.";
    postsStatus.hidden = false;
    return;
  }

  postsList.innerHTML = "";
  posts.forEach((post) => {
    const li = document.createElement("li");
    li.className = "feed-row";

    const title = document.createElement("h3");
    title.className = "feed-row-title";
    const link = document.createElement("a");
    link.href = `post.html?id=${encodeURIComponent(post.id)}`;
    link.textContent = post.title;
    title.appendChild(link);

    const meta = document.createElement("p");
    meta.className = "feed-meta";
    meta.textContent = `${timeAgo(post.createdAt)} · ${post.commentCount != null ? post.commentCount : 0} izoh`;

    li.appendChild(title);
    li.appendChild(meta);
    postsList.appendChild(li);
  });
}

renderAuthArea();

(() => {
  const username = getUsername();
  const status = document.getElementById("profile-status");
  if (!username) {
    status.textContent = "Foydalanuvchi ko'rsatilmagan.";
    status.classList.add("is-error");
    return;
  }
  loadProfile(username);
})();
