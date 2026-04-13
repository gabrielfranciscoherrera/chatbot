<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError(405, 'Método no permitido. Use POST.');
}

$input = getJsonInput();

$message = isset($input['message']) && is_string($input['message']) ? trim($input['message']) : '';
$conversationId = isset($input['conversation_id']) && is_string($input['conversation_id']) ? trim($input['conversation_id']) : '';
$userId = isset($input['user_id']) && is_string($input['user_id']) ? trim($input['user_id']) : '';

if ($message === '') {
    sendError(400, 'El campo message es obligatorio.');
}
if ($conversationId === '') {
    sendError(400, 'El campo conversation_id es obligatorio.');
}
if ($userId === '') {
    sendError(400, 'El campo user_id es obligatorio.');
}

try {
    $pdo = getDb();

    // Asegurar que el usuario exista
    $stmt = $pdo->prepare("INSERT INTO users (user_id) VALUES (:user_id) ON DUPLICATE KEY UPDATE user_id=user_id");
    $stmt->execute([':user_id' => $userId]);

    // Asegurar que la conversación exista
    $stmt = $pdo->prepare("INSERT INTO conversations (conversation_id, user_id) VALUES (:conv_id, :user_id) ON DUPLICATE KEY UPDATE updated_at=NOW()");
    $stmt->execute([':conv_id' => $conversationId, ':user_id' => $userId]);

    // Guardar mensaje del usuario
    $userMsgId = 'msg_' . bin2hex(random_bytes(8));
    $stmt = $pdo->prepare("INSERT INTO messages (message_id, conversation_id, role, content, type) VALUES (:msg_id, :conv_id, 'user', :content, 'text')");
    $stmt->execute([':msg_id' => $userMsgId, ':conv_id' => $conversationId, ':content' => $message]);

    // Obtener contexto reciente (últimos 10 mensajes)
    $stmt = $pdo->prepare("SELECT role, content FROM messages WHERE conversation_id = :conv_id ORDER BY created_at DESC LIMIT 10");
    $stmt->execute([':conv_id' => $conversationId]);
    $context = array_reverse($stmt->fetchAll());

    // Generar respuesta
    $responseData = generateResponse($message, $context, $conversationId);

    // Guardar respuesta del asistente
    $assistantMsgId = $responseData['id'] ?? ('msg_' . bin2hex(random_bytes(8)));
    $stmt = $pdo->prepare("INSERT INTO messages (message_id, conversation_id, role, content, type, suggestions, fallback, intent, confidence) VALUES (:msg_id, :conv_id, 'assistant', :content, :type, :suggestions, :fallback, :intent, :confidence)");
    $stmt->execute([
        ':msg_id' => $assistantMsgId,
        ':conv_id' => $conversationId,
        ':content' => $responseData['content'] ?? '',
        ':type' => $responseData['type'] ?? 'text',
        ':suggestions' => isset($responseData['suggestions']) ? json_encode($responseData['suggestions']) : null,
        ':fallback' => !empty($responseData['fallback']) ? 1 : 0,
        ':intent' => $responseData['intent'] ?? null,
        ':confidence' => isset($responseData['confidence']) ? (float)$responseData['confidence'] : null,
    ]);

    sendSuccess($responseData);
} catch (Throwable $e) {
    error_log('Chatbot API error: ' . $e->getMessage());
    sendError(500, 'Error interno del servidor');
}

function generateResponse(string $message, array $context, string $conversationId): array {
    $lower = mb_strtolower($message);

    // Saludos
    if (preg_match('/\b(hola|buenas|hey|saludos|qué tal|como estás)\b/u', $lower)) {
        return [
            'id' => 'msg_' . bin2hex(random_bytes(8)),
            'type' => 'text',
            'content' => "¡Hola! 👋\n\nSoy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
            'role' => 'assistant',
            'conversation_id' => $conversationId,
            'suggestions' => ['Ayuda', 'Código de ejemplo'],
        ];
    }

    // Código / programación
    if (preg_match('/\b(código|code|php|javascript|js|python|html|css|programar|función)\b/u', $lower)) {
        return [
            'id' => 'msg_' . bin2hex(random_bytes(8)),
            'type' => 'code',
            'content' => "Aquí tienes un ejemplo básico en PHP:\n\n```php\n<?php\necho 'Hola, mundo!';\n?>\n```\n\n¿Te gustaría que profundice en algún tema específico?",
            'role' => 'assistant',
            'conversation_id' => $conversationId,
            'suggestions' => ['Más ejemplos PHP', 'JavaScript básico'],
        ];
    }

    // Ayuda / información
    if (preg_match('/\b(ayuda|help|información|qué haces|quién eres)\b/u', $lower)) {
        return [
            'id' => 'msg_' . bin2hex(random_bytes(8)),
            'type' => 'text',
            'content' => "Puedo ayudarte con:\n\n• Explicaciones generales\n• Fragmentos de código\n• Respuestas a preguntas técnicas\n\nSolo escríbeme lo que necesites.",
            'role' => 'assistant',
            'conversation_id' => $conversationId,
            'suggestions' => ['Dame un ejemplo', 'Explica la API'],
        ];
    }

    // Fallback por defecto
    return [
        'content' => 'No entendí tu pregunta',
        'intent' => 'unknown',
        'confidence' => 0.1,
        'fallback' => true,
    ];
}
