<?php
namespace App\Services\Web\Features;

use App\Domains\Panorama\Jobs\FindPanoramaByPrivateKeyJob;
use Lucid\Foundation\Feature;
use Illuminate\Http\Request;

class ShowPrivatePanoramaFeature extends Feature
{
    /**
     * ShowPrivatePanoramaFeature constructor.
     * @param $slug
     */
    function __construct($key)
    {
        $this->key = $key;
    }


    /**
     * @param Request $request
     * @return \Illuminate\View\View
     */
    public function handle()
    {
        $panorama = $this->run(new FindPanoramaByPrivateKeyJob($this->key));

        return view('show',['panorama' => $panorama]);
    }
}
