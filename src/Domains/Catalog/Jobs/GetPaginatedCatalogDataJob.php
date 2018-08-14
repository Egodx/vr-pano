<?php
namespace App\Domains\Catalog\Jobs;

use App\Data\Panorama;
use Illuminate\Support\Collection;
use Lucid\Foundation\Job;

class GetPaginatedCatalogDataJob extends Job
{
    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     *
     * @return Collection
     */
    public function handle(Panorama $panoramas)
    {
        return $panoramas->orderBy('created_at','desc')->paginate(20);
    }
}
