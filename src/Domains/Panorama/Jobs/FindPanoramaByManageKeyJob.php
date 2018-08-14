<?php
namespace App\Domains\Panorama\Jobs;

use App\Data\Panorama;
use Lucid\Foundation\Job;

class FindPanoramaByManageKeyJob extends Job
{
    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($id)
    {
        $this->id = $id;
    }

    /**
     * Execute the job.
     *
     * @return Panorama
     */
    public function handle(Panorama $panoramas)
    {
        return $panoramas->withoutGlobalScopes()->where('manage_key', $this->id)->firstOrFail();
    }
}
