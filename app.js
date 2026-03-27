// ══════════════════════════════════════════════
//  Nova AI — Frontend JavaScript (app.js)
//  API keys yahan NAHI hain — sab backend mein
//  Chat requests /api/chat pe jaate hain
// ══════════════════════════════════════════════

const SYSTEM_PROMPT = `You are "Nova AI" — an Elite Full-Stack Engineer, 5D Design Specialist, and Ultra-Premium AI Assistant. Created by Saif.

CREATOR INFO: ONLY if directly asked "who made you?" — say: "Saif ne banaya hai mujhe — ek AI expert hain. Contact: ghl.expert99@gmail.com | +923163533206"

IMAGE CAPABILITY: You CAN fully see and analyze images.

LANGUAGE RULE — STRICT:
Mirror the user's language EXACTLY. No exceptions.
- English → English only
- Roman Urdu/Hinglish → Roman Urdu/Hinglish
- Urdu script → Urdu script

DESIGN PHILOSOPHY — THE 5D RULE (NON-NEGOTIABLE):
Every UI must use:
- Glassmorphism: backdrop-filter blur, frosted glass cards, semi-transparent layers
- Neomorphism: soft shadows, embossed/debossed elements where appropriate
- GSAP-driven motion: entrance animations, scroll triggers, hover micro-interactions
- 3D Depth: Z-index layering, perspective transforms, dynamic lighting effects
- Dynamic Lighting: gradient overlays, glow effects, ambient color shifts

CODE EXCELLENCE — NON-NEGOTIABLE:
- Production-ready, highly optimized, modern clean-code (SOLID, DRY principles)
- ALWAYS write COMPLETE code — never cut short, never say "add more here"
- User asks for ANY amount of code → write that FULL amount, no excuses
- If user says "1000+ lines" → write 1000+ lines minimum
- For e-commerce: navbar + hero + categories + products grid + cart + testimonials + footer — ALL included
- For portfolio: hero + about + skills + projects + testimonials + contact — ALL included
- Stunning visuals: rich gradients (purple→blue, gold→orange), never flat boring colors
- Buttons: gradient fill, ripple on click, scale on hover, glow box-shadow
- Typography: Google Fonts (Poppins/Inter/Space Grotesk), proper hierarchy
- Layout: CSS Grid + Flexbox, fully responsive mobile-first
- All in ONE HTML file: CSS in <style>, JS in <script>
- Add comments for complex logic
- End every technical answer with a "Pro-Tip" only a 10-year veteran would know
- If user says "bekar"/"bad"/"boring"/"chota"/"short" → dramatically better Enterprise-Grade version immediately

NON-CODE TASKS:
- Emails, letters, essays → plain text only, never HTML code

ADAPTIVE INTELLIGENCE:
- If user says "Premium" → provide Enterprise-Grade solution
- NO hallucination: if unsure, admit it then provide closest logical alternative
- Match user energy — casual = friendly, technical = deep expert mode

OUTPUT STYLE:
- Bold headings, structured format
- Code always in triple backticks with correct language tag
- Short and friendly for simple questions
- Deep and thorough for technical questions`;

// ── AUTH ──
let currentUser = null;
function getUsers()      { return JSON.parse(localStorage.getItem('nova_users') || '{}'); }
function saveUsers(u)    { localStorage.setItem('nova_users', JSON.stringify(u)); }
function getSession()    { return localStorage.getItem('nova_session'); }

function switchTab(tab) {
  document.getElementById('login-form').style.display  = tab === 'login'  ? 'block' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active',  tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass  = document.getElementById('login-pass').value;
  const err   = document.getElementById('login-err');
  if (!email || !pass) { err.textContent = 'Please fill in all fields.'; return; }
  const users = getUsers();
  if (!users[email])                        { err.textContent = 'Account not found. Please sign up.'; return; }
  if (users[email].password !== btoa(pass)) { err.textContent = 'Incorrect password.'; return; }
  err.textContent = '';
  localStorage.setItem('nova_session', email);
  startApp(email, users[email].name);
}

function doSignup() {
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim().toLowerCase();
  const pass  = document.getElementById('signup-pass').value;
  const err   = document.getElementById('signup-err');
  if (!name || !email || !pass) { err.textContent = 'Please fill in all fields.'; return; }
  if (pass.length < 6)          { err.textContent = 'Password must be at least 6 characters.'; return; }
  if (!email.includes('@'))     { err.textContent = 'Please enter a valid email.'; return; }
  const users = getUsers();
  if (users[email]) { err.textContent = 'Account already exists. Please sign in.'; return; }
  users[email] = { name, password: btoa(pass) };
  saveUsers(users);
  err.textContent = '';
  localStorage.setItem('nova_session', email);
  startApp(email, name);
}

function doLogout() {
  localStorage.removeItem('nova_session');
  currentUser = null;
  document.getElementById('app').classList.remove('visible');
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value  = '';
  switchTab('login');
}

function startApp(email, name) {
  currentUser = { email, name };
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  document.getElementById('user-av').textContent      = name.charAt(0).toUpperCase();
  document.getElementById('user-display').textContent = name;
  renderSidebar();
  applyTheme();
}

// ── CHAT DATA ──
function getChatKey() { return `nova_chats_${currentUser.email}`; }
let allChats = [], currentChatId = null, currentHistory = [];
let isTyping = false, attachedImage = null, ttsEnabled = false;
let recognition = null, isListening = false;

const messagesEl = document.getElementById('messages');
const emptyEl    = document.getElementById('empty-state');
const textareaEl = document.getElementById('textarea');
const sendBtn    = document.getElementById('send-btn');
const chatHistEl = document.getElementById('chat-history');

function loadChats() { allChats = JSON.parse(localStorage.getItem(getChatKey()) || '[]'); }
function saveChats() { localStorage.setItem(getChatKey(), JSON.stringify(allChats)); }
function genId()     { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function renderSidebar() {
  loadChats();
  searchChats(document.getElementById('chat-search')?.value || '');
}

function loadChat(id) {
  const chat = allChats.find(c => c.id === id);
  if (!chat) return;
  currentChatId = id;
  currentHistory = [...chat.messages];
  messagesEl.innerHTML = '';
  emptyEl.style.display   = 'none';
  messagesEl.style.display = 'block';
  chat.messages.forEach(m => { if (m.role !== 'system') addMessageDOM(m.role === 'user' ? 'user' : 'ai', m.content); });
  renderSidebar();
  messagesEl.scrollTop = messagesEl.scrollHeight;
  closeSidebar();
}

function newChat() {
  currentChatId = null;
  currentHistory = [];
  messagesEl.innerHTML = '';
  messagesEl.style.display = 'none';
  emptyEl.style.display    = 'flex';
  renderSidebar();
  textareaEl.focus();
  closeSidebar();
}

function resize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  sendBtn.disabled = (!el.value.trim() && !attachedImage) || isTyping;
}
function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }
function showMessages() { emptyEl.style.display = 'none'; messagesEl.style.display = 'block'; }

function addMessageDOM(role, text) {
  showMessages();
  const row  = document.createElement('div'); row.className = 'msg-row';
  const av   = document.createElement('div'); av.className  = 'msg-av ' + role;
  av.textContent = role === 'user' ? (currentUser?.name?.charAt(0).toUpperCase() || 'U') : 'N';
  const body = document.createElement('div'); body.className = 'msg-body';
  const nameRow = document.createElement('div'); nameRow.className = 'msg-name';
  nameRow.innerHTML = role === 'user' ? 'You' : 'Nova AI <span class="msg-badge">AI</span>';
  const txt = document.createElement('div'); txt.className = 'msg-text';
  body.appendChild(nameRow);
  body.appendChild(txt);

  if (role === 'ai') {
    const actRow   = document.createElement('div');
    actRow.style.cssText = 'margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;';
    const btnStyle = 'display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;border:1px solid var(--border-md);background:transparent;font-size:12px;color:var(--text-faint);cursor:pointer;font-family:var(--font);transition:all 0.12s;';

    // Listen button
    const speakBtn = document.createElement('button');
    speakBtn.style.cssText = btnStyle;
    speakBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg> Listen`;
    speakBtn.onmouseover = () => { speakBtn.style.borderColor = 'var(--accent)'; speakBtn.style.color = 'var(--accent)'; };
    speakBtn.onmouseout  = () => { speakBtn.style.borderColor = 'var(--border-md)'; speakBtn.style.color = 'var(--text-faint)'; };
    speakBtn.onclick = () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        speakBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg> Listen`;
        return;
      }
      const clean = txt.innerText.replace(/\n+/g, ' ');
      function detectLang(t) {
        if (/[\u0600-\u06FF]/.test(t)) return 'ur-PK';
        if (/[\u4E00-\u9FFF]/.test(t)) return 'zh-CN';
        if (/[\u0900-\u097F]/.test(t)) return 'hi-IN';
        if (/[\uAC00-\uD7AF]/.test(t)) return 'ko-KR';
        if (/[\u3040-\u30FF]/.test(t)) return 'ja-JP';
        if (/[\u0400-\u04FF]/.test(t)) return 'ru-RU';
        if (/\b(hai|hain|karo|mujhe|aap|bhai|yaar|kya|nahi|hoga|aur|se|ko|ka|ki|ke|mein)\b/i.test(t)) return 'ur-PK';
        return 'en-US';
      }
      const lang = detectLang(clean);
      const utt  = new SpeechSynthesisUtterance(clean);
      utt.lang = lang;
      utt.rate = lang === 'zh-CN' ? 0.9 : 0.98;
      const voices = window.speechSynthesis.getVoices();
      const match  = voices.find(v => v.lang.startsWith(lang.split('-')[0]) && v.localService) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
      if (match) utt.voice = match;
      utt.onend = () => { speakBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg> Listen`; };
      speakBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Stop`;
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          const v2 = window.speechSynthesis.getVoices();
          const m2 = v2.find(v => v.lang.startsWith(lang.split('-')[0]));
          if (m2) utt.voice = m2;
          window.speechSynthesis.speak(utt);
        };
      } else {
        window.speechSynthesis.speak(utt);
      }
    };

    // Regenerate button
    const regenBtn = document.createElement('button');
    regenBtn.style.cssText = btnStyle;
    regenBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg> Regenerate`;
    regenBtn.onmouseover = () => { regenBtn.style.borderColor = 'var(--accent)'; regenBtn.style.color = 'var(--accent)'; };
    regenBtn.onmouseout  = () => { regenBtn.style.borderColor = 'var(--border-md)'; regenBtn.style.color = 'var(--text-faint)'; };
    regenBtn.onclick = regenerate;

    actRow.appendChild(speakBtn);
    actRow.appendChild(regenBtn);
    body.appendChild(actRow);
  }

  row.appendChild(av);
  row.appendChild(body);
  messagesEl.appendChild(row);
  if (text) renderText(txt, text);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return txt;
}

function renderText(el, text) {
  const parts = text.split(/(```[\w]*\n?[\s\S]*?```)/g);
  let html = '';
  parts.forEach(part => {
    const m = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
    if (m) {
      const lang    = m[1].toLowerCase(), rawCode = m[2].trim();
      const id      = 'cb_' + Math.random().toString(36).slice(2);
      const escaped = rawCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const highlighted = syntaxHighlight(escaped, lang);
      const previewBtn  = lang === 'html'
        ? `<button onclick="previewCode('raw_${id}')" style="display:flex;align-items:center;gap:4px;background:transparent;border:1px solid rgba(180,140,60,0.35);border-radius:6px;padding:3px 10px;cursor:pointer;color:#92752a;font-size:12px;font-family:var(--font);" onmouseover="this.style.background='rgba(180,140,60,0.12)'" onmouseout="this.style.background='transparent'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Preview</button>`
        : '';
      html += `<div style="margin:12px 0;border-radius:10px;border:1px solid rgba(180,140,60,0.25);overflow:hidden;"><textarea id="raw_${id}" style="display:none;">${rawCode}</textarea><div style="display:flex;align-items:center;justify-content:space-between;background:#f5e9c0;padding:8px 14px;border-bottom:1px solid rgba(180,140,60,0.2);"><span style="font-size:11px;color:#92752a;font-family:var(--font);text-transform:uppercase;letter-spacing:0.05em;font-weight:500;">${lang || 'code'}</span><div style="display:flex;gap:6px;">${previewBtn}<button id="btn_${id}" onclick="copyRaw('raw_${id}','btn_${id}')" style="display:flex;align-items:center;gap:5px;background:transparent;border:1px solid rgba(180,140,60,0.35);border-radius:6px;padding:3px 10px;cursor:pointer;color:#92752a;font-size:12px;font-family:var(--font);" onmouseover="this.style.background='rgba(180,140,60,0.12)'" onmouseout="this.style.background='transparent'"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy</button></div></div><pre style="background:#fefaf2;margin:0;padding:16px;overflow-x:auto;font-family:'SF Mono','Fira Code',monospace;font-size:13px;line-height:1.65;color:#1e1a0e;"><code>${highlighted}</code></pre></div>`;
    } else {
      let p = part
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/`([^`]+)`/g, '<code style="background:rgba(180,140,60,0.15);padding:2px 6px;border-radius:4px;font-size:13px;font-family:\'SF Mono\',monospace;">$1</code>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^#{1,3}\s+(.+)$/gm, '<strong style="font-size:16px;display:block;margin:6px 0;">$1</strong>')
        .replace(/^\d+\.\s+(.+)$/gm, '<div style="padding:2px 0 2px 4px;">$1</div>')
        .replace(/^[-*]\s+(.+)$/gm, '<div style="padding:2px 0 2px 12px;">• $1</div>')
        .replace(/\n\n/g, '</p><p style="margin-bottom:8px;">').replace(/\n/g, '<br>');
      html += '<p style="margin-bottom:8px;">' + p + '</p>';
    }
  });
  el.innerHTML = html;
}

function copyRaw(rawId, btnId) {
  const ta = document.getElementById(rawId), btn = document.getElementById(btnId);
  if (!ta || !btn) return;
  navigator.clipboard.writeText(ta.value).then(() => {
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
    btn.style.color = '#4ade80'; btn.style.borderColor = 'rgba(74,222,128,0.3)';
    setTimeout(() => {
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy`;
      btn.style.color = '#92752a'; btn.style.borderColor = 'rgba(180,140,60,0.35)';
    }, 2000);
  });
}

function syntaxHighlight(code, lang) {
  const colors = { keyword: '#8b5cf6', string: '#16a34a', comment: '#9ca3af', number: '#ea580c', tag: '#dc2626', attr: '#b45309', fn: '#1d4ed8', const_: '#0369a1' };
  const c = (color, text) => `<span style="color:${color}">${text}</span>`;
  if (['html', 'xml', ''].includes(lang)) {
    return code
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, m => c(colors.comment, m))
      .replace(/(&lt;\/?)([\w-]+)([\s\S]*?)(\/?&gt;)/g, (_, open, tag, attrs, close) => {
        const ca = attrs.replace(/([\w-]+)(=)(&quot;[^&]*&quot;|&#x27;[^&]*&#x27;)/g, (_, a, eq, val) => c(colors.attr, a) + eq + c(colors.string, val));
        return c(colors.comment, open) + c(colors.tag, tag) + ca + c(colors.comment, close);
      });
  }
  if (lang === 'css') {
    return code
      .replace(/(\/\*[\s\S]*?\*\/)/g, m => c(colors.comment, m))
      .replace(/^(\s*)([.#]?[\w-]+(?:[,\s]*[.#]?[\w-]+)*)(\s*\{)/gm, (_, sp, sel, br) => sp + c(colors.fn, sel) + br)
      .replace(/\b([\w-]+)(\s*:\s*)([^;{}]+?)(;)/g, (_, prop, col, val, semi) => c(colors.attr, prop) + col + c(colors.string, val) + semi);
  }
  const keywords = /\b(function|return|const|let|var|if|else|for|while|class|import|export|from|async|await|def|in|not|and|or|True|False|None|new|this|typeof|null|undefined|try|catch|throw|print|self)\b/g;
  return code
    .replace(/(\/\/[^\n]*)/g, m => c(colors.comment, m))
    .replace(/(\/\*[\s\S]*?\*\/)/g, m => c(colors.comment, m))
    .replace(/(#[^\n]*)/g, m => c(colors.comment, m))
    .replace(/(&quot;[^&]*&quot;|&#x27;[^&#x27;]*&#x27;)/g, m => c(colors.string, m))
    .replace(/\b(\d+\.?\d*)\b/g, m => c(colors.number, m))
    .replace(keywords, m => c(colors.keyword, m))
    .replace(/\b([A-Z_][A-Z0-9_]{2,})\b/g, m => c(colors.const_, m))
    .replace(/\b([\w]+)(?=\s*\()/g, m => c(colors.fn, m));
}

function addTyping() {
  showMessages();
  const row = document.createElement('div'); row.id = 'typing-row'; row.className = 'msg-row';
  const av  = document.createElement('div'); av.className = 'msg-av ai'; av.textContent = 'N';
  const body = document.createElement('div'); body.className = 'msg-body';
  const nameRow = document.createElement('div'); nameRow.className = 'msg-name';
  nameRow.innerHTML = 'Nova AI <span class="msg-badge">AI</span>';
  const dots = document.createElement('div'); dots.className = 'typing-dots';
  dots.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  body.appendChild(nameRow); body.appendChild(dots); row.appendChild(av); row.appendChild(body);
  messagesEl.appendChild(row); messagesEl.scrollTop = messagesEl.scrollHeight;
}
function removeTyping() { const t = document.getElementById('typing-row'); if (t) t.remove(); }

function handleImage(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    attachedImage = ev.target.result;
    document.getElementById('preview-img').src = attachedImage;
    document.getElementById('img-preview').style.display = 'block';
    sendBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}
function removeImage() {
  attachedImage = null;
  document.getElementById('img-preview').style.display = 'none';
  document.getElementById('img-input').value = '';
  sendBtn.disabled = !textareaEl.value.trim();
}

function toggleMic() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    alert('Voice input not supported. Please use Chrome.');
    return;
  }
  if (isListening) { recognition.stop(); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = false; recognition.interimResults = true; recognition.lang = 'en-US';
  recognition.onstart  = () => { isListening = true;  document.getElementById('mic-btn').classList.add('mic-on');    textareaEl.placeholder = 'Listening...'; };
  recognition.onresult = e  => { textareaEl.value = Array.from(e.results).map(r => r[0].transcript).join(''); resize(textareaEl); };
  recognition.onend    = () => { isListening = false; document.getElementById('mic-btn').classList.remove('mic-on'); textareaEl.placeholder = 'Message Nova...'; if (textareaEl.value.trim()) sendBtn.disabled = false; };
  recognition.onerror  = () => { isListening = false; document.getElementById('mic-btn').classList.remove('mic-on'); textareaEl.placeholder = 'Message Nova...'; };
  recognition.start();
}

function speakText(text) {
  if (!ttsEnabled) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, '').replace(/\n+/g, ' '));
  utt.rate = 1.0;
  window.speechSynthesis.speak(utt);
}

// ══════════════════════════════════════════════
//  MAIN SEND — Ab /api/chat pe jaata hai
//  API key frontend mein bilkul nahi hai
// ══════════════════════════════════════════════
async function send() {
  const text = textareaEl.value.trim();
  if ((!text && !attachedImage) || isTyping) return;

  if (!currentChatId) {
    currentChatId = genId();
    const title = (text || 'Image').slice(0, 34) + (text.length > 34 ? '…' : '');
    allChats.push({ id: currentChatId, title, messages: [] });
  }

  let userContent, useVision = false;
  if (attachedImage) {
    useVision   = true;
    const base64 = attachedImage.split(',')[1];
    const mime   = attachedImage.split(';')[0].split(':')[1];
    userContent  = [{ type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } }];
    if (text) userContent.push({ type: 'text', text });
  } else {
    userContent = text;
  }

  const historyContent = text || '[Image uploaded]';
  currentHistory.push({ role: 'user', content: historyContent });
  addMessageDOM('user', text || '📷 Image attached');

  const apiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...currentHistory.slice(0, -1),
    { role: 'user', content: userContent }
  ];

  textareaEl.value = ''; textareaEl.style.height = 'auto';
  if (attachedImage) removeImage();
  const chat = allChats.find(c => c.id === currentChatId);
  if (chat) chat.messages = [...currentHistory];
  saveChats(); renderSidebar();

  isTyping = true; sendBtn.disabled = true; addTyping();

  try {
    // ✅ Backend pe request — API key expose nahi hoti
    const res = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages: apiMessages, useVision })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error || `Server error ${res.status}`);
    }

    const data  = await res.json();
    removeTyping();
    if (data.error) throw new Error(typeof data.error === "string" ? data.error : data.error.message || JSON.stringify(data.error));
    const reply = data.choices?.[0]?.message?.content || 'Something went wrong.';
    currentHistory.push({ role: 'assistant', content: reply });
    const c = allChats.find(x => x.id === currentChatId);
    if (c) { c.messages = [...currentHistory]; saveChats(); }
    addMessageDOM('ai', reply);
    speakText(reply);

  } catch (err) {
    removeTyping();
    const errEl = addMessageDOM('ai', '');
    errEl.innerHTML = `<span style="color:#e53e3e;font-size:14px;">⚠️ Error: ${err.message}</span>`;
  }

  isTyping = false; sendBtn.disabled = !textareaEl.value.trim(); textareaEl.focus();
}

function quickSend(text) { textareaEl.value = text; resize(textareaEl); send(); }

function updateCounter() {
  const len = textareaEl.value.length, counter = document.getElementById('char-counter');
  if (len > 100) { counter.style.display = 'inline'; counter.textContent = len; counter.style.color = len > 3000 ? '#e53e3e' : 'var(--text-faint)'; }
  else counter.style.display = 'none';
}

function searchChats(query) {
  loadChats();
  const pinned = allChats.filter(c => c.pinned), rest = allChats.filter(c => !c.pinned);
  const all    = [...pinned, ...rest];
  const filtered = query.trim() ? all.filter(c => c.title.toLowerCase().includes(query.toLowerCase())) : all;
  chatHistEl.innerHTML = '';
  if (filtered.length === 0) { chatHistEl.innerHTML = '<div style="padding:8px 12px;font-size:12.5px;color:var(--text-faint);">No results</div>'; return; }
  filtered.slice().reverse().forEach(chat => {
    const item = document.createElement('div');
    item.className = 'chat-item' + (chat.id === currentChatId ? ' active' : '');
    const pin = chat.pinned ? '<span style="font-size:10px;margin-right:2px;">📌</span>' : '';
    item.innerHTML = `<div class="chat-item-dot"></div>${pin}<span style="overflow:hidden;text-overflow:ellipsis;flex:1;">${chat.title}</span>`;
    item.onclick = () => loadChat(chat.id);
    item.oncontextmenu = e => { e.preventDefault(); showChatMenu(e, chat.id); };
    chatHistEl.appendChild(item);
  });
}

function showChatMenu(e, chatId) {
  document.getElementById('chat-ctx-menu')?.remove();
  const menu = document.createElement('div'); menu.id = 'chat-ctx-menu';
  menu.style.cssText = `position:fixed;left:${Math.min(e.clientX, window.innerWidth - 160)}px;top:${e.clientY}px;background:var(--white);border:1px solid var(--border-md);border-radius:10px;padding:4px;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,0.15);min-width:150px;`;
  const chat = allChats.find(c => c.id === chatId);
  const pinLabel = chat?.pinned ? 'Unpin' : 'Pin to top';
  const mi = (icon, label, fn, color = 'var(--text)') => {
    const d = document.createElement('div');
    d.style.cssText = `padding:8px 12px;border-radius:7px;cursor:pointer;font-size:13px;color:${color};display:flex;align-items:center;gap:7px;`;
    d.innerHTML = `${icon} ${label}`;
    d.onmouseover = () => d.style.background = color === 'var(--text)' ? 'var(--accent-light)' : '#fff5f5';
    d.onmouseout  = () => d.style.background = 'transparent';
    d.onclick = fn;
    menu.appendChild(d);
  };
  mi('📌', pinLabel, () => { togglePin(chatId); menu.remove(); });
  mi('⬇️', 'Export',  () => { exportSingleChat(chatId); menu.remove(); });
  mi('🗑️', 'Delete',  () => { deleteChat(chatId); menu.remove(); }, '#e53e3e');
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 50);
}

function togglePin(chatId)   { const c = allChats.find(x => x.id === chatId); if (c) { c.pinned = !c.pinned; saveChats(); renderSidebar(); } }
function deleteChat(chatId)  { allChats = allChats.filter(c => c.id !== chatId); saveChats(); if (currentChatId === chatId) newChat(); else renderSidebar(); }
function exportChat()        { if (currentChatId) exportSingleChat(currentChatId); }
function exportSingleChat(chatId) {
  const chat = allChats.find(c => c.id === chatId); if (!chat) return;
  let txt = `Nova AI — Chat Export\n${'='.repeat(40)}\n${chat.title}\n${'='.repeat(40)}\n\n`;
  chat.messages.forEach(m => { txt += `[${m.role === 'user' ? 'You' : 'Nova AI'}]\n${typeof m.content === 'string' ? m.content : '[Image]'}\n\n`; });
  const a = document.createElement('a');
  a.href     = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
  a.download = `nova-${chat.title.slice(0, 20).replace(/[^a-z0-9]/gi, '-')}.txt`;
  a.click();
}

function previewCode(rawId) { const ta = document.getElementById(rawId); if (!ta) return; document.getElementById('preview-modal').style.display = 'flex'; document.getElementById('preview-frame').srcdoc = ta.value; }
function closePreview()     { document.getElementById('preview-modal').style.display = 'none'; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePreview(); });

async function regenerate() {
  if (!currentHistory.length || isTyping) return;
  if (currentHistory[currentHistory.length - 1].role === 'assistant') currentHistory.pop();
  const lastAI = messagesEl.querySelector('.msg-row:last-child');
  if (lastAI?.querySelector('.msg-av.ai')) lastAI.remove();
  isTyping = true; sendBtn.disabled = true; addTyping();
  try {
    const res = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...currentHistory], useVision: false })
    });
    const data = await res.json(); removeTyping();
    if (data.error) throw new Error(typeof data.error === "string" ? data.error : data.error.message || JSON.stringify(data.error));
    const reply = data.choices?.[0]?.message?.content || 'Something went wrong.';
    currentHistory.push({ role: 'assistant', content: reply });
    const c = allChats.find(x => x.id === currentChatId);
    if (c) { c.messages = [...currentHistory]; saveChats(); }
    addMessageDOM('ai', reply); speakText(reply);
  } catch (e) { removeTyping(); }
  isTyping = false; sendBtn.disabled = false;
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); }
function closeSidebar()  { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('open'); }

let isDark = localStorage.getItem('nova_theme') === 'dark';
function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
  const icon = document.getElementById('theme-icon'); if (!icon) return;
  icon.innerHTML = isDark
    ? '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'
    : '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
}
function toggleTheme() { isDark = !isDark; localStorage.setItem('nova_theme', isDark ? 'dark' : 'light'); applyTheme(); }
applyTheme();

textareaEl.addEventListener('input', () => { sendBtn.disabled = (!textareaEl.value.trim() && !attachedImage) || isTyping; updateCounter(); });

// Auto-login
const session = getSession();
if (session) { const users = getUsers(); if (users[session]) startApp(session, users[session].name); }

// ── FIX 1: Image Paste (Ctrl+V) support ──
document.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = ev => {
        attachedImage = ev.target.result;
        document.getElementById('preview-img').src = attachedImage;
        document.getElementById('img-preview').style.display = 'block';
        sendBtn.disabled = false;
      };
      reader.readAsDataURL(file);
      break;
    }
  }
});

// ── FIX 2: Mobile send button fix — recalc on resize ──
window.addEventListener('resize', () => {
  sendBtn.disabled = (!textareaEl.value.trim() && !attachedImage) || isTyping;
});