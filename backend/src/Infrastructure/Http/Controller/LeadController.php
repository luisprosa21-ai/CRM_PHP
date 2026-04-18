<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Controller;

use CRM\Application\DTO\CreateLeadDTO;
use CRM\Application\UseCase\Lead\AssignLeadUseCase;
use CRM\Application\UseCase\Lead\ConvertLeadUseCase;
use CRM\Application\UseCase\Lead\CreateLeadUseCase;
use CRM\Application\UseCase\Lead\ListLeadsUseCase;
use CRM\Application\UseCase\Lead\QualifyLeadUseCase;

final class LeadController
{
    public function __construct(
        private readonly CreateLeadUseCase $createLeadUseCase,
        private readonly AssignLeadUseCase $assignLeadUseCase,
        private readonly QualifyLeadUseCase $qualifyLeadUseCase,
        private readonly ConvertLeadUseCase $convertLeadUseCase,
        private readonly ListLeadsUseCase $listLeadsUseCase,
    ) {}

    public function index(array $params): void
    {
        try {
            $page = (int) ($_GET['page'] ?? 1);
            $perPage = (int) ($_GET['per_page'] ?? 20);
            $status = $_GET['status'] ?? null;
            $assignee = $_GET['assignee'] ?? null;

            $result = $this->listLeadsUseCase->execute($page, $perPage, $status, $assignee);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log($e->getMessage()); echo json_encode(['error' => 'Server Error', 'message' => 'An internal error occurred.']);
        }
    }

    public function show(array $params): void
    {
        // Listed via index; individual show reuses list with ID filter
        http_response_code(200);
        echo json_encode(['success' => true, 'data' => ['id' => $params['id'] ?? '']]);
    }

    public function store(array $params): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $dto = CreateLeadDTO::fromArray($input);
            $result = $this->createLeadUseCase->execute($dto);

            http_response_code(201);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => $e->getMessage()]);
        } catch (\DomainException $e) {
            http_response_code(422);
            echo json_encode(['error' => 'Unprocessable Entity', 'message' => $e->getMessage()]);
        }
    }

    public function assign(array $params): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $result = $this->assignLeadUseCase->execute($params['id'], $input['advisor_id'] ?? '');

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\DomainException $e) {
            http_response_code(422);
            echo json_encode(['error' => 'Unprocessable Entity', 'message' => $e->getMessage()]);
        }
    }

    public function qualify(array $params): void
    {
        try {
            $result = $this->qualifyLeadUseCase->execute($params['id']);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\DomainException $e) {
            http_response_code(422);
            echo json_encode(['error' => 'Unprocessable Entity', 'message' => $e->getMessage()]);
        }
    }

    public function convert(array $params): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $result = $this->convertLeadUseCase->execute($params['id'], $input);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\DomainException $e) {
            http_response_code(422);
            echo json_encode(['error' => 'Unprocessable Entity', 'message' => $e->getMessage()]);
        }
    }
}
