<?php

declare(strict_types=1);

namespace CRM\Domain\Repository;

use CRM\Domain\Entity\Offer;

interface OfferRepositoryInterface
{
    public function findById(string $id): ?Offer;
    public function findByExpediente(string $expedienteId): array;
    public function findByBank(string $bankId): array;
    public function save(Offer $offer): void;
    public function delete(string $id): void;
}
