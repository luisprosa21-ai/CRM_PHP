<?php

declare(strict_types=1);

namespace CRM\Domain\ValueObject;

final readonly class Email
{
    private string $value;

    public function __construct(string $value)
    {
        $normalized = mb_strtolower(trim($value));
        if (!filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email address: {$value}");
        }
        $this->value = $normalized;
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function getDomain(): string
    {
        return substr($this->value, strpos($this->value, '@') + 1);
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
