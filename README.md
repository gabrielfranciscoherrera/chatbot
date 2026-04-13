# Chatbot Webkor

Chatbot de código abierto con interfaz tipo ChatGPT, backend en PHP y persistencia en MySQL.

## 🚀 Características

- **Frontend** moderno inspirado en ChatGPT (tema oscuro, responsive, animaciones suaves).
- **Backend API REST** en PHP 8+ estrictamente tipado.
- **Persistencia real** de usuarios, conversaciones y mensajes en MySQL 8.0.
- **Diccionario de datos** y documentación de API profesional incluidos.
- **Markdown + Syntax Highlighting** para respuestas enriquecidas.
- **Soporte fallback** según estándar documentado para respuestas genéricas.

## 📁 Estructura del Proyecto

```
.
├── database/
│   └── schema.sql              # Esquema MySQL completo
├── docs/
│   ├── API_DOCUMENTATION.md    # Documentación REST API
│   └── DATA_DICTIONARY.md      # Diccionario de datos MySQL
├── public_html/
│   ├── index.php               # Punto de entrada del frontend
│   ├── app.js                  # Lógica del chat (JS vanilla)
│   ├── styles.css              # Tema oscuro tipo ChatGPT
│   └── api/
│       ├── config.php          # Configuración PDO y helpers
│       └── chat/
│           └── index.php       # Endpoint POST /api/chat/
└── README.md
```

## ⚡ API Endpoint

```http
POST /api/chat/
Content-Type: application/json

{
  "message": "Hola",
  "conversation_id": "conv_123",
  "user_id": "user_001"
}
```

Documentación completa en [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md).

## 🗄️ Base de Datos

El esquema consta de 3 tablas principales:

- `users` — usuarios anónimos.
- `conversations` — hilos de chat.
- `messages` — mensajes con metadatos (tipo, fallback, intent, confidence).

Ver [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md) para detalles completos.

## 🛠️ Instalación Rápida

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/gabrielfranciscoherrera/chatbot.git
   cd chatbot
   ```

2. Crear la base de datos MySQL y ejecutar el esquema:
   ```bash
   mysql -u chatbot -p < database/schema.sql
   ```

3. Configurar `public_html/api/config.php` con tus credenciales de MySQL.

4. Apuntar el virtual host de tu servidor web a `public_html/`.

5. Abrir en el navegador y empezar a chatear.

## 📝 Licencia

MIT — Uso libre con atribución.
