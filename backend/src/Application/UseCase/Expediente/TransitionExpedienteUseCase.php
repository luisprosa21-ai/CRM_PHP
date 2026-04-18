<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Expediente;

use CRM\Domain\Entity\ExpedienteStatus;
use CRM\Domain\Event\EventDispatcherInterface;
use CRM\Domain\Event\ExpedienteStatusChanged;
use CRM\Domain\Repository\ExpedienteRepositoryInterface;
use CRM\Domain\Service\ExpedienteStateMachine;

final class TransitionExpedienteUseCase
{
    public function __construct(
        private readonly ExpedienteRepositoryInterface $expedienteRepository,
        private readonly ExpedienteStateMachine $stateMachine,
        private readonly EventDispatcherInterface $eventDispatcher,
    ) {}

    public function execute(string $expedienteId, string $newStatus): array
    {
        $expediente = $this->expedienteRepository->findById($expedienteId);
        if ($expediente === null) {
            throw new \DomainException('Expediente not found.');
        }

        $oldStatus = $expediente->getStatus();
        $targetStatus = ExpedienteStatus::from($newStatus);

        $this->stateMachine->validate($oldStatus, $targetStatus);
        $expediente->transition($targetStatus);

        $this->expedienteRepository->save($expediente);

        $this->eventDispatcher->dispatch(
            new ExpedienteStatusChanged(
                $expedienteId,
                $oldStatus->value,
                $targetStatus->value,
                $expediente->getAdvisorId(),
            )
        );

        return $expediente->toArray();
    }
}
