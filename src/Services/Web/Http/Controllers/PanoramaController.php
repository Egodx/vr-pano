<?php

namespace App\Services\Web\Http\Controllers;

use App\Services\Web\Features\DeletePanoramaFeature;
use App\Services\Web\Features\EmbedPanoramaFeature;
use App\Services\Web\Features\ShowEditFormFeature;
use App\Services\Web\Features\ShowPrivatePanoramaFeature;
use App\Services\Web\Features\ShowUploadForm;
use App\Services\Web\Features\SavePanoramaFeature;
use App\Services\Web\Features\ShowPanoramaFeature;
use App\Services\Web\Features\UpdatePanoramaFeature;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\View;
use Lucid\Foundation\Http\Controller;

class PanoramaController extends Controller
{

    /**
     * Show a public panorama
     *
     * @param string $slug
     * @return View
     */
    public function show(string $slug)
    {
        return $this->serve(ShowPanoramaFeature::class, ['slug' => $slug]);
    }


    /**
     * Show a private panorama (accessible by link)
     *
     * @param string $key
     * @return View
     */
    public function showPrivate(string $key)
    {
        return $this->serve(ShowPrivatePanoramaFeature::class, ['key' => $key]);
    }


    /**
     * Form for uploading new panorama
     *
     * @return View
     */
    public function add()
    {
        return $this->serve(ShowUploadForm::class);
    }


    /**
     * Form for editing panorama
     *
     * @return View
     */
    public function edit()
    {
        return $this->serve(ShowEditFormFeature::class);
    }


    /**
     * Storing uploaded panorama
     *
     * @return Array
     */
    public function save()
    {
        return $this->serve(SavePanoramaFeature::class);
    }

    /**
     * Update info for edited panorama
     *
     * @return RedirectResponse
     */
    public function update()
    {
        return $this->serve(UpdatePanoramaFeature::class);
    }


    /**
     * Delete a panorama
     *
     * @return RedirectResponse
     */
    public function delete()
    {
        return $this->serve(DeletePanoramaFeature::class);
    }


    /**
     * Embed panorama (iframe export)
     *
     * @return View
     */
    public function embed(string $slug)
    {
        return $this->serve(EmbedPanoramaFeature::class, ['slug' => $slug]);
    }

}
