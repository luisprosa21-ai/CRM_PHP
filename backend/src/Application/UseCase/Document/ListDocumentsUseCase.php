<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Document;

use CRM\Domain\Repository\DocumentRepositoryInterface;

final class ListDocumentsUseCase
{
    public function __construct(
        private readonly DocumentRepositoryInterface $documentRepository,
    ) {}

    public function execute(?string $expedienteId = null, ?string $clientId = null): array
    {
        if ($expedienteId !== null) {
            return $this->documentRepository->findByExpediente($expedienteId);
        }

        if ($clientId !== null) {
            return $this->documentRepository->findByClient($clientId);
        }

        return [];
    }
}
