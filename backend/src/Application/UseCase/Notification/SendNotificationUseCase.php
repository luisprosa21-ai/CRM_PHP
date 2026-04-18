<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Notification;

use CRM\Domain\Entity\Notification;
use CRM\Domain\Entity\NotificationType;
use CRM\Domain\Repository\NotificationRepositoryInterface;

final class SendNotificationUseCase
{
    public function __construct(
        private readonly NotificationRepositoryInterface $notificationRepository,
    ) {}

    public function execute(
        string $userId,
        string $type,
        string $channel,
        string $subject,
        string $message,
    ): array {
        $notification = Notification::create(
            userId: $userId,
            type: NotificationType::from($type),
            channel: $channel,
            subject: $subject,
            message: $message,
        );

        // For internal notifications, mark as sent immediately
        if ($notification->getType() === NotificationType::Internal) {
            $notification->markSent();
        }

        $this->notificationRepository->save($notification);

        return $notification->toArray();
    }
}
