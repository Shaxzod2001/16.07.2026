// DevCircle — login page

renderAuthArea();

const form = document.getElementById("login-form");
const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const formError = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");

function clearErrors() {
  emailError.hidden = true;
  passwordError.hidden = true;
  formError.hidden = true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const email = emailField.value.trim();
  const password = passwordField.value;

  let hasError = false;
  if (!email) {
    emailError.textContent = "Elektron pochtangizni kiriting.";
    emailError.hidden = false;
    hasError = true;
  }
  if (!password) {
    passwordError.textContent = "Parolingizni kiriting.";
    passwordError.hidden = false;
    hasError = true;
  }
  if (hasError) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Kirilmoqda...";

  const { ok, status, data } = await Api.login(email, password);

  submitBtn.disabled = false;
  submitBtn.textContent = "Kirish";

  if (ok && data && data.success) {
    window.location.href = "index.html";
    return;
  }

  if (status === 401) {
    formError.textContent = (data && data.error) || "Elektron pochta yoki parol noto'g'ri.";
  } else {
    formError.textContent = (data && data.error) || "Kirib bo'lmadi. Qayta urinib ko'ring.";
  }
  formError.hidden = false;
});
