<?php
namespace App\Services\Web\Features;

use App\Domains\Catalog\Jobs\GetPaginatedCatalogDataJob;
use Lucid\Foundation\Feature;
use Illuminate\Http\Request;

class ShowCatalogFeature extends Feature
{
    public function handle(Request $request)
    {
        $panoramas = $this->run(GetPaginatedCatalogDataJob::class);

        return view('catalog', compact('panoramas'));
    }
}
