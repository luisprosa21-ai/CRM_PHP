<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Report;

use CRM\Domain\Repository\ExpedienteRepositoryInterface;

final class GetPipelineUseCase
{
    public function __construct(
        private readonly ExpedienteRepositoryInterface $expedienteRepository,
    ) {}

    public function execute(): array
    {
        $byStatus = $this->expedienteRepository->countByStatus();

        $stages = [
            'nuevo',
            'en_estudio',
            'documentacion_pendiente',
            'enviado_a_banco',
            'oferta_recibida',
            'negociacion',
            'aprobado',
            'firmado',
            'rechazado',
        ];

        $pipeline = [];
        foreach ($stages as $stage) {
            $pipeline[] = [
                'stage' => $stage,
                'count' => $byStatus[$stage] ?? 0,
            ];
        }

        $total = array_sum($byStatus);

        return [
            'pipeline' => $pipeline,
            'total' => $total,
        ];
    }
}
