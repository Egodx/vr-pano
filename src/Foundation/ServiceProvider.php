<?php
namespace App\Foundation;

use App\Services\Web\Providers\WebServiceProvider;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider as BaseServiceProvider;

class ServiceProvider extends BaseServiceProvider
{
    public function register()
    {
        // Register the service providers of your Services here.
        // $this->app->register('full namespace here')

        $this->app->register(WebServiceProvider::class);
    }
}
