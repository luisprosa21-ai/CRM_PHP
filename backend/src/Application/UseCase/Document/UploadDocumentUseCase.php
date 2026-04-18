<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Document;

use CRM\Application\DTO\UploadDocumentDTO;
use CRM\Domain\Entity\Document;
use CRM\Domain\Entity\DocumentCategory;
use CRM\Domain\Event\DocumentUploaded;
use CRM\Domain\Event\EventDispatcherInterface;
use CRM\Domain\Repository\DocumentRepositoryInterface;

final class UploadDocumentUseCase
{
    public function __construct(
        private readonly DocumentRepositoryInterface $documentRepository,
        private readonly EventDispatcherInterface $eventDispatcher,
    ) {}

    public function execute(UploadDocumentDTO $dto): array
    {
        if (empty($dto->expedienteId) || empty($dto->fileName)) {
            throw new \InvalidArgumentException('Expediente ID and file name are required.');
        }

        $document = Document::create(
            expedienteId: $dto->expedienteId,
            clientId: $dto->clientId,
            type: DocumentCategory::from($dto->type),
            fileName: $dto->fileName,
            filePath: $dto->filePath,
            mimeType: $dto->mimeType,
            size: $dto->size,
            uploadedBy: $dto->uploadedBy,
        );

        $this->documentRepository->save($document);

        $this->eventDispatcher->dispatch(
            new DocumentUploaded($document->getId(), $document->getExpedienteId(), $document->getType()->value)
        );

        return $document->toArray();
    }
}
