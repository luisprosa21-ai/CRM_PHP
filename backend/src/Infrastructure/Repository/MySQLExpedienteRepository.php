<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Repository;

use CRM\Domain\Entity\Expediente;
use CRM\Domain\Entity\ExpedienteStatus;
use CRM\Domain\Repository\ExpedienteRepositoryInterface;
use CRM\Infrastructure\Database\QueryBuilder;

final class MySQLExpedienteRepository implements ExpedienteRepositoryInterface
{
    public function __construct(
        private readonly QueryBuilder $queryBuilder,
    ) {}

    public function findById(string $id): ?Expediente
    {
        $row = $this->queryBuilder->table('expedientes')->where('id', '=', $id)->first();
        return $row ? Expediente::fromArray($row) : null;
    }

    public function findByClient(string $clientId): array
    {
        $rows = $this->queryBuilder->table('expedientes')
            ->where('client_id', '=', $clientId)
            ->orderBy('created_at', 'DESC')
            ->get();

        return array_map(fn(array $row) => Expediente::fromArray($row)->toArray(), $rows);
    }

    public function findByAdvisor(string $advisorId, int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $rows = $this->queryBuilder->table('expedientes')
            ->where('advisor_id', '=', $advisorId)
            ->orderBy('created_at', 'DESC')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        return array_map(fn(array $row) => Expediente::fromArray($row)->toArray(), $rows);
    }

    public function findByStatus(ExpedienteStatus $status, int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $rows = $this->queryBuilder->table('expedientes')
            ->where('status', '=', $status->value)
            ->orderBy('created_at', 'DESC')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        return array_map(fn(array $row) => Expediente::fromArray($row)->toArray(), $rows);
    }

    public function findAll(int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $rows = $this->queryBuilder->table('expedientes')
            ->orderBy('created_at', 'DESC')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        return array_map(fn(array $row) => Expediente::fromArray($row)->toArray(), $rows);
    }

    public function save(Expediente $expediente): void
    {
        $existing = $this->findById($expediente->getId());
        $data = [
            'id' => $expediente->getId(),
            'client_id' => $expediente->getClientId(),
            'advisor_id' => $expediente->getAdvisorId(),
            'property_value' => $expediente->getPropertyValue(),
            'requested_amount' => $expediente->getRequestedAmount(),
            'term' => $expediente->getTerm(),
            'status' => $expediente->getStatus()->value,
            'score' => $expediente->getScore(),
            'notes' => $expediente->getNotes(),
            'created_at' => $expediente->getCreatedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $expediente->getUpdatedAt()->format('Y-m-d H:i:s'),
        ];

        if ($existing) {
            $this->queryBuilder->update('expedientes', $data, 'id', $expediente->getId());
        } else {
            $this->queryBuilder->insert('expedientes', $data);
        }
    }

    public function delete(string $id): void
    {
        $this->queryBuilder->delete('expedientes', 'id', $id);
    }

    public function countByStatus(): array
    {
        $rows = $this->queryBuilder->raw(
            'SELECT status, COUNT(*) as count FROM expedientes GROUP BY status'
        );

        $counts = [];
        foreach ($rows as $row) {
            $counts[$row['status']] = (int) $row['count'];
        }
        return $counts;
    }
}
