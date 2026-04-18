<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Database;

final class Connection
{
    private static ?\PDO $instance = null;

    private function __construct() {}

    public static function getInstance(): \PDO
    {
        if (self::$instance === null) {
            $config = require __DIR__ . '/../../../config/database.php';
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $config['host'],
                $config['port'],
                $config['database'],
                $config['charset'],
            );

            self::$instance = new \PDO(
                $dsn,
                $config['username'],
                $config['password'],
                $config['options'],
            );
        }

        return self::$instance;
    }

    public static function reset(): void
    {
        self::$instance = null;
    }
}
