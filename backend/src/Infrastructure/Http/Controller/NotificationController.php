<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Controller;

use CRM\Application\UseCase\Notification\ListNotificationsUseCase;
use CRM\Application\UseCase\Notification\MarkReadUseCase;

final class NotificationController
{
    public function __construct(
        private readonly ListNotificationsUseCase $listNotificationsUseCase,
        private readonly MarkReadUseCase $markReadUseCase,
    ) {}

    public function index(array $params): void
    {
        try {
            $userId = $_REQUEST['_auth_user_id'] ?? '';
            $unreadOnly = filter_var($_GET['unread'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $result = $this->listNotificationsUseCase->execute($userId, $unreadOnly);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log($e->getMessage()); echo json_encode(['error' => 'Server Error', 'message' => 'An internal error occurred.']);
        }
    }

    public function markRead(array $params): void
    {
        try {
            $this->markReadUseCase->execute($params['id']);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Notification marked as read.']);
        } catch (\DomainException $e) {
            http_response_code(404);
            echo json_encode(['error' => 'Not Found', 'message' => $e->getMessage()]);
        }
    }
}
