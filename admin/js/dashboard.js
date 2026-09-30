'use strict';

class DashboardManager {
    constructor() {
        this.weeklyData = [];
        this.activities = [];
        this.departments = [];
        this.stats = {};
        this.rewards = [];
        this.chart = null;
        this.currentSlide = 0;
        this.searchTimeout = null;
        this.deptSlide = 0;
    }

    async init() {
        await this.loadDashboardData();
        this.setupEventListeners();
        this.initializeSlider();
    }

    async loadDashboardData() {
      try {      
        const [statsResponse, activitiesResponse, departmentsResponse, rewardsResponse, total_attendees] = await Promise.all([
          this.fetchDashboardStats(),
          this.fetchRecentActivities(),
          this.fetchDepartmentStats(),
          // this.fetchAttendanceRewards()
        ]);
       
        if (statsResponse.success) {        
            this.stats = statsResponse.data; 
                 
            this.updateStatsCards();         
            // this.initializeChart();
            this.initializeAllChart();
            console.log(statsResponse)  
              this.renderRewards(); 
        }
       
        if (activitiesResponse.success) {
          this.activities = activitiesResponse.data;
          this.renderActivitiesSlider();
        }
        

        if (departmentsResponse.success) {
            console.log(departmentsResponse)        
            this.departments = departmentsResponse.data;
            this.renderDepartments();
        }
        
        
        if (rewardsResponse.success) {
            console.log(rewardsResponse)
            showSuccess('Failed to load rewardResponse data');
          this.rewards = rewardsResponse.data;
          this.renderRewards();
        }
        

      } catch (error) {
          console.error('Error loading dashboard data:', error);
          showError('Failed to load dashboard data');
      }
    }

    async fetchDashboardStats() {
      const response = await fetch('../class/ApiHandler.php?action=getAll&entity=dashboard');     
        return response.json();
    }

    async fetchRecentActivities() {
        const response = await fetch('../class/ApiHandler.php?action=getAll&entity=activities');
        return response.json();
    }

    async fetchDepartmentStats() {
        const response = await fetch('../class/ApiHandler.php?action=getAll&entity=departments');
        return response.json();
    }

    async fetchAttendanceRewards() {
      const response = await fetch('../class/ApiHandler.php?action=special&entity=reports');   
      return response.json();
    }

    async searchActivities(searchTerm) {
        if (!searchTerm.trim()) {
            // If search is empty, show all activities
            this.renderActivitiesSlider();
            return;
        }

        try {
            const response = await fetch('../class/ApiHandler.php?action=special&entity=dashboard&type=search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ search: searchTerm })
            });
            
            const result = await response.json();
            if (result.success) {
                alert('you dey whine')
                this.activities = result.data;
                this.renderActivitiesSlider();
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    updateStatsCards() {
        const container = document.getElementById('statsCards');
        if (!container) return;

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="background: #c1bff2;">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                    <h4>${this.stats.total_attendees || 0}</h4>
                    <p>Total Attendees Last 24hrs</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #ffb2b2;">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="stat-info">
                    <h4>${this.stats.activities_this_week || 0}</h4>
                    <p>Activities/Events Attended This Week</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #c9e78a;">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-info">
                    <h4>${this.stats.growth_percentage >= 0 ? '+' : ''}${this.stats.growth_percentage || 0}%</h4>
                    <p>Growth last 24hrs</p>
                </div>
            </div>
        `;
    }

    initializeAllChart() {
        const filter = document.getElementById('chart-filter').value;
    const contentFilter = document.getElementById("chartTitle");
       console.log(filter);
        switch(filter) {
            case 'week':
                contentFilter.textContent = 'Weekly Attendnce'
               this.initializeChart()
                break;
            case 'month':        
                contentFilter.textContent = 'Monthly Attendnce'     
                this.initializeChartMonth();
                break;
            case 'quarter':
                contentFilter.textContent = 'Quater Attendnce'
                this.initializeChartQuarter()
                break;
            default:
                this.initializeChart()
        }
    }
    initializeChart() {
      const ctx = document.getElementById('attendanceChart').getContext('2d');
      if (!ctx) return;

      if (this.chart) {
          this.chart.destroy();
      }

      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const data = this.stats.weekly_data || Array(7).fill(0);

      this.chart = new Chart(ctx, {
          type: 'line',
          data: {
              labels: labels,
              datasets: [{
                  label: 'Attendance',
                  data: data,
                  backgroundColor: 'rgba(135, 134, 227, 0.2)',
                  borderColor: 'rgba(135, 134, 227, 1)',
                  borderWidth: 2,
                  tension: 0.4,
                  fill: true
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: { display: false }
              },
              scales: {
                  y: {
                      beginAtZero: true,
                      grid: { drawBorder: false }
                  },
                  x: {
                      grid: { display: false }
                  }
              }
          }
      });
    }

    initializeChartMonth() {
        const ctx = document.getElementById('attendanceChart').getContext('2d');
        if (!ctx) return;

        if (this.chart) {
            this.chart.destroy();
        }

        // Month labels (Jan to Dec)
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Use monthly_data or create array of 12 zeros
        const data = this.stats.monthly_data || Array(12).fill(0);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Attendance',
                    data: data,
                    backgroundColor: 'rgba(135, 134, 227, 0.2)',
                    borderColor: 'rgba(135, 134, 227, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { drawBorder: false }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }
    async renderOnlineMembers() {
        const container = document.getElementById('rewardsContainer');
        if (!container) return;

        container.innerHTML = '<div class="online-empty">Loading online members…</div>';

        try {
            const response = await fetch('../class/ApiHandler.php?action=getAll&entity=members');
            const data     = await response.json();

            if (!data.success) {
                container.innerHTML = '<div class="online-empty">Failed to load members</div>';
                return;
            }

            const members = data.data || [];
            const onlineMembers = members.filter(
                m => (m.status || '').toString().toLowerCase() === 'online'
            );

            if (onlineMembers.length === 0) {
                container.innerHTML = `
                    <div class="online-empty">
                        <i class="fas fa-circle" style="color:#bbb;font-size:2rem;"></i>
                        <p>No members online</p>
                    </div>`;
                return;
            }

            let html = `
                <div class="online-wrapper">
                    <div class="online-header">
                        <h4>Online Members</h4>
                        <span class="online-count">${onlineMembers.length}</span>
                    </div>
                    <div class="online-list">
            `;

            onlineMembers.forEach(member => {
                const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown';
                html += `
                    <div class="online-member-item">
                        <span class="online-dot"></span>
                        <div class="online-member-info">
                            <p class="online-member-name">${escapeHtml(fullName)}</p>
                            <small class="online-member-dept">${escapeHtml(member.department_name || 'No Department')}</small>
                        </div>
                    </div>
                `;
            });

            html += `</div></div>`;
            container.innerHTML = html;

        } catch (err) {
            console.error('Online members fetch failed:', err);
            container.innerHTML = '<div class="online-empty">Error loading online members</div>';
        }
    }
    initializeChartQuarter() {
        const ctx = document.getElementById('attendanceChart').getContext('2d');
        if (!ctx) return;

        if (this.chart) {
            this.chart.destroy();
        }

        // Generate labels for last 4 months (including year)
        const labels = this.getQuarterLabels();
        
        // Use quarterly_data or create array of 4 zeros
        const data = this.stats.quarterly_data || Array(4).fill(0);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Attendance',
                    data: data,
                    backgroundColor: 'rgba(135, 134, 227, 0.2)',
                    borderColor: 'rgba(135, 134, 227, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { drawBorder: false }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // Helper function to generate quarter labels (last 4 months)
    getQuarterLabels() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const labels = [];
        const currentDate = new Date();
        
        // Get last 4 months including year
        for (let i = 3; i >= 0; i--) {
            const date = new Date();
            date.setMonth(currentDate.getMonth() - i);
            
            const monthIndex = date.getMonth();
            const year = date.getFullYear();
            const shortYear = year.toString().slice(-2);
            
            labels.push(`${months[monthIndex]} '${shortYear}`);
        }
        
        return labels;
    }
    renderActivitiesSlider() {
        const track = document.getElementById('activitiesSlider');
        const dots  = document.getElementById('sliderDots');

        if (!track || !dots) return;

        if (!this.activities || this.activities.length === 0) {
            track.innerHTML = '<div class="no-data">No activities found</div>';
            dots.innerHTML  = '';
            return;
        }

        // Build slides (only slides — buttons stay put)
        let slidesHTML = '';
        this.activities.forEach((activity, index) => {
            slidesHTML += `
                <div class="sliding-go slide" id="section--${index + 1}">
                    <div>
                        <h4>${escapeHtml(activity.name || 'Untitled')}</h4>
                        <h6>${escapeHtml(activity.dayofactivity || '')}</h6>
                        <h6>${escapeHtml(activity.location || 'N/A')}</h6>
                    </div>
                </div>
            `;
        });
        track.innerHTML = slidesHTML;

        // Reset track position
        track.style.transform = 'translateX(0)';

        // Rebuild dots
        dots.innerHTML = '';
        this.activities.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className   = 'dots__dot';
            dot.dataset.slide = index;
            dot.addEventListener('click', () => this.goToSlide(index));
            dots.appendChild(dot);
        });

        this.currentSlide = 0;
        this.activateDot(0);
    }
    renderDepartments() {
        const container = document.getElementById('departmentsContainer');
        if (!container) return;

        if (this.departments.length === 0) {
            container.innerHTML = '<div class="no-data">No department data available</div>';
            return;
        }

        let html = '';
        this.departments.forEach((dept, index) => {
            html += `
                <div class="sunschl" id="dept-section--${index + 1}">
                    <div>
                        <h4>Department Name : ${escapeHtml(dept.name || 'Unknown Department')}</h4>
                        <h6>No Of Members : ${dept.no_members || 0}</h6>
                        <h6>HOD: ${dept.HOD} Members</h6>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        // Reset vertical scroll to the top
        this.deptSlide = 0;
        const track = document.getElementById('departmentsContainer');
        if (track) track.style.transform = 'translateY(0)';
    }

    goToDeptSlide(index) {
        const track = document.getElementById('departmentsContainer');
        const first = track ? track.querySelector('.sunschl') : null;
        if (!track || !first) return;

        // Measure real pixel height + gap so it works on every viewport
        const cardHeight = first.getBoundingClientRect().height;
        const gap        = parseFloat(getComputedStyle(track).gap) || 16;
        const offset     = index * (cardHeight + gap);

        track.style.transform = `translateY(-${offset}px)`;
        this.deptSlide = index;
    }
    renderRewards() {
        const container = document.getElementById('rewardsContainer');
        if (!container) return;

        // Check if we have any data at all
        const hasPerfect = this.stats.perfectatten && this.stats.perfectatten.length > 0;
        const hasRegular = this.stats.weekly_attendees && this.stats.weekly_attendees.length > 0;
        const hasNewMembers = this.stats.NewMembers && this.stats.NewMembers.length > 0;
        
        let html = '';
        
        // Perfect Attendance Section
        html += `
            <div class="reward-item">
            
                <div class="reward-badge" style="background: gold;">
                    <i class="fas fa-trophy"></i>
                </div>
                <p><b>Perfect Attendance</b></p>
            
                <div class="category-members">`;
        
        if (!hasPerfect) {
            html += `<div class="no-members">No perfect attendance members</div>`;
        } else {
            this.stats.perfectatten.forEach((member, index) => {
                html += `
                    <div class="member-item">
                        <div class="member-badge" style="background: gold">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="member-info">
                            <p class="member-name">${escapeHtml(member.user_name || 'Unknown')}</p>
                            <small class="member-days">${member.days || member.day_name || 0} days</small>
                        </div>
                    </div>`;
            });
        }
        
        html += `
                </div>
            </div>`;
        
        // Regular Participants Section
        html += `
            <div class="reward-item">            
                <div class="reward-badge" style="background: silver;">
                    <i class="fas fa-star"></i>
                </div>
                <p><b>Regular Participants</b></p>
            
                <div class="category-members">`;
        
        if (!hasRegular) {
            html += `<div class="no-members">No regular participants</div>`;
        } else {
    
            const maxToShow = 15;
            const membersToShow = this.stats.weekly_attendees.slice(0, maxToShow);
            const totalMembers = this.stats.weekly_attendees.length;
            
            membersToShow.forEach((member, index) => {
                html += `
                    <div class="member-item">
                        <div class="member-info">
                            <p class="member-name">${escapeHtml(member.user_name || 'Unknown')}</p>                       
                        </div>
                    </div>`;
            });
            
            // Add "View More" link if there are more than 15 members
            if (totalMembers > maxToShow) {
                html += `
                    <div class="view-more-container">
                        <a href="report.php" class="view-more-link">
                            View More (${totalMembers - maxToShow} more)
                        </a>
                    </div>`;
            }
        }
        
        html += `
                </div>
            </div>`;

            
        
        // New Members Section
        html += `         
            <div class="reward-item">            
                <div class="reward-badge" style="background: #cd7f32;">
                    <i class="fas fa-award"></i>
                </div>
                <p><b>New Members</b></p>        
                <div class="category-members">`;
        
        if (!hasNewMembers) {
            html += `<div class="no-members">No new members</div>`;
        } else {
            
            const maxToShow = 15;
            const membersToShow = this.stats.NewMembers.slice(0, maxToShow);
            const totalMembers = this.stats.NewMembers.length;
            
            membersToShow.forEach((member, index) => {
                html += `
                    <div class="member-item">
                        <div class="member-info">
                            <p class="member-name">${escapeHtml(member.user_name || 'Unknown')}</p>                       
                        </div>
                    </div>`;
            });
            
            // Add "View More" link if there are more than 15 members
            if (totalMembers > maxToShow) {
                html += `
                    <div class="view-more-container">
                        <a href="members.php" class="view-more-link">
                            View More (${totalMembers - maxToShow} more)
                        </a>
                    </div>`;
            }
        }
        html += `
                </div>
            </div>`;

        container.innerHTML = html;
    }

    initializeSlider() {
        this.currentSlide = 0;
        this.goToSlide(0);
    }

    goToSlide(slide) {
        this.currentSlide = slide;

        const track      = document.getElementById('activitiesSlider');
        const firstSlide = track ? track.querySelector('.slide') : null;

        if (track && firstSlide) {
            // Measure the real slide width + gap in pixels — handles every viewport
            const slideWidth = firstSlide.getBoundingClientRect().width;
            const gap        = parseFloat(getComputedStyle(track).gap) || 16;
            const offset     = slide * (slideWidth + gap);

            track.style.transform = `translateX(-${offset}px)`;
        }

        this.activateDot(slide);
    }

    activateDot(slide) {
        document.querySelectorAll('.dots__dot').forEach(dot => {
            dot.classList.remove('dots__dot--active');
        });
        
        const activeDot = document.querySelector(`.dots__dot[data-slide="${slide}"]`);
        if (activeDot) {
            activeDot.classList.add('dots__dot--active');
        }
    }

    nextSlide() {
        if (this.activities.length === 0) return;
        this.currentSlide = this.currentSlide === this.activities.length - 1 ? 0 : this.currentSlide + 1;
        this.goToSlide(this.currentSlide);
    }

    prevSlide() {
        if (this.activities.length === 0) return;
        this.currentSlide = this.currentSlide === 0 ? this.activities.length - 1 : this.currentSlide - 1;
        this.goToSlide(this.currentSlide);
    }

    setupEventListeners() {
        // Chart filter
        document.getElementById('chart-filter')?.addEventListener('change', (e) => {
            this.initializeAllChart()          
        });

        // Search input
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.searchActivities(e.target.value);
            }, 300);
        });

        // Slider buttons
        const btnPrev = document.querySelector('.slider__btn--left');
        const btnNext = document.querySelector('.slider__btn--right');
        if (btnPrev) btnPrev.addEventListener('click', () => this.prevSlide());
        if (btnNext) btnNext.addEventListener('click', () => this.nextSlide());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
        });

        // Tab buttons
        // Tab buttons — Attendance vs Online
        const tabAttendance = document.getElementById('tabAttendance');
        const tabOnline     = document.getElementById('tabOnline');

        if (tabAttendance) {
            tabAttendance.addEventListener('click', () => {
                tabAttendance.classList.add('btn-active');
                if (tabOnline) tabOnline.classList.remove('btn-active');
                this.renderRewards();   // restore the attendance rewards list
            });
        }

        if (tabOnline) {
            tabOnline.addEventListener('click', () => {
                tabOnline.classList.add('btn-active');
                if (tabAttendance) tabAttendance.classList.remove('btn-active');
                this.renderOnlineMembers();   // show online members
            });
        }

        // Auto-advance slides
        setInterval(() => {
            this.nextSlide();
        }, 5000);
        // Auto-advance the vertical department slider every 5 s
        setInterval(() => {
            if (!this.departments || this.departments.length === 0) return;

            // Loop back to the top when we've reached the last card
            const nextIndex = (this.deptSlide + 1) % this.departments.length;
            this.goToDeptSlide(nextIndex);
        }, 5000);
    }

}

// Initialize dashboard when page loads
let dashboardManager;

document.addEventListener('DOMContentLoaded', () => {
    dashboardManager = new DashboardManager();
    dashboardManager.init();
});

