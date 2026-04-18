<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Lead;

use CRM\Domain\Repository\LeadRepositoryInterface;

final class QualifyLeadUseCase
{
    public function __construct(
        private readonly LeadRepositoryInterface $leadRepository,
    ) {}

    public function execute(string $leadId): array
    {
        $lead = $this->leadRepository->findById($leadId);
        if ($lead === null) {
            throw new \DomainException('Lead not found.');
        }

        $lead->qualify();
        $this->leadRepository->save($lead);

        return $lead->toArray();
    }
}
