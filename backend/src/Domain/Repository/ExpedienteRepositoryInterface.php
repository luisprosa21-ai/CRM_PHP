<?php

declare(strict_types=1);

namespace CRM\Domain\Repository;

use CRM\Domain\Entity\Expediente;
use CRM\Domain\Entity\ExpedienteStatus;

interface ExpedienteRepositoryInterface
{
    public function findById(string $id): ?Expediente;
    public function findByClient(string $clientId): array;
    public function findByAdvisor(string $advisorId, int $page = 1, int $perPage = 20): array;
    public function findByStatus(ExpedienteStatus $status, int $page = 1, int $perPage = 20): array;
    public function findAll(int $page = 1, int $perPage = 20): array;
    public function save(Expediente $expediente): void;
    public function delete(string $id): void;
    public function countByStatus(): array;
}
