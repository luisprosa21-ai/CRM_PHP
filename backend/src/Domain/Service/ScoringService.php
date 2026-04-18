<?php

declare(strict_types=1);

namespace CRM\Domain\Service;

use CRM\Domain\Entity\Client;
use CRM\Domain\Entity\Expediente;
use CRM\Domain\ValueObject\Score;

final class ScoringService
{
    /**
     * Calculate a viability score based on client financial data and expediente details.
     *
     * Factors weighted:
     * - LTV ratio (30%): Lower LTV = higher score
     * - Debt ratio (25%): Lower debt = higher score
     * - Income level (20%): Higher income = higher score
     * - Employment stability (15%): Permanent > freelance > temporary
     * - Loan term (10%): Moderate terms score higher
     */
    public function calculateScore(Client $client, Expediente $expediente): Score
    {
        $ltvScore = $this->calculateLtvScore($expediente->calculateLTV());
        $debtScore = $this->calculateDebtScore($client, $expediente);
        $incomeScore = $this->calculateIncomeScore($client->getMonthlyIncome());
        $employmentScore = $this->calculateEmploymentScore($client->getEmploymentType());
        $termScore = $this->calculateTermScore($expediente->getTerm());

        $totalScore = ($ltvScore * 0.30)
            + ($debtScore * 0.25)
            + ($incomeScore * 0.20)
            + ($employmentScore * 0.15)
            + ($termScore * 0.10);

        return new Score(round($totalScore, 2));
    }

    private function calculateLtvScore(float $ltv): float
    {
        return match (true) {
            $ltv <= 60.0 => 100.0,
            $ltv <= 70.0 => 85.0,
            $ltv <= 80.0 => 70.0,
            $ltv <= 90.0 => 45.0,
            $ltv <= 100.0 => 20.0,
            default => 0.0,
        };
    }

    private function calculateDebtScore(Client $client, Expediente $expediente): float
    {
        $estimatedMonthlyPayment = $this->estimateMonthlyPayment(
            $expediente->getRequestedAmount(),
            $expediente->getTerm(),
        );
        $debtRatio = $client->calculateDebtRatio($estimatedMonthlyPayment);

        return match (true) {
            $debtRatio <= 25.0 => 100.0,
            $debtRatio <= 30.0 => 85.0,
            $debtRatio <= 35.0 => 65.0,
            $debtRatio <= 40.0 => 40.0,
            $debtRatio <= 50.0 => 20.0,
            default => 0.0,
        };
    }

    private function calculateIncomeScore(float $monthlyIncome): float
    {
        return match (true) {
            $monthlyIncome >= 5000.0 => 100.0,
            $monthlyIncome >= 3500.0 => 85.0,
            $monthlyIncome >= 2500.0 => 70.0,
            $monthlyIncome >= 1500.0 => 50.0,
            $monthlyIncome >= 1000.0 => 30.0,
            default => 10.0,
        };
    }

    private function calculateEmploymentScore(string $employmentType): float
    {
        return match (mb_strtolower($employmentType)) {
            'permanent', 'indefinido', 'funcionario' => 100.0,
            'contract', 'temporal' => 60.0,
            'freelance', 'autonomo' => 50.0,
            'retired', 'jubilado' => 70.0,
            default => 30.0,
        };
    }

    private function calculateTermScore(int $termMonths): float
    {
        return match (true) {
            $termMonths <= 120 => 100.0,
            $termMonths <= 180 => 90.0,
            $termMonths <= 240 => 75.0,
            $termMonths <= 300 => 55.0,
            $termMonths <= 360 => 40.0,
            default => 20.0,
        };
    }

    private function estimateMonthlyPayment(float $amount, int $termMonths): float
    {
        // Conservative 3% annual rate used as baseline for scoring comparison only.
        // Not reflective of actual market rates — provides consistent score benchmarking.
        $monthlyRate = 0.03 / 12;
        if ($monthlyRate === 0.0) {
            return $amount / $termMonths;
        }
        return $amount * ($monthlyRate * pow(1 + $monthlyRate, $termMonths))
            / (pow(1 + $monthlyRate, $termMonths) - 1);
    }
}
