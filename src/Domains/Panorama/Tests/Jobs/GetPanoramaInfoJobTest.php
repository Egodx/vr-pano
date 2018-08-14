<?php
namespace App\Domains\Panorama\Tests\Jobs;

use App\Data\Panorama;
use App\Domains\Panorama\Jobs\GetPanoramaInfoJob;
use Tests\TestCase;

class GetPanoramaInfoJobTest extends TestCase
{
    public function test_get_panorama_info_job()
    {
        $mPanorama = \Mockery::mock(Panorama::class)->makePartial();
        $result = new Panorama();
        $mPanorama->shouldReceive('findBySlug')->with('abc')->andReturn($result);

        $job = new GetPanoramaInfoJob('abc');
        $this->assertInstanceOf(Panorama::class,$job->handle($mPanorama));
    }
}
