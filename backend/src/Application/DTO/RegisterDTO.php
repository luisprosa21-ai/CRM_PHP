<?php

declare(strict_types=1);

namespace CRM\Application\DTO;

final readonly class RegisterDTO
{
    public function __construct(
        public string $email,
        public string $password,
        public string $firstName,
        public string $lastName,
        public string $role = 'advisor',
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            email: $data['email'] ?? '',
            password: $data['password'] ?? '',
            firstName: $data['first_name'] ?? '',
            lastName: $data['last_name'] ?? '',
            role: $data['role'] ?? 'advisor',
        );
    }
}
