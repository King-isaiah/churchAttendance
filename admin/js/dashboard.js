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
      const response = await fetch('class/ApiHandler.php?action=getAll&entity=dashboard');     
        return response.json();
    }

    async fetchRecentActivities() {
        const response = await fetch('class/ApiHandler.php?action=getAll&entity=activities');
        return response.json();
    }

    async fetchDepartmentStats() {
        const response = await fetch('class/ApiHandler.php?action=getAll&entity=departments');
        return response.json();
    }

    async fetchAttendanceRewards() {
      const response = await fetch('class/ApiHandler.php?action=special&entity=reports');   
      return response.json();
    }

    async searchActivities(searchTerm) {
        if (!searchTerm.trim()) {
            // If search is empty, show all activities
            this.renderActivitiesSlider();
            return;
        }

        try {
            const response = await fetch('class/ApiHandler.php?action=special&entity=dashboard&type=search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ search: searchTerm })
            });
            
            const result = await response.json();
            if (result.success) {
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
                    <p>Total Attendees Today</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #ffb2b2;">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="stat-info">
                    <h4>${this.stats.activities_this_week || 0}</h4>
                    <p>Activities This Week</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #c9e78a;">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-info">
                    <h4>${this.stats.growth_percentage >= 0 ? '+' : ''}${this.stats.growth_percentage || 0}%</h4>
                    <p>Growth</p>
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
      const slider = document.getElementById('activitiesSlider');
      const dots = document.getElementById('sliderDots');
      
      if (!slider || !dots) return;

      if (this.activities.length === 0) {
          slider.innerHTML = '<div class="no-data">No activities found</div>';
          dots.innerHTML = '';
          return;
      }

      let slidesHTML = '';
      this.activities.forEach((activity, index) => {
        slidesHTML += `
            <div class="sliding-go slide" id="section--${index + 1}">
                <div class="">
                    <h4>${escapeHtml(activity.name)}</h4>
                    <h6>${activity.dayofactivity}</h6>
                    <h6>${escapeHtml(activity.location || 'N/A')}</h6>
                </div>
            </div>
        `;
      });

      slider.innerHTML = slidesHTML;

      dots.innerHTML = '';
      this.activities.forEach((_, index) => {
          const dot = document.createElement('button');
          dot.className = 'dots__dot';
          dot.dataset.slide = index;
          dot.addEventListener('click', () => this.goToSlide(index));
          dots.appendChild(dot);
      });

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
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.dots__dot');

        slides.forEach((s, i) => {
            s.style.transform = `translateX(${100 * (i - slide)}%)`;
        });

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
        document.querySelector('.slider__btn--right')?.addEventListener('click', () => this.nextSlide());
        document.querySelector('.slider__btn--left')?.addEventListener('click', () => this.prevSlide());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
        });

        // Tab buttons
        document.querySelectorAll('.btn-group button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-group button').forEach(b => b.classList.remove('btn-active'));
                e.target.classList.add('btn-active');
                // Handle tab switching here
            });
        });

        // Auto-advance slides
        setInterval(() => {
            this.nextSlide();
        }, 5000);
    }

}

// Initialize dashboard when page loads
let dashboardManager;

document.addEventListener('DOMContentLoaded', () => {
    dashboardManager = new DashboardManager();
    dashboardManager.init();
});