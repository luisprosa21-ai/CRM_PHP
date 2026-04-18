<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Task;

use CRM\Domain\Repository\TaskRepositoryInterface;

final class ListTasksUseCase
{
    public function __construct(
        private readonly TaskRepositoryInterface $taskRepository,
    ) {}

    public function execute(?string $assigneeId = null, ?string $expedienteId = null): array
    {
        if ($expedienteId !== null) {
            return $this->taskRepository->findByExpediente($expedienteId);
        }

        if ($assigneeId !== null) {
            return $this->taskRepository->findByAssignee($assigneeId);
        }

        return $this->taskRepository->findOverdue();
    }
}
