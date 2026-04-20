<?php

declare(strict_types=1);

use CRM\Infrastructure\Http\Router\Router;
use CRM\Infrastructure\Config\Container;

return function (Router $router, Container $container): void {
    $authMiddleware = fn() => $container->getAuthMiddleware()->handle();
    $adminMiddleware = fn() => $container->getAuthMiddleware()->requireRole('admin')();

    // ─── Auth ────────────────────────────────────────────────
    $authController = $container->getAuthController();
    $router->post('/api/auth/login', [$authController, 'login']);
    $router->post('/api/auth/register', [$authController, 'register']);

    // ─── Leads ───────────────────────────────────────────────
    $leadController = fn() => $container->getLeadController() ; // Usamos una función anónima para retrasar la obtención del controlador hasta que se ejecute la ruta
    $router->get('/api/leads', fn($params) => $leadController()->index($params), [$authMiddleware]);
    $router->post('/api/leads', fn($params) => $leadController()->store($params), [$authMiddleware]);
    $router->get('/api/leads/{id}', fn($params) => $leadController()->show($params), [$authMiddleware]);
    $router->post('/api/leads/{id}/assign', fn($params) => $leadController()->assign($params), [$authMiddleware]);
    $router->post('/api/leads/{id}/qualify', fn($params) => $leadController()->qualify($params), [$authMiddleware]);
    $router->post('/api/leads/{id}/convert', fn($params) => $leadController()->convert($params), [$authMiddleware]);

    // ─── Clients ─────────────────────────────────────────────
    $clientController = fn() => $container->getClientController();
    $router->get('/api/clients', fn($params) => $clientController()->index($params), [$authMiddleware]);
    $router->post('/api/clients', fn($params) => $clientController()->store($params), [$authMiddleware]);
    $router->get('/api/clients/{id}', fn($params) => $clientController()->show($params), [$authMiddleware]);
    $router->put('/api/clients/{id}', fn($params) => $clientController()->update($params), [$authMiddleware]);

    // ─── Expedientes ─────────────────────────────────────────
    $expedienteController = fn() => $container->getExpedienteController();
    $router->get('/api/expedients', fn($params) => $expedienteController()->index($params), [$authMiddleware]);
    $router->post('/api/expedients', fn($params) => $expedienteController()->store($params), [$authMiddleware]);
    $router->get('/api/expedients/{id}', fn($params) => $expedienteController()->show($params), [$authMiddleware]);
    $router->post('/api/expedients/{id}/transition', fn($params) => $expedienteController()->transition($params), [$authMiddleware]);
    $router->post('/api/expedients/{id}/score', fn($params) => $expedienteController()->score($params), [$authMiddleware]);

    // ─── Tasks ───────────────────────────────────────────────
    $taskController = fn() => $container->getTaskController();
    $router->get('/api/tasks', fn($params) => $taskController()->index($params), [$authMiddleware]);
    $router->post('/api/tasks', fn($params) => $taskController()->store($params), [$authMiddleware]);
    $router->post('/api/tasks/{id}/complete', fn($params) => $taskController()->complete($params), [$authMiddleware]);

    // ─── Offers ──────────────────────────────────────────────
    $offerController = fn() => $container->getOfferController();
    $router->get('/api/offers', fn($params) => $offerController()->index($params), [$authMiddleware]);
    $router->post('/api/offers', fn($params) => $offerController()->store($params), [$authMiddleware]);
    $router->post('/api/offers/{id}/accept', fn($params) => $offerController()->accept($params), [$authMiddleware]);

    // ─── Documents ───────────────────────────────────────────
    $documentController = fn() => $container->getDocumentController();
    $router->get('/api/documents', fn($params) => $documentController()->index($params), [$authMiddleware]);
    $router->post('/api/documents', fn($params) => $documentController()->upload($params), [$authMiddleware]);
    $router->post('/api/documents/{id}/verify', fn($params) => $documentController()->verify($params), [$authMiddleware]);

    // ─── Notifications ───────────────────────────────────────
    $notificationController = fn() => $container->getNotificationController();
    $router->get('/api/notifications', fn($params) => $notificationController()->index($params), [$authMiddleware]);
    $router->post('/api/notifications/{id}/read', fn($params) => $notificationController()->markRead($params), [$authMiddleware]);

    // ─── Audit ───────────────────────────────────────────────
    $auditController = fn() => $container->getAuditController();
    $router->get('/api/audit', fn($params) => $auditController()->index($params), [$authMiddleware]);

    // ─── Reports ─────────────────────────────────────────────
    $reportController = fn() => $container->getReportController();
    $router->get('/api/reports/dashboard', fn($params) => $reportController()->dashboard($params), [$authMiddleware]);
    $router->get('/api/reports/pipeline', fn($params) => $reportController()->pipeline($params), [$authMiddleware]);
};
