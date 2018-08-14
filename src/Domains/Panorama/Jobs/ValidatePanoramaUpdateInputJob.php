<?php
namespace App\Domains\Panorama\Jobs;

use Illuminate\Http\Request;
use Lucid\Foundation\Job;

class ValidatePanoramaUpdateInputJob extends Job
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
        $request->validate([
            'title'     => 'required|max:255|min:2',
        ]);
    }
}
