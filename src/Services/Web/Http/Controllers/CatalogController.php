<?php
namespace App\Services\Web\Http\Controllers;

use App\Services\Web\Features\ShowCatalogFeature;
use Illuminate\Http\Request;
use Lucid\Foundation\Http\Controller;

class CatalogController extends Controller
{
    /**
     *  Shows the catalog
     *
     * @return mixed
     */
    public function index()
    {
        return $this->serve(ShowCatalogFeature::class);
    }
}
