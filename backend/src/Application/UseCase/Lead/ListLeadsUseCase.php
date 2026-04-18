<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Lead;

use CRM\Domain\Repository\LeadRepositoryInterface;

final class ListLeadsUseCase
{
    public function __construct(
        private readonly LeadRepositoryInterface $leadRepository,
    ) {}

    public function execute(int $page = 1, int $perPage = 20, ?string $status = null, ?string $assignee = null): array
    {
        if ($status !== null) {
            $leadStatus = \CRM\Domain\Entity\LeadStatus::from($status);
            return $this->leadRepository->findByStatus($leadStatus, $page, $perPage);
        }

        if ($assignee !== null) {
            return $this->leadRepository->findByAssignee($assignee, $page, $perPage);
        }

        return $this->leadRepository->findAll($page, $perPage);
    }
}
