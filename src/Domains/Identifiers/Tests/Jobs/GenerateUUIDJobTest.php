<?php
namespace App\Domains\Identifiers\Tests\Jobs;

use App\Domains\Identifiers\Jobs\GenerateUUIDJob;
use Tests\TestCase;

class GenerateUUIDJobTest extends TestCase
{
    public function test_generate_uuid_job()
    {
        $job = new GenerateUUIDJob();
        $this->assertRegExp('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i',$job->handle());
    }
}
