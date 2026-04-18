<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Controller;

use CRM\Application\DTO\CreateClientDTO;
use CRM\Application\UseCase\Client\CreateClientUseCase;
use CRM\Application\UseCase\Client\GetClientUseCase;
use CRM\Application\UseCase\Client\ListClientsUseCase;
use CRM\Application\UseCase\Client\UpdateClientUseCase;

final class ClientController
{
    public function __construct(
        private readonly CreateClientUseCase $createClientUseCase,
        private readonly UpdateClientUseCase $updateClientUseCase,
        private readonly GetClientUseCase $getClientUseCase,
        private readonly ListClientsUseCase $listClientsUseCase,
    ) {}

    public function index(array $params): void
    {
        try {
            $page = (int) ($_GET['page'] ?? 1);
            $perPage = (int) ($_GET['per_page'] ?? 20);
            $result = $this->listClientsUseCase->execute($page, $perPage);

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
            $result = $this->getClientUseCase->execute($params['id']);

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
            $dto = CreateClientDTO::fromArray($input);
            $result = $this->createClientUseCase->execute($dto);

            http_response_code(201);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => $e->getMessage()]);
        } catch (\DomainException $e) {
            http_response_code(409);
            echo json_encode(['error' => 'Conflict', 'message' => $e->getMessage()]);
        }
    }

    public function update(array $params): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $result = $this->updateClientUseCase->execute($params['id'], $input);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\DomainException $e) {
            http_response_code(404);
            echo json_encode(['error' => 'Not Found', 'message' => $e->getMessage()]);
        }
    }
}
