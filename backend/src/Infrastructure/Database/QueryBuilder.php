<?php

declare(strict_types=1);

namespace CRM\Infrastructure\Database;

final class QueryBuilder
{
    private string $table = '';
    private array $selects = ['*'];
    private array $wheres = [];
    private array $bindings = [];
    private ?string $orderBy = null;
    private ?string $orderDir = 'ASC';
    private ?int $limit = null;
    private ?int $offset = null;

    public function __construct(
        private readonly \PDO $pdo,
    ) {}

    public function table(string $table): self
    {
        $clone = clone $this;
        $clone->table = $table;
        return $clone;
    }

    public function select(array $columns): self
    {
        $clone = clone $this;
        $clone->selects = $columns;
        return $clone;
    }

    public function where(string $column, string $operator, mixed $value): self
    {
        $clone = clone $this;
        $placeholder = ':w' . count($clone->wheres);
        $clone->wheres[] = "{$column} {$operator} {$placeholder}";
        $clone->bindings[$placeholder] = $value;
        return $clone;
    }

    public function orderBy(string $column, string $direction = 'ASC'): self
    {
        $clone = clone $this;
        $clone->orderBy = $column;
        $clone->orderDir = strtoupper($direction);
        return $clone;
    }

    public function limit(int $limit): self
    {
        $clone = clone $this;
        $clone->limit = $limit;
        return $clone;
    }

    public function offset(int $offset): self
    {
        $clone = clone $this;
        $clone->offset = $offset;
        return $clone;
    }

    public function get(): array
    {
        $sql = 'SELECT ' . implode(', ', $this->selects) . ' FROM ' . $this->table;

        if (!empty($this->wheres)) {
            $sql .= ' WHERE ' . implode(' AND ', $this->wheres);
        }

        if ($this->orderBy !== null) {
            $sql .= " ORDER BY {$this->orderBy} {$this->orderDir}";
        }

        if ($this->limit !== null) {
            $sql .= ' LIMIT :_limit';
            $this->bindings[':_limit'] = $this->limit;
        }

        if ($this->offset !== null) {
            $sql .= ' OFFSET :_offset';
            $this->bindings[':_offset'] = $this->offset;
        }

        $stmt = $this->pdo->prepare($sql);
        foreach ($this->bindings as $key => $value) {
            $paramType = is_int($value) ? \PDO::PARAM_INT : \PDO::PARAM_STR;
            $stmt->bindValue($key, $value, $paramType);
        }
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function first(): ?array
    {
        $results = $this->limit(1)->get();
        return $results[0] ?? null;
    }

    public function insert(string $table, array $data): bool
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_map(fn($k) => ":{$k}", array_keys($data)));
        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";

        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($data);
    }

    public function update(string $table, array $data, string $whereColumn, mixed $whereValue): bool
    {
        $sets = implode(', ', array_map(fn($k) => "{$k} = :{$k}", array_keys($data)));
        $sql = "UPDATE {$table} SET {$sets} WHERE {$whereColumn} = :_where_value";

        $data['_where_value'] = $whereValue;
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($data);
    }

    public function delete(string $table, string $whereColumn, mixed $whereValue): bool
    {
        $sql = "DELETE FROM {$table} WHERE {$whereColumn} = :value";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute(['value' => $whereValue]);
    }

    public function count(): int
    {
        $sql = 'SELECT COUNT(*) as count FROM ' . $this->table;

        if (!empty($this->wheres)) {
            $sql .= ' WHERE ' . implode(' AND ', $this->wheres);
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($this->bindings);
        $result = $stmt->fetch();
        return (int) ($result['count'] ?? 0);
    }

    public function raw(string $sql, array $bindings = []): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($bindings);
        return $stmt->fetchAll();
    }
}
