<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Controller;

use CRM\Application\DTO\UploadDocumentDTO;
use CRM\Application\UseCase\Document\ListDocumentsUseCase;
use CRM\Application\UseCase\Document\UploadDocumentUseCase;
use CRM\Application\UseCase\Document\VerifyDocumentUseCase;

final class DocumentController
{
    public function __construct(
        private readonly UploadDocumentUseCase $uploadDocumentUseCase,
        private readonly VerifyDocumentUseCase $verifyDocumentUseCase,
        private readonly ListDocumentsUseCase $listDocumentsUseCase,
    ) {}

    public function index(array $params): void
    {
        try {
            $expedienteId = $_GET['expediente_id'] ?? null;
            $clientId = $_GET['client_id'] ?? null;
            $result = $this->listDocumentsUseCase->execute($expedienteId, $clientId);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\Throwable $e) {
            http_response_code(500);
            error_log($e->getMessage()); echo json_encode(['error' => 'Server Error', 'message' => 'An internal error occurred.']);
        }
    }

    public function upload(array $params): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $input['uploaded_by'] = $_REQUEST['_auth_user_id'] ?? '';
            $dto = UploadDocumentDTO::fromArray($input);
            $result = $this->uploadDocumentUseCase->execute($dto);

            http_response_code(201);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Bad Request', 'message' => $e->getMessage()]);
        }
    }

    public function verify(array $params): void
    {
        try {
            $verifiedBy = $_REQUEST['_auth_user_id'] ?? '';
            $result = $this->verifyDocumentUseCase->execute($params['id'], $verifiedBy);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $result]);
        } catch (\DomainException $e) {
            http_response_code(422);
            echo json_encode(['error' => 'Unprocessable Entity', 'message' => $e->getMessage()]);
        }
    }
}
