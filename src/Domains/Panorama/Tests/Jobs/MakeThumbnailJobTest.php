<?php
namespace App\Domains\Panorama\Tests\Jobs;

use App\Domains\Panorama\Jobs\MakeThumbnailJob;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class MakeThumbnailJobTest extends TestCase
{
    public function test_make_thumbnail_for_cardboard_photo()
    {
        $file = UploadedFile::fake()->image('pano.jpg','600','300');
        $job = new MakeThumbnailJob($file, 'MySlug','cardboard');
        $job->handle();
        $this->assertFileExists(public_path('uploads/MySlug.preview.jpeg'));
        list($image_width, $image_height,,,,,) = getimagesize(public_path('uploads/MySlug.preview.jpeg'));
        $this->assertEquals('576', $image_width);
        $this->assertEquals('256', $image_height);

    }

    public function test_make_thumbnail_for_equirectangular_image()
    {
        $file = UploadedFile::fake()->image('pano.jpg','600','600');
        $job = new MakeThumbnailJob($file, 'MySlug','equirectangular');
        $job->handle();
        $this->assertFileExists(public_path('uploads/MySlug.preview.jpeg'));
        list($image_width, $image_height,,,,,) = getimagesize(public_path('uploads/MySlug.preview.jpeg'));
        $this->assertEquals('576', $image_width);
        $this->assertEquals('256', $image_height);

    }

    public function tearDown()
    {
        if(file_exists(public_path('uploads/MySlug.preview.jpeg'))) unlink(public_path('uploads/MySlug.preview.jpeg'));
    }
}
