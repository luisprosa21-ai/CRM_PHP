<?php

declare(strict_types=1);

namespace CRM\Domain\Repository;

use CRM\Domain\Entity\Lead;
use CRM\Domain\Entity\LeadStatus;

interface LeadRepositoryInterface
{
    public function findById(string $id): ?Lead;
    public function findAll(int $page = 1, int $perPage = 20): array;
    public function findByStatus(LeadStatus $status, int $page = 1, int $perPage = 20): array;
    public function findByAssignee(string $assigneeId, int $page = 1, int $perPage = 20): array;
    public function save(Lead $lead): void;
    public function delete(string $id): void;
    public function countByStatus(): array;
}
