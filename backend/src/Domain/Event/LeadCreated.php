<?php

declare(strict_types=1);

namespace CRM\Domain\Event;

final class LeadCreated extends DomainEvent
{
    public function __construct(string $leadId, string $fullName, string $source)
    {
        parent::__construct([
            'lead_id' => $leadId,
            'full_name' => $fullName,
            'source' => $source,
        ]);
    }

    public function getName(): string
    {
        return 'lead.created';
    }
}
