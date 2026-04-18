<?php

declare(strict_types=1);

namespace CRM\Tests\Application;

use CRM\Application\DTO\CreateLeadDTO;
use CRM\Application\UseCase\Lead\CreateLeadUseCase;
use CRM\Domain\Entity\Lead;
use CRM\Domain\Entity\LeadSource;
use CRM\Domain\Entity\LeadStatus;
use CRM\Domain\Event\EventDispatcherInterface;
use CRM\Domain\Repository\LeadRepositoryInterface;
use PHPUnit\Framework\TestCase;

final class CreateLeadUseCaseTest extends TestCase
{
    private LeadRepositoryInterface $leadRepository;
    private EventDispatcherInterface $eventDispatcher;
    private CreateLeadUseCase $useCase;

    protected function setUp(): void
    {
        $this->leadRepository = $this->createMock(LeadRepositoryInterface::class);
        $this->eventDispatcher = $this->createMock(EventDispatcherInterface::class);
        $this->useCase = new CreateLeadUseCase($this->leadRepository, $this->eventDispatcher);
    }

    public function testCreateLeadSuccessfully(): void
    {
        $this->leadRepository
            ->expects($this->once())
            ->method('save');

        $this->eventDispatcher
            ->expects($this->once())
            ->method('dispatch');

        $dto = new CreateLeadDTO(
            fullName: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '+34612345678',
            source: 'web',
            notes: 'Interested in mortgage',
        );

        $result = $this->useCase->execute($dto);

        $this->assertArrayHasKey('id', $result);
        $this->assertSame('Juan Pérez', $result['full_name']);
        $this->assertSame('juan@example.com', $result['email']);
        $this->assertSame('web', $result['source']);
        $this->assertSame('new', $result['status']);
    }

    public function testCreateLeadWithMissingNameThrowsException(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Name, email, and phone are required');

        $dto = new CreateLeadDTO(
            fullName: '',
            email: 'test@example.com',
            phone: '+34612345678',
            source: 'web',
        );

        $this->useCase->execute($dto);
    }

    public function testCreateLeadWithMissingEmailThrowsException(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $dto = new CreateLeadDTO(
            fullName: 'Test User',
            email: '',
            phone: '+34612345678',
            source: 'web',
        );

        $this->useCase->execute($dto);
    }

    public function testCreateLeadWithMissingPhoneThrowsException(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $dto = new CreateLeadDTO(
            fullName: 'Test User',
            email: 'test@example.com',
            phone: '',
            source: 'web',
        );

        $this->useCase->execute($dto);
    }

    public function testCreateLeadDispatchesEvent(): void
    {
        $this->leadRepository
            ->expects($this->once())
            ->method('save');

        $this->eventDispatcher
            ->expects($this->once())
            ->method('dispatch')
            ->with($this->callback(fn($event) => $event->getName() === 'lead.created'));

        $dto = new CreateLeadDTO(
            fullName: 'Event Test',
            email: 'event@example.com',
            phone: '+34612345678',
            source: 'phone',
        );

        $this->useCase->execute($dto);
    }

    public function testCreateLeadFromDifferentSources(): void
    {
        $sources = ['web', 'phone', 'referral', 'partner', 'advertising'];

        foreach ($sources as $source) {
            $this->leadRepository
                ->expects($this->once())
                ->method('save');
            $this->eventDispatcher
                ->expects($this->once())
                ->method('dispatch');

            $dto = new CreateLeadDTO(
                fullName: 'Test User',
                email: "test-{$source}@example.com",
                phone: '+34612345678',
                source: $source,
            );

            $result = $this->useCase->execute($dto);
            $this->assertSame($source, $result['source']);

            // Reset mocks for next iteration
            $this->leadRepository = $this->createMock(LeadRepositoryInterface::class);
            $this->eventDispatcher = $this->createMock(EventDispatcherInterface::class);
            $this->useCase = new CreateLeadUseCase($this->leadRepository, $this->eventDispatcher);
        }
    }
}
