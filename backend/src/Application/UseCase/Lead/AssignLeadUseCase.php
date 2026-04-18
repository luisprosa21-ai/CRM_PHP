<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Lead;

use CRM\Domain\Repository\LeadRepositoryInterface;
use CRM\Domain\Repository\UserRepositoryInterface;

final class AssignLeadUseCase
{
    public function __construct(
        private readonly LeadRepositoryInterface $leadRepository,
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function execute(string $leadId, string $advisorId): array
    {
        $lead = $this->leadRepository->findById($leadId);
        if ($lead === null) {
            throw new \DomainException('Lead not found.');
        }

        $advisor = $this->userRepository->findById($advisorId);
        if ($advisor === null) {
            throw new \DomainException('Advisor not found.');
        }

        $lead->assign($advisorId);
        $this->leadRepository->save($lead);

        return $lead->toArray();
    }
}
