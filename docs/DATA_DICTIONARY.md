# Diccionario de Datos - Chatbot Webkor

Base de datos: `chatbot`  
Motor: `InnoDB`  
Charset: `utf8mb4`  
Collation: `utf8mb4_unicode_ci`

---

## 1. Tabla: `users`

Almacena los usuarios únicos identificados por el sistema.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `user_id` | `VARCHAR(64)` | NO | — | PK. Identificador único del usuario |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Fecha de creación del registro |

**Relaciones:**
- `1:N` con `conversations` (`user_id`)

---

## 2. Tabla: `conversations`

Agrupa los mensajes intercambiados en una misma conversación.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `conversation_id` | `VARCHAR(64)` | NO | — | PK. Identificador único de la conversación |
| `user_id` | `VARCHAR(64)` | NO | — | FK a `users.user_id` |
| `title` | `VARCHAR(255)` | YES | `'Nueva conversación'` | Título visible de la conversación |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Fecha de inicio |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP ON UPDATE` | Última modificación |

**Índices:**
- `idx_user_id` (`user_id`)
- `idx_updated_at` (`updated_at`)

**Relaciones:**
- `N:1` con `users` (`user_id`)
- `1:N` con `messages` (`conversation_id`)

---

## 3. Tabla: `messages`

Registra cada mensaje enviado tanto por el usuario como por el asistente.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `message_id` | `VARCHAR(64)` | NO | — | PK. Identificador único del mensaje |
| `conversation_id` | `VARCHAR(64)` | NO | — | FK a `conversations.conversation_id` |
| `role` | `ENUM('user','assistant')` | NO | — | Identifica al emisor del mensaje |
| `content` | `TEXT` | NO | — | Cuerpo del mensaje |
| `type` | `ENUM('text','code','image','markdown')` | YES | `'text'` | Formato del contenido |
| `suggestions` | `JSON` | YES | `NULL` | Array de sugerencias de follow-up |
| `fallback` | `TINYINT(1)` | YES | `0` | `1` si la respuesta fue genérica |
| `intent` | `VARCHAR(64)` | YES | `NULL` | Intención detectada por el bot |
| `confidence` | `DECIMAL(3,2)` | YES | `NULL` | Confianza de la intención (`0.00` - `1.00`) |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Fecha de envío del mensaje |

**Índices:**
- `idx_conversation_id` (`conversation_id`)
- `idx_created_at` (`created_at`)

**Relaciones:**
- `N:1` con `conversations` (`conversation_id`)

---

## 4. Diagrama Entidad-Relación (ER)

```
+-------------+       +-------------------+       +-------------+
|   users     | 1   N |   conversations   | 1   N |   messages  |
+-------------+       +-------------------+       +-------------+
| PK user_id  |<----->| PK conversation_id|<----->| PK message_id|
| created_at  |       | FK user_id        |       | FK conv_id  |
+-------------+       | title             |       | role        |
                      | created_at        |       | content     |
                      | updated_at        |       | type        |
                      +-------------------+       | suggestions |
                                                  | fallback    |
                                                  | intent      |
                                                  | confidence  |
                                                  | created_at  |
                                                  +-------------+
```

---

## 5. Glosario de Términos

| Término | Significado |
|---------|-------------|
| **user_id** | Identificador anónimo generado por el frontend (localStorage / sesión PHP) |
| **conversation_id** | UUID que agrupa todos los mensajes de un mismo hilo de chat |
| **message_id** | UUID único por cada mensaje individual |
| **role** | Puede ser `user` (humano) o `assistant` (bot) |
| **fallback** | Bandera que indica si el bot no entendió la pregunta y respondió con un mensaje genérico |
| **intent** | Clasificación semántica de la intención del usuario (ej. `greeting`, `code_request`, `unknown`) |
| **confidence** | Probabilidad numérica de que la clasificación `intent` sea correcta |
| **suggestions** | Lista de posibles siguientes preguntas para facilitar la interacción |
