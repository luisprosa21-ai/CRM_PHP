<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Controller;

use CRM\Application\DTO\CreateOfferDTO;
use CRM\Application\UseCase\Offer\AcceptOfferUseCase;
use CRM\Application\UseCase\Offer\CreateOfferUseCase;
use CRM\Application\UseCase\Offer\ListOffersUseCase;

final class OfferController
{
    public function __construct(
        private readonly CreateOfferUseCase $createOfferUseCase,
        private readonly AcceptOfferUseCase $acceptOfferUseCase,
        private readonly ListOffersUseCase $listOffersUseCase,
    ) {}

    public function index(array $params): void
    {
        try {
            $expedienteId = $_GET['expediente_id'] ?? null;
            $result = $this->listOffersUseCase->execute($expedienteId);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log($e->getMessage()); echo json_encode(['error' => 'Server Error', 'message' => 'An internal error occurred.']);
        }
    }

    public function store(array $params): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $dto = CreateOfferDTO::fromArray($input);
            $result = $this->createOfferUseCase->execute($dto);

            http_response_code(201);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => $e->getMessage()]);
        }
    }

    public function accept(array $params): void
    {
        try {
            $result = $this->acceptOfferUseCase->execute($params['id']);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\DomainException $e) {
            http_response_code(422);
            echo json_encode(['error' => 'Unprocessable Entity', 'message' => $e->getMessage()]);
        }
    }
}
