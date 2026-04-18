<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Audit;

use CRM\Domain\Entity\AuditLog;
use CRM\Domain\Repository\AuditLogRepositoryInterface;

final class LogActionUseCase
{
    public function __construct(
        private readonly AuditLogRepositoryInterface $auditLogRepository,
    ) {}

    public function execute(
        string $userId,
        string $action,
        string $entityType,
        string $entityId,
        ?array $oldValue = null,
        ?array $newValue = null,
        string $ipAddress = '',
        string $userAgent = '',
    ): void {
        $auditLog = AuditLog::create(
            userId: $userId,
            action: $action,
            entityType: $entityType,
            entityId: $entityId,
            oldValue: $oldValue,
            newValue: $newValue,
            ipAddress: $ipAddress,
            userAgent: $userAgent,
        );

        $this->auditLogRepository->save($auditLog);
    }
}
