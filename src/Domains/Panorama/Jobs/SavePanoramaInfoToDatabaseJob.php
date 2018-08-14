<?php
namespace App\Domains\Panorama\Jobs;

use App\Data\Panorama;
use Lucid\Foundation\Job;

class SavePanoramaInfoToDatabaseJob extends Job
{
    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($title, $manage_key, $public, $type)
    {
        $this->info = array_filter(compact('title', 'public'));
        $this->manage_key = $manage_key;
        $this->type = $type;

    }

    /**
     * Execute the job.
     *
     * @return string
     */
    public function handle()
    {
        $panorama = new Panorama($this->info);

        $panorama->manage_key = $this->manage_key;

        if($this->type == 'equirectangular') $type = 1; //Equirectangular image
        else $type = 0; //Cardboard photo

        $panorama->type = $type;

        $panorama->save();

        return $panorama->slug();

    }
}
