<?php

declare(strict_types=1);

namespace CRM\Domain\Entity;

use Ramsey\Uuid\Uuid;

final class Notification
{
    private function __construct(
        private readonly string $id,
        private readonly string $userId,
        private NotificationType $type,
        private string $channel,
        private string $subject,
        private string $message,
        private NotificationStatus $status,
        private ?\DateTimeImmutable $sentAt,
        private ?\DateTimeImmutable $readAt,
        private readonly \DateTimeImmutable $createdAt,
    ) {}

    public static function create(
        string $userId,
        NotificationType $type,
        string $channel,
        string $subject,
        string $message,
    ): self {
        return new self(
            id: Uuid::uuid4()->toString(),
            userId: $userId,
            type: $type,
            channel: $channel,
            subject: $subject,
            message: $message,
            status: NotificationStatus::Pending,
            sentAt: null,
            readAt: null,
            createdAt: new \DateTimeImmutable(),
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            userId: $data['user_id'],
            type: NotificationType::from($data['type']),
            channel: $data['channel'] ?? '',
            subject: $data['subject'],
            message: $data['message'],
            status: NotificationStatus::from($data['status']),
            sentAt: isset($data['sent_at']) ? new \DateTimeImmutable($data['sent_at']) : null,
            readAt: isset($data['read_at']) ? new \DateTimeImmutable($data['read_at']) : null,
            createdAt: new \DateTimeImmutable($data['created_at']),
        );
    }

    public function markSent(): void
    {
        $this->status = NotificationStatus::Sent;
        $this->sentAt = new \DateTimeImmutable();
    }

    public function markFailed(): void
    {
        $this->status = NotificationStatus::Failed;
    }

    public function markRead(): void
    {
        $this->status = NotificationStatus::Read;
        $this->readAt = new \DateTimeImmutable();
    }

    public function getId(): string { return $this->id; }
    public function getUserId(): string { return $this->userId; }
    public function getType(): NotificationType { return $this->type; }
    public function getChannel(): string { return $this->channel; }
    public function getSubject(): string { return $this->subject; }
    public function getMessage(): string { return $this->message; }
    public function getStatus(): NotificationStatus { return $this->status; }
    public function getSentAt(): ?\DateTimeImmutable { return $this->sentAt; }
    public function getReadAt(): ?\DateTimeImmutable { return $this->readAt; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->userId,
            'type' => $this->type->value,
            'channel' => $this->channel,
            'subject' => $this->subject,
            'message' => $this->message,
            'status' => $this->status->value,
            'sent_at' => $this->sentAt?->format('Y-m-d H:i:s'),
            'read_at' => $this->readAt?->format('Y-m-d H:i:s'),
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}
