<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Repository;

use CRM\Domain\Entity\AuditLog;
use CRM\Domain\Repository\AuditLogRepositoryInterface;
use CRM\Domain\ValueObject\DateRange;
use CRM\Infrastructure\Database\QueryBuilder;

final class MySQLAuditLogRepository implements AuditLogRepositoryInterface
{
    public function __construct(
        private readonly QueryBuilder $queryBuilder,
    ) {}

    public function findByEntity(string $entityType, string $entityId): array
    {
        $rows = $this->queryBuilder->raw(
            'SELECT * FROM audit_logs WHERE entity_type = :entity_type AND entity_id = :entity_id ORDER BY created_at DESC',
            ['entity_type' => $entityType, 'entity_id' => $entityId]
        );

        return array_map(fn(array $row) => AuditLog::fromArray($row)->toArray(), $rows);
    }

    public function findByUser(string $userId, int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $rows = $this->queryBuilder->table('audit_logs')
            ->where('user_id', '=', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        return array_map(fn(array $row) => AuditLog::fromArray($row)->toArray(), $rows);
    }

    public function findByDateRange(DateRange $dateRange, int $page = 1, int $perPage = 50): array
    {
        $offset = ($page - 1) * $perPage;
        $rows = $this->queryBuilder->raw(
            'SELECT * FROM audit_logs WHERE created_at BETWEEN :start AND :end ORDER BY created_at DESC LIMIT :limit OFFSET :offset',
            [
                'start' => $dateRange->getStart()->format('Y-m-d H:i:s'),
                'end' => $dateRange->getEnd()->format('Y-m-d H:i:s'),
                'limit' => $perPage,
                'offset' => $offset,
            ]
        );

        return array_map(fn(array $row) => AuditLog::fromArray($row)->toArray(), $rows);
    }

    public function save(AuditLog $auditLog): void
    {
        $this->queryBuilder->insert('audit_logs', [
            'id' => $auditLog->getId(),
            'user_id' => $auditLog->getUserId(),
            'action' => $auditLog->getAction(),
            'entity_type' => $auditLog->getEntityType(),
            'entity_id' => $auditLog->getEntityId(),
            'old_value' => $auditLog->getOldValue() !== null ? json_encode($auditLog->getOldValue()) : null,
            'new_value' => $auditLog->getNewValue() !== null ? json_encode($auditLog->getNewValue()) : null,
            'ip_address' => $auditLog->getIpAddress(),
            'user_agent' => $auditLog->getUserAgent(),
            'created_at' => $auditLog->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
    }
}
