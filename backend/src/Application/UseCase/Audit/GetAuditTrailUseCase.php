<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Audit;

use CRM\Domain\Repository\AuditLogRepositoryInterface;

final class GetAuditTrailUseCase
{
    public function __construct(
        private readonly AuditLogRepositoryInterface $auditLogRepository,
    ) {}

    public function execute(?string $entityType = null, ?string $entityId = null, ?string $userId = null): array
    {
        if ($entityType !== null && $entityId !== null) {
            return $this->auditLogRepository->findByEntity($entityType, $entityId);
        }

        if ($userId !== null) {
            return $this->auditLogRepository->findByUser($userId);
        }

        return [];
    }
}
