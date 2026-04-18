<?php

declare(strict_types=1);

namespace CRM\Domain\Entity;

use Ramsey\Uuid\Uuid;

final class AuditLog
{
    private function __construct(
        private readonly string $id,
        private readonly string $userId,
        private readonly string $action,
        private readonly string $entityType,
        private readonly string $entityId,
        private readonly ?array $oldValue,
        private readonly ?array $newValue,
        private readonly string $ipAddress,
        private readonly string $userAgent,
        private readonly \DateTimeImmutable $createdAt,
    ) {}

    public static function create(
        string $userId,
        string $action,
        string $entityType,
        string $entityId,
        ?array $oldValue = null,
        ?array $newValue = null,
        string $ipAddress = '',
        string $userAgent = '',
    ): self {
        return new self(
            id: Uuid::uuid4()->toString(),
            userId: $userId,
            action: $action,
            entityType: $entityType,
            entityId: $entityId,
            oldValue: $oldValue,
            newValue: $newValue,
            ipAddress: $ipAddress,
            userAgent: $userAgent,
            createdAt: new \DateTimeImmutable(),
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            userId: $data['user_id'],
            action: $data['action'],
            entityType: $data['entity_type'],
            entityId: $data['entity_id'],
            oldValue: isset($data['old_value']) ? json_decode($data['old_value'], true) : null,
            newValue: isset($data['new_value']) ? json_decode($data['new_value'], true) : null,
            ipAddress: $data['ip_address'] ?? '',
            userAgent: $data['user_agent'] ?? '',
            createdAt: new \DateTimeImmutable($data['created_at']),
        );
    }

    public function getId(): string { return $this->id; }
    public function getUserId(): string { return $this->userId; }
    public function getAction(): string { return $this->action; }
    public function getEntityType(): string { return $this->entityType; }
    public function getEntityId(): string { return $this->entityId; }
    public function getOldValue(): ?array { return $this->oldValue; }
    public function getNewValue(): ?array { return $this->newValue; }
    public function getIpAddress(): string { return $this->ipAddress; }
    public function getUserAgent(): string { return $this->userAgent; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->userId,
            'action' => $this->action,
            'entity_type' => $this->entityType,
            'entity_id' => $this->entityId,
            'old_value' => $this->oldValue,
            'new_value' => $this->newValue,
            'ip_address' => $this->ipAddress,
            'user_agent' => $this->userAgent,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}
