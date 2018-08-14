<?php
namespace App\Domains\Panorama\Jobs;

use Illuminate\Support\Facades\Storage;
use Lucid\Foundation\Job;

class SaveSourceFileJob extends Job
{
    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($file, $slug, $type)
    {
        $this->file = $file;
        $this->slug = $slug;
        $this->type = $type;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $extension = '.vr.jpg'; //Default for Cardboard camera
        if ($this->type =='equirectangular') $extension = '.ou.jpg';

        return Storage::putFileAs('uploads/source', $this->file, $this->slug.$extension);
    }
}
