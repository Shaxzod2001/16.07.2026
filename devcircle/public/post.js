// DevCircle — post detail page

function getPostId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function renderComments(comments) {
  const status = document.getElementById("comments-status");
  const list = document.getElementById("comment-list");

  if (!comments || comments.length === 0) {
    status.textContent = "Hozircha izohlar yo'q. Birinchi bo'lib fikr bildiring.";
    status.hidden = false;
    list.hidden = true;
    return;
  }

  status.hidden = true;
  list.hidden = false;
  list.innerHTML = "";

  comments.forEach((comment) => {
    const li = document.createElement("li");
    li.className = "comment-item";

    const meta = document.createElement("p");
    meta.className = "comment-meta";
    const authorStrong = document.createElement("strong");
    authorStrong.textContent = comment.author;
    meta.appendChild(authorStrong);
    meta.appendChild(document.createTextNode(` · ${timeAgo(comment.createdAt)}`));

    const body = document.createElement("p");
    body.className = "comment-body";
    body.textContent = comment.body;

    li.appendChild(meta);
    li.appendChild(body);
    list.appendChild(li);
  });
}

async function loadPost(id) {
  const status = document.getElementById("post-status");
  const article = document.getElementById("post-article");
  const commentsSection = document.getElementById("comments-section");

  const { ok, status: httpStatus, data } = await Api.getPost(id);

  if (httpStatus === 404 || !data || !data.post) {
    status.textContent = "Bu post topilmadi.";
    status.classList.add("is-error");
    return;
  }

  if (!ok) {
    status.textContent = "Postni yuklab bo'lmadi. Sahifani yangilab ko'ring.";
    status.classList.add("is-error");
    return;
  }

  const { post, comments } = data;

  document.title = `${post.title} — DevCircle`;
  document.getElementById("post-title").textContent = post.title;
  document.getElementById("post-meta").textContent =
    `${post.author} · ${formatDate(post.createdAt)}`;
  document.getElementById("post-body").innerHTML = renderBody(post.body);

  status.hidden = true;
  article.hidden = false;
  commentsSection.hidden = false;

  renderComments(comments);
}

function setupCommentForm(postId, user) {
  const form = document.getElementById("comment-form");
  const prompt = document.getElementById("login-prompt");

  if (!user) {
    form.hidden = true;
    prompt.hidden = false;
    return;
  }

  prompt.hidden = true;
  form.hidden = false;

  const bodyField = document.getElementById("comment-body");
  const bodyError = document.getElementById("comment-body-error");
  const formError = document.getElementById("comment-form-error");
  const submitBtn = document.getElementById("comment-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    bodyError.hidden = true;
    formError.hidden = true;

    const body = bodyField.value.trim();
    if (!body) {
      bodyError.textContent = "Izoh matnini kiriting.";
      bodyError.hidden = false;
      bodyField.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Yuborilmoqda...";

    const { ok, status, data } = await Api.addComment(postId, body);

    submitBtn.disabled = false;
    submitBtn.textContent = "Izoh qoldirish";

    if (ok && data && data.success !== false) {
      bodyField.value = "";
      await loadPost(postId);
    } else if (status === 401) {
      formError.textContent = "Izoh qoldirish uchun tizimga kiring.";
      formError.hidden = false;
    } else {
      formError.textContent = (data && data.error) || "Izoh yuborilmadi. Qayta urinib ko'ring.";
      formError.hidden = false;
    }
  });
}

(async () => {
  const id = getPostId();
  const status = document.getElementById("post-status");

  if (!id) {
    status.textContent = "Post topilmadi.";
    status.classList.add("is-error");
    renderAuthArea();
    return;
  }

  const [user] = await Promise.all([
    renderAuthArea(),
    loadPost(id),
  ]);

  setupCommentForm(id, user);
})();
