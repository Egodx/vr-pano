<?php
namespace App\Domains\Catalog\Tests\Jobs;

use App\Data\Panorama;
use App\Domains\Catalog\Jobs\GetPaginatedCatalogDataJob;
use Illuminate\Support\Collection;
use Tests\TestCase;

class GetPaginatedCatalogDataJobTest extends TestCase
{
    public function test_get_paginated_catalog_data_job() // Unnecessary deep testing here. Just for code coverage
    {
        $mPanorama = \Mockery::mock(Panorama::class);
        $mPanorama->shouldReceive('orderBy')->andReturn(\Mockery::mock(['paginate'=>collect()]));

        $job = new GetPaginatedCatalogDataJob();

        $this->assertInstanceOf(Collection::class,$job->handle($mPanorama));
    }
}
