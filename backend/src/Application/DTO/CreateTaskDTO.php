<?php

declare(strict_types=1);

namespace CRM\Application\DTO;

final readonly class CreateTaskDTO
{
    public function __construct(
        public string $assignedTo,
        public string $title,
        public string $description,
        public string $priority = 'medium',
        public string $dueDate = '',
        public ?string $expedienteId = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            assignedTo: $data['assigned_to'] ?? '',
            title: $data['title'] ?? '',
            description: $data['description'] ?? '',
            priority: $data['priority'] ?? 'medium',
            dueDate: $data['due_date'] ?? '',
            expedienteId: $data['expediente_id'] ?? null,
        );
    }
}
