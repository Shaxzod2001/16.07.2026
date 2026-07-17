// DevCircle — shared API helper
// Thin fetch wrapper: always sends the session cookie and returns
// parsed JSON alongside the HTTP status, so callers can branch on
// both without juggling try/catch everywhere.

const Api = (() => {
  async function request(path, { method = "GET", body } = {}) {
    let res;
    try {
      res = await fetch(path, {
        method,
        credentials: "same-origin",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr) {
      return {
        ok: false,
        status: 0,
        data: { success: false, error: "Server bilan aloqa yo'q. Internetni tekshiring." },
      };
    }

    let data = null;
    try {
      data = await res.json();
    } catch (parseErr) {
      data = null;
    }

    return { ok: res.ok, status: res.status, data };
  }

  return {
    me: () => request("/api/me"),
    register: (username, email, password) =>
      request("/api/register", { method: "POST", body: { username, email, password } }),
    login: (email, password) =>
      request("/api/login", { method: "POST", body: { email, password } }),
    logout: () => request("/api/logout", { method: "POST" }),
    getPosts: () => request("/api/posts"),
    createPost: (title, body) =>
      request("/api/posts", { method: "POST", body: { title, body } }),
    getPost: (id) => request(`/api/posts/${encodeURIComponent(id)}`),
    addComment: (id, body) =>
      request(`/api/posts/${encodeURIComponent(id)}/comments`, { method: "POST", body: { body } }),
    getUser: (username) => request(`/api/users/${encodeURIComponent(username)}`),
  };
})();

// ---------- Shared nav rendering ----------
// Every page includes a <div id="auth-area"></div> inside its header nav.
// This fills it in based on session state from /api/me.

async function renderAuthArea() {
  const el = document.getElementById("auth-area");
  if (!el) return;

  const { data } = await Api.me();
  const user = data && data.user;

  if (user) {
    el.innerHTML = "";

    const greeting = document.createElement("span");
    greeting.className = "greeting";
    greeting.appendChild(document.createTextNode("Salom, "));

    const profileLink = document.createElement("a");
    profileLink.href = `profile.html?username=${encodeURIComponent(user.username)}`;
    profileLink.textContent = user.username;
    profileLink.setAttribute("aria-label", `${user.username} profili`);
    greeting.appendChild(profileLink);

    const logoutBtn = document.createElement("button");
    logoutBtn.type = "button";
    logoutBtn.className = "nav-link-btn";
    logoutBtn.textContent = "Chiqish";
    logoutBtn.addEventListener("click", async () => {
      logoutBtn.disabled = true;
      await Api.logout();
      window.location.href = "index.html";
    });

    el.appendChild(greeting);
    el.appendChild(logoutBtn);
  } else {
    el.innerHTML = "";
    const loginLink = document.createElement("a");
    loginLink.href = "login.html";
    loginLink.textContent = "Kirish";

    const registerLink = document.createElement("a");
    registerLink.href = "register.html";
    registerLink.textContent = "Ro'yxatdan o'tish";

    el.appendChild(loginLink);
    el.appendChild(registerLink);
  }

  document.dispatchEvent(new CustomEvent("devcircle:auth", { detail: { user } }));
  return user;
}

// ---------- Small shared utilities ----------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Renders plain-text post/comment bodies as paragraphs (blank line = new
// paragraph, single newline = line break), with minimal support for
// `inline code` and ```code blocks``` so the code tokens in the design
// spec get used without requiring a full markdown parser.
function renderBody(text) {
  if (!text) return "";
  const blocks = String(text).split(/```/);
  let html = "";
  blocks.forEach((chunk, i) => {
    if (i % 2 === 1) {
      // fenced code block
      const cleaned = chunk.replace(/^\n/, "").replace(/\n$/, "");
      html += `<pre class="code-block"><code>${escapeHtml(cleaned)}</code></pre>`;
    } else {
      const paragraphs = chunk.split(/\n{2,}/).filter((p) => p.trim() !== "");
      paragraphs.forEach((p) => {
        const withInlineCode = escapeHtml(p)
          .replace(/`([^`\n]+)`/g, "<code>$1</code>")
          .replace(/\n/g, "<br>");
        html += `<p>${withInlineCode}</p>`;
      });
    }
  });
  return html;
}

function timeAgo(isoString) {
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return "";
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  const units = [
    ["yil", 31536000],
    ["oy", 2592000],
    ["hafta", 604800],
    ["kun", 86400],
    ["soat", 3600],
    ["daqiqa", 60],
  ];

  for (const [label, secs] of units) {
    const value = Math.floor(diffSec / secs);
    if (value >= 1) return `${value} ${label} oldin`;
  }
  return "hozirgina";
}

function formatDate(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });
}
