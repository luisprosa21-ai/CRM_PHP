<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Middleware;

use CRM\Application\Service\AuthService;

final class AuthMiddleware
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function handle(): bool
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!str_starts_with($header, 'Bearer ')) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized', 'message' => 'Missing or invalid Authorization header.']);
            return false;
        }

        $token = substr($header, 7);
        $payload = $this->authService->validateToken($token);

        if ($payload === null) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid or expired token.']);
            return false;
        }

        // Store user context for downstream use
        $_REQUEST['_auth_user_id'] = $payload['sub'] ?? '';
        $_REQUEST['_auth_user_email'] = $payload['email'] ?? '';
        $_REQUEST['_auth_user_role'] = $payload['role'] ?? '';

        return true;
    }

    public function requireRole(string ...$roles): callable
    {
        return function () use ($roles): bool {
            if (!$this->handle()) {
                return false;
            }

            $userRole = $_REQUEST['_auth_user_role'] ?? '';
            if (!in_array($userRole, $roles, true)) {
                http_response_code(403);
                echo json_encode(['error' => 'Forbidden', 'message' => 'Insufficient permissions.']);
                return false;
            }

            return true;
        };
    }
}
