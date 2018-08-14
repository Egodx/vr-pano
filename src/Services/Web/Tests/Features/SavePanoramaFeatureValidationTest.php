<?php
namespace App\Services\Web\Tests\Features;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;
use App\Services\Web\Features\SavePanoramaFeature;

class SavePanoramaFeatureValidationTest extends TestCase
{
    use DatabaseTransactions;

    public function test_it_requires_all_input_fields_required()
    {
        $response = $this->post('upload', [
            'type' => 'equirectangular'
        ]);
        $response->assertSessionHasErrors(['title','source']);
    }

    public function test_it_requires_valid_title_not_too_short()
    {
        $response = $this->post('upload', [
            'type'  => 'equirectangular',
            'title'  => 'q',
            'source'    => UploadedFile::fake()->image('pano.jpeg',768,768)
        ]);
        $response->assertSessionHasErrors(['title']);
    }

    public function test_it_requires_valid_title_not_too_long()
    {
        $response = $this->post('upload', [
            'type'  => 'equirectangular',
            'title'  => 'very very very very very very very very very very very very very very very very very very 
            very very very very very very very very very very very very very very very very very very very very 
            very very very very very very very very very very very very very very long title',
            'source'    => UploadedFile::fake()->image('pano.jpeg',768,768)
        ]);
        $response->assertSessionHasErrors(['title']);
    }

    public function test_it_requires_valid_source_image_not_too_small()
    {
        $response = $this->post('upload', [
            'type'  => 'equirectangular',
            'title'  => 'pano title',
            'source'    => UploadedFile::fake()->image('pano.jpeg',767,768)
        ]);
        $response->assertSessionHasErrors(['source']);
    }

    public function test_it_requires_valid_image_type()
    {
        $response = $this->post('upload', [
            'type'  => 'cardboard',
            'title'  => 'pano title',
            'source'    => UploadedFile::fake()->image('pano.png',768,768),
            'image'    => UploadedFile::fake()->image('pano.png',768,256)

        ]);
        $response->assertSessionHasErrors(['source','image']);
    }

    public function test_it_requires_valid_equirectangular_image_aspect_ratio()
    {
        $response = $this->post('upload', [
            'type'  => 'equirectangular',
            'title'  => 'pano title',
            'source'    => UploadedFile::fake()->image('pano.jpg',768,256),

        ]);

        $response->assertSessionHasErrors(['source']);
    }

}
