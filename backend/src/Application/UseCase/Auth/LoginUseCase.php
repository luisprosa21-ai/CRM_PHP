<?php

declare(strict_types=1);

namespace CRM\Application\UseCase\Auth;

use CRM\Application\DTO\LoginDTO;
use CRM\Application\Service\AuthService;
use CRM\Domain\Repository\UserRepositoryInterface;

final class LoginUseCase
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly AuthService $authService,
    ) {}

    public function execute(LoginDTO $dto): array
    {
        if (empty($dto->email) || empty($dto->password)) {
            throw new \InvalidArgumentException('Email and password are required.');
        }

        $user = $this->userRepository->findByEmail($dto->email);
        if ($user === null || !$user->authenticate($dto->password)) {
            throw new \DomainException('Invalid credentials.');
        }

        $token = $this->authService->generateToken(
            $user->getId(),
            $user->getEmailString(),
            $user->getRole()->value,
        );

        return [
            'token' => $token,
            'user' => $user->toArray(),
        ];
    }
}
