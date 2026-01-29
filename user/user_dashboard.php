<?php
include_once "include/user_header.php";
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Dashboard - Hub Church</title>
    <link rel="stylesheet" href="css/user_header.css">
    <link rel="stylesheet" href="css/user_dashboard.css">
    <link rel="stylesheet" href="../fontawesome/css/all.min.css">
</head>
<body>

<div class="center-div" id="center-div"></div>

<!-- QR Scanner Modal -->
<div id="qrScannerModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Scan QR Code</h3>
            <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
            <div id="qrScanner">
                <div id="reader" style="width: 100%;"></div>
                <p class="scan-instruction">Point your camera at the QR code to mark attendance</p>
            </div>
            <div id="scanResult" style="display: none;"></div>
        </div>
    </div>
</div>


<script src="https://unpkg.com/html5-qrcode/minified/html5-qrcode.min.js"></script>
<script src="js/user_dashboard.js"></script>
<script src="../js/main.js"></script>

<?php include_once "include/footer.php"; ?>
</body>
</html>