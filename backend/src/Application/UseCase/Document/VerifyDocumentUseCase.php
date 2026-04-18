<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Document;

use CRM\Domain\Repository\DocumentRepositoryInterface;

final class VerifyDocumentUseCase
{
    public function __construct(
        private readonly DocumentRepositoryInterface $documentRepository,
    ) {}

    public function execute(string $documentId, string $verifiedBy): array
    {
        $document = $this->documentRepository->findById($documentId);
        if ($document === null) {
            throw new \DomainException('Document not found.');
        }

        $document->verify($verifiedBy);
        $this->documentRepository->save($document);

        return $document->toArray();
    }
}
