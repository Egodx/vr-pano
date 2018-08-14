@extends('layouts.main')

@section('title')
    Upload your panorama
@stop

@section('content')
    <main class="container my-4">
        <div class="card mb-4 shadow-sm">
            <div class="card-header ">
                <h4>Instructions</h4>
            </div>
            <div class="cart-body">
                    <ol class="mb-4">
                        <li class="my-2">Take a photo using Cardboard Camera app (<a class="text-danger" target="_blank" href="https://play.google.com/store/apps/details?id=com.google.vr.cyclops"><i class="fab fa-android"></i> Android</a>
                            or
                            <a class="text-danger" target="_blank" href="https://itunes.apple.com/us/app/cardboard-camera/id1095487294"><i class="fab fa-apple"></i> iOS</a>). <br>
                            Or make an equirectangular stereo image (aspect ratio must be 1:1). <a target="_blank" href="/equirect.example.jpg">Example.</a>
                        </li>
                        <li class="my-2">
                            Drop it to the box below or open a file from your PC or mobile.
                        </li>
                        <li class="my-2">
                            Wait until conversion is completed
                        </li>
                        <li class="my-2">
                            Enter the panorama name and click <span class="text-primary"><i class="fas fa-fw fa-upload"></i> Upload</span>
                        </li>
                    </ol>
            </div>
        </div>
    <!-- The in progress dialog -->
    <div class="modal" tabindex="-1" id="progress" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Converting...</h5>
                 </div>
                <div class="modal-body">
                    <div class="linear-progress small mb-4">
                        <div class="bar bar1"></div>
                        <div class="bar bar2"></div>
                    </div>
                    <p>It may take a few minutes</p>
                </div>
            </div>
        </div>
    </div>

    <!-- The failed dialog -->
    <div class="modal" tabindex="-1" id="fail" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Error</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <p id="error-message">I'm just can't do that</p>
                </div>

            </div>
        </div>
    </div>


    <div id="dropzone" class="cardboard">
        <div class="drop-message">
            <img src="/images/logo_google_cardboard_camera_24dp.svg">
            <h1>Drop a Cardboard Camera or Equirectangular Image to Convert</h1>
            <h2 id="openfile">or click here to open a file</h2>
        </div>
        <input type="file" multiple="true" style="display: none;">
    </div>


    <div class="form-group">
        <label for="panorama-title">Panorama name <span class="text-danger">*</span></label>
        <input class="form-control" name="name" type="text" id="panorama-title" minlength="2" required>
    </div>

    <div class="form-group form-check my-4">
        <input type="checkbox" name="public" id="public" value="1" class="form-check-input" checked>
        <label for="public" class="form-check-label">
            <span >Place my panorama to the catalog</span><br>
            <span class="text-muted">Visible for everyone. Uncheck to make it available by link only.</span>
        </label>
    </div>

    <button class="btn btn-lg btn-primary" id="send"><i class="fas fa-fw fa-upload"></i> Upload</button>
    </main>
    @stop

@section('scripts')
    <script defer src="https://use.fontawesome.com/releases/v5.0.13/js/brands.js" integrity="sha384-G/XjSSGjG98ANkPn82CYar6ZFqo7iCeZwVZIbNWhAmvCF2l+9b5S21K4udM7TGNu" crossorigin="anonymous"></script>
    <script src="/js/all.js"></script>
@stop
