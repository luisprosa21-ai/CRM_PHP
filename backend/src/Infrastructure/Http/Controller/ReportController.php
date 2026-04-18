<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Controller;

use CRM\Application\UseCase\Report\GetDashboardUseCase;
use CRM\Application\UseCase\Report\GetPipelineUseCase;

final class ReportController
{
    public function __construct(
        private readonly GetDashboardUseCase $getDashboardUseCase,
        private readonly GetPipelineUseCase $getPipelineUseCase,
    ) {}

    public function dashboard(array $params): void
    {
        try {
            $result = $this->getDashboardUseCase->execute();

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log($e->getMessage()); echo json_encode(['error' => 'Server Error', 'message' => 'An internal error occurred.']);
        }
    }

    public function pipeline(array $params): void
    {
        try {
            $result = $this->getPipelineUseCase->execute();

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log($e->getMessage()); echo json_encode(['error' => 'Server Error', 'message' => 'An internal error occurred.']);
        }
    }
}
