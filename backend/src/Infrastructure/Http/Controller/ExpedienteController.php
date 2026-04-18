<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Controller;

use CRM\Application\DTO\CreateExpedienteDTO;
use CRM\Application\UseCase\Expediente\CreateExpedienteUseCase;
use CRM\Application\UseCase\Expediente\GetExpedienteUseCase;
use CRM\Application\UseCase\Expediente\ListExpedientesUseCase;
use CRM\Application\UseCase\Expediente\ScoreExpedienteUseCase;
use CRM\Application\UseCase\Expediente\TransitionExpedienteUseCase;

final class ExpedienteController
{
    public function __construct(
        private readonly CreateExpedienteUseCase $createExpedienteUseCase,
        private readonly GetExpedienteUseCase $getExpedienteUseCase,
        private readonly ListExpedientesUseCase $listExpedientesUseCase,
        private readonly TransitionExpedienteUseCase $transitionExpedienteUseCase,
        private readonly ScoreExpedienteUseCase $scoreExpedienteUseCase,
    ) {}

    public function index(array $params): void
    {
        try {
            $page = (int) ($_GET['page'] ?? 1);
            $perPage = (int) ($_GET['per_page'] ?? 20);
            $status = $_GET['status'] ?? null;
            $advisorId = $_GET['advisor_id'] ?? null;

            $result = $this->listExpedientesUseCase->execute($page, $perPage, $status, $advisorId);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log($e->getMessage()); echo json_encode(['error' => 'Server Error', 'message' => 'An internal error occurred.']);
        }
    }

    public function show(array $params): void
    {
        try {
            $result = $this->getExpedienteUseCase->execute($params['id']);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\DomainException $e) {
            http_response_code(404);
            echo json_encode(['error' => 'Not Found', 'message' => $e->getMessage()]);
        }
    }

    public function store(array $params): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $dto = CreateExpedienteDTO::fromArray($input);
            $result = $this->createExpedienteUseCase->execute($dto);

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

    public function transition(array $params): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $result = $this->transitionExpedienteUseCase->execute($params['id'], $input['status'] ?? '');

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\DomainException $e) {
            http_response_code(422);
            echo json_encode(['error' => 'Unprocessable Entity', 'message' => $e->getMessage()]);
        }
    }

    public function score(array $params): void
    {
        try {
            $result = $this->scoreExpedienteUseCase->execute($params['id']);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\DomainException $e) {
            http_response_code(422);
            echo json_encode(['error' => 'Unprocessable Entity', 'message' => $e->getMessage()]);
        }
    }
}
