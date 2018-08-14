<?php
namespace App\Services\Web\Features;

use App\Domains\Panorama\Jobs\FindPanoramaByManageKeyJob;
use App\Domains\Panorama\Jobs\UpdatePanoramaInfoJob;
use App\Domains\Panorama\Jobs\ValidatePanoramaUpdateInputJob;
use Lucid\Foundation\Feature;
use Illuminate\Http\Request;

class UpdatePanoramaFeature extends Feature
{
    public function handle(Request $request)
    {
        $this->run(new ValidatePanoramaUpdateInputJob());
        $panorama = $this->run(new FindPanoramaByManageKeyJob($request->get('manage_key')));
        $this->run(UpdatePanoramaInfoJob::class, compact('panorama','request'));

        return back()->with('message','Your panorama was updated');
    }
}
