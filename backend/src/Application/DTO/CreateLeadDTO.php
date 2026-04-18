<?php

declare(strict_types=1);

namespace CRM\Application\DTO;

final readonly class CreateLeadDTO
{
    public function __construct(
        public string $fullName,
        public string $email,
        public string $phone,
        public string $source,
        public string $notes = '',
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            fullName: $data['full_name'] ?? '',
            email: $data['email'] ?? '',
            phone: $data['phone'] ?? '',
            source: $data['source'] ?? 'web',
            notes: $data['notes'] ?? '',
        );
    }
}
