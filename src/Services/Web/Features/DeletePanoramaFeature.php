<?php
namespace App\Services\Web\Features;

use App\Domains\Panorama\Jobs\DeletePanoramaFilesJob;
use App\Domains\Panorama\Jobs\DeletePanoramaInfoJob;
use App\Domains\Panorama\Jobs\FindPanoramaByManageKeyJob;
use Lucid\Foundation\Feature;
use Illuminate\Http\Request;

class DeletePanoramaFeature extends Feature
{
    public function handle(Request $request)
    {
        $panorama = $this->run(new FindPanoramaByManageKeyJob($request->get('key')));
        $this->run(new DeletePanoramaFilesJob($panorama));
        $this->run(new DeletePanoramaInfoJob($panorama));

        return redirect('/')->with('warning','Your panorama was deleted');
    }
}
