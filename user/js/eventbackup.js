// User Events functionality
class UserEvents {
    constructor() {
        this.events = [];
        this.filteredEvents = [];
        this.currentView = 'grid';
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadEvents();
        this.initializeCalendar();
    }

    setupEventListeners() {
        // Filter event listeners
        document.getElementById('eventTypeFilter').addEventListener('change', () => this.filterEvents());
        document.getElementById('timeFrameFilter').addEventListener('change', () => this.filterEvents());

        // View toggle
        document.querySelectorAll('.view-toggle button').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });

        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());

        // Modal close events
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(btn.closest('.modal')));
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal[style*="display: block"]');
                if (openModal) {
                    this.closeModal(openModal);
                }
            }
        });
    }

    async loadEvents() {
        try {
            this.showLoading(true);
            
            const events = await this.fetchEvents();
            this.events = events;
            this.filteredEvents = events;
            
            this.renderEventsGrid();
            this.updateCalendar();
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading events:', error);
            this.showError('Failed to load events');
            this.showLoading(false);
        }
    }

    async fetchEvents() {
        // Simulate API call - replace with actual API endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        id: 1,
                        title: 'Annual Church Picnic',
                        description: 'Join us for a fun-filled day of food, games, and fellowship at our annual church picnic.',
                        date: '2024-06-15',
                        time: '12:00 PM',
                        location: 'City Park',
                        type: 'social',
                        image: 'picnic.jpg'
                    },
                    {
                        id: 2,
                        title: 'Christmas Eve Service',
                        description: 'Celebrate the birth of Jesus with special music, candlelight, and communion.',
                        date: '2024-12-24',
                        time: '7:00 PM',
                        location: 'Main Sanctuary',
                        type: 'worship',
                        image: 'christmas.jpg'
                    },
                    {
                        id: 3,
                        title: 'Youth Summer Camp',
                        description: 'Week-long summer camp for youth with worship, teaching, and outdoor activities.',
                        date: '2024-07-20',
                        time: '9:00 AM',
                        location: 'Camp Wilderness',
                        type: 'social',
                        image: 'camp.jpg'
                    },
                    {
                        id: 4,
                        title: 'Financial Peace University',
                        description: 'Learn biblical principles for managing money and getting out of debt.',
                        date: '2024-02-05',
                        time: '6:30 PM',
                        location: 'Room 201',
                        type: 'educational',
                        image: 'fpu.jpg'
                    }
                ]);
            }, 1000);
        });
    }

    filterEvents() {
        const typeFilter = document.getElementById('eventTypeFilter').value;
        const timeFrameFilter = document.getElementById('timeFrameFilter').value;
        const currentDate = new Date();

        this.filteredEvents = this.events.filter(event => {
            const eventDate = new Date(event.date);
            const matchesType = typeFilter === 'all' || event.type === typeFilter;
            
            let matchesTimeFrame = true;
            switch (timeFrameFilter) {
                case 'upcoming':
                    matchesTimeFrame = eventDate >= currentDate;
                    break;
                case 'this-month':
                    matchesTimeFrame = eventDate.getMonth() === currentDate.getMonth() && 
                                      eventDate.getFullYear() === currentDate.getFullYear();
                    break;
                case 'next-month':
                    const nextMonth = currentDate.getMonth() + 1;
                    const nextMonthYear = nextMonth > 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
                    matchesTimeFrame = eventDate.getMonth() === nextMonth % 12 && 
                                      eventDate.getFullYear() === nextMonthYear;
                    break;
                case 'all':
                default:
                    matchesTimeFrame = true;
            }

            return matchesType && matchesTimeFrame;
        });

        if (this.currentView === 'grid') {
            this.renderEventsGrid();
        } else {
            this.updateCalendar();
        }
    }

    renderEventsGrid() {
        const grid = document.querySelector('.events-grid');
        
        if (this.filteredEvents.length === 0) {
            grid.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Events Found</h3>
                    <p>Try adjusting your filters or check back later for new events</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredEvents.map(event => `
            <div class="event-card" data-type="${event.type}">
                <div class="event-image">
                    <img src="images/events/${event.image}" alt="${this.escapeHtml(event.title)}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDM1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzNTAiIGhlaWdodD0iMjAwIiBmaWxsPSIjODc4NkUzIi8+Cjx0ZXh0IHg9IjE3NSIgeT0iMTAwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5IdWIgQ2h1cmNoIEV2ZW50PC90ZXh0Pgo8L3N2Zz4K'">
                    <div class="event-date">
                        <span class="month">${this.formatDate(event.date, 'M')}</span>
                        <span class="day">${this.formatDate(event.date, 'j')}</span>
                    </div>
                </div>
                
                <div class="event-content">
                    <div class="event-header">
                        <h3>${this.escapeHtml(event.title)}</h3>
                        <span class="event-type type-${event.type}">
                            ${this.capitalizeFirst(event.type)}
                        </span>
                    </div>
                    
                    <p class="event-description">${this.escapeHtml(event.description)}</p>
                    
                    <div class="event-details">
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>${event.time}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${this.escapeHtml(event.location)}</span>
                        </div>
                    </div>
                    
                    <div class="event-actions">
                        <button class="btn-primary" onclick="userEvents.rsvpToEvent(${event.id})">
                            <i class="fas fa-calendar-plus"></i> RSVP
                        </button>
                        <button class="btn-outline" onclick="userEvents.viewEventDetails(${event.id})">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    switchView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-toggle button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Show/hide views
        document.querySelector('.events-grid').style.display = view === 'grid' ? 'grid' : 'none';
        document.querySelector('.calendar-view').style.display = view === 'calendar' ? 'block' : 'none';

        if (view === 'calendar') {
            this.updateCalendar();
        }
    }

    initializeCalendar() {
        this.updateCalendarHeader();
        this.generateCalendar();
    }

    updateCalendarHeader() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('currentMonth').textContent = 
            `${monthNames[this.currentMonth]} ${this.currentYear}`;
    }

    generateCalendar() {
        const calendar = document.getElementById('eventsCalendar');
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();

        // Clear calendar
        calendar.innerHTML = '';

        // Add day headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day day-header';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            calendar.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const dateStr = `${this.currentYear}-${(this.currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayEvents = this.getEventsForDate(dateStr);

            dayElement.innerHTML = `
                <div class="day-header">${day}</div>
                <div class="day-events">
                    ${dayEvents.map(event => `
                        <div class="day-event" onclick="userEvents.viewEventDetails(${event.id})">
                            ${this.escapeHtml(event.title)}
                        </div>
                    `).join('')}
                </div>
            `;

            if (dayEvents.length > 0) {
                dayElement.classList.add('has-event');
            }

            calendar.appendChild(dayElement);
        }
    }

    getEventsForDate(dateStr) {
        return this.filteredEvents.filter(event => event.date === dateStr);
    }

    updateCalendar() {
        this.updateCalendarHeader();
        this.generateCalendar();
    }

    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.updateCalendar();
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.updateCalendar();
    }

    rsvpToEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const modal = document.getElementById('rsvpModal');
        document.getElementById('rsvpEventId').value = eventId;
        
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
        modal.style.display = 'block';
        
        // Reset form
        document.getElementById('rsvpForm').reset();
        document.getElementById('guestCount').value = '0';
        
        // Focus on first input for accessibility
        setTimeout(() => {
            document.querySelector('#rsvpForm input[type="radio"]').focus();
        }, 100);
    }

    closeRSVP() {
        const modal = document.getElementById('rsvpModal');
        modal.style.display = 'none';
        // Re-enable body scrolling
        document.body.style.overflow = 'auto';
    }

    async submitRSVP(e) {
        if (e) e.preventDefault();
        
        const formData = new FormData(document.getElementById('rsvpForm'));
        const data = Object.fromEntries(formData.entries());
        const eventId = document.getElementById('rsvpEventId').value;

        try {
            this.showMessage('Submitting RSVP...', 'loading');
            
            const response = await this.sendRSVP(eventId, data);
            
            if (response.success) {
                this.showMessage('RSVP submitted successfully!', 'success');
                this.closeRSVP();
            } else {
                this.showMessage(response.message || 'Failed to submit RSVP', 'error');
            }
        } catch (error) {
            console.error('Error submitting RSVP:', error);
            this.showMessage('Error submitting RSVP', 'error');
        }
    }

    async sendRSVP(eventId, data) {
        // Simulate API call - replace with actual API endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'RSVP submitted successfully'
                });
            }, 1000);
        });
    }

    async viewEventDetails(eventId) {
        try {
            const event = await this.fetchEventDetails(eventId);
            this.showEventDetails(event);
        } catch (error) {
            console.error('Error loading event details:', error);
            this.showMessage('Failed to load event details', 'error');
        }
    }

    async fetchEventDetails(eventId) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const event = this.events.find(e => e.id === eventId);
                resolve({
                    ...event,
                    detailed_description: event.description + ' This is a more detailed description of the event with additional information about what to expect, what to bring, and any special instructions for attendees.',
                    contact_person: 'Pastor John Smith',
                    contact_email: 'john.smith@hubchurch.org',
                    contact_phone: '+1 (555) 123-4567',
                    registration_required: true,
                    capacity: 200,
                    current_rsvps: 150
                });
            }, 500);
        });
    }

    showEventDetails(event) {
        const modal = document.getElementById('eventDetailsModal');
        const content = document.getElementById('eventDetailsContent');
        
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
        
        content.innerHTML = `
            <div class="event-details-content">
                <div class="event-header">
                    <h4>${this.escapeHtml(event.title)}</h4>
                    <span class="event-type type-${event.type}">
                        ${this.capitalizeFirst(event.type)}
                    </span>
                </div>
                
                ${event.image ? `
                <div class="event-image-large">
                    <img src="images/events/${event.image}" alt="${this.escapeHtml(event.title)}"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDUwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjODc4NkUzIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iMTUwIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5IdWIgQ2h1cmNoIEV2ZW50PC90ZXh0Pgo8L3N2Zz4K'">
                </div>
                ` : ''}
                
                <div class="event-info-grid">
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <div>
                            <strong>Date</strong>
                            <span>${this.formatDate(event.date, 'D, M j, Y')}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <strong>Time</strong>
                            <span>${event.time}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div>
                            <strong>Location</strong>
                            <span>${this.escapeHtml(event.location)}</span>
                        </div>
                    </div>
                    ${event.capacity ? `
                    <div class="info-item">
                        <i class="fas fa-users"></i>
                        <div>
                            <strong>RSVPs</strong>
                            <span>${event.current_rsvps || 0} / ${event.capacity}</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="event-description-detailed">
                    <h5>About This Event</h5>
                    <p>${this.escapeHtml(event.detailed_description || event.description)}</p>
                </div>
                
                ${event.contact_person ? `
                <div class="event-contact">
                    <h5>Contact Information</h5>
                    <div class="contact-details">
                        <p><strong>${event.contact_person}</strong></p>
                        ${event.contact_email ? `<p><i class="fas fa-envelope"></i> ${event.contact_email}</p>` : ''}
                        ${event.contact_phone ? `<p><i class="fas fa-phone"></i> ${event.contact_phone}</p>` : ''}
                    </div>
                </div>
                ` : ''}
                
                <div class="event-actions-detailed">
                    <button class="btn-primary" onclick="userEvents.rsvpToEvent(${event.id})">
                        <i class="fas fa-calendar-plus"></i> RSVP Now
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        
        // Focus on modal for accessibility
        setTimeout(() => {
            modal.querySelector('.modal-header h3').focus();
        }, 100);
    }

    closeModal(modal) {
        modal.style.display = 'none';
        // Re-enable body scrolling
        document.body.style.overflow = 'auto';
    }

    showLoading(show) {
        const grid = document.querySelector('.events-grid');
        if (show) {
            grid.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-spinner fa-spin"></i>
                    <h3>Loading Events</h3>
                    <p>Please wait...</p>
                </div>
            `;
        }
    }

    showError(message) {
        const grid = document.querySelector('.events-grid');
        grid.innerHTML = `
            <div class="no-events">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Events</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="userEvents.loadEvents()" style="margin-top: 1rem;">
                    Try Again
                </button>
            </div>
        `;
    }

    showMessage(message, type = 'info') {
        // Simple toast message implementation
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Utility functions
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    formatDate(dateString, format) {
        const date = new Date(dateString);
        const options = {
            'D, M j, Y': { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
            'M': { month: 'short' },
            'j': { day: 'numeric' }
        };
        return date.toLocaleDateString('en-US', options[format]);
    }
}

// Initialize events when page loads
let userEvents;
document.addEventListener('DOMContentLoaded', () => {
    userEvents = new UserEvents();
    
    // Setup RSVP form submission
    document.getElementById('rsvpForm').addEventListener('submit', (e) => userEvents.submitRSVP(e));
    
    // Add toast styles
    const style = document.createElement('style');
    style.textContent = `
        .toast-message {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 1001;
            transform: translateX(150%);
            transition: transform 0.3s ease;
        }
        .toast-message.show {
            transform: translateX(0);
        }
        .toast-success {
            border-left: 4px solid #10b981;
        }
        .toast-error {
            border-left: 4px solid #ef4444;
        }
        .toast-loading {
            border-left: 4px solid #f59e0b;
        }
        .toast-message i {
            font-size: 1.25rem;
        }
        .toast-success i { color: #10b981; }
        .toast-error i { color: #ef4444; }
        .toast-loading i { color: #f59e0b; }
    `;
    document.head.appendChild(style);
});

// Global functions for HTML onclick handlers
function rsvpToEvent(eventId) {
    if (userEvents) {
        userEvents.rsvpToEvent(eventId);
    }
}

function closeRSVP() {
    if (userEvents) {
        userEvents.closeRSVP();
    }
}

function viewEventDetails(eventId) {
    if (userEvents) {
        userEvents.viewEventDetails(eventId);
    }
}