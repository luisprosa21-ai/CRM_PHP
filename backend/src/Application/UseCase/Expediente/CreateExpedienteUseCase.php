<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Expediente;

use CRM\Application\DTO\CreateExpedienteDTO;
use CRM\Domain\Entity\Expediente;
use CRM\Domain\Repository\ClientRepositoryInterface;
use CRM\Domain\Repository\ExpedienteRepositoryInterface;

final class CreateExpedienteUseCase
{
    public function __construct(
        private readonly ExpedienteRepositoryInterface $expedienteRepository,
        private readonly ClientRepositoryInterface $clientRepository,
    ) {}

    public function execute(CreateExpedienteDTO $dto): array
    {
        $client = $this->clientRepository->findById($dto->clientId);
        if ($client === null) {
            throw new \DomainException('Client not found.');
        }

        $expediente = Expediente::create(
            clientId: $dto->clientId,
            advisorId: $dto->advisorId,
            propertyValue: $dto->propertyValue,
            requestedAmount: $dto->requestedAmount,
            term: $dto->term,
            notes: $dto->notes,
        );

        $this->expedienteRepository->save($expediente);

        return $expediente->toArray();
    }
}
