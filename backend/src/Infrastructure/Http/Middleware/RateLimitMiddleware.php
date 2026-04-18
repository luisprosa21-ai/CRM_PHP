<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Middleware;

final class RateLimitMiddleware
{
    public function __construct(
        private readonly int $maxRequests = 60,
        private readonly int $windowSeconds = 60,
        private readonly string $storageDir = './storage/rate_limit',
    ) {}

    public function handle(): bool
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $key = md5($ip);
        $file = $this->storageDir . '/' . $key;

        if (!is_dir($this->storageDir)) {
            mkdir($this->storageDir, 0755, true);
        }

        $now = time();
        $data = ['requests' => [], 'blocked_until' => 0];

        if (file_exists($file)) {
            $content = file_get_contents($file);
            if ($content !== false) {
                $data = json_decode($content, true) ?: $data;
            }
        }

        if ($data['blocked_until'] > $now) {
            http_response_code(429);
            $retryAfter = $data['blocked_until'] - $now;
            header("Retry-After: {$retryAfter}");
            echo json_encode(['error' => 'Too Many Requests', 'retry_after' => $retryAfter]);
            return false;
        }

        // Filter requests within the window
        $data['requests'] = array_filter(
            $data['requests'],
            fn(int $timestamp) => $timestamp > ($now - $this->windowSeconds),
        );

        if (count($data['requests']) >= $this->maxRequests) {
            $data['blocked_until'] = $now + $this->windowSeconds;
            file_put_contents($file, json_encode($data));
            http_response_code(429);
            header("Retry-After: {$this->windowSeconds}");
            echo json_encode(['error' => 'Too Many Requests', 'retry_after' => $this->windowSeconds]);
            return false;
        }

        $data['requests'][] = $now;
        file_put_contents($file, json_encode($data));

        $remaining = $this->maxRequests - count($data['requests']);
        header("X-RateLimit-Limit: {$this->maxRequests}");
        header("X-RateLimit-Remaining: {$remaining}");

        return true;
    }
}
