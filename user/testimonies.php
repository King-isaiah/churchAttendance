<?php
include_once "include/user_header.php";
?>

<div class="main-content" style="padding: 30px; max-width: 1000px; margin: 0 auto;">
    
    <div class="card" style="background: white; border-radius: 12px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <h2 style="color: #0d6efd; margin-bottom: 20px;"><i class="fas fa-pen-fancy"></i> Share Your Testimony</h2>
        <form id="testimonyForm">
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="font-weight: 600; display: block; margin-bottom: 5px;">Title</label>
                <input type="text" id="testimonyTitle" required placeholder="e.g., God's faithfulness in my career" 
                       style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px;">
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="font-weight: 600; display: block; margin-bottom: 5px;">Your Testimony</label>
                <textarea id="testimonyContent" rows="6" required placeholder="Write your testimony here..." 
                          style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; resize: vertical;"></textarea>
            </div>
            <button type="submit" id="submitBtn" class="btn btn-primary" style="padding: 12px 25px; font-weight: 600; border-radius: 8px; background: #0d6efd; color: white; border: none; cursor: pointer;">
                <i class="fas fa-paper-plane"></i> Submit Testimony
            </button>
        </form>
    </div>

    <div class="card" style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <h3 style="margin-bottom: 20px;">My Previous Testimonies</h3>
        <div id="userTestimonyList">
            <p style="text-align: center; color: #999;">Loading...</p>
        </div>
    </div>

</div>

<script src="js/user_testimonies.js"></script>
<?php include_once "include/footer.php"; ?>