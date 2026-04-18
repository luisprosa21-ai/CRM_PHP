<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Expediente;

use CRM\Domain\Repository\ExpedienteRepositoryInterface;

final class GetExpedienteUseCase
{
    public function __construct(
        private readonly ExpedienteRepositoryInterface $expedienteRepository,
    ) {}

    public function execute(string $expedienteId): array
    {
        $expediente = $this->expedienteRepository->findById($expedienteId);
        if ($expediente === null) {
            throw new \DomainException('Expediente not found.');
        }

        return $expediente->toArray();
    }
}
