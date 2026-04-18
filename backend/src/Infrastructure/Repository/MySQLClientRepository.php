<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Repository;

use CRM\Domain\Entity\Client;
use CRM\Domain\Repository\ClientRepositoryInterface;
use CRM\Infrastructure\Database\QueryBuilder;

final class MySQLClientRepository implements ClientRepositoryInterface
{
    public function __construct(
        private readonly QueryBuilder $queryBuilder,
    ) {}

    public function findById(string $id): ?Client
    {
        $row = $this->queryBuilder->table('clients')->where('id', '=', $id)->first();
        return $row ? Client::fromArray($row) : null;
    }

    public function findByEmail(string $email): ?Client
    {
        $row = $this->queryBuilder->table('clients')->where('email', '=', $email)->first();
        return $row ? Client::fromArray($row) : null;
    }

    public function findByDocument(string $documentNumber): ?Client
    {
        $row = $this->queryBuilder->table('clients')->where('document_number', '=', $documentNumber)->first();
        return $row ? Client::fromArray($row) : null;
    }

    public function findAll(int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $rows = $this->queryBuilder->table('clients')
            ->orderBy('created_at', 'DESC')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        return array_map(fn(array $row) => Client::fromArray($row)->toArray(), $rows);
    }

    public function save(Client $client): void
    {
        $existing = $this->findById($client->getId());
        $data = [
            'id' => $client->getId(),
            'lead_id' => $client->getLeadId(),
            'first_name' => $client->getFirstName(),
            'last_name' => $client->getLastName(),
            'email' => $client->getEmail(),
            'phone' => $client->getPhone(),
            'document_type' => $client->getDocumentType()->value,
            'document_number' => $client->getDocumentNumber(),
            'address' => $client->getAddress(),
            'city' => $client->getCity(),
            'country' => $client->getCountry(),
            'employment_type' => $client->getEmploymentType(),
            'monthly_income' => $client->getMonthlyIncome(),
            'created_at' => $client->getCreatedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $client->getUpdatedAt()->format('Y-m-d H:i:s'),
        ];

        if ($existing) {
            $this->queryBuilder->update('clients', $data, 'id', $client->getId());
        } else {
            $this->queryBuilder->insert('clients', $data);
        }
    }

    public function delete(string $id): void
    {
        $this->queryBuilder->delete('clients', 'id', $id);
    }
}
