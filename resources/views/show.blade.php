@extends('layouts.main')

@section('title')
    {{ $panorama->title }}
@stop

@section('content')
    <main class="container my-4">
        <input type="hidden" name="panorama-id" id="panorama-id" value="{{ $panorama->slug() }}">
        <div class="flex-center position-ref full-height">
            <div class="content">
                <h1 class="display-4">{{ $panorama->title }}</h1>
                <p class="text-muted"><i class="fas fa-calendar-alt"></i> {{ $panorama->created_at }}</p>
                <div class="row">
                    @if($panorama->type == 0)
                        <div class="col-lg-6">
                            <a  class="btn btn-success" style="white-space: normal" href="/uploads/source/{{ $panorama->slug() }}.vr.jpg" download><i class="fas fa-fw fa-download"></i> Download (Cardboard&nbsp;Camera&nbsp;photo)</a>
                        </div>
                    <div class="col-lg-6 mt-4 mt-lg-0">
                        <p class="text-muted text-lg-right">
                            Download viewer for
                            <span class="d-block d-sm-inline mt-2 mt-sm-0">
                                <a class="btn btn-outline-danger" target="_blank" href="https://play.google.com/store/apps/details?id=com.google.vr.cyclops"><i class="fab fa-android"></i> Android</a>
                                or
                                <a class="btn btn-outline-danger" target="_blank" href="https://itunes.apple.com/us/app/cardboard-camera/id1095487294"><i class="fab fa-apple"></i> iOS</a>
                            </span>
                        </p>
                    </div>
                    @elseif($panorama->type == 1)
                        <div class="col-lg-6">
                            <a  class="btn btn-success btn-xs-sm" href="/uploads/source/{{ $panorama->slug() }}.ou.jpg" download>Download (Over/under&nbsp;image&nbsp;format)</a>
                        </div>
                    <div class="col-lg-6 mt-4 mt-lg-0">
                            <p class="text-muted text-lg-right">
                            Download viewer for
                                <span class="d-block d-sm-inline mt-2 mt-sm-0">
                                    <a class="btn btn-outline-danger" target="_blank" href="https://play.google.com/store/apps/details?id=com.xojot.vrplayer"><i class="fab fa-android"></i> Android</a>
                                    or
                                    <a class="btn btn-outline-danger" target="_blank" href="https://itunes.apple.com/ca/app/mobile-vr-station/id959820493"><i class="fab fa-apple"></i> iOS</a>
                                </span>
                        </p>
                    </div>
                    @endif
                </div>
                <h2 class="display-5 preview-title">Preview</h2>
                <div class="card shadow-sm">
                    <div class="card-img-top" >
                        <div id="vrview"></div>
                    </div>
                    <div class="card-body alert-vr">
                        <span class="text-danger ">To enable <strong>VR-mode</strong> open this page on your mobile phone (Android/iOS) and use <a target="_blank" href="https://vr.google.com/cardboard/">Google Cardboard</a></span>
                    </div>
                </div>

            </div>
        </div>
    </main>
@stop

@section('scripts')
    <script defer src="https://use.fontawesome.com/releases/v5.0.13/js/brands.js" integrity="sha384-G/XjSSGjG98ANkPn82CYar6ZFqo7iCeZwVZIbNWhAmvCF2l+9b5S21K4udM7TGNu" crossorigin="anonymous"></script>
    <script src="/build/vrview.js"></script>
    <script src="/vrview_frame.js"></script>
@stop