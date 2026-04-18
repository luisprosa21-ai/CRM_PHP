<?php

declare(strict_types=1);

namespace CRM\Tests\Domain;

use CRM\Domain\Entity\Client;
use CRM\Domain\Entity\DocumentType;
use CRM\Domain\Entity\Expediente;
use CRM\Domain\Service\ScoringService;
use PHPUnit\Framework\TestCase;

final class ScoringServiceTest extends TestCase
{
    private ScoringService $scoringService;

    protected function setUp(): void
    {
        $this->scoringService = new ScoringService();
    }

    public function testHighIncomeClientWithLowLtvScoresHigh(): void
    {
        $client = Client::create(
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: '+34612345678',
            documentType: DocumentType::DNI,
            documentNumber: '12345678A',
            address: 'Test St 1',
            city: 'Madrid',
            country: 'ES',
            employmentType: 'permanent',
            monthlyIncome: 5000.0,
        );

        $expediente = Expediente::create(
            clientId: $client->getId(),
            advisorId: 'advisor-id-123',
            propertyValue: 300000.0,
            requestedAmount: 150000.0, // 50% LTV
            term: 240,
        );

        $score = $this->scoringService->calculateScore($client, $expediente);

        $this->assertGreaterThanOrEqual(70.0, $score->getValue());
        $this->assertTrue($score->isViable());
        $this->assertContains($score->getRiskLevel(), ['low', 'medium']);
    }

    public function testLowIncomeFreelanceWithHighLtvScoresLow(): void
    {
        $client = Client::create(
            firstName: 'Test',
            lastName: 'Low',
            email: 'testlow@example.com',
            phone: '+34612345679',
            documentType: DocumentType::NIE,
            documentNumber: 'X1234567L',
            address: 'Test St 2',
            city: 'Barcelona',
            country: 'ES',
            employmentType: 'freelance',
            monthlyIncome: 1200.0,
        );

        $expediente = Expediente::create(
            clientId: $client->getId(),
            advisorId: 'advisor-id-456',
            propertyValue: 200000.0,
            requestedAmount: 190000.0, // 95% LTV
            term: 360,
        );

        $score = $this->scoringService->calculateScore($client, $expediente);

        $this->assertLessThanOrEqual(50.0, $score->getValue());
        $this->assertContains($score->getRiskLevel(), ['high', 'very_high']);
    }

    public function testMidRangeProfileScoresViable(): void
    {
        $client = Client::create(
            firstName: 'Mid',
            lastName: 'Range',
            email: 'mid@example.com',
            phone: '+34612345680',
            documentType: DocumentType::DNI,
            documentNumber: '87654321B',
            address: 'Test St 3',
            city: 'Valencia',
            country: 'ES',
            employmentType: 'permanent',
            monthlyIncome: 3000.0,
        );

        $expediente = Expediente::create(
            clientId: $client->getId(),
            advisorId: 'advisor-id-789',
            propertyValue: 250000.0,
            requestedAmount: 175000.0, // 70% LTV
            term: 300,
        );

        $score = $this->scoringService->calculateScore($client, $expediente);

        $this->assertGreaterThanOrEqual(0.0, $score->getValue());
        $this->assertLessThanOrEqual(100.0, $score->getValue());
    }

    public function testScoreValueObjectConstraints(): void
    {
        $client = Client::create(
            firstName: 'Constraint',
            lastName: 'Test',
            email: 'constraint@example.com',
            phone: '+34612345681',
            documentType: DocumentType::DNI,
            documentNumber: '11223344C',
            address: 'Test St 4',
            city: 'Sevilla',
            country: 'ES',
            employmentType: 'permanent',
            monthlyIncome: 4000.0,
        );

        $expediente = Expediente::create(
            clientId: $client->getId(),
            advisorId: 'advisor-id-000',
            propertyValue: 200000.0,
            requestedAmount: 100000.0,
            term: 120,
        );

        $score = $this->scoringService->calculateScore($client, $expediente);

        $this->assertGreaterThanOrEqual(0.0, $score->getValue());
        $this->assertLessThanOrEqual(100.0, $score->getValue());
    }
}
