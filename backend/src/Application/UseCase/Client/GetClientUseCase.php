<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Client;

use CRM\Domain\Repository\ClientRepositoryInterface;

final class GetClientUseCase
{
    public function __construct(
        private readonly ClientRepositoryInterface $clientRepository,
    ) {}

    public function execute(string $clientId): array
    {
        $client = $this->clientRepository->findById($clientId);
        if ($client === null) {
            throw new \DomainException('Client not found.');
        }

        return $client->toArray();
    }
}
