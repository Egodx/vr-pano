@extends('layouts.main')

@section('title')
    Cardboard Camera and 360° VR Panoramas (photospheres)
@stop

@section('meta')
    <meta name="description" content="{{ setting('site.description') }}">
@stop

@section('content')
    <main class="container-fluid my-2">
        <div class="catalog-rows">
            @if(session('warning'))
                <div class="alert alert-warning">{{ session('warning') }}</div>
            @elseif(session('message'))
                <div class="alert alert-success">{{ session('message') }}</div>
            @endif
            <div class="alert alert-info"><strong>Every panorama here is stereoscopic!</strong> You can see 3D depth of the scene using
                <a target="_blank" href="https://vr.google.com/cardboard/">Google Cardboard</a></div>
        </div>
        <div class="card-group catalog-rows">
            @foreach($panoramas as $panorama)
                        <div class="card shadow-sm pano-card">
                         <div class="card-img-top" >
                             <a class="" href="{{ route('show',$panorama->slug()) }}">
                                 <img src="/uploads/{{ $panorama->slug() }}.preview.jpeg"  class="img-fluid" alt="">
                             </a>
                         </div>
                         <div class="card-body">
                             <h3 class="card-title">
                                 {{ $panorama->title }}
                             </h3>
                             <div class="card-subtitle">
                                 {{ $panorama->created_at }}
                             </div>
                         </div>
                     </div>
            @endforeach
                <div class="card shadow-sm pano-card upload-card">
                    <div class="card-img-top" >
                        <a class="upload-icon" href="{{ route('add') }}">
                            <i class="fas fa-upload fa-10x"></i>
                        </a>
                    </div>
                    <div class="card-body text-info">
                        <h3 class="card-title">
                            Upload
                        </h3>
                        <div class="card-subtitle">
                            Place your idea here
                        </div>
                    </div>
                </div>
        </div>
        <nav class="my-4">
    {!! $panoramas->links() !!}
        </nav>
    </main>
@stop