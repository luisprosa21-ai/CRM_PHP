<?php

declare(strict_types=1);

namespace CRM\Domain\Entity;

use CRM\Domain\ValueObject\Email;
use Ramsey\Uuid\Uuid;

final class User
{
    private function __construct(
        private readonly string $id,
        private Email $email,
        private string $passwordHash,
        private string $firstName,
        private string $lastName,
        private UserRole $role,
        private bool $isActive,
        private readonly \DateTimeImmutable $createdAt,
        private \DateTimeImmutable $updatedAt,
    ) {}

    public static function create(
        string $email,
        string $password,
        string $firstName,
        string $lastName,
        UserRole $role = UserRole::Advisor,
    ): self {
        $now = new \DateTimeImmutable();
        return new self(
            id: Uuid::uuid4()->toString(),
            email: new Email($email),
            passwordHash: password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]),
            firstName: $firstName,
            lastName: $lastName,
            role: $role,
            isActive: true,
            createdAt: $now,
            updatedAt: $now,
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            email: new Email($data['email']),
            passwordHash: $data['password_hash'],
            firstName: $data['first_name'],
            lastName: $data['last_name'],
            role: UserRole::from($data['role']),
            isActive: (bool) $data['is_active'],
            createdAt: new \DateTimeImmutable($data['created_at']),
            updatedAt: new \DateTimeImmutable($data['updated_at']),
        );
    }

    public function authenticate(string $password): bool
    {
        return $this->isActive && password_verify($password, $this->passwordHash);
    }

    public function changePassword(string $currentPassword, string $newPassword): void
    {
        if (!password_verify($currentPassword, $this->passwordHash)) {
            throw new \DomainException('Current password is incorrect.');
        }
        $this->passwordHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function deactivate(): void
    {
        $this->isActive = false;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): string { return $this->id; }
    public function getEmail(): Email { return $this->email; }
    public function getEmailString(): string { return $this->email->getValue(); }
    public function getPasswordHash(): string { return $this->passwordHash; }
    public function getFirstName(): string { return $this->firstName; }
    public function getLastName(): string { return $this->lastName; }
    public function getFullName(): string { return "{$this->firstName} {$this->lastName}"; }
    public function getRole(): UserRole { return $this->role; }
    public function isActive(): bool { return $this->isActive; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email->getValue(),
            'first_name' => $this->firstName,
            'last_name' => $this->lastName,
            'role' => $this->role->value,
            'is_active' => $this->isActive,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
        ];
    }
}
