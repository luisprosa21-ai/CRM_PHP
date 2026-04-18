<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Repository;

use CRM\Domain\Entity\User;
use CRM\Domain\Repository\UserRepositoryInterface;
use CRM\Infrastructure\Database\QueryBuilder;

final class MySQLUserRepository implements UserRepositoryInterface
{
    public function __construct(
        private readonly QueryBuilder $queryBuilder,
    ) {}

    public function findById(string $id): ?User
    {
        $row = $this->queryBuilder->table('users')->where('id', '=', $id)->first();
        return $row ? User::fromArray($row) : null;
    }

    public function findByEmail(string $email): ?User
    {
        $row = $this->queryBuilder->table('users')->where('email', '=', $email)->first();
        return $row ? User::fromArray($row) : null;
    }

    public function findAll(int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;
        $rows = $this->queryBuilder->table('users')
            ->orderBy('created_at', 'DESC')
            ->limit($perPage)
            ->offset($offset)
            ->get();

        return array_map(fn(array $row) => User::fromArray($row)->toArray(), $rows);
    }

    public function save(User $user): void
    {
        $existing = $this->findById($user->getId());
        $data = [
            'id' => $user->getId(),
            'email' => $user->getEmailString(),
            'password_hash' => $user->getPasswordHash(),
            'first_name' => $user->getFirstName(),
            'last_name' => $user->getLastName(),
            'role' => $user->getRole()->value,
            'is_active' => $user->isActive() ? 1 : 0,
            'created_at' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
            'updated_at' => $user->getUpdatedAt()->format('Y-m-d H:i:s'),
        ];

        if ($existing) {
            $this->queryBuilder->update('users', $data, 'id', $user->getId());
        } else {
            $this->queryBuilder->insert('users', $data);
        }
    }

    public function delete(string $id): void
    {
        $this->queryBuilder->delete('users', 'id', $id);
    }
}
