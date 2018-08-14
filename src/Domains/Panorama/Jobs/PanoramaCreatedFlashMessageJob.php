<?php
namespace App\Domains\Panorama\Jobs;

use Illuminate\Http\Request;
use Lucid\Foundation\Job;

class PanoramaCreatedFlashMessageJob extends Job
{
    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(Request $request)
    {
        $request->session()->flash('message', 'Your panorama created successfully!');
    }
}
