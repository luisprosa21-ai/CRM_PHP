<?php

declare(strict_types=1);

namespace CRM\Domain\Entity;

use Ramsey\Uuid\Uuid;

final class Lead
{
    private function __construct(
        private readonly string $id,
        private string $fullName,
        private string $email,
        private string $phone,
        private LeadSource $source,
        private LeadStatus $status,
        private ?string $assignedTo,
        private string $notes,
        private ?float $score,
        private readonly \DateTimeImmutable $createdAt,
        private \DateTimeImmutable $updatedAt,
    ) {}

    public static function create(
        string $fullName,
        string $email,
        string $phone,
        LeadSource $source,
        string $notes = '',
    ): self {
        $now = new \DateTimeImmutable();
        return new self(
            id: Uuid::uuid4()->toString(),
            fullName: $fullName,
            email: $email,
            phone: $phone,
            source: $source,
            status: LeadStatus::New,
            assignedTo: null,
            notes: $notes,
            score: null,
            createdAt: $now,
            updatedAt: $now,
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            fullName: $data['full_name'],
            email: $data['email'],
            phone: $data['phone'],
            source: LeadSource::from($data['source']),
            status: LeadStatus::from($data['status']),
            assignedTo: $data['assigned_to'] ?? null,
            notes: $data['notes'] ?? '',
            score: isset($data['score']) ? (float) $data['score'] : null,
            createdAt: new \DateTimeImmutable($data['created_at']),
            updatedAt: new \DateTimeImmutable($data['updated_at']),
        );
    }

    public function assign(string $advisorId): void
    {
        $this->assignedTo = $advisorId;
        if ($this->status === LeadStatus::New) {
            $this->status = LeadStatus::Contacted;
        }
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function qualify(): void
    {
        if ($this->status !== LeadStatus::Contacted) {
            throw new \DomainException('Only contacted leads can be qualified.');
        }
        $this->status = LeadStatus::Qualified;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function convert(): void
    {
        if ($this->status !== LeadStatus::Qualified) {
            throw new \DomainException('Only qualified leads can be converted.');
        }
        $this->status = LeadStatus::Converted;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function reject(): void
    {
        $this->status = LeadStatus::Lost;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function updateScore(float $score): void
    {
        $this->score = max(0.0, min(100.0, $score));
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): string { return $this->id; }
    public function getFullName(): string { return $this->fullName; }
    public function getEmail(): string { return $this->email; }
    public function getPhone(): string { return $this->phone; }
    public function getSource(): LeadSource { return $this->source; }
    public function getStatus(): LeadStatus { return $this->status; }
    public function getAssignedTo(): ?string { return $this->assignedTo; }
    public function getNotes(): string { return $this->notes; }
    public function getScore(): ?float { return $this->score; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->fullName,
            'email' => $this->email,
            'phone' => $this->phone,
            'source' => $this->source->value,
            'status' => $this->status->value,
            'assigned_to' => $this->assignedTo,
            'notes' => $this->notes,
            'score' => $this->score,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
        ];
    }
}
