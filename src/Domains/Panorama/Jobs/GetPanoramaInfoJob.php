<?php
namespace App\Domains\Panorama\Jobs;

use App\Data\Panorama;
use Lucid\Foundation\Job;

class GetPanoramaInfoJob extends Job
{
    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($slug)
    {
        $this->slug = $slug;
    }

    /**
     * Execute the job.
     *
     * @return Panorama
     */
    public function handle(Panorama $panoramas)
    {
        return $panoramas->findBySlug($this->slug);


    }
}
