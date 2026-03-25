<?php
include "include/header.php";
// include "class/Location.php";
// include "class/Department.php";
// include "class/Category.php";
// include "class/Speaker.php";



?>

<head>
    <link rel="stylesheet" href="css/management.css">
</head>

<div class="management-container">
    <div class="management-menu">
        <h2>Management</h2>
        <ul class="menu-list">
            <li class="menu-item active" data-target="locations">
                <i class="fas fa-map-marker-alt"></i>
                <span>Locations</span>
            </li>
            <li class="menu-item" data-target="departments">
                <i class="fas fa-building"></i>
                <span>Departments</span>
            </li>
            <li class="menu-item" data-target="speakers">
                <i class="fas fa-microphone"></i>
                <span>Speakers</span>
            </li>
            <li class="menu-item" data-target="categories">
                <i class="fas fa-calendar-alt"></i>
                <span>Categories</span>
            </li>
            <li class="menu-item" data-target="statuses">
                <i class="fas fa-circle"></i>
                <span>Status</span>
            </li>
            <li class="menu-item" data-target="attendance_methods">
                <i class="fas fa-calendar-alt"></i>
                <span>Attendance_method</span>
            </li>            
            <!-- <li class="menu-item" data-target="attendance">
                <i class="fas fa-clipboard-check"></i>
                <span>Attendance</span>
            </li> -->
        </ul>
    </div>

    
    <div class="management-content">
      
        <div id="content-display">
            <div class="table-container">
                <table class="data-table">
                  
                </table>
            </div>
            
        </div>
    </div>
</div>

<!-- Universal Modal for Add/Edit -->
<div id="managementModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="modalTitle">Add Item</h3>
            <span class="close" onclick="closeModal()">&times;</span>
        </div>
       
        <div class="modal-body">
            <form id="managementForm">
                <input type="hidden" id="itemId" name="id" value="">
                <input type="hidden" id="itemType" name="type" value="">
                
                <div id="formFields">
                
                </div>
            
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary" id="save-btn">Save</button>
                </div>
                
                
            </form>
           
           
        </div>
    </div>
</div>





<div id="overlay" class="overlay"></div>
<div id="itemDetailsModal" class="custom-modal">
    <div class="modal-content">
        
    </div>
    <button class="close-modal">Close</button>
    
</div>


<script src="js/management.js"></script>


<?php include "include/footer.php"; ?>