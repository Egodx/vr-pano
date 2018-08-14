<?php
namespace App\Services\Web\Tests\Features;

use App\Data\Panorama;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use App\Services\Web\Features\ShowCatalogFeature;

class ShowCatalogFeatureTest extends TestCase
{
    use DatabaseTransactions;

    public function setup()
    {
        parent::setUp();
        factory(Panorama::class,22)->create();
    }

    public function test_showcatalog_feature()
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        $response->assertViewHas('panoramas');
        $response->assertSeeText('Test-');
    }

}
