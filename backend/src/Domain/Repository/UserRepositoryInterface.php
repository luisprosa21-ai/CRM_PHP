<?php

declare(strict_types=1);

namespace CRM\Domain\Repository;

use CRM\Domain\Entity\User;

interface UserRepositoryInterface
{
    public function findById(string $id): ?User;
    public function findByEmail(string $email): ?User;
    public function findAll(int $page = 1, int $perPage = 20): array;
    public function save(User $user): void;
    public function delete(string $id): void;
}
