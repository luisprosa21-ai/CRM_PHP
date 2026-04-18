<?php

declare(strict_types=1);

namespace CRM\Tests\Domain;

use CRM\Domain\Entity\Expediente;
use CRM\Domain\Entity\ExpedienteStatus;
use PHPUnit\Framework\TestCase;

final class ExpedienteTest extends TestCase
{
    private function createExpediente(): Expediente
    {
        return Expediente::create(
            clientId: 'client-001',
            advisorId: 'advisor-001',
            propertyValue: 300000.0,
            requestedAmount: 240000.0,
            term: 360,
        );
    }

    public function testCreateExpedienteWithNuevoStatus(): void
    {
        $expediente = $this->createExpediente();

        $this->assertSame(ExpedienteStatus::Nuevo, $expediente->getStatus());
        $this->assertSame('client-001', $expediente->getClientId());
        $this->assertSame(300000.0, $expediente->getPropertyValue());
        $this->assertNotEmpty($expediente->getId());
    }

    public function testValidTransitionNuevoToEnEstudio(): void
    {
        $expediente = $this->createExpediente();
        $expediente->transition(ExpedienteStatus::EnEstudio);

        $this->assertSame(ExpedienteStatus::EnEstudio, $expediente->getStatus());
    }

    public function testValidTransitionEnEstudioToDocumentacionPendiente(): void
    {
        $expediente = $this->createExpediente();
        $expediente->transition(ExpedienteStatus::EnEstudio);
        $expediente->transition(ExpedienteStatus::DocumentacionPendiente);

        $this->assertSame(ExpedienteStatus::DocumentacionPendiente, $expediente->getStatus());
    }

    public function testValidTransitionEnEstudioToRechazado(): void
    {
        $expediente = $this->createExpediente();
        $expediente->transition(ExpedienteStatus::EnEstudio);
        $expediente->transition(ExpedienteStatus::Rechazado);

        $this->assertSame(ExpedienteStatus::Rechazado, $expediente->getStatus());
    }

    public function testFullHappyPathTransitions(): void
    {
        $expediente = $this->createExpediente();

        $expediente->transition(ExpedienteStatus::EnEstudio);
        $expediente->transition(ExpedienteStatus::DocumentacionPendiente);
        $expediente->transition(ExpedienteStatus::EnviadoABanco);
        $expediente->transition(ExpedienteStatus::OfertaRecibida);
        $expediente->transition(ExpedienteStatus::Negociacion);
        $expediente->transition(ExpedienteStatus::Aprobado);
        $expediente->transition(ExpedienteStatus::Firmado);

        $this->assertSame(ExpedienteStatus::Firmado, $expediente->getStatus());
    }

    public function testInvalidTransitionNuevoToAprobado(): void
    {
        $expediente = $this->createExpediente();

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage("Invalid transition from 'nuevo' to 'aprobado'");
        $expediente->transition(ExpedienteStatus::Aprobado);
    }

    public function testInvalidTransitionFromFirmado(): void
    {
        $expediente = $this->createExpediente();
        $expediente->transition(ExpedienteStatus::EnEstudio);
        $expediente->transition(ExpedienteStatus::DocumentacionPendiente);
        $expediente->transition(ExpedienteStatus::EnviadoABanco);
        $expediente->transition(ExpedienteStatus::OfertaRecibida);
        $expediente->transition(ExpedienteStatus::Negociacion);
        $expediente->transition(ExpedienteStatus::Aprobado);
        $expediente->transition(ExpedienteStatus::Firmado);

        $this->expectException(\DomainException::class);
        $expediente->transition(ExpedienteStatus::Rechazado);
    }

    public function testInvalidTransitionFromRechazado(): void
    {
        $expediente = $this->createExpediente();
        $expediente->transition(ExpedienteStatus::EnEstudio);
        $expediente->transition(ExpedienteStatus::Rechazado);

        $this->expectException(\DomainException::class);
        $expediente->transition(ExpedienteStatus::EnEstudio);
    }

    public function testCalculateLTV(): void
    {
        $expediente = $this->createExpediente();
        $ltv = $expediente->calculateLTV();

        $this->assertSame(80.0, $ltv);
    }

    public function testAddNote(): void
    {
        $expediente = $this->createExpediente();
        $expediente->addNote('Test note added');

        $this->assertStringContainsString('Test note added', $expediente->getNotes());
    }

    public function testRequestedAmountCannotExceedPropertyValue(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Requested amount cannot exceed property value');

        Expediente::create(
            clientId: 'client-001',
            advisorId: 'advisor-001',
            propertyValue: 200000.0,
            requestedAmount: 250000.0,
            term: 360,
        );
    }

    public function testTermMustBeWithinRange(): void
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Term must be between 1 and 480 months');

        Expediente::create(
            clientId: 'client-001',
            advisorId: 'advisor-001',
            propertyValue: 300000.0,
            requestedAmount: 200000.0,
            term: 500,
        );
    }

    public function testToArrayIncludesAllFields(): void
    {
        $expediente = $this->createExpediente();
        $data = $expediente->toArray();

        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('client_id', $data);
        $this->assertArrayHasKey('advisor_id', $data);
        $this->assertArrayHasKey('property_value', $data);
        $this->assertArrayHasKey('requested_amount', $data);
        $this->assertArrayHasKey('term', $data);
        $this->assertArrayHasKey('status', $data);
        $this->assertArrayHasKey('ltv', $data);
        $this->assertSame('nuevo', $data['status']);
    }

    public function testGetAllowedTransitions(): void
    {
        $transitions = Expediente::getAllowedTransitions(ExpedienteStatus::EnEstudio);

        $this->assertCount(2, $transitions);
        $this->assertContains('documentacion_pendiente', $transitions);
        $this->assertContains('rechazado', $transitions);
    }
}
