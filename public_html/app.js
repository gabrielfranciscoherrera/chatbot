(function () {
  'use strict';

  const API_ENDPOINT = window.API_ENDPOINT || '/api/chat';
  const USER_ID = window.USER_ID || getOrCreateUserId();

  // DOM refs
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const menuToggle = document.getElementById('menuToggle');
  const newChatBtn = document.getElementById('newChatBtn');
  const conversationList = document.getElementById('conversationList');
  const topbarTitle = document.getElementById('topbarTitle');
  const messagesScroll = document.getElementById('messagesScroll');
  const messagesContent = document.getElementById('messagesContent');
  const emptyState = document.getElementById('emptyState');
  const suggestionsGrid = document.getElementById('suggestionsGrid');
  const messagesEnd = document.getElementById('messagesEnd');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');

  if (typeof marked !== 'undefined') {
    marked.setOptions({ gfm: true, breaks: true, headerIds: false });
  }

  function getOrCreateUserId() {
    let id = localStorage.getItem('chat_user_id');
    if (!id) {
      id = generateId('user');
      localStorage.setItem('chat_user_id', id);
    }
    return id;
  }

  function generateId(prefix) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function formatDateLabel(ts) {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
    if (isToday) return 'Hoy';
    if (d >= weekAgo) return 'Esta semana';
    return 'Anteriores';
  }

  class ChatApp {
    constructor() {
      this.conversations = this.loadConversations();
      this.currentId = null;
      this.isTyping = false;
      this.init();
    }

    init() {
      this.bindEvents();
      this.renderSidebar();
      this.startNewConversation();
      this.autoResize();
    }

    bindEvents() {
      sendBtn.addEventListener('click', () => this.handleSend());
      messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSend();
        }
      });
      messageInput.addEventListener('input', () => this.autoResize());

      newChatBtn.addEventListener('click', () => {
        this.startNewConversation();
        this.closeSidebar();
      });

      menuToggle.addEventListener('click', () => this.openSidebar());
      overlay.addEventListener('click', () => this.closeSidebar());

      suggestionsGrid.querySelectorAll('.suggestion-card').forEach((btn) => {
        btn.addEventListener('click', () => {
          messageInput.value = btn.textContent.trim();
          this.autoResize();
          this.handleSend();
        });
      });
    }

    openSidebar() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    }

    closeSidebar() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }

    loadConversations() {
      try {
        const raw = localStorage.getItem('chat_conversations_v2');
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }

    saveConversations() {
      localStorage.setItem('chat_conversations_v2', JSON.stringify(this.conversations));
    }

    startNewConversation() {
      this.currentId = generateId('conv');
      const conv = {
        id: this.currentId,
        title: 'Nueva conversación',
        messages: [],
        createdAt: Date.now(),
      };
      this.conversations.unshift(conv);
      this.saveConversations();
      this.renderSidebar();
      this.renderMessages();
      topbarTitle.textContent = 'ChatGPT';
    }

    switchConversation(id) {
      this.currentId = id;
      this.renderSidebar();
      this.renderMessages();
      const conv = this.conversations.find((c) => c.id === id);
      if (conv) topbarTitle.textContent = conv.title || 'Conversación';
      this.closeSidebar();
    }

    deleteConversation(e, id) {
      e.stopPropagation();
      this.conversations = this.conversations.filter((c) => c.id !== id);
      this.saveConversations();
      if (this.currentId === id) {
        if (this.conversations.length) {
          this.switchConversation(this.conversations[0].id);
        } else {
          this.startNewConversation();
        }
      } else {
        this.renderSidebar();
      }
    }

    updateTitle(text) {
      const conv = this.conversations.find((c) => c.id === this.currentId);
      if (!conv) return;
      if (conv.title === 'Nueva conversación') {
        conv.title = text.split('\n')[0].slice(0, 40) || 'Conversación';
        topbarTitle.textContent = conv.title;
        this.saveConversations();
        this.renderSidebar();
      }
    }

    renderSidebar() {
      conversationList.innerHTML = '';
      const grouped = { Hoy: [], 'Esta semana': [], Anteriores: [] };
      this.conversations.forEach((c) => {
        const label = formatDateLabel(c.createdAt);
        if (!grouped[label]) grouped[label] = [];
        grouped[label].push(c);
      });

      Object.entries(grouped).forEach(([label, items]) => {
        if (!items.length) return;
        const group = document.createElement('div');
        group.className = 'nav-group';
        group.innerHTML = `<div class="nav-group-label">${escapeHtml(label)}</div>`;
        items.forEach((conv) => {
          const btn = document.createElement('button');
          btn.className = 'conv-item' + (conv.id === this.currentId ? ' active' : '');
          btn.title = conv.title;
          btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <span class="conv-title">${escapeHtml(conv.title)}</span>
            <button class="delete-btn" aria-label="Eliminar conversación">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          `;
          btn.addEventListener('click', () => this.switchConversation(conv.id));
          btn.querySelector('.delete-btn').addEventListener('click', (e) => this.deleteConversation(e, conv.id));
          group.appendChild(btn);
        });
        conversationList.appendChild(group);
      });
    }

    renderMessages() {
      messagesContent.innerHTML = '';
      const conv = this.conversations.find((c) => c.id === this.currentId);
      if (!conv || conv.messages.length === 0) {
        messagesContent.appendChild(emptyState);
        emptyState.style.display = 'flex';
        return;
      }
      emptyState.style.display = 'none';
      if (!messagesContent.contains(emptyState)) {
        messagesContent.appendChild(emptyState);
      }
      conv.messages.forEach((msg) => this.appendMessage(msg));
      this.scrollToBottom();
    }

    appendMessage(msg) {
      const isUser = msg.role === 'user';
      const wrapper = document.createElement('div');
      wrapper.className = `message ${isUser ? 'user' : ''}`;

      const inner = document.createElement('div');
      inner.className = 'message-inner';

      if (!isUser) {
        const avatar = document.createElement('div');
        avatar.className = 'avatar-bot';
        avatar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path></svg>`;
        inner.appendChild(avatar);
      }

      const body = document.createElement('div');
      body.className = 'message-body';

      const bubble = document.createElement('div');
      bubble.className = `bubble ${isUser ? 'user' : 'assistant'}`;

      if (msg.type === 'image' && msg.content) {
        const img = document.createElement('img');
        img.src = msg.content;
        img.alt = 'Imagen';
        img.style.maxWidth = '100%';
        img.style.borderRadius = '12px';
        bubble.appendChild(img);
      } else {
        const html = typeof marked !== 'undefined' ? marked.parse(msg.content || '') : escapeHtml(msg.content || '');
        bubble.innerHTML = html;
        bubble.querySelectorAll('pre code').forEach((block) => {
          const pre = block.parentElement;
          if (!pre.querySelector('.copy-code-btn')) {
            const btn = document.createElement('button');
            btn.className = 'copy-code-btn';
            btn.textContent = 'Copiar';
            btn.style.cssText = 'position:absolute;top:8px;right:8px;background:hsl(var(--muted));color:hsl(var(--foreground));border:1px solid hsl(var(--border));border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer;opacity:0;transition:opacity .2s;';
            btn.addEventListener('click', () => {
              navigator.clipboard.writeText(block.textContent).then(() => {
                btn.textContent = 'Copiado';
                setTimeout(() => (btn.textContent = 'Copiar'), 1500);
              });
            });
            pre.appendChild(btn);
            pre.addEventListener('mouseenter', () => (btn.style.opacity = '1'));
            pre.addEventListener('mouseleave', () => (btn.style.opacity = '0'));
          }
          if (typeof hljs !== 'undefined') hljs.highlightElement(block);
        });
      }

      body.appendChild(bubble);

      // Fallback badge
      if (msg.fallback) {
        const badge = document.createElement('div');
        badge.className = 'fallback-badge';
        badge.textContent = 'Respuesta genérica (fallback)';
        badge.style.cssText = 'display:inline-block;margin-top:8px;font-size:12px;color:hsl(var(--primary));background:hsl(var(--primary)/0.1);padding:2px 8px;border-radius:6px;';
        body.appendChild(badge);
      }

      // Suggestions
      if (Array.isArray(msg.suggestions) && msg.suggestions.length) {
        const chips = document.createElement('div');
        chips.className = 'suggestions';
        chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;';
        msg.suggestions.forEach((s) => {
          const chip = document.createElement('button');
          chip.className = 'suggestion-chip';
          chip.textContent = s;
          chip.style.cssText = 'padding:6px 12px;border:1px solid hsl(var(--border));border-radius:9999px;background:transparent;color:hsl(var(--secondary-foreground));font-size:13px;cursor:pointer;transition:background .2s,border-color .2s;';
          chip.addEventListener('mouseenter', () => {
            chip.style.background = 'hsl(var(--accent) / 0.5)';
            chip.style.borderColor = 'hsl(var(--muted-foreground) / 0.5)';
          });
          chip.addEventListener('mouseleave', () => {
            chip.style.background = 'transparent';
            chip.style.borderColor = 'hsl(var(--border))';
          });
          chip.addEventListener('click', () => {
            messageInput.value = s;
            this.autoResize();
            this.handleSend();
          });
          chips.appendChild(chip);
        });
        body.appendChild(chips);
      }

      // Actions for assistant
      if (!isUser && !msg.isTyping) {
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        actions.innerHTML = `
          <button class="action-btn" title="Copiar" aria-label="Copiar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>
          <button class="action-btn" title="Me gusta" aria-label="Me gusta"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg></button>
          <button class="action-btn" title="No me gusta" aria-label="No me gusta"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg></button>
          <button class="action-btn" title="Reintentar" aria-label="Reintentar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
        `;
        actions.querySelector('.action-btn[title="Copiar"]').addEventListener('click', () => {
          navigator.clipboard.writeText(msg.content || '');
        });
        body.appendChild(actions);
      }

      inner.appendChild(body);
      wrapper.appendChild(inner);
      messagesContent.appendChild(wrapper);
    }

    addMessage(msg) {
      const conv = this.conversations.find((c) => c.id === this.currentId);
      if (!conv) return;
      conv.messages.push(msg);
      this.saveConversations();
      if (messagesContent.contains(emptyState)) emptyState.style.display = 'none';
      this.appendMessage(msg);
      this.scrollToBottom();
    }

    scrollToBottom() {
      messagesEnd.scrollIntoView({ behavior: 'smooth' });
    }

    autoResize() {
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
      sendBtn.disabled = !messageInput.value.trim();
    }

    async handleSend() {
      const text = messageInput.value.trim();
      if (!text || this.isTyping) return;

      const userMsg = {
        id: generateId('msg'),
        role: 'user',
        type: 'text',
        content: text,
      };
      this.addMessage(userMsg);
      this.updateTitle(text);

      messageInput.value = '';
      this.autoResize();

      this.isTyping = true;
      sendBtn.disabled = true;

      const typingMsg = {
        id: generateId('typing'),
        role: 'assistant',
        type: 'text',
        content: '',
        isTyping: true,
      };
      this.addMessage(typingMsg);

      try {
        const res = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversation_id: this.currentId,
            user_id: USER_ID,
          }),
        });

        const result = await res.json();
        const conv = this.conversations.find((c) => c.id === this.currentId);
        if (conv) {
          conv.messages = conv.messages.filter((m) => !m.isTyping);
          this.saveConversations();
        }

        if (result.status === 'error' || !result.data) {
          this.addMessage({
            id: generateId('msg'),
            role: 'assistant',
            type: 'text',
            content: result.error?.message || 'Ocurrió un error inesperado. Intenta de nuevo.',
          });
          return;
        }

        const data = result.data;
        this.addMessage({
          id: data.id || generateId('msg'),
          role: data.role || 'assistant',
          type: data.type || 'text',
          content: data.content || '',
          suggestions: data.suggestions || [],
          fallback: !!data.fallback,
          intent: data.intent,
          confidence: data.confidence,
        });
      } catch (err) {
        const conv = this.conversations.find((c) => c.id === this.currentId);
        if (conv) {
          conv.messages = conv.messages.filter((m) => !m.isTyping);
          this.saveConversations();
        }
        this.addMessage({
          id: generateId('msg'),
          role: 'assistant',
          type: 'text',
          content: 'No se pudo conectar con el servidor. Revisa tu conexión e intenta más tarde.',
        });
      } finally {
        this.isTyping = false;
        sendBtn.disabled = !messageInput.value.trim();
        messageInput.focus();
      }
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  window.chatApp = new ChatApp();
})();
