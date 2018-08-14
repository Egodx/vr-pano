@extends('layouts.main')

@section('title', 'Edit your panorama')

@section('content')
    <main class="container my-4">
    @if(session('message'))
        <div class="alert alert-success">{{ session('message') }}</div>
    @endif

    @if( $errors->any())
        <div class="alert alert-danger">
            <ul>
                @foreach ($errors->all() as $error)
                   <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif
        <h2 class="display-4 mb-4">Edit your panorama</h2>
    <input type="hidden" name="panorama-id" id="panorama-id" value="{{ $panorama->slug() }}">

    <form id="update-form" action="{{ route('update') }}" method="post">
        <div class="form-group input-group-lg">
            <input type="text" class="form-control " placeholder="Title" required id="title" name="title" value="{{ $panorama->title }}">
        </div>
        <div class="card shadow-sm mb-4">
            <div class="card-img-top">
                <div id="vrview"></div>
            </div>
            <div class="card-body">
                <div class="form-group form-check">
                    <input type="checkbox" name="public" class="form-check-input" id="public" value="1" @if($panorama->public) checked @endif>
                    <label class="form-check-label" for="public"> Place my panorama to the catalog<br>
                        <span class="text-muted">Uncheck to make it private</span></label>
                </div>
            </div>
        </div>
        <input type="hidden" name="manage_key" value="{{ $panorama->manage_key }}">
        {{ csrf_field() }}

        <div class="form-group mb-4">
            <label for="link"><i class="fas fa-fw fa-share-alt"></i> Share link</label>
            <input type="text" readonly class="form-control" id="link" onClick="this.select();" value="{{ $panorama->public? route('show',$panorama->slug()):route('show.private',$panorama->private_key) }}">
        </div>
        <p>
            <a id="show-embed-block" href="#/"><i class="fas fa-fw fa-code"></i> Embed</a>
        </p>
        <div id="embed-block" style="display:none;">
            <div class="form-group">
                <label for="iframe">HTML code</label>
                <textarea readonly="readonly" class="form-control" id="iframe" rows="2">&lt;iframe src="http://vrhosting.net/embed/{{ $panorama->slug() }}" height="480" allowfullscreen allow="accelerometer; magnetometer; gyroscope; vr" width="100%" frameborder="0"&gt;&lt;/iframe&gt;</textarea>
            </div>
        </div>
    </form>

        <div class="row">
            <div class="col-6">
                <button form="update-form" class="btn btn-lg btn-primary mt-4 update-button"><i class="fas fa-fw fa-check"></i> Save</button>
            </div>
            <div class="col-6">
                <form action="{{ route('delete') }}" method="POST">
                    <input type="hidden" name="key" value="{{ $panorama->manage_key }}">
                    {{ csrf_field() }}
                    <button class="delete-panorama-button btn btn-lg btn-danger mt-4"><i class="fas fa-fw fa-times"></i> Delete</button>
                </form>
            </div>
        </div>
    </main>
@stop

@section('scripts')
    <script src="/build/vrview.js"></script>
    <script src="/vrview_frame.js"></script>
    <script>
        $('#show-embed-block').click(function (ev) {
            ev.preventDefault();
            $('#embed-block').toggle();
        });
        $('.update-button').click(function (ev) {
            ev.preventDefault();
            $("#update-form").submit(); // IE/Edge fix

        });
        $('.delete-panorama-button').click(function (ev) {
            if(!confirm('Are you sure?')) ev.preventDefault();


        });
    </script>
@stop