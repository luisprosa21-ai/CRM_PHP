<?php

declare(strict_types=1);

namespace CRM\Application\DTO;

final readonly class CreateOfferDTO
{
    public function __construct(
        public string $expedienteId,
        public string $bankId,
        public string $bankName,
        public float $interestRate,
        public int $term,
        public float $monthlyPayment,
        public float $totalCost,
        public string $conditions = '',
        public int $validDays = 30,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            expedienteId: $data['expediente_id'] ?? '',
            bankId: $data['bank_id'] ?? '',
            bankName: $data['bank_name'] ?? '',
            interestRate: (float) ($data['interest_rate'] ?? 0),
            term: (int) ($data['term'] ?? 0),
            monthlyPayment: (float) ($data['monthly_payment'] ?? 0),
            totalCost: (float) ($data['total_cost'] ?? 0),
            conditions: $data['conditions'] ?? '',
            validDays: (int) ($data['valid_days'] ?? 30),
        );
    }
}
