<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Repository;

use CRM\Domain\Entity\Task;
use CRM\Domain\Repository\TaskRepositoryInterface;
use CRM\Infrastructure\Database\QueryBuilder;

final class MySQLTaskRepository implements TaskRepositoryInterface
{
    public function __construct(
        private readonly QueryBuilder $queryBuilder,
    ) {}

    public function findById(string $id): ?Task
    {
        $row = $this->queryBuilder->table('tasks')->where('id', '=', $id)->first();
        return $row ? Task::fromArray($row) : null;
    }

    public function findByAssignee(string $assigneeId, int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $rows = $this->queryBuilder->table('tasks')
            ->where('assigned_to', '=', $assigneeId)
            ->orderBy('due_date', 'ASC')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        return array_map(fn(array $row) => Task::fromArray($row)->toArray(), $rows);
    }

    public function findByExpediente(string $expedienteId): array
    {
        $rows = $this->queryBuilder->table('tasks')
            ->where('expediente_id', '=', $expedienteId)
            ->orderBy('due_date', 'ASC')
            ->get();

        return array_map(fn(array $row) => Task::fromArray($row)->toArray(), $rows);
    }

    public function findOverdue(): array
    {
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $rows = $this->queryBuilder->raw(
            "SELECT * FROM tasks WHERE due_date < :now AND status NOT IN ('completed', 'cancelled') ORDER BY due_date ASC",
            ['now' => $now]
        );

        return array_map(fn(array $row) => Task::fromArray($row)->toArray(), $rows);
    }

    public function save(Task $task): void
    {
        $existing = $this->findById($task->getId());
        $data = [
            'id' => $task->getId(),
            'expediente_id' => $task->getExpedienteId(),
            'assigned_to' => $task->getAssignedTo(),
            'title' => $task->getTitle(),
            'description' => $task->getDescription(),
            'priority' => $task->getPriority()->value,
            'status' => $task->getStatus()->value,
            'due_date' => $task->getDueDate()->format('Y-m-d H:i:s'),
            'completed_at' => $task->getCompletedAt()?->format('Y-m-d H:i:s'),
            'created_at' => $task->getCreatedAt()->format('Y-m-d H:i:s'),
        ];

        if ($existing) {
            $this->queryBuilder->update('tasks', $data, 'id', $task->getId());
        } else {
            $this->queryBuilder->insert('tasks', $data);
        }
    }

    public function delete(string $id): void
    {
        $this->queryBuilder->delete('tasks', 'id', $id);
    }
}
