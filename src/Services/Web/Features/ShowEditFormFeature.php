<?php
namespace App\Services\Web\Features;

use App\Domains\Panorama\Jobs\FindPanoramaByManageKeyJob;
use Lucid\Foundation\Feature;
use Illuminate\Http\Request;

class ShowEditFormFeature extends Feature
{
    public function handle(Request $request)
    {
        $panorama = $this->run(new FindPanoramaByManageKeyJob($request->get('key')));
        return view('edit',compact('panorama') );
    }
}
