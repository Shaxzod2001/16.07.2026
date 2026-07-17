const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = 3002;

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.use(express.json());

// Catch malformed JSON bodies and return a clean 400 instead of crashing.
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Malformed JSON body' });
  }
  next(err);
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'devcircle-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));

// ---------- Prepared statements ----------

const stmts = {
  insertUser: db.prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
  ),
  findUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  findUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  findUserById: db.prepare('SELECT * FROM users WHERE id = ?'),

  insertPost: db.prepare(
    'INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?)'
  ),
  findPostById: db.prepare('SELECT * FROM posts WHERE id = ?'),
  listPostsFeed: db.prepare(`
    SELECT
      posts.id AS id,
      posts.title AS title,
      users.username AS author,
      posts.created_at AS createdAt,
      (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS commentCount
    FROM posts
    JOIN users ON users.id = posts.user_id
    ORDER BY posts.created_at DESC, posts.id DESC
  `),
  listPostsByUser: db.prepare(`
    SELECT
      posts.id AS id,
      posts.title AS title,
      posts.created_at AS createdAt,
      (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS commentCount
    FROM posts
    WHERE posts.user_id = ?
    ORDER BY posts.created_at DESC, posts.id DESC
  `),
  postDetail: db.prepare(`
    SELECT posts.id AS id, posts.title AS title, posts.body AS body,
           users.username AS author, posts.created_at AS createdAt
    FROM posts JOIN users ON users.id = posts.user_id
    WHERE posts.id = ?
  `),

  insertComment: db.prepare(
    'INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)'
  ),
  listCommentsForPost: db.prepare(`
    SELECT comments.id AS id, users.username AS author, comments.body AS body,
           comments.created_at AS createdAt
    FROM comments JOIN users ON users.id = comments.user_id
    WHERE comments.post_id = ?
    ORDER BY comments.created_at ASC, comments.id ASC
  `),
};

// ---------- Helpers ----------

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, error: 'You must be logged in to do that.' });
  }
  next();
}

function trimStr(v) {
  return typeof v === 'string' ? v.trim() : v;
}

// ---------- Auth routes ----------

app.post('/api/register', (req, res) => {
  const body = req.body || {};
  const username = trimStr(body.username);
  const email = trimStr(body.email);
  const password = typeof body.password === 'string' ? body.password : undefined;

  if (!username || !USERNAME_RE.test(username)) {
    return res.status(400).json({
      success: false,
      error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores.',
    });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
  }

  const existingUsername = stmts.findUserByUsername.get(username);
  if (existingUsername) {
    return res.status(409).json({ success: false, error: 'That username is already taken.' });
  }
  const existingEmail = stmts.findUserByEmail.get(email.toLowerCase());
  if (existingEmail) {
    return res.status(409).json({ success: false, error: 'That email is already registered.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const normalizedEmail = email.toLowerCase();

  try {
    const info = stmts.insertUser.run(username, normalizedEmail, passwordHash);
    req.session.userId = info.lastInsertRowid;
    req.session.username = username;
    return res.status(201).json({
      success: true,
      user: { id: info.lastInsertRowid, username },
    });
  } catch (e) {
    if (e && e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ success: false, error: 'That username or email is already taken.' });
    }
    console.error('Register error:', e);
    return res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

app.post('/api/login', (req, res) => {
  const body = req.body || {};
  const email = trimStr(body.email);
  const password = typeof body.password === 'string' ? body.password : undefined;

  if (!email || !password) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const user = stmts.findUserByEmail.get(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  return res.status(200).json({ success: true, user: { id: user.id, username: user.username } });
});

app.post('/api/logout', (req, res) => {
  if (!req.session) {
    return res.status(200).json({ success: true });
  }
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ success: true });
  });
});

app.get('/api/me', (req, res) => {
  if (req.session && req.session.userId) {
    return res.status(200).json({ user: { id: req.session.userId, username: req.session.username } });
  }
  return res.status(200).json({ user: null });
});

// ---------- Posts routes ----------

app.get('/api/posts', (req, res) => {
  const rows = stmts.listPostsFeed.all();
  const posts = rows.map((r) => ({
    id: r.id,
    title: r.title,
    author: r.author,
    commentCount: r.commentCount,
    createdAt: r.createdAt,
  }));
  return res.status(200).json({ posts });
});

app.post('/api/posts', requireAuth, (req, res) => {
  const body = req.body || {};
  const title = trimStr(body.title);
  const postBody = trimStr(body.body);

  if (!title || title.length === 0 || title.length > 200) {
    return res.status(400).json({ success: false, error: 'Title is required and must be 200 characters or fewer.' });
  }
  if (!postBody || postBody.length === 0 || postBody.length > 20000) {
    return res.status(400).json({ success: false, error: 'Body is required and must be 20000 characters or fewer.' });
  }

  const info = stmts.insertPost.run(req.session.userId, title, postBody);
  return res.status(201).json({ success: true, post: { id: info.lastInsertRowid } });
});

app.get('/api/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: 'Post not found.' });
  }
  const post = stmts.postDetail.get(id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }
  const commentRows = stmts.listCommentsForPost.all(id);
  const comments = commentRows.map((c) => ({
    id: c.id,
    author: c.author,
    body: c.body,
    createdAt: c.createdAt,
  }));
  return res.status(200).json({
    post: { id: post.id, title: post.title, body: post.body, author: post.author, createdAt: post.createdAt },
    comments,
  });
});

app.post('/api/posts/:id/comments', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: 'Post not found.' });
  }
  const post = stmts.findPostById.get(id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const body = req.body || {};
  const commentBody = trimStr(body.body);
  if (!commentBody || commentBody.length === 0 || commentBody.length > 5000) {
    return res.status(400).json({ success: false, error: 'Comment is required and must be 5000 characters or fewer.' });
  }

  const info = stmts.insertComment.run(id, req.session.userId, commentBody);
  return res.status(201).json({ success: true, comment: { id: info.lastInsertRowid } });
});

// ---------- Users routes ----------

app.get('/api/users/:username', (req, res) => {
  const username = req.params.username;
  const user = stmts.findUserByUsername.get(username);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  const postRows = stmts.listPostsByUser.all(user.id);
  const posts = postRows.map((p) => ({
    id: p.id,
    title: p.title,
    createdAt: p.createdAt,
    commentCount: p.commentCount,
  }));
  return res.status(200).json({
    user: { username: user.username, createdAt: user.created_at },
    posts,
  });
});

// ---------- Static files ----------

app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------- Fallback error handler ----------

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
