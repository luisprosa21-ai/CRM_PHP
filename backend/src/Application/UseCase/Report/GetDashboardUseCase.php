<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Report;

use CRM\Application\DTO\DashboardDTO;
use CRM\Domain\Repository\ExpedienteRepositoryInterface;
use CRM\Domain\Repository\LeadRepositoryInterface;
use CRM\Domain\Repository\ClientRepositoryInterface;

final class GetDashboardUseCase
{
    public function __construct(
        private readonly LeadRepositoryInterface $leadRepository,
        private readonly ExpedienteRepositoryInterface $expedienteRepository,
        private readonly ClientRepositoryInterface $clientRepository,
    ) {}

    public function execute(): array
    {
        $leadsByStatus = $this->leadRepository->countByStatus();
        $expedientesByStatus = $this->expedienteRepository->countByStatus();

        $totalLeads = array_sum($leadsByStatus);
        $convertedLeads = $leadsByStatus['converted'] ?? 0;
        $conversionRate = $totalLeads > 0 ? round(($convertedLeads / $totalLeads) * 100, 2) : 0.0;

        $terminalStatuses = ['firmado', 'rechazado'];
        $activeExpedientes = 0;
        foreach ($expedientesByStatus as $status => $count) {
            if (!in_array($status, $terminalStatuses, true)) {
                $activeExpedientes += $count;
            }
        }

        $clients = $this->clientRepository->findAll(1, 1);
        $totalClients = count($clients);

        $dto = new DashboardDTO(
            totalLeads: $totalLeads,
            conversionRate: $conversionRate,
            expedientesByStatus: $expedientesByStatus,
            avgProcessingTimeDays: 0.0,
            topAdvisors: [],
            totalClients: $totalClients,
            activeExpedientes: $activeExpedientes,
            totalPipelineValue: 0.0,
        );

        return $dto->toArray();
    }
}
