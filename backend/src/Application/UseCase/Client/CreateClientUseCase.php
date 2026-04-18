<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Client;

use CRM\Application\DTO\CreateClientDTO;
use CRM\Domain\Entity\Client;
use CRM\Domain\Entity\DocumentType;
use CRM\Domain\Repository\ClientRepositoryInterface;

final class CreateClientUseCase
{
    public function __construct(
        private readonly ClientRepositoryInterface $clientRepository,
    ) {}

    public function execute(CreateClientDTO $dto): array
    {
        if (empty($dto->firstName) || empty($dto->lastName) || empty($dto->email)) {
            throw new \InvalidArgumentException('First name, last name, and email are required.');
        }

        $existing = $this->clientRepository->findByEmail($dto->email);
        if ($existing !== null) {
            throw new \DomainException('Client with this email already exists.');
        }

        $client = Client::create(
            firstName: $dto->firstName,
            lastName: $dto->lastName,
            email: $dto->email,
            phone: $dto->phone,
            documentType: DocumentType::from($dto->documentType),
            documentNumber: $dto->documentNumber,
            address: $dto->address,
            city: $dto->city,
            country: $dto->country,
            employmentType: $dto->employmentType,
            monthlyIncome: $dto->monthlyIncome,
            leadId: $dto->leadId,
        );

        $this->clientRepository->save($client);

        return $client->toArray();
    }
}
