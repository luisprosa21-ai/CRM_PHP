<?php

declare(strict_types=1);

namespace CRM\Domain\Event;

final class DocumentUploaded extends DomainEvent
{
    public function __construct(string $documentId, string $expedienteId, string $type)
    {
        parent::__construct([
            'document_id' => $documentId,
            'expediente_id' => $expedienteId,
            'type' => $type,
        ]);
    }

    public function getName(): string
    {
        return 'document.uploaded';
    }
}
