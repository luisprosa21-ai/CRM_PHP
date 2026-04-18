<?php

declare(strict_types=1);

namespace CRM\Application\DTO;

final readonly class PaginationDTO
{
    public function __construct(
        public int $page,
        public int $perPage,
        public int $total,
        public array $data,
    ) {}

    public function toArray(): array
    {
        return [
            'data' => $this->data,
            'pagination' => [
                'page' => $this->page,
                'per_page' => $this->perPage,
                'total' => $this->total,
                'total_pages' => $this->perPage > 0 ? (int) ceil($this->total / $this->perPage) : 0,
            ],
        ];
    }
}
