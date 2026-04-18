<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Repository;

use CRM\Domain\Entity\Lead;
use CRM\Domain\Entity\LeadStatus;
use CRM\Domain\Repository\LeadRepositoryInterface;
use CRM\Infrastructure\Database\QueryBuilder;

final class MySQLLeadRepository implements LeadRepositoryInterface
{
    public function __construct(
        private readonly QueryBuilder $queryBuilder,
    ) {}

    public function findById(string $id): ?Lead
    {
        $row = $this->queryBuilder->table('leads')->where('id', '=', $id)->first();
        return $row ? Lead::fromArray($row) : null;
    }

    public function findAll(int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $rows = $this->queryBuilder->table('leads')
            ->orderBy('created_at', 'DESC')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        return array_map(fn(array $row) => Lead::fromArray($row)->toArray(), $rows);
    }

    public function findByStatus(LeadStatus $status, int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $rows = $this->queryBuilder->table('leads')
            ->where('status', '=', $status->value)
            ->orderBy('created_at', 'DESC')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        return array_map(fn(array $row) => Lead::fromArray($row)->toArray(), $rows);
    }

    public function findByAssignee(string $assigneeId, int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $rows = $this->queryBuilder->table('leads')
            ->where('assigned_to', '=', $assigneeId)
            ->orderBy('created_at', 'DESC')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        return array_map(fn(array $row) => Lead::fromArray($row)->toArray(), $rows);
    }

    public function save(Lead $lead): void
    {
        $existing = $this->findById($lead->getId());
        $data = [
            'id' => $lead->getId(),
            'full_name' => $lead->getFullName(),
            'email' => $lead->getEmail(),
            'phone' => $lead->getPhone(),
            'source' => $lead->getSource()->value,
            'status' => $lead->getStatus()->value,
            'assigned_to' => $lead->getAssignedTo(),
            'notes' => $lead->getNotes(),
            'score' => $lead->getScore(),
            'created_at' => $lead->getCreatedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $lead->getUpdatedAt()->format('Y-m-d H:i:s'),
        ];

        if ($existing) {
            $this->queryBuilder->update('leads', $data, 'id', $lead->getId());
        } else {
            $this->queryBuilder->insert('leads', $data);
        }
    }

    public function delete(string $id): void
    {
        $this->queryBuilder->delete('leads', 'id', $id);
    }

    public function countByStatus(): array
    {
        $rows = $this->queryBuilder->raw(
            'SELECT status, COUNT(*) as count FROM leads GROUP BY status'
        );

        $counts = [];
        foreach ($rows as $row) {
            $counts[$row['status']] = (int) $row['count'];
        }
        return $counts;
    }
}
