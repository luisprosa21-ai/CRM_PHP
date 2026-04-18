<?php

declare(strict_types=1);

namespace CRM\Domain\ValueObject;

final readonly class Phone
{
    private string $value;

    public function __construct(string $value)
    {
        $cleaned = preg_replace('/[\s\-\(\)]/', '', trim($value));
        if (!preg_match('/^\+?[0-9]{6,15}$/', $cleaned)) {
            throw new \InvalidArgumentException("Invalid phone number: {$value}");
        }
        $this->value = $cleaned;
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
