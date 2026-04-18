<?php

declare(strict_types=1);

namespace CRM\Domain\Repository;

use CRM\Domain\Entity\Task;

interface TaskRepositoryInterface
{
    public function findById(string $id): ?Task;
    public function findByAssignee(string $assigneeId, int $page = 1, int $perPage = 20): array;
    public function findByExpediente(string $expedienteId): array;
    public function findOverdue(): array;
    public function save(Task $task): void;
    public function delete(string $id): void;
}
