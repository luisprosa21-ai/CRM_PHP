<?php

declare(strict_types=1);

namespace CRM\Domain\Event;

final class ExpedienteStatusChanged extends DomainEvent
{
    public function __construct(
        string $expedienteId,
        string $oldStatus,
        string $newStatus,
        string $advisorId,
    ) {
        parent::__construct([
            'expediente_id' => $expedienteId,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'advisor_id' => $advisorId,
        ]);
    }

    public function getName(): string
    {
        return 'expediente.status_changed';
    }
}
