<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Http\Router;

final class Router
{
    /** @var array<string, array<string, array{handler: callable, middlewares: array}>> */
    private array $routes = [];

    public function get(string $path, callable $handler, array $middlewares = []): void
    {
        $this->addRoute('GET', $path, $handler, $middlewares);
    }

    public function post(string $path, callable $handler, array $middlewares = []): void
    {
        $this->addRoute('POST', $path, $handler, $middlewares);
    }

    public function put(string $path, callable $handler, array $middlewares = []): void
    {
        $this->addRoute('PUT', $path, $handler, $middlewares);
    }

    public function delete(string $path, callable $handler, array $middlewares = []): void
    {
        $this->addRoute('DELETE', $path, $handler, $middlewares);
    }

    private function addRoute(string $method, string $path, callable $handler, array $middlewares): void
    {
        $this->routes[$method][$path] = [
            'handler' => $handler,
            'middlewares' => $middlewares,
        ];
    }

    public function dispatch(string $method, string $uri): void
    {
        $uri = rtrim($uri, '/') ?: '/';

        foreach ($this->routes[$method] ?? [] as $path => $route) {
            $params = $this->matchRoute($path, $uri);
            if ($params !== null) {
                // Run middlewares
                foreach ($route['middlewares'] as $middleware) {
                    $result = $middleware();
                    if ($result === false) {
                        return;
                    }
                }

                ($route['handler'])($params);
                return;
            }
        }

        http_response_code(404);
        echo json_encode(['error' => 'Route not found', 'path' => $uri, 'method' => $method]);
    }

    private function matchRoute(string $pattern, string $uri): ?array
    {
        $patternParts = explode('/', trim($pattern, '/'));
        $uriParts = explode('/', trim($uri, '/'));

        if (count($patternParts) !== count($uriParts)) {
            return null;
        }

        $params = [];
        foreach ($patternParts as $i => $part) {
            if (str_starts_with($part, '{') && str_ends_with($part, '}')) {
                $paramName = trim($part, '{}');
                $params[$paramName] = $uriParts[$i];
            } elseif ($part !== $uriParts[$i]) {
                return null;
            }
        }

        return $params;
    }
}
