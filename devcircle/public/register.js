// DevCircle — register page

renderAuthArea();

const form = document.getElementById("register-form");
const usernameField = document.getElementById("username");
const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");
const usernameError = document.getElementById("username-error");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const formError = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");

function clearErrors() {
  usernameError.hidden = true;
  emailError.hidden = true;
  passwordError.hidden = true;
  formError.hidden = true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const username = usernameField.value.trim();
  const email = emailField.value.trim();
  const password = passwordField.value;

  let hasError = false;
  if (!username) {
    usernameError.textContent = "Foydalanuvchi nomini kiriting.";
    usernameError.hidden = false;
    hasError = true;
  } else if (username.length < 3) {
    usernameError.textContent = "Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak.";
    usernameError.hidden = false;
    hasError = true;
  }

  if (!email) {
    emailError.textContent = "Elektron pochtangizni kiriting.";
    emailError.hidden = false;
    hasError = true;
  }

  if (!password) {
    passwordError.textContent = "Parol kiriting.";
    passwordError.hidden = false;
    hasError = true;
  } else if (password.length < 6) {
    passwordError.textContent = "Parol kamida 6 ta belgidan iborat bo'lishi kerak.";
    passwordError.hidden = false;
    hasError = true;
  }

  if (hasError) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Yuborilmoqda...";

  const { ok, status, data } = await Api.register(username, email, password);

  submitBtn.disabled = false;
  submitBtn.textContent = "Ro'yxatdan o'tish";

  if (ok && data && data.success) {
    window.location.href = "index.html";
    return;
  }

  if (status === 409) {
    formError.textContent = (data && data.error) || "Bu foydalanuvchi nomi yoki elektron pochta allaqachon band.";
  } else {
    formError.textContent = (data && data.error) || "Ro'yxatdan o'tib bo'lmadi. Qayta urinib ko'ring.";
  }
  formError.hidden = false;
});
