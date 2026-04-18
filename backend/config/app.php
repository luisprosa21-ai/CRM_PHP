<?php

declare(strict_types=1);

return [
    'name' => 'CRM Hipotecario',
    'env' => $_ENV['APP_ENV'] ?? 'production',
    'debug' => filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),

    'jwt' => [
        'secret' => $_ENV['JWT_SECRET'] ?? 'change-me-in-production',
        'expiration' => (int) ($_ENV['JWT_EXPIRATION'] ?? 3600),
        'algorithm' => 'HS256',
        'issuer' => 'crm-hipotecario',
    ],

    'upload' => [
        'directory' => $_ENV['UPLOAD_DIR'] ?? './storage/documents',
        'max_size' => (int) ($_ENV['MAX_UPLOAD_SIZE'] ?? 10485760),
        'allowed_types' => [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
    ],

    'cors' => [
        'allowed_origins' => array_filter(
            explode(',', $_ENV['ALLOWED_ORIGINS'] ?? 'http://localhost:3000')
        ),
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
        'max_age' => 86400,
    ],
];
