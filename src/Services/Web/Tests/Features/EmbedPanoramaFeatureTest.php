<?php
namespace App\Services\Web\Tests\Features;

use App\Data\Panorama;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;
use App\Services\Web\Features\EmbedPanoramaFeature;

class EmbedPanoramaFeatureTest extends TestCase
{
    use DatabaseTransactions;

    public function setUp()
    {
        parent::setUp();
        factory(Panorama::class)->create();
    }

    public function test_embedpanorama_feature()
    {
        $slug = Panorama::first()->slug();
        $response = $this->get('embed/'.$slug);
        $response->assertStatus(200);
        $response->assertViewIs('embed');
    }
}
