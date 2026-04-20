<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Config;

final class ContainerProfiler
{
    private bool $enabled;
    private int $instanceCounter = 0;

    public function __construct(bool $enabled = false)
    {
        $this->enabled = $enabled;
    }

    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Log the creation of a new container instance to STDERR.
     */
    public function logCreation(string $name, object $instance): void
    {
        if (!$this->enabled) {
            return;
        }

        $this->instanceCounter++;

        $className = get_class($instance);
        $objectId = spl_object_id($instance);

        $message = sprintf(
            "[ContainerProfiler] #%d | Name: %-25s | Class: %-60s | ObjectId: %d\n",
            $this->instanceCounter,
            $name,
            $className,
            $objectId,
        );

        // 1. Abrimos el recurso (stream)
        $stream = fopen('php://stderr', 'w');

        // 2. Verificamos que sea un recurso válido antes de escribir
        if (is_resource($stream)) {
            fwrite($stream, $message);
            fclose($stream); // Es buena práctica cerrarlo
        }
    }

    public function getInstanceCount(): int
    {
        return $this->instanceCounter;
    }
}
