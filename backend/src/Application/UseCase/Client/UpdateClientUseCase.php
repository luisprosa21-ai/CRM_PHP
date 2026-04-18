<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Client;

use CRM\Domain\Repository\ClientRepositoryInterface;

final class UpdateClientUseCase
{
    public function __construct(
        private readonly ClientRepositoryInterface $clientRepository,
    ) {}

    public function execute(string $clientId, array $data): array
    {
        $client = $this->clientRepository->findById($clientId);
        if ($client === null) {
            throw new \DomainException('Client not found.');
        }

        $client->updateProfile(
            address: $data['address'] ?? null,
            city: $data['city'] ?? null,
            country: $data['country'] ?? null,
            employmentType: $data['employment_type'] ?? null,
            monthlyIncome: isset($data['monthly_income']) ? (float) $data['monthly_income'] : null,
            phone: $data['phone'] ?? null,
        );

        $this->clientRepository->save($client);

        return $client->toArray();
    }
}
