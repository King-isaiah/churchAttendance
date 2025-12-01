<?php
    include_once "include/user_header.php";
    $events = [
        [
            'id' => 1,
            'title' => 'Annual Church Picnic',
            'description' => 'Join us for a fun-filled day of food, games, and fellowship at our annual church picnic.',
            'date' => '2024-06-15',
            'time' => '12:00 PM',
            'location' => 'City Park',
            'type' => 'social',
            'image' => 'picnic.jpg'
        ],
        [
            'id' => 2,
            'title' => 'Christmas Eve Service',
            'description' => 'Celebrate the birth of Jesus with special music, candlelight, and communion.',
            'date' => '2024-12-24',
            'time' => '7:00 PM',
            'location' => 'Main Sanctuary',
            'type' => 'worship',
            'image' => 'christmas.jpg'
        ]
    ];

    $eventTypes = ['all', 'worship', 'social', 'educational', 'outreach'];
?>


<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Events - Hub Church</title>
    <link rel="stylesheet" href="css/user_header.css">
    <link rel="stylesheet" href="css/user_events.css">
    <link rel="stylesheet" href="../fontawesome/css/all.min.css">
</head>

    

        <div class="center-div">           

            <div class="events-page">
                <div class="user-welcome">
                    <h6 style="color: greenyellow;">Church Events</h6>
                </div>
                <div class="page-header">
                    <h2>Upcoming Events</h2>
                    <p>Discover and participate in our church events</p>
                </div>

                <!-- Event Filters -->
                <div class="event-filters">
                    <div class="filter-group">
                        <select id="eventTypeFilter">
                            <option value="all">All Event Types</option>
                            <option value="worship">Worship</option>
                            <option value="social">Social</option>
                            <option value="educational">Educational</option>
                            <option value="outreach">Outreach</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <select id="timeFrameFilter">
                            <option value="upcoming">Upcoming Events</option>
                            <option value="this-month">This Month</option>
                            <option value="next-month">Next Month</option>
                            <option value="all">All Events</option>
                        </select>
                    </div>
                </div>

                <!-- Events Grid -->
                <div class="events-grid">
                    <?php if (!empty($events)): ?>
                        <?php foreach ($events as $event): ?>
                            <div class="event-card" data-type="<?php echo $event['type']; ?>">
                                <div class="event-image">
                                    <img src="images/events/<?php echo $event['image']; ?>" alt="<?php echo htmlspecialchars($event['title']); ?>">
                                    <div class="event-date">
                                        <span class="month"><?php echo date('M', strtotime($event['date'])); ?></span>
                                        <span class="day"><?php echo date('j', strtotime($event['date'])); ?></span>
                                    </div>
                                </div>
                                
                                <div class="event-content">
                                    <div class="event-header">
                                        <h3><?php echo htmlspecialchars($event['title']); ?></h3>
                                        <span class="event-type type-<?php echo $event['type']; ?>">
                                            <?php echo ucfirst($event['type']); ?>
                                        </span>
                                    </div>
                                    
                                    <p class="event-description"><?php echo htmlspecialchars($event['description']); ?></p>
                                    
                                    <div class="event-details">
                                        <div class="detail-item">
                                            <i class="fas fa-clock"></i>
                                            <span><?php echo $event['time']; ?></span>
                                        </div>
                                        <div class="detail-item">
                                            <i class="fas fa-map-marker-alt"></i>
                                            <span><?php echo htmlspecialchars($event['location']); ?></span>
                                        </div>
                                    </div>
                                    
                                    <div class="event-actions">
                                        <button class="btn-primary" onclick="rsvpToEvent(<?php echo $event['id']; ?>)">
                                            <i class="fas fa-calendar-plus"></i> RSVP
                                        </button>
                                        <button class="btn-outline" onclick="viewEventDetails(<?php echo $event['id']; ?>)">
                                            <i class="fas fa-info-circle"></i> Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <div class="no-events">
                            <i class="fas fa-calendar-times"></i>
                            <h3>No Upcoming Events</h3>
                            <p>Check back later for new events!</p>
                        </div>
                    <?php endif; ?>
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
                        <!-- Calendar will be generated by JavaScript -->
                    </div>
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
                <!-- Event details will be loaded here -->
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
                    <input type="hidden" id="rsvpEventId">
                    <div class="form-group">
                        <label>Will you be attending?</label>
                        <div class="rsvp-options">
                            <label class="rsvp-option">
                                <input type="radio" name="attending" value="yes" checked>
                                <span class="rsvp-label yes">
                                    <i class="fas fa-check"></i>
                                    Yes, I'll be there
                                </span>
                            </label>
                            <label class="rsvp-option">
                                <input type="radio" name="attending" value="no">
                                <span class="rsvp-label no">
                                    <i class="fas fa-times"></i>
                                    No, I can't make it
                                </span>
                            </label>
                            <label class="rsvp-option">
                                <input type="radio" name="attending" value="maybe">
                                <span class="rsvp-label maybe">
                                    <i class="fas fa-question"></i>
                                    Maybe
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="guestCount">Number of Guests</label>
                        <input type="number" id="guestCount" name="guest_count" min="0" max="10" value="0">
                    </div>
                    
                    <div class="form-group">
                        <label for="additionalNotes">Additional Notes (Optional)</label>
                        <textarea id="additionalNotes" name="notes" rows="3" placeholder="Any dietary restrictions or special requirements..."></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeRSVP()">Cancel</button>
                        <button type="submit" class="btn-primary">Submit RSVP</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="js/user_events.js"></script>
   <?php include_once "include/footer.php"; ?>