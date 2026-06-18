# Secure Backend and Glassmorphism UI Enhancements

## Goal Description

Add robust security to the Express backend (HTTPS enforcement, CSRF protection, strict CSP, JWT authentication, secure cookies) and redesign the frontend using a curated color palette, glass‑morphism components with pill‑shaped transparent elements, smooth transitions, micro‑interactions, and a dark‑mode toggle.

## User Review Required

[!IMPORTANT]
- The backend will gain a new `auth.js` middleware providing JWT generation and verification. A new login route will issue a HttpOnly, Secure cookie. All protected API endpoints will require this token.
- HTTPS redirection will be enabled when the `HTTPS` environment variable is set to `true` (production). For local development you can run without TLS.
- The UI will switch to a dark‑mode toggle (default light with toggle) and use a curated palette (see `style.css` updates). Glass‑morphism classes (`.glass`) will be applied to cards, sections, and forms, with pill‑shaped inputs/buttons.
- If any existing routes or pages rely on session‑based auth, they will be updated to use the new JWT flow.

## Open Questions

- None (all previous questions have been answered).

## Proposed Changes

---
### Backend Enhancements

#### [MODIFY] server.js
- Insert HTTPS redirect middleware early in the request chain (enabled when `process.env.HTTPS === 'true'`).
- Update `cookieParser()` to use `{ secure: true, httpOnly: true, sameSite: 'strict' }`.
- Apply `csurf` middleware globally for state‑changing routes.
- Import and use `authMiddleware.verifyToken` on any routes that need protection (e.g., `/api/secure/*`).

#### [NEW] middleware/auth.js
```js
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'change-me-please';

function signToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function verifyToken(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }
}

module.exports = { signToken, verifyToken };
```

#### [MODIFY] authRouter (create if missing)
- POST `/login` validates credentials (placeholder logic) then sets a cookie:
```js
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // TODO: replace with real user lookup
  if (email === 'demo@example.com' && password === 'demo') {
    const token = signToken({ email });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7*24*60*60*1000 });
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});
```
- Add logout route to clear the cookie.

#### [NEW] .env.example
```
PORT=3000
NODE_ENV=development
HTTPS=false
JWT_SECRET=your-very-secret-key
```

---
### Frontend UI Redesign

#### [MODIFY] public/style.css
- Introduce CSS variables for the curated palette (already present – we will keep the existing system).
- Add `.glass` component:
```css
.glass {
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-color);
  transition: background var(--transition-speed), transform var(--transition-speed), box-shadow var(--transition-speed);
}
.glass:hover {
  background: rgba(255,255,255,0.18);
  transform: scale(1.02);
  box-shadow: var(--shadow-md);
}
```
- Update buttons to use `.btn-pill` and `.glass` as needed.
- Ensure inputs have `border-radius: var(--radius-pill);`.
- Add dark‑mode toggle script (`public/animations.js`) to toggle `document.body.classList.toggle('dark-theme')`.
- Load Google Font **Outfit** at the top of `style.css` via `@import`.

#### [MODIFY] HTML files (index.html, blog.html, login.html, admin.html)
- Replace existing container classes with `<section class="glass card">` where appropriate (hero, project cards, skill boxes, timeline items).
- Add `class="btn btn-primary btn-pill glass"` to primary CTA buttons.
- Insert a theme toggle button in the header:
```html
<button class="theme-toggle" id="themeBtn">
  <svg class="sun-icon" ...></svg>
  <svg class="moon-icon" ...></svg>
</button>
```
- Reference the new `animations.js` script at the end of the body.

#### [NEW] public/animations.js
```js
// Theme toggle
const themeBtn = document.getElementById('themeBtn');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
  });
}

// Simple ripple effect for .glass buttons
document.addEventListener('click', e => {
  const target = e.target.closest('.glass');
  if (!target) return;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const rect = target.getBoundingClientRect();
  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top = `${e.clientY - rect.top}px`;
  target.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

/* Add CSS for ripple via JS injection (or place in style.css) */
const style = document.createElement('style');
style.textContent = `
.glass { position: relative; overflow: hidden; }
.ripple {
  position: absolute;
  width: 20px; height: 20px;
  background: rgba(255,255,255,0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ripple-effect 0.6s linear;
}
@keyframes ripple-effect {
  from { opacity: 0.6; transform: scale(1); }
  to { opacity: 0; transform: scale(10); }
}
`;
document.head.appendChild(style);
```

---
## Verification Plan

### Automated
- Run `npm test` (if tests exist) after changes.
- Use `npm run lint` to ensure no style errors.
- Start server (`npm start`) and issue a curl request to a protected endpoint without a token → expect 401.
- Issue a login POST, capture the `token` cookie, then request the protected endpoint → expect 200.

### Manual
- Open `http://localhost:3000` and verify the glass‑morphism cards, pill‑shaped buttons, and smooth hover effects.
- Toggle the theme button and confirm dark mode styles apply.
- Test the login page, submit demo credentials (`demo@example.com` / `demo`) and observe a secure cookie being set (HttpOnly, Secure when HTTPS true).
- Verify HTTPS redirect when `HTTPS=true` in `.env` (use a self‑signed cert for local testing if desired).

---
**Proceed?**
- Please confirm to start applying these changes.
