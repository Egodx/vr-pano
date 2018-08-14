<?php
namespace App\Services\Web\Features;

use App\Domains\Identifiers\Jobs\GenerateUUIDJob;
use App\Domains\Panorama\Jobs\MakeThumbnailJob;
use App\Domains\Panorama\Jobs\PanoramaCreatedFlashMessageJob;
use App\Domains\Panorama\Jobs\SavePanoramaFileJob;
use App\Domains\Panorama\Jobs\SaveSourceFileJob;
use App\Domains\Panorama\Jobs\ValidatePanoramaUploadInputJob;
use App\Domains\Panorama\Jobs\SavePanoramaInfoToDatabaseJob;
use Lucid\Foundation\Feature;
use Illuminate\Http\Request;

class SavePanoramaFeature extends Feature
{
    public function handle(Request $request)
    {
        $this->run(new ValidatePanoramaUploadInputJob());
        $manage_key = $this->run(new GenerateUUIDJob());
        $slug = $this->run(new SavePanoramaInfoToDatabaseJob(
            $request->get('title'),
            $manage_key,
            $request->get('public'),
            $request->get('type')
        ));
        if($request->get('type') == 'cardboard' ) $this->run(new SavePanoramaFileJob($request->file('image'),$slug));
        else $this->run(new SavePanoramaFileJob($request->file('source'),$slug));

        $this->run(new SaveSourceFileJob($request->file('source'),$slug,$request->get('type')));

        $this->run(new MakeThumbnailJob($request->file('source'),$slug, $request->get('type')));

        $this->run(new PanoramaCreatedFlashMessageJob());

        return ['manage_key'=>$manage_key];
    }
}
