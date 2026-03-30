// API Configuration
// Production URL - deployed on Render
const API_BASE_URL = 'https://consistency-tracker-hz8m.onrender.com';
app.constant('API_URL', API_BASE_URL + '/api');

// Storage Service - Now stores JWT and minimal local data
app.factory('StorageService', function() {
    return {
        setToken: function(token) {
            localStorage.setItem('ct_token', token);
        },
        getToken: function() {
            return localStorage.getItem('ct_token');
        },
        removeToken: function() {
            localStorage.removeItem('ct_token');
        },
        setUser: function(user) {
            localStorage.setItem('ct_user', JSON.stringify(user));
        },
        getUser: function() {
            return JSON.parse(localStorage.getItem('ct_user') || '{}');
        },
        removeUser: function() {
            localStorage.removeItem('ct_user');
        },
        getTheme: function() {
            return localStorage.getItem('ct_theme') || 'light';
        },
        setTheme: function(theme) {
            localStorage.setItem('ct_theme', theme);
        },
        clear: function() {
            localStorage.removeItem('ct_token');
            localStorage.removeItem('ct_user');
        }
    };
});

// Auth Service - Connects to backend API
app.factory('AuthService', function($http, API_URL, StorageService) {
    return {
        login: function(email, password) {
            return $http.post(API_URL + '/auth/login', { email, password })
                .then(function(response) {
                    StorageService.setToken(response.data.token);
                    StorageService.setUser(response.data.user);
                    return response.data;
                });
        },

        register: function(email, password, name) {
            return $http.post(API_URL + '/auth/register', { email, password, name })
                .then(function(response) {
                    StorageService.setToken(response.data.token);
                    StorageService.setUser(response.data.user);
                    return response.data;
                });
        },

        logout: function() {
            StorageService.clear();
        },

        isLoggedIn: function() {
            return !!StorageService.getToken();
        },

        getUser: function() {
            return StorageService.getUser();
        },

        getToken: function() {
            return StorageService.getToken();
        },

        getProfile: function() {
            return $http.get(API_URL + '/auth/profile', {
                headers: { 'Authorization': 'Bearer ' + StorageService.getToken() }
            }).then(function(response) {
                return response.data.user;
            });
        },

        updateTheme: function(theme) {
            return $http.put(API_URL + '/auth/theme', { theme }, {
                headers: { 'Authorization': 'Bearer ' + StorageService.getToken() }
            });
        },

        updateProfile: function(profileData) {
            return $http.put(API_URL + '/auth/profile', profileData, {
                headers: { 'Authorization': 'Bearer ' + StorageService.getToken() }
            }).then(function(response) {
                // Update stored user data
                StorageService.setUser(response.data.user);
                return response.data;
            });
        }
    };
});

// Habit Service - Connects to backend API
app.factory('HabitService', function($http, API_URL, StorageService) {
    function getHeaders() {
        return { 'Authorization': 'Bearer ' + StorageService.getToken() };
    }

    return {
        getHabits: function() {
            return $http.get(API_URL + '/habits', { headers: getHeaders() })
                .then(function(response) {
                    return response.data.habits;
                });
        },

        addHabit: function(habit) {
            return $http.post(API_URL + '/habits', habit, { headers: getHeaders() })
                .then(function(response) {
                    return response.data.habit;
                });
        },

        updateHabit: function(habit) {
            return $http.put(API_URL + '/habits/' + habit.id, habit, { headers: getHeaders() })
                .then(function(response) {
                    return response.data.habit;
                });
        },

        deleteHabit: function(id) {
            return $http.delete(API_URL + '/habits/' + id, { headers: getHeaders() });
        },

        logCompletion: function(habitId, date, completed) {
            return $http.post(API_URL + '/logs', {
                habit_id: habitId,
                date: date,
                completed: completed
            }, { headers: getHeaders() });
        },

        getCompletionForDate: function(date) {
            return $http.get(API_URL + '/logs/date/' + date, { headers: getHeaders() })
                .then(function(response) {
                    var logs = {};
                    response.data.logs.forEach(function(log) {
                        logs[log.habit_id] = log.completed;
                    });
                    return logs;
                });
        },

        getCompletionForDateRange: function(startDate, endDate, habitId) {
            var url = API_URL + '/logs/range?start=' + startDate + '&end=' + endDate;
            if (habitId) url += '&habitId=' + habitId;
            return $http.get(url, { headers: getHeaders() })
                .then(function(response) {
                    var completed = 0;
                    response.data.logs.forEach(function(log) {
                        if (log.completed) completed++;
                    });
                    return {
                        completed: completed,
                        total: response.data.logs.length,
                        percentage: response.data.logs.length ? Math.round((completed / response.data.logs.length) * 100) : 0
                    };
                });
        },

        getHeatmapData: function(startDate, endDate) {
            var url = API_URL + '/logs/heatmap?start=' + startDate + '&end=' + endDate;
            return $http.get(url, { headers: getHeaders() })
                .then(function(response) {
                    return response.data.data;
                });
        },

        getSingleHabitHeatmapData: function(startDate, endDate, habitId) {
            var url = API_URL + '/logs/heatmap/habit/' + habitId + '?start=' + startDate + '&end=' + endDate;
            return $http.get(url, { headers: getHeaders() })
                .then(function(response) {
                    return response.data.data;
                })
                .catch(function(error) {
                    // Fallback: use getByDateRange if endpoint doesn't exist
                    console.log('Fallback to getByDateRange for single habit heatmap');
                    return this.getByDateRange(startDate, endDate, habitId)
                        .then(function(logs) {
                            // Convert logs to heatmap format
                            var dataMap = {};
                            logs.forEach(function(log) {
                                if (!dataMap[log.log_date]) {
                                    dataMap[log.log_date] = {
                                        completed_count: 0,
                                        total_habits: 1,
                                        percentage: 0
                                    };
                                }
                                if (log.completed) {
                                    dataMap[log.log_date].completed_count = 1;
                                    dataMap[log.log_date].percentage = 100;
                                }
                            });
                            
                            // Convert map to array and fill missing dates with zeros
                            var result = [];
                            var start = new Date(startDate);
                            var end = new Date(endDate);
                            var current = new Date(start);
                            
                            while (current <= end) {
                                var dateStr = current.toISOString().split('T')[0];
                                result.push(dataMap[dateStr] || {
                                    log_date: dateStr,
                                    completed_count: 0,
                                    total_habits: 1,
                                    percentage: 0
                                });
                                current.setDate(current.getDate() + 1);
                            }
                            
                            return result;
                        });
                }.bind(this));
        },

        getStats: function(startDate, endDate) {
            var url = API_URL + '/logs/stats?start=' + startDate + '&end=' + endDate;
            return $http.get(url, { headers: getHeaders() })
                .then(function(response) {
                    return response.data.stats;
                });
        }
    };
});

// Notification Service
app.factory('NotificationService', function() {
    var service = {
        supported: 'Notification' in window,
        permission: Notification.permission,

        requestPermission: function() {
            if (!service.supported) return Promise.resolve(false);
            return Notification.requestPermission().then(function(permission) {
                service.permission = permission;
                return permission === 'granted';
            });
        },

        scheduleReminder: function(habit, time) {
            if (!service.supported || service.permission !== 'granted') return;
            
            // Store reminder in localStorage for simple client-side scheduling
            var reminders = JSON.parse(localStorage.getItem('ct_reminders') || '[]');
            reminders.push({
                habitId: habit.id,
                habitName: habit.name,
                time: time,
                enabled: true
            });
            localStorage.setItem('ct_reminders', JSON.stringify(reminders));
        },

        sendNotification: function(title, body) {
            if (!service.supported || service.permission !== 'granted') return;
            
            new Notification(title, {
                body: body,
                icon: '../assets/icon.png',
                badge: '../assets/icon.png',
                tag: 'habit-reminder'
            });
        },

        checkReminders: function() {
            if (!service.supported || service.permission !== 'granted') return;
            
            var now = new Date();
            var currentTime = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
            
            var reminders = JSON.parse(localStorage.getItem('ct_reminders') || '[]');
            reminders.forEach(function(reminder) {
                if (reminder.enabled && reminder.time === currentTime) {
                    service.sendNotification(
                        'Habit Reminder',
                        'Time to complete: ' + reminder.habitName
                    );
                }
            });
        }
    };

    // Check reminders every minute
    if (service.supported) {
        setInterval(service.checkReminders, 60000);
    }

    return service;
});
