<?php
namespace App\Domains\Panorama\Jobs;

use App\Data\Panorama;
use Illuminate\Support\Facades\Request;
use Lucid\Foundation\Job;

class FindPanoramaByPrivateKeyJob extends Job
{
    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($key)
    {
        $this->key = $key;
    }

    /**
     * Execute the job.
     *
     * @return Panorama
     */
    public function handle(Panorama $panoramas)
    {
        return $panoramas->where('private_key', $this->key)->withoutGlobalScopes()->firstOrFail();
    }
}
