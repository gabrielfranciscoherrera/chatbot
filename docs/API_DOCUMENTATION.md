# Documentación API - Chatbot Webkor

## 1. Información General

| Campo | Valor |
|-------|-------|
| **Base URL** | `https://chatbot.webkor.org/api/chat/` |
| **Formato** | JSON |
| **Codificación** | UTF-8 |
| **Método principal** | `POST` |
| **Autenticación** | `user_id` (uuid generado por cliente o sesión PHP) |

---

## 2. Endpoint

### `POST /api/chat/`

Recibe un mensaje del usuario, lo persiste en la base de datos MySQL y retorna una respuesta generada por el asistente.

### 3. Request Body

```json
{
  "message": "Hola",
  "conversation_id": "conv_123",
  "user_id": "user_001"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `message` | `string` | Sí | Mensaje enviado por el usuario |
| `conversation_id` | `string` | Sí | Identificador único de la conversación |
| `user_id` | `string` | Sí | Identificador único del usuario |

### 4. Response Exitosa (`200 OK`)

```json
{
  "status": "success",
  "data": {
    "id": "msg_001",
    "type": "text",
    "content": "¡Hola! ¿En qué puedo ayudarte?",
    "role": "assistant",
    "conversation_id": "conv_123",
    "suggestions": ["Ayuda", "Código"]
  },
  "error": null
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `status` | `string` | Estado de la petición: `success` |
| `data.id` | `string` | ID único del mensaje de respuesta |
| `data.type` | `string` | Tipo de contenido: `text`, `code`, `image`, `markdown` |
| `data.content` | `string` | Cuerpo de la respuesta |
| `data.role` | `string` | Rol del emisor: `assistant` |
| `data.conversation_id` | `string` | ID de la conversación asociada |
| `data.suggestions` | `array<string>` | Sugerencias de follow-up (puede estar vacío) |

### 5. Caso Fallback (`200 OK`)

Cuando el asistente no entiende la intención del usuario:

```json
{
  "status": "success",
  "data": {
    "content": "No entendí tu pregunta",
    "intent": "unknown",
    "confidence": 0.1,
    "fallback": true
  },
  "error": null
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fallback` | `boolean` | `true` indica que se activó una respuesta genérica |
| `intent` | `string` | Intención detectada (ej. `unknown`) |
| `confidence` | `float` | Nivel de confianza entre `0.0` y `1.0` |

### 6. Caso Error

#### `400 Bad Request`
```json
{
  "status": "error",
  "data": null,
  "error": {
    "code": 400,
    "message": "El campo message es obligatorio."
  }
}
```

#### `500 Internal Server Error`
```json
{
  "status": "error",
  "data": null,
  "error": {
    "code": 500,
    "message": "Error interno del servidor"
  }
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `status` | `string` | Estado de la petición: `error` |
| `error.code` | `integer` | Código HTTP de error |
| `error.message` | `string` | Descripción legible del error |

---

## 7. Flujo de Uso Recomendado

1. **Inicio de sesión / visita**: Generar un `user_id` único (frontend o PHP session).
2. **Nueva conversación**: Generar un `conversation_id` único y enviar el primer mensaje.
3. **Mensajes subsiguientes**: Reutilizar el mismo `conversation_id` para mantener contexto.
4. **Renderizado**: Usar `data.type` para decidir si renderizar texto plano, Markdown, código o imagen.
5. **Fallback**: Si `fallback === true`, mostrar una advertencia visual de "respuesta genérica".

---

## 8. CORS

El endpoint acepta peticiones `OPTIONS` para preflight y responde con los headers necesarios si se envía un `Origin` válido.

---

## 9. Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Lenguaje | PHP 8.x (`strict_types=1`) |
| Base de datos | MySQL 8.0 (PDO) |
| Frontend | HTML5, CSS3, JavaScript Vanilla |
| Servidor | Apache / Nginx |
