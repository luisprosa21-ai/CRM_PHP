<?php

declare(strict_types=1);

namespace CRM\Domain\Event;

use Ramsey\Uuid\Uuid;

abstract class DomainEvent
{
    public readonly string $id;
    public readonly \DateTimeImmutable $occurredAt;

    public function __construct(
        public readonly array $payload = [],
    ) {
        $this->id = Uuid::uuid4()->toString();
        $this->occurredAt = new \DateTimeImmutable();
    }

    abstract public function getName(): string;

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->getName(),
            'occurred_at' => $this->occurredAt->format('Y-m-d H:i:s'),
            'payload' => $this->payload,
        ];
    }
}
