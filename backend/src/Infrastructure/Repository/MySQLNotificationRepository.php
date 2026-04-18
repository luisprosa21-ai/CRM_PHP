<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Repository;

use CRM\Domain\Entity\Notification;
use CRM\Domain\Repository\NotificationRepositoryInterface;
use CRM\Infrastructure\Database\QueryBuilder;

final class MySQLNotificationRepository implements NotificationRepositoryInterface
{
    public function __construct(
        private readonly QueryBuilder $queryBuilder,
    ) {}

    public function findById(string $id): ?Notification
    {
        $row = $this->queryBuilder->table('notifications')->where('id', '=', $id)->first();
        return $row ? Notification::fromArray($row) : null;
    }

    public function findByUser(string $userId, int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $rows = $this->queryBuilder->table('notifications')
            ->where('user_id', '=', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        return array_map(fn(array $row) => Notification::fromArray($row)->toArray(), $rows);
    }

    public function findUnread(string $userId): array
    {
        $rows = $this->queryBuilder->raw(
            "SELECT * FROM notifications WHERE user_id = :user_id AND status != 'read' ORDER BY created_at DESC",
            ['user_id' => $userId]
        );

        return array_map(fn(array $row) => Notification::fromArray($row)->toArray(), $rows);
    }

    public function save(Notification $notification): void
    {
        $existing = $this->findById($notification->getId());
        $data = [
            'id' => $notification->getId(),
            'user_id' => $notification->getUserId(),
            'type' => $notification->getType()->value,
            'channel' => $notification->getChannel(),
            'subject' => $notification->getSubject(),
            'message' => $notification->getMessage(),
            'status' => $notification->getStatus()->value,
            'sent_at' => $notification->getSentAt()?->format('Y-m-d H:i:s'),
            'read_at' => $notification->getReadAt()?->format('Y-m-d H:i:s'),
            'created_at' => $notification->getCreatedAt()->format('Y-m-d H:i:s'),
        ];

        if ($existing) {
            $this->queryBuilder->update('notifications', $data, 'id', $notification->getId());
        } else {
            $this->queryBuilder->insert('notifications', $data);
        }
    }

    public function markAsRead(string $id): void
    {
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->queryBuilder->update('notifications', [
            'status' => 'read',
            'read_at' => $now,
        ], 'id', $id);
    }
}
