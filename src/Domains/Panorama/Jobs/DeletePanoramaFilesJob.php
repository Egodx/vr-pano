<?php
namespace App\Domains\Panorama\Jobs;

use Illuminate\Support\Facades\Storage;
use Lucid\Foundation\Job;

class DeletePanoramaFilesJob extends Job
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
        Storage::delete('uploads/'.$this->panorama->slug().'.jpeg');
        Storage::delete('uploads/'.$this->panorama->slug().'.preview.jpeg');
        Storage::delete('uploads/source/'.$this->panorama->slug().'.vr.jpg');
        Storage::delete('uploads/source/'.$this->panorama->slug().'.ou.jpg');



    }
}
