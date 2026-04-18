<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Task;

use CRM\Domain\Repository\TaskRepositoryInterface;

final class CompleteTaskUseCase
{
    public function __construct(
        private readonly TaskRepositoryInterface $taskRepository,
    ) {}

    public function execute(string $taskId): array
    {
        $task = $this->taskRepository->findById($taskId);
        if ($task === null) {
            throw new \DomainException('Task not found.');
        }

        $task->complete();
        $this->taskRepository->save($task);

        return $task->toArray();
    }
}
