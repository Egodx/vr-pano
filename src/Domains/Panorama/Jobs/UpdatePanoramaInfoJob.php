<?php
namespace App\Domains\Panorama\Jobs;

use App\Data\Panorama;
use Illuminate\Http\Request;
use Lucid\Foundation\Job;

class UpdatePanoramaInfoJob extends Job
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
     * @return Panorama
     */
    public function handle(Request $request)
    {
        $fields = $request->all();
        if (empty($fields['public']) && $this->panorama->isPublic()){
            $this->panorama->private_key = str_random(36);
            $fields['public'] = 0;
        }

        $this->panorama->fill($fields);
        return $this->panorama->save();
    }
}
