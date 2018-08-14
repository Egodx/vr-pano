<?php
namespace App\Services\Web\Tests\Features;

use App\Data\Panorama;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use App\Services\Web\Features\SavePanoramaFeature;

class SavePanoramaFeatureCreationTest extends TestCase
{

    public function setUp()
    {
        parent::setUp();
        DB::update("ALTER TABLE panoramas AUTO_INCREMENT = 4000000000;"); // Do no harm to existing files
    }

    public function test_it_can_upload_cardboard_panorama()
    {
        $response = $this->post('upload', [
            'type'      => 'cardboard',
            'title'     => 'pano title',
            'public'    => 1,
            'source'    => UploadedFile::fake()->image('pano.jpg',768,256),
            'image'     => UploadedFile::fake()->image('pano.jpg',768,768)

        ]);
        $this->assertDatabaseHas('panoramas',['id' => 4000000000,'title'=> 'pano title']);

    }

    public function test_it_can_upload_equirectangular_panorama()
    {
        $response = $this->post('upload', [
            'type'      => 'equirectangular',
            'public'    => 1,
            'title'     => 'different pano title',
            'source'    => UploadedFile::fake()->image('pano.jpg',768,768),

        ]);
        $this->assertDatabaseHas('panoramas',['id' => 4000000000,'title'=> 'different pano title', 'type'=> 1]);
        $response->assertSessionHas('message');
        $response_object = json_decode($response->content());
        $this->assertNotEmpty($response_object->manage_key);
    }

    public function tearDown()
    {

        $slug = Panorama::first()->slug();
        Storage::delete('uploads/'.$slug.'.jpeg');
        Storage::delete('uploads/'.$slug.'.preview.jpeg');
        Storage::delete('uploads/source/'.$slug.'.vr.jpg');
        Storage::delete('uploads/source/'.$slug.'.ou.jpg');
        DB::table('panoramas')->truncate();
    }

}
