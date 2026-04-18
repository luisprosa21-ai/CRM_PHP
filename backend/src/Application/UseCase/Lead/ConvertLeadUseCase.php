<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Lead;

use CRM\Domain\Entity\Client;
use CRM\Domain\Entity\DocumentType;
use CRM\Domain\Repository\ClientRepositoryInterface;
use CRM\Domain\Repository\LeadRepositoryInterface;

final class ConvertLeadUseCase
{
    public function __construct(
        private readonly LeadRepositoryInterface $leadRepository,
        private readonly ClientRepositoryInterface $clientRepository,
    ) {}

    public function execute(string $leadId, array $clientData): array
    {
        $lead = $this->leadRepository->findById($leadId);
        if ($lead === null) {
            throw new \DomainException('Lead not found.');
        }

        $lead->convert();

        $nameParts = explode(' ', $lead->getFullName(), 2);
        $client = Client::create(
            firstName: $clientData['first_name'] ?? $nameParts[0],
            lastName: $clientData['last_name'] ?? ($nameParts[1] ?? ''),
            email: $lead->getEmail(),
            phone: $lead->getPhone(),
            documentType: DocumentType::from($clientData['document_type'] ?? 'dni'),
            documentNumber: $clientData['document_number'] ?? '',
            address: $clientData['address'] ?? '',
            city: $clientData['city'] ?? '',
            country: $clientData['country'] ?? 'ES',
            employmentType: $clientData['employment_type'] ?? '',
            monthlyIncome: (float) ($clientData['monthly_income'] ?? 0),
            leadId: $leadId,
        );

        $this->leadRepository->save($lead);
        $this->clientRepository->save($client);

        return [
            'lead' => $lead->toArray(),
            'client' => $client->toArray(),
        ];
    }
}
