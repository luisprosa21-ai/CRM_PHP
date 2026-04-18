<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Expediente;

use CRM\Domain\Repository\ClientRepositoryInterface;
use CRM\Domain\Repository\ExpedienteRepositoryInterface;
use CRM\Domain\Service\ScoringService;

final class ScoreExpedienteUseCase
{
    public function __construct(
        private readonly ExpedienteRepositoryInterface $expedienteRepository,
        private readonly ClientRepositoryInterface $clientRepository,
        private readonly ScoringService $scoringService,
    ) {}

    public function execute(string $expedienteId): array
    {
        $expediente = $this->expedienteRepository->findById($expedienteId);
        if ($expediente === null) {
            throw new \DomainException('Expediente not found.');
        }

        $client = $this->clientRepository->findById($expediente->getClientId());
        if ($client === null) {
            throw new \DomainException('Client not found.');
        }

        $score = $this->scoringService->calculateScore($client, $expediente);
        $expediente->setScore($score->getValue());
        $this->expedienteRepository->save($expediente);

        return [
            'expediente_id' => $expedienteId,
            'score' => $score->getValue(),
            'is_viable' => $score->isViable(),
            'risk_level' => $score->getRiskLevel(),
            'expediente' => $expediente->toArray(),
        ];
    }
}
