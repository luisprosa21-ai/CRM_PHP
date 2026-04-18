<?php

declare(strict_types=1);

namespace CRM\Domain\Event;

interface EventDispatcherInterface
{
    public function dispatch(DomainEvent $event): void;
    public function subscribe(string $eventName, callable $listener): void;
}

final class EventDispatcher implements EventDispatcherInterface
{
    /** @var array<string, callable[]> */
    private array $listeners = [];

    public function dispatch(DomainEvent $event): void
    {
        $eventName = $event->getName();
        foreach ($this->listeners[$eventName] ?? [] as $listener) {
            $listener($event);
        }
    }

    public function subscribe(string $eventName, callable $listener): void
    {
        $this->listeners[$eventName][] = $listener;
    }
}
