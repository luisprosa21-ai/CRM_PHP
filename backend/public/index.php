<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use CRM\Infrastructure\Http\Router\Router;
use CRM\Infrastructure\Http\Middleware\CorsMiddleware;
use CRM\Infrastructure\Config\Container;

// Load environment variables
if (file_exists(__DIR__ . '/../.env')) {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->load();
}

// Error handling
set_error_handler(function (int $severity, string $message, string $file, int $line): bool {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function (Throwable $e): void {
    $appConfig = require __DIR__ . '/../config/app.php';
    $debug = $appConfig['debug'] ?? false;

    http_response_code(500);
    header('Content-Type: application/json');

    $response = ['error' => 'Internal Server Error'];
    if ($debug) {
        $response['message'] = $e->getMessage();
        $response['file'] = $e->getFile();
        $response['line'] = $e->getLine();
        $response['trace'] = $e->getTraceAsString();
    }

    echo json_encode($response);
    exit;
});

// Handle CORS
$appConfig = require __DIR__ . '/../config/app.php';
$cors = new CorsMiddleware($appConfig['cors']);
$cors->handle();

// Bootstrap container and router
$container = new Container();
$router = new Router();

// Register routes
$routeRegistrar = require __DIR__ . '/../src/Infrastructure/Http/Router/routes.php';
$routeRegistrar($router, $container);

// Dispatch request
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

header('Content-Type: application/json');

try {
    $router->dispatch($method, $uri);
} catch (\RuntimeException $e) {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found', 'message' => $e->getMessage()]);
}
