<!DOCTYPE html>
<html lang="{{ config('app.locale') }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Embedded panorama</title>
    <script src="/build/vrview.js" defer></script>
    <script src="/vrview_frame.js" defer></script>
    <link rel="stylesheet" href="/style.css">

</head>
<body>
    <input type="hidden" name="panorama-id" id="panorama-id" value="{{ $panorama->slug() }}">
    <div id="vrview"></div>
</body>
</html>