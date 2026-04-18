<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Controller;

use CRM\Application\DTO\LoginDTO;
use CRM\Application\DTO\RegisterDTO;
use CRM\Application\UseCase\Auth\LoginUseCase;
use CRM\Application\UseCase\Auth\RegisterUseCase;

final class AuthController
{
    public function __construct(
        private readonly LoginUseCase $loginUseCase,
        private readonly RegisterUseCase $registerUseCase,
    ) {}

    public function login(array $params): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $dto = LoginDTO::fromArray($input);
            $result = $this->loginUseCase->execute($dto);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => $e->getMessage()]);
        } catch (\DomainException $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized', 'message' => $e->getMessage()]);
        }
    }

    public function register(array $params): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $dto = RegisterDTO::fromArray($input);
            $result = $this->registerUseCase->execute($dto);

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
}
