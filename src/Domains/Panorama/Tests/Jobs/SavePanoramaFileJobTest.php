<?php
namespace App\Domains\Panorama\Tests\Jobs;

use App\Domains\Panorama\Jobs\SavePanoramaFileJob;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class SavePanoramaFileJobTest extends TestCase
{
    public function test_save_normal_panorama_file()
    {
        $file = UploadedFile::fake()->image('pano.jpg','600','600');
        $job = new SavePanoramaFileJob($file, 'MySlug');
        $job->handle();
        $this->assertFileExists(public_path('uploads/MySlug.jpeg'));
    }

    public function test_save_big_panorama_file()
    {
        $file = UploadedFile::fake()->image('pano.jpg','4098','4098');
        $job = new SavePanoramaFileJob($file, 'MySlug');
        $job->handle();
        $this->assertFileExists(public_path('uploads/MySlug.jpeg'));
        $image_width = getimagesize(public_path('uploads/MySlug.jpeg'))[0];
        $this->assertEquals('4096', $image_width);

    }

    public function tearDown()
    {
        if(file_exists(public_path('uploads/MySlug.jpeg'))) unlink(public_path('uploads/MySlug.jpeg'));
    }
}
