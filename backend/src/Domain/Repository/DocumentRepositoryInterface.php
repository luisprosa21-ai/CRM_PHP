<?php

declare(strict_types=1);

namespace CRM\Domain\Repository;

use CRM\Domain\Entity\Document;

interface DocumentRepositoryInterface
{
    public function findById(string $id): ?Document;
    public function findByExpediente(string $expedienteId): array;
    public function findByClient(string $clientId): array;
    public function save(Document $document): void;
    public function delete(string $id): void;
}
