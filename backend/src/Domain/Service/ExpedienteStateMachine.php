<?php

declare(strict_types=1);

namespace CRM\Domain\Service;

use CRM\Domain\Entity\ExpedienteStatus;

final class ExpedienteStateMachine
{
    private const TRANSITIONS = [
        'nuevo' => ['en_estudio'],
        'en_estudio' => ['documentacion_pendiente', 'rechazado'],
        'documentacion_pendiente' => ['enviado_a_banco'],
        'enviado_a_banco' => ['oferta_recibida', 'rechazado'],
        'oferta_recibida' => ['negociacion', 'rechazado'],
        'negociacion' => ['aprobado', 'rechazado'],
        'aprobado' => ['firmado'],
        'firmado' => [],
        'rechazado' => [],
    ];

    public function canTransition(ExpedienteStatus $from, ExpedienteStatus $to): bool
    {
        $allowed = self::TRANSITIONS[$from->value] ?? [];
        return in_array($to->value, $allowed, true);
    }

    public function getAllowedTransitions(ExpedienteStatus $status): array
    {
        $values = self::TRANSITIONS[$status->value] ?? [];
        return array_map(
            static fn(string $v) => ExpedienteStatus::from($v),
            $values,
        );
    }

    public function isTerminal(ExpedienteStatus $status): bool
    {
        return empty(self::TRANSITIONS[$status->value] ?? []);
    }

    public function validate(ExpedienteStatus $from, ExpedienteStatus $to): void
    {
        if (!$this->canTransition($from, $to)) {
            throw new \DomainException(
                "Invalid transition from '{$from->value}' to '{$to->value}'. "
                . "Allowed: " . implode(', ', self::TRANSITIONS[$from->value] ?? [])
            );
        }
    }
}
