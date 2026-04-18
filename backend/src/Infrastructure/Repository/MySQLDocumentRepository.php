<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Repository;

use CRM\Domain\Entity\Document;
use CRM\Domain\Repository\DocumentRepositoryInterface;
use CRM\Infrastructure\Database\QueryBuilder;

final class MySQLDocumentRepository implements DocumentRepositoryInterface
{
    public function __construct(
        private readonly QueryBuilder $queryBuilder,
    ) {}

    public function findById(string $id): ?Document
    {
        $row = $this->queryBuilder->table('documents')->where('id', '=', $id)->first();
        return $row ? Document::fromArray($row) : null;
    }

    public function findByExpediente(string $expedienteId): array
    {
        $rows = $this->queryBuilder->table('documents')
            ->where('expediente_id', '=', $expedienteId)
            ->orderBy('created_at', 'DESC')
            ->get();

        return array_map(fn(array $row) => Document::fromArray($row)->toArray(), $rows);
    }

    public function findByClient(string $clientId): array
    {
        $rows = $this->queryBuilder->table('documents')
            ->where('client_id', '=', $clientId)
            ->orderBy('created_at', 'DESC')
            ->get();

        return array_map(fn(array $row) => Document::fromArray($row)->toArray(), $rows);
    }

    public function save(Document $document): void
    {
        $existing = $this->findById($document->getId());
        $data = [
            'id' => $document->getId(),
            'expediente_id' => $document->getExpedienteId(),
            'client_id' => $document->getClientId(),
            'type' => $document->getType()->value,
            'file_name' => $document->getFileName(),
            'file_path' => $document->getFilePath(),
            'mime_type' => $document->getMimeType(),
            'size' => $document->getSize(),
            'version' => $document->getVersion(),
            'status' => $document->getStatus()->value,
            'uploaded_by' => $document->getUploadedBy(),
            'verified_by' => $document->getVerifiedBy(),
            'created_at' => $document->getCreatedAt()->format('Y-m-d H:i:s'),
        ];

        if ($existing) {
            $this->queryBuilder->update('documents', $data, 'id', $document->getId());
        } else {
            $this->queryBuilder->insert('documents', $data);
        }
    }

    public function delete(string $id): void
    {
        $this->queryBuilder->delete('documents', 'id', $id);
    }
}
