<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Lead;

use CRM\Application\DTO\CreateLeadDTO;
use CRM\Domain\Entity\Lead;
use CRM\Domain\Entity\LeadSource;
use CRM\Domain\Event\EventDispatcherInterface;
use CRM\Domain\Event\LeadCreated;
use CRM\Domain\Repository\LeadRepositoryInterface;

final class CreateLeadUseCase
{
    public function __construct(
        private readonly LeadRepositoryInterface $leadRepository,
        private readonly EventDispatcherInterface $eventDispatcher,
    ) {}

    public function execute(CreateLeadDTO $dto): array
    {
        if (empty($dto->fullName) || empty($dto->email) || empty($dto->phone)) {
            throw new \InvalidArgumentException('Name, email, and phone are required.');
        }

        $lead = Lead::create(
            fullName: $dto->fullName,
            email: $dto->email,
            phone: $dto->phone,
            source: LeadSource::from($dto->source),
            notes: $dto->notes,
        );

        $this->leadRepository->save($lead);

        $this->eventDispatcher->dispatch(
            new LeadCreated($lead->getId(), $lead->getFullName(), $lead->getSource()->value)
        );

        return $lead->toArray();
    }
}
