<?php
namespace App\Services\Web\Features;

use Lucid\Foundation\Feature;
use Illuminate\Http\Request;

class ShowUploadForm extends Feature
{
    public function handle(Request $request)
    {
        return view('upload');
    }
}
