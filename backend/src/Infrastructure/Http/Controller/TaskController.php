<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Controller;

use CRM\Application\DTO\CreateTaskDTO;
use CRM\Application\UseCase\Task\CompleteTaskUseCase;
use CRM\Application\UseCase\Task\CreateTaskUseCase;
use CRM\Application\UseCase\Task\ListTasksUseCase;

final class TaskController
{
    public function __construct(
        private readonly CreateTaskUseCase $createTaskUseCase,
        private readonly CompleteTaskUseCase $completeTaskUseCase,
        private readonly ListTasksUseCase $listTasksUseCase,
    ) {}

    public function index(array $params): void
    {
        try {
            $assigneeId = $_GET['assignee_id'] ?? null;
            $expedienteId = $_GET['expediente_id'] ?? null;
            $result = $this->listTasksUseCase->execute($assigneeId, $expedienteId);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log($e->getMessage()); echo json_encode(['error' => 'Server Error', 'message' => 'An internal error occurred.']);
        }
    }

    public function store(array $params): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $dto = CreateTaskDTO::fromArray($input);
            $result = $this->createTaskUseCase->execute($dto);

            http_response_code(201);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => $e->getMessage()]);
        }
    }

    public function complete(array $params): void
    {
        try {
            $result = $this->completeTaskUseCase->execute($params['id']);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\DomainException $e) {
            http_response_code(422);
            echo json_encode(['error' => 'Unprocessable Entity', 'message' => $e->getMessage()]);
        }
    }
}
