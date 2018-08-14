<?php
namespace App\Domains\Panorama\Jobs;

use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;
use Lucid\Foundation\Job;

class SavePanoramaFileJob extends Job
{
    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($converted, $slug)
    {
       $this->converted = $converted;
       $this->slug = $slug;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $img = Image::make($this->converted);
        if ($img->width() > 4096 || $img->height() > 4096) $img->resize(4096, 4096);

        return $img->save(public_path("uploads/{$this->slug}.jpeg"));

    }
}
