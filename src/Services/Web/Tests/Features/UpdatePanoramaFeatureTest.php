<?php
namespace App\Services\Web\Tests\Features;

use App\Data\Panorama;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;
use App\Services\Web\Features\UpdatePanoramaFeature;

class UpdatePanoramaFeatureTest extends TestCase
{
    use DatabaseTransactions;

    public function setUp()
    {
        parent::setUp();
        factory(Panorama::class)->create(['manage_key'=>'manage_me']);
    }

    public function test_it_can_update_panorama_title()
    {
        $response = $this->post('/edit',[
            'manage_key'   => 'manage_me',
            'title' => 'New Title'
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas(['message']);
        $this->assertDatabaseHas('panoramas',['title'=> 'New Title']);
    }

    public function test_it_can_set_panorama_private_key()
    {
        $response = $this->post('/edit',[
            'manage_key'    => 'manage_me',
            'title'         => 'Not a New Title',
            'public'        => 0
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas(['message']);
        $pano = Panorama::withoutGlobalScopes()->where('manage_key','manage_me')->first();
        $this->assertNotEmpty($pano->private_key);
    }
}
