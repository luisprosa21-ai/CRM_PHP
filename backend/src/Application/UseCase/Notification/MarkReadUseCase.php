<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Notification;

use CRM\Domain\Repository\NotificationRepositoryInterface;

final class MarkReadUseCase
{
    public function __construct(
        private readonly NotificationRepositoryInterface $notificationRepository,
    ) {}

    public function execute(string $notificationId): void
    {
        $notification = $this->notificationRepository->findById($notificationId);
        if ($notification === null) {
            throw new \DomainException('Notification not found.');
        }

        $this->notificationRepository->markAsRead($notificationId);
    }
}
