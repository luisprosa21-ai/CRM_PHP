<?php

declare(strict_types=1);

namespace CRM\Domain\ValueObject;

final readonly class Score
{
    private float $value;

    public function __construct(float $value)
    {
        if ($value < 0.0 || $value > 100.0) {
            throw new \InvalidArgumentException("Score must be between 0 and 100, got: {$value}");
        }
        $this->value = round($value, 2);
    }

    public function getValue(): float
    {
        return $this->value;
    }

    public function isViable(): bool
    {
        return $this->value >= 50.0;
    }

    public function getRiskLevel(): string
    {
        return match (true) {
            $this->value >= 80.0 => 'low',
            $this->value >= 60.0 => 'medium',
            $this->value >= 40.0 => 'high',
            default => 'very_high',
        };
    }

    public function equals(self $other): bool
    {
        return abs($this->value - $other->value) < 0.01;
    }

    public function __toString(): string
    {
        return (string) $this->value;
    }
}
