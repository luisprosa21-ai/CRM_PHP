<?php

declare(strict_types=1);

namespace CRM\Application\Service;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class AuthService
{
    public function __construct(
        private readonly string $secret,
        private readonly int $expiration,
        private readonly string $algorithm = 'HS256',
        private readonly string $issuer = 'crm-hipotecario',
    ) {}

    public function generateToken(string $userId, string $email, string $role): string
    {
        $now = time();
        $payload = [
            'iss' => $this->issuer,
            'sub' => $userId,
            'email' => $email,
            'role' => $role,
            'iat' => $now,
            'exp' => $now + $this->expiration,
        ];

        return JWT::encode($payload, $this->secret, $this->algorithm);
    }

    public function validateToken(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, $this->algorithm));
            return (array) $decoded;
        } catch (\Exception) {
            return null;
        }
    }

    public function getUserIdFromToken(string $token): ?string
    {
        $payload = $this->validateToken($token);
        return $payload['sub'] ?? null;
    }
}
