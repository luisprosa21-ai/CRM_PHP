<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Expediente;

use CRM\Domain\Entity\ExpedienteStatus;
use CRM\Domain\Repository\ExpedienteRepositoryInterface;

final class ListExpedientesUseCase
{
    public function __construct(
        private readonly ExpedienteRepositoryInterface $expedienteRepository,
    ) {}

    public function execute(int $page = 1, int $perPage = 20, ?string $status = null, ?string $advisorId = null): array
    {
        if ($status !== null) {
            return $this->expedienteRepository->findByStatus(ExpedienteStatus::from($status), $page, $perPage);
        }

        if ($advisorId !== null) {
            return $this->expedienteRepository->findByAdvisor($advisorId, $page, $perPage);
        }

        return $this->expedienteRepository->findAll($page, $perPage);
    }
}
