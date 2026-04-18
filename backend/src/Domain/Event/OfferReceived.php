<?php

declare(strict_types=1);

namespace CRM\Domain\Event;

final class OfferReceived extends DomainEvent
{
    public function __construct(string $offerId, string $expedienteId, string $bankName, float $interestRate)
    {
        parent::__construct([
            'offer_id' => $offerId,
            'expediente_id' => $expedienteId,
            'bank_name' => $bankName,
            'interest_rate' => $interestRate,
        ]);
    }

    public function getName(): string
    {
        return 'offer.received';
    }
}
