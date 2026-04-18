<?php

declare(strict_types=1);

namespace CRM\Application\DTO;

final readonly class UploadDocumentDTO
{
    public function __construct(
        public string $expedienteId,
        public string $clientId,
        public string $type,
        public string $fileName,
        public string $filePath,
        public string $mimeType,
        public int $size,
        public string $uploadedBy,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            expedienteId: $data['expediente_id'] ?? '',
            clientId: $data['client_id'] ?? '',
            type: $data['type'] ?? 'other',
            fileName: $data['file_name'] ?? '',
            filePath: $data['file_path'] ?? '',
            mimeType: $data['mime_type'] ?? 'application/octet-stream',
            size: (int) ($data['size'] ?? 0),
            uploadedBy: $data['uploaded_by'] ?? '',
        );
    }
}
