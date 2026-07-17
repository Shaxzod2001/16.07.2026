// DevCircle — new post page

const form = document.getElementById("new-post-form");
const titleField = document.getElementById("title");
const bodyField = document.getElementById("body");
const titleError = document.getElementById("title-error");
const bodyError = document.getElementById("body-error");
const formError = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");

function clearErrors() {
  titleError.hidden = true;
  bodyError.hidden = true;
  formError.hidden = true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const title = titleField.value.trim();
  const body = bodyField.value.trim();

  let hasError = false;
  if (!title) {
    titleError.textContent = "Sarlavha kiriting.";
    titleError.hidden = false;
    hasError = true;
  }
  if (!body) {
    bodyError.textContent = "Post matnini kiriting.";
    bodyError.hidden = false;
    hasError = true;
  }
  if (hasError) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Nashr qilinmoqda...";

  const { ok, status, data } = await Api.createPost(title, body);

  submitBtn.disabled = false;
  submitBtn.textContent = "Nashr qilish";

  if (ok && data && data.success && data.post) {
    window.location.href = `post.html?id=${encodeURIComponent(data.post.id)}`;
    return;
  }

  if (status === 401) {
    window.location.href = "login.html";
    return;
  }

  formError.textContent = (data && data.error) || "Post nashr qilinmadi. Qayta urinib ko'ring.";
  formError.hidden = false;
});

(async () => {
  const user = await renderAuthArea();
  if (!user) {
    window.location.href = "login.html";
  }
})();
