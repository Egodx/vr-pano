<?php
namespace App\Domains\Panorama\Tests\Jobs;

use App\Domains\Panorama\Jobs\SaveSourceFileJob;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class SaveSourceFileJobTest extends TestCase
{

    public function test_save_cardboard_source_file()
    {
        $file = UploadedFile::fake()->image('source.jpg');
        $job = new SaveSourceFileJob($file, 'TSTslug', 'cardboard');
        $job->handle();
        $this->assertFileExists(public_path('uploads/source/TSTslug.vr.jpg'));
    }

    public function test_save_equirectangular_source_file()
    {
        $file = UploadedFile::fake()->image('source.jpg');
        $job = new SaveSourceFileJob($file, 'OUslug', 'equirectangular');
        $job->handle();
        $this->assertFileExists(public_path('uploads/source/OUslug.ou.jpg'));
    }

    public function tearDown()
    {
        if(file_exists(public_path('uploads/source/TSTslug.vr.jpg'))) unlink(public_path('uploads/source/TSTslug.vr.jpg'));
        if(file_exists(public_path('uploads/source/OUslug.ou.jpg'))) unlink(public_path('uploads/source/OUslug.ou.jpg'));
    }

}
