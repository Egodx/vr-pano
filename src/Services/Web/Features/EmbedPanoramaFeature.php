<?php
namespace App\Services\Web\Features;

use App\Domains\Panorama\Jobs\GetPanoramaInfoJob;
use Lucid\Foundation\Feature;
use Illuminate\Http\Request;

class EmbedPanoramaFeature extends Feature
{
    function __construct($slug)
    {
        $this->slug = $slug;
    }

    public function handle(Request $request)
    {
        $panorama = $this->run(new GetPanoramaInfoJob ($this->slug));

        return view('embed',['panorama' => $panorama]);
    }
}
