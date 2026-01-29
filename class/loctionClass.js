// advance

class UserTracker {
    constructor() {
        this.userData = {};
    }

    // Get IP address
    async getIPAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Error getting IP:', error);
            return null;
        }
    }

    // Get location from IP
    async getLocationFromIP(ip) {
        try {
            const response = await fetch(`https://ipapi.co/${ip}/json/`);
            const data = await response.json();
            return {
                city: data.city,
                region: data.region,
                country: data.country_name,
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.timezone,
                isp: data.org
            };
        } catch (error) {
            console.error('Error getting location from IP:', error);
            return null;
        }
    }

    // Get precise GPS location (requires user permission)
    async getGPSLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    // Get browser and device info
    getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            javaEnabled: navigator.javaEnabled(),
            screenWidth: screen.width,
            screenHeight: screen.height,
            colorDepth: screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // Main tracking function
    async trackAllInfo() {
        try {
            // Get IP address
            const ip = await this.getIPAddress();
            if (!ip) throw new Error('Could not get IP address');

            // Get location from IP
            const ipLocation = await this.getLocationFromIP(ip);
            
            // Get browser info
            const browserInfo = this.getBrowserInfo();

            // Try to get GPS location (user permission required)
            let gpsLocation = null;
            try {
                gpsLocation = await this.getGPSLocation();
            } catch (gpsError) {
                console.log('GPS location not available:', gpsError.message);
            }

            // Compile all data
            this.userData = {
                ip: ip,
                ipLocation: ipLocation,
                gpsLocation: gpsLocation,
                browser: browserInfo,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                referrer: document.referrer
            };

            console.log('Complete User Tracking Data:', this.userData);
            return this.userData;

        } catch (error) {
            console.error('Error in user tracking:', error);
            return null;
        }
    }

    // Send data to server
    async sendToServer(endpoint) {
        if (!this.userData.ip) {
            await this.trackAllInfo();
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.userData)
            });

            if (response.ok) {
                console.log('User data sent to server successfully');
                return true;
            } else {
                throw new Error('Server responded with error');
            }
        } catch (error) {
            console.error('Error sending data to server:', error);
            return false;
        }
    }
}

// basic

function trackUserInfo() {
    // Get IP address
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(ipData => {
            const ipAddress = ipData.ip;
            
            // Get location info based on IP
            return fetch(`https://ipapi.co/${ipAddress}/json/`)
                .then(response => response.json())
                .then(locationData => {
                    const userInfo = {
                        ip: ipAddress,
                        city: locationData.city,
                        region: locationData.region,
                        country: locationData.country_name,
                        latitude: locationData.latitude,
                        longitude: locationData.longitude,
                        timezone: locationData.timezone,
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    };
                    
                    console.log('User Information:', userInfo);
                    return userInfo;
                });
        })
        .catch(error => {
            console.error('Error tracking user info:', error);
            return null;
        });
}

// Usage
trackUserInfo().then(info => {
    if (info) {
        // Send to your server or use as needed
        console.log('User IP:', info.ip);
        console.log('Location:', info.city + ', ' + info.country);
    }
});

// for church attendance system
// Track when user logs in or marks attendance
function trackAttendanceLocation() {
    const tracker = new UserTracker();
    
    tracker.trackAllInfo().then(data => {
        if (data) {
            // Add to attendance data
            const attendanceData = {
                userId: getCurrentUserId(), // Your function
                activityId: getCurrentActivityId(), // Your function
                location: data.ipLocation,
                gps: data.gpsLocation,
                device: data.browser,
                timestamp: data.timestamp
            };
            
            // Send to your server
            fetch('attendance.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attendanceData)
            });
        }
    });
}

// Call this when user marks attendance
trackAttendanceLocation();