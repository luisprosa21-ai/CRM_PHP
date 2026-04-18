<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Offer;

use CRM\Application\DTO\CreateOfferDTO;
use CRM\Domain\Entity\Offer;
use CRM\Domain\Event\EventDispatcherInterface;
use CRM\Domain\Event\OfferReceived;
use CRM\Domain\Repository\OfferRepositoryInterface;

final class CreateOfferUseCase
{
    public function __construct(
        private readonly OfferRepositoryInterface $offerRepository,
        private readonly EventDispatcherInterface $eventDispatcher,
    ) {}

    public function execute(CreateOfferDTO $dto): array
    {
        if (empty($dto->expedienteId) || empty($dto->bankName)) {
            throw new \InvalidArgumentException('Expediente ID and bank name are required.');
        }

        $offer = Offer::create(
            expedienteId: $dto->expedienteId,
            bankId: $dto->bankId,
            bankName: $dto->bankName,
            interestRate: $dto->interestRate,
            term: $dto->term,
            monthlyPayment: $dto->monthlyPayment,
            totalCost: $dto->totalCost,
            conditions: $dto->conditions,
            validDays: $dto->validDays,
        );

        $this->offerRepository->save($offer);

        $this->eventDispatcher->dispatch(
            new OfferReceived($offer->getId(), $offer->getExpedienteId(), $offer->getBankName(), $offer->getInterestRate())
        );

        return $offer->toArray();
    }
}
