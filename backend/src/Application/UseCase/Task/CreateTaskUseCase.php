<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Task;

use CRM\Application\DTO\CreateTaskDTO;
use CRM\Domain\Entity\Task;
use CRM\Domain\Entity\TaskPriority;
use CRM\Domain\Repository\TaskRepositoryInterface;

final class CreateTaskUseCase
{
    public function __construct(
        private readonly TaskRepositoryInterface $taskRepository,
    ) {}

    public function execute(CreateTaskDTO $dto): array
    {
        if (empty($dto->assignedTo) || empty($dto->title)) {
            throw new \InvalidArgumentException('Assigned user and title are required.');
        }

        $dueDate = !empty($dto->dueDate)
            ? new \DateTimeImmutable($dto->dueDate)
            : new \DateTimeImmutable('+7 days');

        $task = Task::create(
            assignedTo: $dto->assignedTo,
            title: $dto->title,
            description: $dto->description,
            priority: TaskPriority::from($dto->priority),
            dueDate: $dueDate,
            expedienteId: $dto->expedienteId,
        );

        $this->taskRepository->save($task);

        return $task->toArray();
    }
}
