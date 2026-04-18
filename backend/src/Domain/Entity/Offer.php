<?php

declare(strict_types=1);

namespace CRM\Domain\Entity;

use Ramsey\Uuid\Uuid;

final class Offer
{
    private function __construct(
        private readonly string $id,
        private readonly string $expedienteId,
        private readonly string $bankId,
        private readonly string $bankName,
        private readonly float $interestRate,
        private readonly int $term,
        private readonly float $monthlyPayment,
        private readonly float $totalCost,
        private readonly string $conditions,
        private OfferStatus $status,
        private readonly \DateTimeImmutable $receivedAt,
        private readonly \DateTimeImmutable $expiresAt,
    ) {}

    public static function create(
        string $expedienteId,
        string $bankId,
        string $bankName,
        float $interestRate,
        int $term,
        float $monthlyPayment,
        float $totalCost,
        string $conditions = '',
        int $validDays = 30,
    ): self {
        $now = new \DateTimeImmutable();
        return new self(
            id: Uuid::uuid4()->toString(),
            expedienteId: $expedienteId,
            bankId: $bankId,
            bankName: $bankName,
            interestRate: $interestRate,
            term: $term,
            monthlyPayment: $monthlyPayment,
            totalCost: $totalCost,
            conditions: $conditions,
            status: OfferStatus::Pending,
            receivedAt: $now,
            expiresAt: $now->modify("+{$validDays} days"),
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            expedienteId: $data['expediente_id'],
            bankId: $data['bank_id'],
            bankName: $data['bank_name'],
            interestRate: (float) $data['interest_rate'],
            term: (int) $data['term'],
            monthlyPayment: (float) $data['monthly_payment'],
            totalCost: (float) $data['total_cost'],
            conditions: $data['conditions'] ?? '',
            status: OfferStatus::from($data['status']),
            receivedAt: new \DateTimeImmutable($data['received_at']),
            expiresAt: new \DateTimeImmutable($data['expires_at']),
        );
    }

    public function accept(): void
    {
        if ($this->status !== OfferStatus::Pending) {
            throw new \DomainException('Only pending offers can be accepted.');
        }
        if ($this->isExpired()) {
            throw new \DomainException('Cannot accept an expired offer.');
        }
        $this->status = OfferStatus::Accepted;
    }

    public function reject(): void
    {
        if ($this->status !== OfferStatus::Pending) {
            throw new \DomainException('Only pending offers can be rejected.');
        }
        $this->status = OfferStatus::Rejected;
    }

    public function isExpired(): bool
    {
        return new \DateTimeImmutable() > $this->expiresAt;
    }

    public function getId(): string { return $this->id; }
    public function getExpedienteId(): string { return $this->expedienteId; }
    public function getBankId(): string { return $this->bankId; }
    public function getBankName(): string { return $this->bankName; }
    public function getInterestRate(): float { return $this->interestRate; }
    public function getTerm(): int { return $this->term; }
    public function getMonthlyPayment(): float { return $this->monthlyPayment; }
    public function getTotalCost(): float { return $this->totalCost; }
    public function getConditions(): string { return $this->conditions; }
    public function getStatus(): OfferStatus { return $this->status; }
    public function getReceivedAt(): \DateTimeImmutable { return $this->receivedAt; }
    public function getExpiresAt(): \DateTimeImmutable { return $this->expiresAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'expediente_id' => $this->expedienteId,
            'bank_id' => $this->bankId,
            'bank_name' => $this->bankName,
            'interest_rate' => $this->interestRate,
            'term' => $this->term,
            'monthly_payment' => $this->monthlyPayment,
            'total_cost' => $this->totalCost,
            'conditions' => $this->conditions,
            'status' => $this->status->value,
            'is_expired' => $this->isExpired(),
            'received_at' => $this->receivedAt->format('Y-m-d H:i:s'),
            'expires_at' => $this->expiresAt->format('Y-m-d H:i:s'),
        ];
    }
}
