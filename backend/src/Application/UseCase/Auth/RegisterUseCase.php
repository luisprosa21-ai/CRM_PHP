<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Auth;

use CRM\Application\DTO\RegisterDTO;
use CRM\Domain\Entity\User;
use CRM\Domain\Entity\UserRole;
use CRM\Domain\Repository\UserRepositoryInterface;

final class RegisterUseCase
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function execute(RegisterDTO $dto): array
    {
        if (empty($dto->email) || empty($dto->password) || empty($dto->firstName) || empty($dto->lastName)) {
            throw new \InvalidArgumentException('All fields are required.');
        }

        $existing = $this->userRepository->findByEmail($dto->email);
        if ($existing !== null) {
            throw new \DomainException('User with this email already exists.');
        }

        $user = User::create(
            email: $dto->email,
            password: $dto->password,
            firstName: $dto->firstName,
            lastName: $dto->lastName,
            role: UserRole::from($dto->role),
        );

        $this->userRepository->save($user);

        return $user->toArray();
    }
}
