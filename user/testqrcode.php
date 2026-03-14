 <!DOCTYPE html>
 <html lang="en">
 <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
 </head>
 <style>
    main{
        display: flex;
        justify-content: center;
        align-items: center;
    }
    #reader{
        width: 600px;
    }
    #result{
        text-align: center;
        font-size: 1.5rem;
    }
 </style>
 <body>
    <main >
    <div id="reader"></div>
    <div id="result"></div>
</main>
<script src="html5-qrcode.min.js" type="text/javascript"></script>
<!-- <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script> -->
<script>

    console.log(Html5QrcodeScanner);
    const scanner = new Html5QrcodeScanner('reader',{
        qrbox:{
            width: 250,
            height:250,
        },
        fps:20,
    });

    scanner.render(success, error);

    function success(result){
        console.log(result);
        document.getElementById('result').innerHTML= `<h2> succes!</h2>
        <p><a href="${result}">${result}</a></p>`;
        scanner.clear();
        document.getElementById('reader').remove();
    }
    function error(err){
        console.error(err);
    }
</script>
 </body>
 </html>

