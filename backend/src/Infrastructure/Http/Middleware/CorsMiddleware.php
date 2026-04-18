<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Middleware;

final class CorsMiddleware
{
    public function __construct(
        private readonly array $config,
    ) {}

    public function handle(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOrigins = $this->config['allowed_origins'] ?? [];

        if (in_array($origin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
        } elseif (in_array('*', $allowedOrigins, true)) {
            header('Access-Control-Allow-Origin: *');
        }

        $methods = implode(', ', $this->config['allowed_methods'] ?? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
        $headers = implode(', ', $this->config['allowed_headers'] ?? ['Content-Type', 'Authorization']);
        $maxAge = $this->config['max_age'] ?? 86400;

        header("Access-Control-Allow-Methods: {$methods}");
        header("Access-Control-Allow-Headers: {$headers}");
        header("Access-Control-Max-Age: {$maxAge}");

        // Handle preflight
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
