<?php
namespace App\Domains\Panorama\Tests\Jobs;

use App\Data\Panorama;
use App\Domains\Panorama\Jobs\DeletePanoramaInfoJob;
use Tests\TestCase;

class DeletePanoramaInfoJobTest extends TestCase
{
    public function test_delete_panorama_info_job()
    {
        $mPanorama = \Mockery::mock(Panorama::class)->makePartial();
        $mPanorama->shouldReceive('delete')->andReturn(true);

        $job = new DeletePanoramaInfoJob($mPanorama);
        $job->handle();
    }
}
