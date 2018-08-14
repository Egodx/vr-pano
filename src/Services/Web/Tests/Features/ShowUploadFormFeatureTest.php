<?php
namespace App\Services\Web\Tests\Features;

use Tests\TestCase;
use App\Services\Web\Features\ShowUploadForm;

class ShowUploadFormFeatureTest extends TestCase
{
    public function test_showuploadform_feature()
    {
        $response = $this->get('upload');
        $response->assertViewIs('upload');
        $response->assertSeeText('Upload');

    }
}
