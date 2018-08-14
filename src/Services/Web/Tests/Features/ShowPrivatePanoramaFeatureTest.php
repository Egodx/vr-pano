<?php
namespace App\Services\Web\Tests\Features;

use App\Data\Panorama;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use App\Services\Web\Features\ShowPrivatePanoramaFeature;

class ShowPrivatePanoramaFeatureTest extends TestCase
{
    use DatabaseTransactions;

    public function setup()
    {
        parent::setUp();
        factory(Panorama::class)->create(['private_key' => 'abcd1234','public' => 0]);
    }

    public function test_showpanorama_feature()
    {
        $response = $this->get('/private/abcd1234');
        $response->assertStatus(200);
        $response->assertViewHas('panorama');
        $response->assertSeeText('Test-');
    }


}
