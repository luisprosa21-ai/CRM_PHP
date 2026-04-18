<?php

declare(strict_types=1);

namespace CRM\Application\DTO;

final readonly class DashboardDTO
{
    public function __construct(
        public int $totalLeads,
        public float $conversionRate,
        public array $expedientesByStatus,
        public float $avgProcessingTimeDays,
        public array $topAdvisors,
        public int $totalClients,
        public int $activeExpedientes,
        public float $totalPipelineValue,
    ) {}

    public function toArray(): array
    {
        return [
            'total_leads' => $this->totalLeads,
            'conversion_rate' => $this->conversionRate,
            'expedientes_by_status' => $this->expedientesByStatus,
            'avg_processing_time_days' => $this->avgProcessingTimeDays,
            'top_advisors' => $this->topAdvisors,
            'total_clients' => $this->totalClients,
            'active_expedientes' => $this->activeExpedientes,
            'total_pipeline_value' => $this->totalPipelineValue,
        ];
    }
}
