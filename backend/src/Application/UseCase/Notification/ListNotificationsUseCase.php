<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Notification;

use CRM\Domain\Repository\NotificationRepositoryInterface;

final class ListNotificationsUseCase
{
    public function __construct(
        private readonly NotificationRepositoryInterface $notificationRepository,
    ) {}

    public function execute(string $userId, bool $unreadOnly = false): array
    {
        if ($unreadOnly) {
            return $this->notificationRepository->findUnread($userId);
        }

        return $this->notificationRepository->findByUser($userId);
    }
}
