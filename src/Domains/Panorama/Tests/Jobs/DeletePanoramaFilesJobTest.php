<?php
namespace App\Domains\Panorama\Tests\Jobs;

use App\Data\Panorama;
use App\Domains\Panorama\Jobs\DeletePanoramaFilesJob;
use Tests\TestCase;

class DeletePanoramaFilesJobTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        file_put_contents(public_path('uploads/MySlug.jpeg'), 'nothing here');
        file_put_contents(public_path('uploads/MySlug.preview.jpeg'), 'nothing here');
        file_put_contents(public_path('uploads/source/MySlug.vr.jpg'), 'nothing here');
        file_put_contents(public_path('uploads/source/MySlug.ou.jpg'), 'nothing here');



    }

    public function test_delete_cardboard_panorama_files()
    {
        $mPanorama = \Mockery::mock(Panorama::class)->makePartial();
        $mPanorama->shouldReceive('slug')->andReturn('MySlug');
        $job = new DeletePanoramaFilesJob($mPanorama);
        $job->handle();
        $this->assertFileNotExists(public_path('uploads/MySlug.jpeg'));
        $this->assertFileNotExists(public_path('uploads/MySlug.preview.jpeg'));
        $this->assertFileNotExists(public_path('uploads/source/MySlug.vr.jpg'));
        $this->assertFileNotExists(public_path('uploads/source/MySlug.ou.jpg'));



    }


}
