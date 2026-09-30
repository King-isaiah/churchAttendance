<?php
include "include/header.php";
require_once 'class/Event.php';
require_once 'class/Department.php';
require_once 'class/Location.php';
require_once 'class/Category.php';

?>

<head>
    <link rel="stylesheet" href="css/events.css">   
</head>

<div class="page-header">
    <h2>Event Management</h2>
    <button class="btn-primary" onclick="openEventModal()">
        <i class="fas fa-plus"></i> Add Event
    </button>
</div>
<div class="evenRendering">
   
</div>


<script src="events.js"></script>
<?php include "include/footer.php"; ?>