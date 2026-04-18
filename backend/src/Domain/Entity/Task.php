<?php

declare(strict_types=1);

namespace CRM\Domain\Entity;

use Ramsey\Uuid\Uuid;

final class Task
{
    private function __construct(
        private readonly string $id,
        private ?string $expedienteId,
        private string $assignedTo,
        private string $title,
        private string $description,
        private TaskPriority $priority,
        private TaskStatus $status,
        private \DateTimeImmutable $dueDate,
        private ?\DateTimeImmutable $completedAt,
        private readonly \DateTimeImmutable $createdAt,
    ) {}

    public static function create(
        string $assignedTo,
        string $title,
        string $description,
        TaskPriority $priority,
        \DateTimeImmutable $dueDate,
        ?string $expedienteId = null,
    ): self {
        return new self(
            id: Uuid::uuid4()->toString(),
            expedienteId: $expedienteId,
            assignedTo: $assignedTo,
            title: $title,
            description: $description,
            priority: $priority,
            status: TaskStatus::Pending,
            dueDate: $dueDate,
            completedAt: null,
            createdAt: new \DateTimeImmutable(),
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            expedienteId: $data['expediente_id'] ?? null,
            assignedTo: $data['assigned_to'],
            title: $data['title'],
            description: $data['description'] ?? '',
            priority: TaskPriority::from($data['priority']),
            status: TaskStatus::from($data['status']),
            dueDate: new \DateTimeImmutable($data['due_date']),
            completedAt: isset($data['completed_at']) ? new \DateTimeImmutable($data['completed_at']) : null,
            createdAt: new \DateTimeImmutable($data['created_at']),
        );
    }

    public function start(): void
    {
        if ($this->status !== TaskStatus::Pending) {
            throw new \DomainException('Only pending tasks can be started.');
        }
        $this->status = TaskStatus::InProgress;
    }

    public function complete(): void
    {
        if ($this->status === TaskStatus::Completed || $this->status === TaskStatus::Cancelled) {
            throw new \DomainException('Task is already completed or cancelled.');
        }
        $this->status = TaskStatus::Completed;
        $this->completedAt = new \DateTimeImmutable();
    }

    public function cancel(): void
    {
        if ($this->status === TaskStatus::Completed || $this->status === TaskStatus::Cancelled) {
            throw new \DomainException('Task is already completed or cancelled.');
        }
        $this->status = TaskStatus::Cancelled;
    }

    public function isOverdue(): bool
    {
        if ($this->status === TaskStatus::Completed || $this->status === TaskStatus::Cancelled) {
            return false;
        }
        return new \DateTimeImmutable() > $this->dueDate;
    }

    public function getId(): string { return $this->id; }
    public function getExpedienteId(): ?string { return $this->expedienteId; }
    public function getAssignedTo(): string { return $this->assignedTo; }
    public function getTitle(): string { return $this->title; }
    public function getDescription(): string { return $this->description; }
    public function getPriority(): TaskPriority { return $this->priority; }
    public function getStatus(): TaskStatus { return $this->status; }
    public function getDueDate(): \DateTimeImmutable { return $this->dueDate; }
    public function getCompletedAt(): ?\DateTimeImmutable { return $this->completedAt; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'expediente_id' => $this->expedienteId,
            'assigned_to' => $this->assignedTo,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority->value,
            'status' => $this->status->value,
            'due_date' => $this->dueDate->format('Y-m-d H:i:s'),
            'completed_at' => $this->completedAt?->format('Y-m-d H:i:s'),
            'is_overdue' => $this->isOverdue(),
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}
