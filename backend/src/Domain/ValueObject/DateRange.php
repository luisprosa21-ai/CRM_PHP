<?php

declare(strict_types=1);

namespace CRM\Domain\ValueObject;

final readonly class DateRange
{
    public function __construct(
        private \DateTimeImmutable $start,
        private \DateTimeImmutable $end,
    ) {
        if ($end < $start) {
            throw new \InvalidArgumentException('End date must be after start date.');
        }
    }

    public function getStart(): \DateTimeImmutable
    {
        return $this->start;
    }

    public function getEnd(): \DateTimeImmutable
    {
        return $this->end;
    }

    public function contains(\DateTimeImmutable $date): bool
    {
        return $date >= $this->start && $date <= $this->end;
    }

    public function overlaps(self $other): bool
    {
        return $this->start <= $other->end && $this->end >= $other->start;
    }

    public function durationInDays(): int
    {
        return (int) $this->start->diff($this->end)->days;
    }

    public function equals(self $other): bool
    {
        return $this->start == $other->start && $this->end == $other->end;
    }
}
