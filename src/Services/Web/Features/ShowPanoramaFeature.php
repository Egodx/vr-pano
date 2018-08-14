<?php
namespace App\Services\Web\Features;

use App\Domains\Panorama\Jobs\GetPanoramaInfoJob;
use Lucid\Foundation\Feature;
use Illuminate\Http\Request;

class ShowPanoramaFeature extends Feature
{
    /**
     * ShowPanoramaFeature constructor.
     * @param $slug
     */
    function __construct($slug)
    {
        $this->slug = $slug;
    }

    /**
     * @param Request $request
     * @return \Illuminate\View\View
     */
    public function handle(Request $request)
    {
        $panorama = $this->run(new GetPanoramaInfoJob ($this->slug));

        return view('show',['panorama' => $panorama]);
    }
}
