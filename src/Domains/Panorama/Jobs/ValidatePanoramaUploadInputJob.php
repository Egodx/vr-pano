<?php
namespace App\Domains\Panorama\Jobs;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Lucid\Foundation\Job;

class ValidatePanoramaUploadInputJob extends Job
{
    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct()
    {

    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(Request $request)
    {

        $request->validate([
            'title'     => 'required|max:255|min:2',
            'source'    => 'required|dimensions:min_width=768,min_height=256,max_width=15000,max_height:15000|max:15360|mimes:jpeg',
            'type'      => ['required', Rule::in(['cardboard','equirectangular'])],
            'image'     => 'sometimes|max:16384|required|dimensions:ratio=1|mimes:jpeg',
        ]);

        if($request->get('type') == 'equirectangular'){
            $request->validate([
                'source'      => 'dimensions:ratio=1',
            ]);
        }


    }
}
