<?php
namespace App\Domains\Panorama\Jobs;

use Lucid\Foundation\Job;

class DeletePanoramaInfoJob extends Job
{
    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($panorama)
    {
        $this->panorama = $panorama;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        return $this->panorama->delete();
    }
}
