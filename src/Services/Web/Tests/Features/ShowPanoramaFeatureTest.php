<?php
namespace App\Services\Web\Tests\Features;

use App\Data\Panorama;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use App\Services\Web\Features\ShowPanoramaFeature;

class ShowPanoramaFeatureTest extends TestCase
{
    use DatabaseTransactions;

    public function setup()
    {
        parent::setUp();
        factory(Panorama::class)->create();
    }

    public function test_showpanorama_feature()
    {
        $panorama = Panorama::first();
        $response = $this->get('/show/'.$panorama->slug());
        $response->assertStatus(200);
        $response->assertViewHas('panorama');
        $response->assertSeeText('Test-');
    }



}
