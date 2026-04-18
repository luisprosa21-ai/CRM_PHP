<?php

declare(strict_types=1);

namespace CRM\Application\DTO;

final readonly class CreateClientDTO
{
    public function __construct(
        public string $firstName,
        public string $lastName,
        public string $email,
        public string $phone,
        public string $documentType,
        public string $documentNumber,
        public string $address = '',
        public string $city = '',
        public string $country = 'ES',
        public string $employmentType = '',
        public float $monthlyIncome = 0.0,
        public ?string $leadId = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            firstName: $data['first_name'] ?? '',
            lastName: $data['last_name'] ?? '',
            email: $data['email'] ?? '',
            phone: $data['phone'] ?? '',
            documentType: $data['document_type'] ?? 'dni',
            documentNumber: $data['document_number'] ?? '',
            address: $data['address'] ?? '',
            city: $data['city'] ?? '',
            country: $data['country'] ?? 'ES',
            employmentType: $data['employment_type'] ?? '',
            monthlyIncome: (float) ($data['monthly_income'] ?? 0),
            leadId: $data['lead_id'] ?? null,
        );
    }
}
