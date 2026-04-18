<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Config;

use CRM\Application\Service\AuthService;
use CRM\Application\UseCase\Auth\LoginUseCase;
use CRM\Application\UseCase\Auth\RegisterUseCase;
use CRM\Application\UseCase\Lead\AssignLeadUseCase;
use CRM\Application\UseCase\Lead\ConvertLeadUseCase;
use CRM\Application\UseCase\Lead\CreateLeadUseCase;
use CRM\Application\UseCase\Lead\ListLeadsUseCase;
use CRM\Application\UseCase\Lead\QualifyLeadUseCase;
use CRM\Application\UseCase\Client\CreateClientUseCase;
use CRM\Application\UseCase\Client\GetClientUseCase;
use CRM\Application\UseCase\Client\ListClientsUseCase;
use CRM\Application\UseCase\Client\UpdateClientUseCase;
use CRM\Application\UseCase\Expediente\CreateExpedienteUseCase;
use CRM\Application\UseCase\Expediente\GetExpedienteUseCase;
use CRM\Application\UseCase\Expediente\ListExpedientesUseCase;
use CRM\Application\UseCase\Expediente\ScoreExpedienteUseCase;
use CRM\Application\UseCase\Expediente\TransitionExpedienteUseCase;
use CRM\Application\UseCase\Task\CompleteTaskUseCase;
use CRM\Application\UseCase\Task\CreateTaskUseCase;
use CRM\Application\UseCase\Task\ListTasksUseCase;
use CRM\Application\UseCase\Offer\AcceptOfferUseCase;
use CRM\Application\UseCase\Offer\CreateOfferUseCase;
use CRM\Application\UseCase\Offer\ListOffersUseCase;
use CRM\Application\UseCase\Document\ListDocumentsUseCase;
use CRM\Application\UseCase\Document\UploadDocumentUseCase;
use CRM\Application\UseCase\Document\VerifyDocumentUseCase;
use CRM\Application\UseCase\Notification\ListNotificationsUseCase;
use CRM\Application\UseCase\Notification\MarkReadUseCase;
use CRM\Application\UseCase\Notification\SendNotificationUseCase;
use CRM\Application\UseCase\Audit\GetAuditTrailUseCase;
use CRM\Application\UseCase\Audit\LogActionUseCase;
use CRM\Application\UseCase\Report\GetDashboardUseCase;
use CRM\Application\UseCase\Report\GetPipelineUseCase;
use CRM\Domain\Event\EventDispatcher;
use CRM\Domain\Event\EventDispatcherInterface;
use CRM\Domain\Service\ExpedienteStateMachine;
use CRM\Domain\Service\ScoringService;
use CRM\Infrastructure\Database\Connection;
use CRM\Infrastructure\Database\QueryBuilder;
use CRM\Infrastructure\Http\Controller\AuditController;
use CRM\Infrastructure\Http\Controller\AuthController;
use CRM\Infrastructure\Http\Controller\ClientController;
use CRM\Infrastructure\Http\Controller\DocumentController;
use CRM\Infrastructure\Http\Controller\ExpedienteController;
use CRM\Infrastructure\Http\Controller\LeadController;
use CRM\Infrastructure\Http\Controller\NotificationController;
use CRM\Infrastructure\Http\Controller\OfferController;
use CRM\Infrastructure\Http\Controller\ReportController;
use CRM\Infrastructure\Http\Controller\TaskController;
use CRM\Infrastructure\Http\Middleware\AuthMiddleware;
use CRM\Infrastructure\Repository\MySQLAuditLogRepository;
use CRM\Infrastructure\Repository\MySQLClientRepository;
use CRM\Infrastructure\Repository\MySQLDocumentRepository;
use CRM\Infrastructure\Repository\MySQLExpedienteRepository;
use CRM\Infrastructure\Repository\MySQLLeadRepository;
use CRM\Infrastructure\Repository\MySQLNotificationRepository;
use CRM\Infrastructure\Repository\MySQLOfferRepository;
use CRM\Infrastructure\Repository\MySQLTaskRepository;
use CRM\Infrastructure\Repository\MySQLUserRepository;

final class Container
{
    private array $instances = [];

    // ─── Infrastructure ──────────────────────────────────────

    public function getQueryBuilder(): QueryBuilder
    {
        return $this->singleton('query_builder', function () {
            $pdo = Connection::getInstance();
            return new QueryBuilder($pdo);
        });
    }

    public function getAuthService(): AuthService
    {
        return $this->singleton('auth_service', function () {
            $config = require __DIR__ . '/../../../config/app.php';
            return new AuthService(
                secret: $config['jwt']['secret'],
                expiration: $config['jwt']['expiration'],
                algorithm: $config['jwt']['algorithm'],
                issuer: $config['jwt']['issuer'],
            );
        });
    }

    public function getEventDispatcher(): EventDispatcherInterface
    {
        return $this->singleton('event_dispatcher', fn() => new EventDispatcher());
    }

    // ─── Repositories ────────────────────────────────────────

    public function getUserRepository(): MySQLUserRepository
    {
        return $this->singleton('user_repo', fn() => new MySQLUserRepository($this->getQueryBuilder()));
    }

    public function getLeadRepository(): MySQLLeadRepository
    {
        return $this->singleton('lead_repo', fn() => new MySQLLeadRepository($this->getQueryBuilder()));
    }

    public function getClientRepository(): MySQLClientRepository
    {
        return $this->singleton('client_repo', fn() => new MySQLClientRepository($this->getQueryBuilder()));
    }

    public function getExpedienteRepository(): MySQLExpedienteRepository
    {
        return $this->singleton('expediente_repo', fn() => new MySQLExpedienteRepository($this->getQueryBuilder()));
    }

    public function getOfferRepository(): MySQLOfferRepository
    {
        return $this->singleton('offer_repo', fn() => new MySQLOfferRepository($this->getQueryBuilder()));
    }

    public function getTaskRepository(): MySQLTaskRepository
    {
        return $this->singleton('task_repo', fn() => new MySQLTaskRepository($this->getQueryBuilder()));
    }

    public function getDocumentRepository(): MySQLDocumentRepository
    {
        return $this->singleton('document_repo', fn() => new MySQLDocumentRepository($this->getQueryBuilder()));
    }

    public function getNotificationRepository(): MySQLNotificationRepository
    {
        return $this->singleton('notification_repo', fn() => new MySQLNotificationRepository($this->getQueryBuilder()));
    }

    public function getAuditLogRepository(): MySQLAuditLogRepository
    {
        return $this->singleton('audit_log_repo', fn() => new MySQLAuditLogRepository($this->getQueryBuilder()));
    }

    // ─── Domain Services ─────────────────────────────────────

    public function getScoringService(): ScoringService
    {
        return $this->singleton('scoring_service', fn() => new ScoringService());
    }

    public function getStateMachine(): ExpedienteStateMachine
    {
        return $this->singleton('state_machine', fn() => new ExpedienteStateMachine());
    }

    // ─── Middleware ───────────────────────────────────────────

    public function getAuthMiddleware(): AuthMiddleware
    {
        return $this->singleton('auth_middleware', fn() => new AuthMiddleware($this->getAuthService()));
    }

    // ─── Controllers ─────────────────────────────────────────

    public function getAuthController(): AuthController
    {
        return new AuthController(
            new LoginUseCase($this->getUserRepository(), $this->getAuthService()),
            new RegisterUseCase($this->getUserRepository()),
        );
    }

    public function getLeadController(): LeadController
    {
        return new LeadController(
            new CreateLeadUseCase($this->getLeadRepository(), $this->getEventDispatcher()),
            new AssignLeadUseCase($this->getLeadRepository(), $this->getUserRepository()),
            new QualifyLeadUseCase($this->getLeadRepository()),
            new ConvertLeadUseCase($this->getLeadRepository(), $this->getClientRepository()),
            new ListLeadsUseCase($this->getLeadRepository()),
        );
    }

    public function getClientController(): ClientController
    {
        return new ClientController(
            new CreateClientUseCase($this->getClientRepository()),
            new UpdateClientUseCase($this->getClientRepository()),
            new GetClientUseCase($this->getClientRepository()),
            new ListClientsUseCase($this->getClientRepository()),
        );
    }

    public function getExpedienteController(): ExpedienteController
    {
        return new ExpedienteController(
            new CreateExpedienteUseCase($this->getExpedienteRepository(), $this->getClientRepository()),
            new GetExpedienteUseCase($this->getExpedienteRepository()),
            new ListExpedientesUseCase($this->getExpedienteRepository()),
            new TransitionExpedienteUseCase(
                $this->getExpedienteRepository(),
                $this->getStateMachine(),
                $this->getEventDispatcher(),
            ),
            new ScoreExpedienteUseCase(
                $this->getExpedienteRepository(),
                $this->getClientRepository(),
                $this->getScoringService(),
            ),
        );
    }

    public function getTaskController(): TaskController
    {
        return new TaskController(
            new CreateTaskUseCase($this->getTaskRepository()),
            new CompleteTaskUseCase($this->getTaskRepository()),
            new ListTasksUseCase($this->getTaskRepository()),
        );
    }

    public function getOfferController(): OfferController
    {
        return new OfferController(
            new CreateOfferUseCase($this->getOfferRepository(), $this->getEventDispatcher()),
            new AcceptOfferUseCase($this->getOfferRepository()),
            new ListOffersUseCase($this->getOfferRepository()),
        );
    }

    public function getDocumentController(): DocumentController
    {
        return new DocumentController(
            new UploadDocumentUseCase($this->getDocumentRepository(), $this->getEventDispatcher()),
            new VerifyDocumentUseCase($this->getDocumentRepository()),
            new ListDocumentsUseCase($this->getDocumentRepository()),
        );
    }

    public function getNotificationController(): NotificationController
    {
        return new NotificationController(
            new ListNotificationsUseCase($this->getNotificationRepository()),
            new MarkReadUseCase($this->getNotificationRepository()),
        );
    }

    public function getAuditController(): AuditController
    {
        return new AuditController(
            new GetAuditTrailUseCase($this->getAuditLogRepository()),
        );
    }

    public function getReportController(): ReportController
    {
        return new ReportController(
            new GetDashboardUseCase(
                $this->getLeadRepository(),
                $this->getExpedienteRepository(),
                $this->getClientRepository(),
            ),
            new GetPipelineUseCase($this->getExpedienteRepository()),
        );
    }

    // ─── Singleton Helper ────────────────────────────────────

    private function singleton(string $key, callable $factory): mixed
    {
        if (!isset($this->instances[$key])) {
            $this->instances[$key] = $factory();
        }
        return $this->instances[$key];
    }
}
