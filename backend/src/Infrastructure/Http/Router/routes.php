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
    $router->post('/api/auth/register', [$authController, 'register'], [$adminMiddleware]);

    // ─── Leads ───────────────────────────────────────────────
    $leadController = $container->getLeadController();
    $router->get('/api/leads', [$leadController, 'index'], [$authMiddleware]);
    $router->post('/api/leads', [$leadController, 'store'], [$authMiddleware]);
    $router->get('/api/leads/{id}', [$leadController, 'show'], [$authMiddleware]);
    $router->post('/api/leads/{id}/assign', [$leadController, 'assign'], [$authMiddleware]);
    $router->post('/api/leads/{id}/qualify', [$leadController, 'qualify'], [$authMiddleware]);
    $router->post('/api/leads/{id}/convert', [$leadController, 'convert'], [$authMiddleware]);

    // ─── Clients ─────────────────────────────────────────────
    $clientController = $container->getClientController();
    $router->get('/api/clients', [$clientController, 'index'], [$authMiddleware]);
    $router->post('/api/clients', [$clientController, 'store'], [$authMiddleware]);
    $router->get('/api/clients/{id}', [$clientController, 'show'], [$authMiddleware]);
    $router->put('/api/clients/{id}', [$clientController, 'update'], [$authMiddleware]);

    // ─── Expedientes ─────────────────────────────────────────
    $expedienteController = $container->getExpedienteController();
    $router->get('/api/expedientes', [$expedienteController, 'index'], [$authMiddleware]);
    $router->post('/api/expedientes', [$expedienteController, 'store'], [$authMiddleware]);
    $router->get('/api/expedientes/{id}', [$expedienteController, 'show'], [$authMiddleware]);
    $router->post('/api/expedientes/{id}/transition', [$expedienteController, 'transition'], [$authMiddleware]);
    $router->post('/api/expedientes/{id}/score', [$expedienteController, 'score'], [$authMiddleware]);

    // ─── Tasks ───────────────────────────────────────────────
    $taskController = $container->getTaskController();
    $router->get('/api/tasks', [$taskController, 'index'], [$authMiddleware]);
    $router->post('/api/tasks', [$taskController, 'store'], [$authMiddleware]);
    $router->post('/api/tasks/{id}/complete', [$taskController, 'complete'], [$authMiddleware]);

    // ─── Offers ──────────────────────────────────────────────
    $offerController = $container->getOfferController();
    $router->get('/api/offers', [$offerController, 'index'], [$authMiddleware]);
    $router->post('/api/offers', [$offerController, 'store'], [$authMiddleware]);
    $router->post('/api/offers/{id}/accept', [$offerController, 'accept'], [$authMiddleware]);

    // ─── Documents ───────────────────────────────────────────
    $documentController = $container->getDocumentController();
    $router->get('/api/documents', [$documentController, 'index'], [$authMiddleware]);
    $router->post('/api/documents', [$documentController, 'upload'], [$authMiddleware]);
    $router->post('/api/documents/{id}/verify', [$documentController, 'verify'], [$authMiddleware]);

    // ─── Notifications ───────────────────────────────────────
    $notificationController = $container->getNotificationController();
    $router->get('/api/notifications', [$notificationController, 'index'], [$authMiddleware]);
    $router->post('/api/notifications/{id}/read', [$notificationController, 'markRead'], [$authMiddleware]);

    // ─── Audit ───────────────────────────────────────────────
    $auditController = $container->getAuditController();
    $router->get('/api/audit', [$auditController, 'index'], [$authMiddleware]);

    // ─── Reports ─────────────────────────────────────────────
    $reportController = $container->getReportController();
    $router->get('/api/reports/dashboard', [$reportController, 'dashboard'], [$authMiddleware]);
    $router->get('/api/reports/pipeline', [$reportController, 'pipeline'], [$authMiddleware]);
};
