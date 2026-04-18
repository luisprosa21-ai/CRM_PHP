<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Offer;

use CRM\Domain\Repository\OfferRepositoryInterface;

final class AcceptOfferUseCase
{
    public function __construct(
        private readonly OfferRepositoryInterface $offerRepository,
    ) {}

    public function execute(string $offerId): array
    {
        $offer = $this->offerRepository->findById($offerId);
        if ($offer === null) {
            throw new \DomainException('Offer not found.');
        }

        $offer->accept();
        $this->offerRepository->save($offer);

        return $offer->toArray();
    }
}
