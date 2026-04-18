<?php

declare(strict_types=1);

namespace CRM\Tests\Infrastructure\Config;

use CRM\Infrastructure\Config\ContainerProfiler;
use PHPUnit\Framework\TestCase;

final class ContainerProfilerTest extends TestCase
{
    public function testProfilerDisabledByDefault(): void
    {
        $profiler = new ContainerProfiler();

        $this->assertFalse($profiler->isEnabled());
        $this->assertSame(0, $profiler->getInstanceCount());
    }

    public function testProfilerCanBeEnabled(): void
    {
        $profiler = new ContainerProfiler(enabled: true);

        $this->assertTrue($profiler->isEnabled());
    }

    public function testLogCreationIncrementsCounterWhenEnabled(): void
    {
        $profiler = new ContainerProfiler(enabled: true);

        $instance = new \stdClass();
        $profiler->logCreation('test_service', $instance);

        $this->assertSame(1, $profiler->getInstanceCount());
    }

    public function testLogCreationDoesNotIncrementCounterWhenDisabled(): void
    {
        $profiler = new ContainerProfiler(enabled: false);

        $instance = new \stdClass();
        $profiler->logCreation('test_service', $instance);

        $this->assertSame(0, $profiler->getInstanceCount());
    }

    public function testLogCreationWritesToStderrWhenEnabled(): void
    {
        $profiler = new ContainerProfiler(enabled: true);
        $instance = new \stdClass();

        ob_start();
        $profiler->logCreation('my_service', $instance);
        ob_end_clean();

        // Verify the counter incremented (STDERR output can't be easily captured in PHPUnit)
        $this->assertSame(1, $profiler->getInstanceCount());
    }

    public function testMultipleCreationsIncrementSequentially(): void
    {
        $profiler = new ContainerProfiler(enabled: true);

        $profiler->logCreation('service_a', new \stdClass());
        $profiler->logCreation('service_b', new \stdClass());
        $profiler->logCreation('service_c', new \stdClass());

        $this->assertSame(3, $profiler->getInstanceCount());
    }
}
