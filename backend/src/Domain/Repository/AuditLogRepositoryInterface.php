<?php

declare(strict_types=1);

namespace CRM\Domain\Repository;

use CRM\Domain\Entity\AuditLog;
use CRM\Domain\ValueObject\DateRange;

interface AuditLogRepositoryInterface
{
    public function findByEntity(string $entityType, string $entityId): array;
    public function findByUser(string $userId, int $page = 1, int $perPage = 20): array;
    public function findByDateRange(DateRange $dateRange, int $page = 1, int $perPage = 50): array;
    public function save(AuditLog $auditLog): void;
}
