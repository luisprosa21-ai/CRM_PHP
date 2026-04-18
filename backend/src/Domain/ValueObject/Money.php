<?php

declare(strict_types=1);

namespace CRM\Domain\ValueObject;

final readonly class Money
{
    public function __construct(
        private float $amount,
        private string $currency = 'EUR',
    ) {
        if ($amount < 0) {
            throw new \InvalidArgumentException('Money amount cannot be negative.');
        }
    }

    public function getAmount(): float
    {
        return $this->amount;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function add(self $other): self
    {
        $this->ensureSameCurrency($other);
        return new self($this->amount + $other->amount, $this->currency);
    }

    public function subtract(self $other): self
    {
        $this->ensureSameCurrency($other);
        $result = $this->amount - $other->amount;
        if ($result < 0) {
            throw new \DomainException('Resulting amount cannot be negative.');
        }
        return new self($result, $this->currency);
    }

    public function multiply(float $factor): self
    {
        return new self(round($this->amount * $factor, 2), $this->currency);
    }

    public function format(): string
    {
        return number_format($this->amount, 2, ',', '.') . ' ' . $this->currency;
    }

    public function equals(self $other): bool
    {
        return $this->currency === $other->currency
            && abs($this->amount - $other->amount) < 0.01;
    }

    private function ensureSameCurrency(self $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new \DomainException("Cannot operate on different currencies: {$this->currency} vs {$other->currency}");
        }
    }

    public function __toString(): string
    {
        return $this->format();
    }
}
