<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Controller;

use CRM\Application\UseCase\Audit\GetAuditTrailUseCase;

final class AuditController
{
    public function __construct(
        private readonly GetAuditTrailUseCase $getAuditTrailUseCase,
    ) {}

    public function index(array $params): void
    {
        try {
            $entityType = $_GET['entity_type'] ?? null;
            $entityId = $_GET['entity_id'] ?? null;
            $userId = $_GET['user_id'] ?? null;

            $result = $this->getAuditTrailUseCase->execute($entityType, $entityId, $userId);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log($e->getMessage()); echo json_encode(['error' => 'Server Error', 'message' => 'An internal error occurred.']);
        }
    }
}
