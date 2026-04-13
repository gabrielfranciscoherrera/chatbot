<?php
session_start();
if (empty($_SESSION['chat_user_id'])) {
    $_SESSION['chat_user_id'] = 'user_' . bin2hex(random_bytes(8));
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chatbot AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css?v=2" />
</head>
<body>
  <div class="app">
    <!-- Overlay móvil -->
    <div class="overlay" id="overlay"></div>

    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <button class="new-chat-btn" id="newChatBtn" aria-label="Nuevo chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nuevo chat
        </button>
      </div>
      <nav class="sidebar-nav" id="conversationList">
        <!-- Grupos inyectados por JS -->
      </nav>
      <div class="sidebar-footer">
        <div class="user-row">
          <div class="user-avatar">U</div>
          <span class="user-name">Usuario</span>
          <svg class="user-more" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="main">
      <header class="topbar">
        <button class="menu-toggle" id="menuToggle" aria-label="Abrir menú">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <h2 class="topbar-title" id="topbarTitle">ChatGPT</h2>
        <div class="topbar-model">
          <select id="modelSelect" class="model-select">
            <option>GPT-4o</option>
            <option>GPT-4o mini</option>
            <option>GPT-4</option>
          </select>
        </div>
      </header>

      <div class="messages-scroll" id="messagesScroll">
        <div class="messages-content" id="messagesContent">
          <!-- Empty state -->
          <div class="empty-state" id="emptyState">
            <div class="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path></svg>
            </div>
            <h1 class="empty-title">¿En qué puedo ayudarte?</h1>
            <p class="empty-subtitle">Elige una sugerencia o escribe tu pregunta</p>
            <div class="suggestions-grid" id="suggestionsGrid">
              <button class="suggestion-card">Explícame la mecánica cuántica de forma sencilla</button>
              <button class="suggestion-card">Escribe un poema sobre la inteligencia artificial</button>
              <button class="suggestion-card">Ayúdame a planificar un viaje a Japón</button>
              <button class="suggestion-card">¿Cuál es la diferencia entre machine learning y deep learning?</button>
            </div>
          </div>
        </div>
        <div id="messagesEnd"></div>
      </div>

      <div class="input-wrapper">
        <div class="input-box">
          <textarea id="messageInput" rows="1" placeholder="Envía un mensaje a ChatGPT"></textarea>
          <div class="input-actions">
            <div class="input-actions-left">
              <button class="icon-btn" aria-label="Adjuntar archivo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </button>
              <button class="icon-btn" aria-label="Buscar en web">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              </button>
            </div>
            <button class="send-btn" id="sendBtn" aria-label="Enviar" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
            </button>
          </div>
        </div>
        <p class="input-disclaimer">ChatGPT puede cometer errores. Considera verificar la información importante.</p>
      </div>
    </main>
  </div>

  <script>
    window.API_ENDPOINT = '/api/chat/';
    window.USER_ID = <?php echo json_encode($_SESSION['chat_user_id']); ?>;
  </script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/javascript.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/python.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/bash.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/json.min.js"></script>
  <script src="app.js?v=2"></script>
</body>
</html>
