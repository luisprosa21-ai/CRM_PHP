<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Repository;

use CRM\Domain\Entity\Offer;
use CRM\Domain\Repository\OfferRepositoryInterface;
use CRM\Infrastructure\Database\QueryBuilder;

final class MySQLOfferRepository implements OfferRepositoryInterface
{
    public function __construct(
        private readonly QueryBuilder $queryBuilder,
    ) {}

    public function findById(string $id): ?Offer
    {
        $row = $this->queryBuilder->table('offers')->where('id', '=', $id)->first();
        return $row ? Offer::fromArray($row) : null;
    }

    public function findByExpediente(string $expedienteId): array
    {
        $rows = $this->queryBuilder->table('offers')
            ->where('expediente_id', '=', $expedienteId)
            ->orderBy('received_at', 'DESC')
            ->get();

        return array_map(fn(array $row) => Offer::fromArray($row)->toArray(), $rows);
    }

    public function findByBank(string $bankId): array
    {
        $rows = $this->queryBuilder->table('offers')
            ->where('bank_id', '=', $bankId)
            ->orderBy('received_at', 'DESC')
            ->get();

        return array_map(fn(array $row) => Offer::fromArray($row)->toArray(), $rows);
    }

    public function save(Offer $offer): void
    {
        $existing = $this->findById($offer->getId());
        $data = [
            'id' => $offer->getId(),
            'expediente_id' => $offer->getExpedienteId(),
            'bank_id' => $offer->getBankId(),
            'bank_name' => $offer->getBankName(),
            'interest_rate' => $offer->getInterestRate(),
            'term' => $offer->getTerm(),
            'monthly_payment' => $offer->getMonthlyPayment(),
            'total_cost' => $offer->getTotalCost(),
            'conditions' => $offer->getConditions(),
            'status' => $offer->getStatus()->value,
            'received_at' => $offer->getReceivedAt()->format('Y-m-d H:i:s'),
            'expires_at' => $offer->getExpiresAt()->format('Y-m-d H:i:s'),
        ];

        if ($existing) {
            $this->queryBuilder->update('offers', $data, 'id', $offer->getId());
        } else {
            $this->queryBuilder->insert('offers', $data);
        }
    }

    public function delete(string $id): void
    {
        $this->queryBuilder->delete('offers', 'id', $id);
    }
}
