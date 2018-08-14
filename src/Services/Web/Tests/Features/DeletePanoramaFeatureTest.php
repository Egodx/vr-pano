<?php
namespace App\Services\Web\Tests\Features;

use App\Data\Panorama;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use App\Services\Web\Features\DeletePanoramaFeature;

class DeletePanoramaFeatureTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        DB::update("ALTER TABLE panoramas AUTO_INCREMENT = 4000000000;"); // Do no harm to existing files
        $panorama = factory(Panorama::class)->create();
        if (file_exists(public_path('uploads/'.$panorama->slug().'.jpeg'))) {
            $this->tearDown();
            $this->markTestSkipped('You are already have a panorama with id = 4 000 000 000. Update id for this test.');
        }
        else {
            file_put_contents(public_path('uploads/'.$panorama->slug().'.jpeg'),'main');
            file_put_contents(public_path('uploads/'.$panorama->slug().'.preview.jpeg'),'preview');
            file_put_contents(public_path('uploads/source/'.$panorama->slug().'.vr.jpg'),'cardboard source');
        }
    }

    public function test_deletepanorama_feature()
    {
        $panorama = Panorama::first();
        $slug = $panorama->slug();
        $response = $this->post('delete',[
            'key' =>$panorama->manage_key
        ]);

        $response->assertRedirect('/');
        $response->assertSessionHas('warning');
        $this->assertFileNotExists(public_path("uploads/$slug.jpeg"));
        $this->assertFileNotExists(public_path("uploads/$slug.preview.jpeg"));
        $this->assertFileNotExists(public_path("uploads/source/$slug.vr.jpg"));
        $this->assertDatabaseMissing('panoramas',['id' => 4000000000]);


    }

    public function tearDown()
    {
        DB::table('panoramas')->truncate();
    }

}
