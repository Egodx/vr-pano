<?php
namespace App\Services\Web\Tests\Features;

use App\Data\Panorama;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;
use App\Services\Web\Features\UpdatePanoramaFeature;

class UpdatePanoramaFeatureValidationTest extends TestCase
{
    use DatabaseTransactions;

    public function setUp()
    {
        parent::setUp();
        factory(Panorama::class)->create(['manage_key'=>'manage_me']);
    }

    public function test_it_validates_panorama_title_required()
    {
        $response = $this->post('/edit',[
            'manage_key'   => 'manage_me',
            'title' => ''
        ]);
        $response->assertSessionHasErrors(['title']);
    }

    public function test_it_validates_panorama_title_too_short()
    {
        $response = $this->post('/edit',[
            'manage_key'   => 'manage_me',
            'title' => 'q'
        ]);
        $response->assertSessionHasErrors(['title']);
    }

    public function test_it_validates_panorama_title_too_long()
    {
        $response = $this->post('/edit',[
            'key'   => 'manage_me',
            'title' => 'very very very very very very very very very very very very very very very very very very 
            very very very very very very very very very very very very very very very very very very very very 
            very very very very very very very very very very very very very very long title'
        ]);
        $response->assertSessionHasErrors(['title']);
    }
}
