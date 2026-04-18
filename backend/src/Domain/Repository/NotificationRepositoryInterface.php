<?php

declare(strict_types=1);

namespace CRM\Domain\Repository;

use CRM\Domain\Entity\Notification;

interface NotificationRepositoryInterface
{
    public function findById(string $id): ?Notification;
    public function findByUser(string $userId, int $page = 1, int $perPage = 20): array;
    public function findUnread(string $userId): array;
    public function save(Notification $notification): void;
    public function markAsRead(string $id): void;
}
