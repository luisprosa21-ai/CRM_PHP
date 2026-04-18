<?php

declare(strict_types=1);

namespace CRM\Domain\Entity;

use Ramsey\Uuid\Uuid;

final class Document
{
    private function __construct(
        private readonly string $id,
        private readonly string $expedienteId,
        private readonly string $clientId,
        private DocumentCategory $type,
        private string $fileName,
        private string $filePath,
        private string $mimeType,
        private int $size,
        private int $version,
        private DocumentStatus $status,
        private string $uploadedBy,
        private ?string $verifiedBy,
        private readonly \DateTimeImmutable $createdAt,
    ) {}

    public static function create(
        string $expedienteId,
        string $clientId,
        DocumentCategory $type,
        string $fileName,
        string $filePath,
        string $mimeType,
        int $size,
        string $uploadedBy,
    ): self {
        return new self(
            id: Uuid::uuid4()->toString(),
            expedienteId: $expedienteId,
            clientId: $clientId,
            type: $type,
            fileName: $fileName,
            filePath: $filePath,
            mimeType: $mimeType,
            size: $size,
            version: 1,
            status: DocumentStatus::Uploaded,
            uploadedBy: $uploadedBy,
            verifiedBy: null,
            createdAt: new \DateTimeImmutable(),
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            expedienteId: $data['expediente_id'],
            clientId: $data['client_id'],
            type: DocumentCategory::from($data['type']),
            fileName: $data['file_name'],
            filePath: $data['file_path'],
            mimeType: $data['mime_type'],
            size: (int) $data['size'],
            version: (int) ($data['version'] ?? 1),
            status: DocumentStatus::from($data['status']),
            uploadedBy: $data['uploaded_by'],
            verifiedBy: $data['verified_by'] ?? null,
            createdAt: new \DateTimeImmutable($data['created_at']),
        );
    }

    public function verify(string $verifiedBy): void
    {
        if ($this->status !== DocumentStatus::Uploaded) {
            throw new \DomainException('Only uploaded documents can be verified.');
        }
        $this->status = DocumentStatus::Verified;
        $this->verifiedBy = $verifiedBy;
    }

    public function reject(string $verifiedBy): void
    {
        if ($this->status !== DocumentStatus::Uploaded) {
            throw new \DomainException('Only uploaded documents can be rejected.');
        }
        $this->status = DocumentStatus::Rejected;
        $this->verifiedBy = $verifiedBy;
    }

    public function newVersion(): self
    {
        return new self(
            id: Uuid::uuid4()->toString(),
            expedienteId: $this->expedienteId,
            clientId: $this->clientId,
            type: $this->type,
            fileName: $this->fileName,
            filePath: $this->filePath,
            mimeType: $this->mimeType,
            size: $this->size,
            version: $this->version + 1,
            status: DocumentStatus::Uploaded,
            uploadedBy: $this->uploadedBy,
            verifiedBy: null,
            createdAt: new \DateTimeImmutable(),
        );
    }

    public function getId(): string { return $this->id; }
    public function getExpedienteId(): string { return $this->expedienteId; }
    public function getClientId(): string { return $this->clientId; }
    public function getType(): DocumentCategory { return $this->type; }
    public function getFileName(): string { return $this->fileName; }
    public function getFilePath(): string { return $this->filePath; }
    public function getMimeType(): string { return $this->mimeType; }
    public function getSize(): int { return $this->size; }
    public function getVersion(): int { return $this->version; }
    public function getStatus(): DocumentStatus { return $this->status; }
    public function getUploadedBy(): string { return $this->uploadedBy; }
    public function getVerifiedBy(): ?string { return $this->verifiedBy; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'expediente_id' => $this->expedienteId,
            'client_id' => $this->clientId,
            'type' => $this->type->value,
            'file_name' => $this->fileName,
            'file_path' => $this->filePath,
            'mime_type' => $this->mimeType,
            'size' => $this->size,
            'version' => $this->version,
            'status' => $this->status->value,
            'uploaded_by' => $this->uploadedBy,
            'verified_by' => $this->verifiedBy,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}
