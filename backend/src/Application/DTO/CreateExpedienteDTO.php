<?php

declare(strict_types=1);

namespace CRM\Application\DTO;

final readonly class CreateExpedienteDTO
{
    public function __construct(
        public string $clientId,
        public string $advisorId,
        public float $propertyValue,
        public float $requestedAmount,
        public int $term,
        public string $notes = '',
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            clientId: $data['client_id'] ?? '',
            advisorId: $data['advisor_id'] ?? '',
            propertyValue: (float) ($data['property_value'] ?? 0),
            requestedAmount: (float) ($data['requested_amount'] ?? 0),
            term: (int) ($data['term'] ?? 0),
            notes: $data['notes'] ?? '',
        );
    }
}
