<?php
namespace App\Domains\Panorama\Jobs;

use Intervention\Image\Facades\Image;
use Lucid\Foundation\Job;

class MakeThumbnailJob extends Job
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
        $img = Image::make($this->file);
        $img->getCore()->stripImage(); // Strip XMP tag with full-sized image
        if($this->type == 'equirectangular') $img->crop($img->width(), floor($img->height()/2), 0,0);
        $img->fit('576', '256');
        $img->save(public_path("uploads/{$this->slug}.preview.jpeg"), 80);

    }
}
