<?php

declare(strict_types=1);

namespace CRM\Domain\Entity;

use Ramsey\Uuid\Uuid;

final class Client
{
    private function __construct(
        private readonly string $id,
        private ?string $leadId,
        private string $firstName,
        private string $lastName,
        private string $email,
        private string $phone,
        private DocumentType $documentType,
        private string $documentNumber,
        private string $address,
        private string $city,
        private string $country,
        private string $employmentType,
        private float $monthlyIncome,
        private readonly \DateTimeImmutable $createdAt,
        private \DateTimeImmutable $updatedAt,
    ) {}

    public static function create(
        string $firstName,
        string $lastName,
        string $email,
        string $phone,
        DocumentType $documentType,
        string $documentNumber,
        string $address,
        string $city,
        string $country,
        string $employmentType,
        float $monthlyIncome,
        ?string $leadId = null,
    ): self {
        $now = new \DateTimeImmutable();
        return new self(
            id: Uuid::uuid4()->toString(),
            leadId: $leadId,
            firstName: $firstName,
            lastName: $lastName,
            email: $email,
            phone: $phone,
            documentType: $documentType,
            documentNumber: $documentNumber,
            address: $address,
            city: $city,
            country: $country,
            employmentType: $employmentType,
            monthlyIncome: $monthlyIncome,
            createdAt: $now,
            updatedAt: $now,
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            leadId: $data['lead_id'] ?? null,
            firstName: $data['first_name'],
            lastName: $data['last_name'],
            email: $data['email'],
            phone: $data['phone'],
            documentType: DocumentType::from($data['document_type']),
            documentNumber: $data['document_number'],
            address: $data['address'] ?? '',
            city: $data['city'] ?? '',
            country: $data['country'] ?? 'ES',
            employmentType: $data['employment_type'] ?? '',
            monthlyIncome: (float) ($data['monthly_income'] ?? 0),
            createdAt: new \DateTimeImmutable($data['created_at']),
            updatedAt: new \DateTimeImmutable($data['updated_at']),
        );
    }

    public function updateProfile(
        ?string $address = null,
        ?string $city = null,
        ?string $country = null,
        ?string $employmentType = null,
        ?float $monthlyIncome = null,
        ?string $phone = null,
    ): void {
        if ($address !== null) $this->address = $address;
        if ($city !== null) $this->city = $city;
        if ($country !== null) $this->country = $country;
        if ($employmentType !== null) $this->employmentType = $employmentType;
        if ($monthlyIncome !== null) $this->monthlyIncome = $monthlyIncome;
        if ($phone !== null) $this->phone = $phone;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function calculateDebtRatio(float $monthlyDebt): float
    {
        if ($this->monthlyIncome <= 0) {
            return 100.0;
        }
        return round(($monthlyDebt / $this->monthlyIncome) * 100, 2);
    }

    public function getId(): string { return $this->id; }
    public function getLeadId(): ?string { return $this->leadId; }
    public function getFirstName(): string { return $this->firstName; }
    public function getLastName(): string { return $this->lastName; }
    public function getFullName(): string { return "{$this->firstName} {$this->lastName}"; }
    public function getEmail(): string { return $this->email; }
    public function getPhone(): string { return $this->phone; }
    public function getDocumentType(): DocumentType { return $this->documentType; }
    public function getDocumentNumber(): string { return $this->documentNumber; }
    public function getAddress(): string { return $this->address; }
    public function getCity(): string { return $this->city; }
    public function getCountry(): string { return $this->country; }
    public function getEmploymentType(): string { return $this->employmentType; }
    public function getMonthlyIncome(): float { return $this->monthlyIncome; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'lead_id' => $this->leadId,
            'first_name' => $this->firstName,
            'last_name' => $this->lastName,
            'email' => $this->email,
            'phone' => $this->phone,
            'document_type' => $this->documentType->value,
            'document_number' => $this->documentNumber,
            'address' => $this->address,
            'city' => $this->city,
            'country' => $this->country,
            'employment_type' => $this->employmentType,
            'monthly_income' => $this->monthlyIncome,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
        ];
    }
}
