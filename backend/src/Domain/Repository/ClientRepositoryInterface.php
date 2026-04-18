<?php

declare(strict_types=1);

namespace CRM\Domain\Repository;

use CRM\Domain\Entity\Client;

interface ClientRepositoryInterface
{
    public function findById(string $id): ?Client;
    public function findByEmail(string $email): ?Client;
    public function findByDocument(string $documentNumber): ?Client;
    public function findAll(int $page = 1, int $perPage = 20): array;
    public function save(Client $client): void;
    public function delete(string $id): void;
}
