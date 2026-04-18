<?php

declare(strict_types=1);

namespace CRM\Domain\Entity;

use Ramsey\Uuid\Uuid;

final class Expediente
{
    /** Valid state transitions map */
    private const TRANSITIONS = [
        'nuevo' => ['en_estudio'],
        'en_estudio' => ['documentacion_pendiente', 'rechazado'],
        'documentacion_pendiente' => ['enviado_a_banco'],
        'enviado_a_banco' => ['oferta_recibida', 'rechazado'],
        'oferta_recibida' => ['negociacion', 'rechazado'],
        'negociacion' => ['aprobado', 'rechazado'],
        'aprobado' => ['firmado'],
        'firmado' => [],
        'rechazado' => [],
    ];

    private function __construct(
        private readonly string $id,
        private readonly string $clientId,
        private string $advisorId,
        private float $propertyValue,
        private float $requestedAmount,
        private int $term,
        private ExpedienteStatus $status,
        private ?float $score,
        private string $notes,
        private readonly \DateTimeImmutable $createdAt,
        private \DateTimeImmutable $updatedAt,
    ) {}

    public static function create(
        string $clientId,
        string $advisorId,
        float $propertyValue,
        float $requestedAmount,
        int $term,
        string $notes = '',
    ): self {
        if ($requestedAmount > $propertyValue) {
            throw new \DomainException('Requested amount cannot exceed property value.');
        }
        if ($term < 1 || $term > 480) {
            throw new \DomainException('Term must be between 1 and 480 months.');
        }

        $now = new \DateTimeImmutable();
        return new self(
            id: Uuid::uuid4()->toString(),
            clientId: $clientId,
            advisorId: $advisorId,
            propertyValue: $propertyValue,
            requestedAmount: $requestedAmount,
            term: $term,
            status: ExpedienteStatus::Nuevo,
            score: null,
            notes: $notes,
            createdAt: $now,
            updatedAt: $now,
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            clientId: $data['client_id'],
            advisorId: $data['advisor_id'],
            propertyValue: (float) $data['property_value'],
            requestedAmount: (float) $data['requested_amount'],
            term: (int) $data['term'],
            status: ExpedienteStatus::from($data['status']),
            score: isset($data['score']) ? (float) $data['score'] : null,
            notes: $data['notes'] ?? '',
            createdAt: new \DateTimeImmutable($data['created_at']),
            updatedAt: new \DateTimeImmutable($data['updated_at']),
        );
    }

    public function transition(ExpedienteStatus $newStatus): void
    {
        $allowed = self::TRANSITIONS[$this->status->value] ?? [];
        if (!in_array($newStatus->value, $allowed, true)) {
            throw new \DomainException(
                "Invalid transition from '{$this->status->value}' to '{$newStatus->value}'."
            );
        }
        $this->status = $newStatus;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function calculateLTV(): float
    {
        if ($this->propertyValue <= 0) {
            return 0.0;
        }
        return round(($this->requestedAmount / $this->propertyValue) * 100, 2);
    }

    public function addNote(string $note): void
    {
        $timestamp = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->notes .= "\n[{$timestamp}] {$note}";
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function setScore(float $score): void
    {
        $this->score = max(0.0, min(100.0, $score));
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): string { return $this->id; }
    public function getClientId(): string { return $this->clientId; }
    public function getAdvisorId(): string { return $this->advisorId; }
    public function getPropertyValue(): float { return $this->propertyValue; }
    public function getRequestedAmount(): float { return $this->requestedAmount; }
    public function getTerm(): int { return $this->term; }
    public function getStatus(): ExpedienteStatus { return $this->status; }
    public function getScore(): ?float { return $this->score; }
    public function getNotes(): string { return $this->notes; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    public static function getAllowedTransitions(ExpedienteStatus $status): array
    {
        return self::TRANSITIONS[$status->value] ?? [];
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'client_id' => $this->clientId,
            'advisor_id' => $this->advisorId,
            'property_value' => $this->propertyValue,
            'requested_amount' => $this->requestedAmount,
            'term' => $this->term,
            'status' => $this->status->value,
            'score' => $this->score,
            'notes' => $this->notes,
            'ltv' => $this->calculateLTV(),
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
        ];
    }
}
