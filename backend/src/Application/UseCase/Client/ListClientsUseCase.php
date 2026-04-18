<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Client;

use CRM\Domain\Repository\ClientRepositoryInterface;

final class ListClientsUseCase
{
    public function __construct(
        private readonly ClientRepositoryInterface $clientRepository,
    ) {}

    public function execute(int $page = 1, int $perPage = 20): array
    {
        return $this->clientRepository->findAll($page, $perPage);
    }
}
