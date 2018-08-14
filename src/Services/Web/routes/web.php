<?php

/*
|--------------------------------------------------------------------------
| Service - Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for this service.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/


    // The controllers live in src/Services/Web/Http/Controllers
    // Route::get('/', 'UserController@index');

    Route::get('/', 'CatalogController@index');
    Route::view('/rules', 'rules');
    Route::get('/show/{slug}', 'PanoramaController@show')->name('show');
    Route::get('/embed/{slug}', 'PanoramaController@embed')->name('embed');
    Route::get('/private/{key}', 'PanoramaController@showPrivate')->name('show.private');
    Route::get('/upload', 'PanoramaController@add')->name('add');
    Route::get('/edit', 'PanoramaController@edit')->name('edit');
    Route::post('/delete', 'PanoramaController@delete')->name('delete');
    Route::post('/upload', 'PanoramaController@save')->name('save');
    Route::post('/edit', 'PanoramaController@update')->name('update');




