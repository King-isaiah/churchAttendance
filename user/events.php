<?php include_once "include/user_header.php"; ?>

<head> 
    <title>Events - Hub Church</title>    
    <link rel="stylesheet" href="css/user_events.css">  
</head>

    

    <div class="center-div">           
        <div class="events-page">
            <div class="user-welcome">
                <h6 style="color: greenyellow;">Church Events</h6>
            </div>
            <div class="page-header">
                <h2>Upcoming Events</h2>
                <p>Discover and participate in the HUBs events</p>
            </div>

            <!-- Event Filters -->
            <div class="event-filters">
                <div class="filter-group" id="selectEventCategory">
                    <select id="eventTypeFilter">
                        <!-- Options populated by JavaScript -->
                        <option value="all">Loading categories...</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <select id="timeFrameFilter">
                        <option value="all" selected>All Events</option>
                        <option value="this-month">This Month</option>
                        <option value="next-month">Next Month</option>
                    </select>
                </div>
            </div>

            <!-- Events Grid -->
            <div class="events-grid">
                
            </div>

            <!-- Calendar View Toggle -->
            <div class="view-toggle">
                <button class="btn-outline active" data-view="grid">
                    <i class="fas fa-th"></i> Grid View
                </button>
                <button class="btn-outline" data-view="calendar">
                    <i class="fas fa-calendar"></i> Calendar View
                </button>
            </div>

            <!-- Calendar View (Hidden by default) -->
            <div class="calendar-view" style="display: none;">
                <div class="calendar-header">
                    <button class="btn-icon" id="prevMonth">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <h3 id="currentMonth">January 2024</h3>
                    <button class="btn-icon" id="nextMonth">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <div class="calendar" id="eventsCalendar">
                    
                </div>
            </div>
        </div>
    </div>

    <!-- Event Details Modal -->
    <div id="eventDetailsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Event Details</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body" id="eventDetailsContent">
                
            </div>
        </div>
    </div>

    <!-- RSVP Modal -->
    <div id="rsvpModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>RSVP to Event</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="rsvpForm">
                    
                    <div class="form-group">
                        <input type="hidden" id="event_id">
                        <!-- Added isset check to prevent PHP warnings if session is not set -->
                        <input type="hidden" id="unique_id" value="<?php echo isset($_SESSION['unique_id']) ? $_SESSION['unique_id'] : ''; ?>">
                        <label>Will you be attending?</label>
                        <div class="rsvp-options">
                            <label class="rsvp-option">
                                <input type="radio" id="attending" name="attending" value="1" checked>
                                <span class="rsvp-label yes">
                                    <i class="fas fa-check"></i>
                                    Yes, I'll be there
                                </span>
                            </label>
                            <label class="rsvp-option">
                                <input type="radio" id="attending" name="attending" value="2">
                                <span class="rsvp-label no">
                                    <i class="fas fa-times"></i>
                                    No, I can't make it
                                </span>
                            </label>
                            <label class="rsvp-option">
                                <input type="radio" id="attending" name="attending" value="3">
                                <span class="rsvp-label maybe">
                                    <i class="fas fa-question"></i>
                                    Maybe
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="guestCount">Number of Guests</label>
                        <input type="number" id="guest_count" name="guest_count" min="0" max="10" value="0">
                    </div>
                    
                    <div class="form-group">
                        <label for="additionalNotes">Additional Notes (Optional)</label>
                        <textarea id="notes" name="notes" rows="3" placeholder="Any dietary restrictions or special requirements..."></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="userEvents.closeRSVP()">Cancel</button>
                        <button type="submit" class="btn-primary">Submit RSVP</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="js/user_events.js"></script>
    <?php include_once "include/footer.php"; ?>
</body>
</html>