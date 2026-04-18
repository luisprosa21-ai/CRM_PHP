<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Offer;

use CRM\Domain\Repository\OfferRepositoryInterface;

final class ListOffersUseCase
{
    public function __construct(
        private readonly OfferRepositoryInterface $offerRepository,
    ) {}

    public function execute(?string $expedienteId = null): array
    {
        if ($expedienteId !== null) {
            return $this->offerRepository->findByExpediente($expedienteId);
        }

        return [];
    }
}
