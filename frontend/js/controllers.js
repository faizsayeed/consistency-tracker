// Auth Controller
app.controller('AuthCtrl', function($scope, $location, AuthService) {
    $scope.form = {};
    $scope.isLogin = true;
    $scope.errorMsg = '';
    
    $scope.submit = function() {
        $scope.errorMsg = '';
        if (!$scope.form.email || !$scope.form.password) {
            $scope.errorMsg = 'Please fill all fields';
            return;
        }
        
        if ($scope.isLogin) {
            AuthService.login($scope.form.email, $scope.form.password)
                .then(function() {
                    $location.path('/dashboard');
                })
                .catch(function(error) {
                    $scope.errorMsg = error.data?.error || 'Login failed';
                });
        } else {
            if (!$scope.form.name) {
                $scope.errorMsg = 'Please enter your name';
                return;
            }
            AuthService.register($scope.form.email, $scope.form.password, $scope.form.name)
                .then(function() {
                    $location.path('/dashboard');
                })
                .catch(function(error) {
                    $scope.errorMsg = error.data?.error || 'Registration failed';
                });
        }
    };
    
    $scope.toggleMode = function() {
        $scope.isLogin = !$scope.isLogin;
        $scope.errorMsg = '';
        $scope.form = {};
    };
});

// Dashboard Controller
app.controller('DashboardCtrl', function($scope, HabitService, AuthService) {
    $scope.user = AuthService.getUser();
    $scope.habits = [];
    $scope.completionMap = {};
    $scope.loading = true;
    
    function loadData() {
        HabitService.getHabits().then(function(habits) {
            $scope.habits = habits;
            $scope.totalHabits = habits.length;
            
            var today = new Date().toISOString().split('T')[0];
            return HabitService.getCompletionForDate(today);
        }).then(function(todayLogs) {
            $scope.habits.forEach(function(habit) {
                $scope.completionMap[habit.id] = todayLogs[habit.id] || false;
            });
            
            $scope.todayCompleted = Object.keys($scope.completionMap).filter(k => $scope.completionMap[k]).length;
            $scope.completionPercentage = $scope.totalHabits ? Math.round(($scope.todayCompleted / $scope.totalHabits) * 100) : 0;
            $scope.loading = false;
        }).catch(function(error) {
            console.error('Dashboard load error:', error);
            $scope.loading = false;
        });
    }
    
    $scope.isCompletedToday = function(habitId) {
        return $scope.completionMap[habitId];
    };
    
    $scope.toggleHabit = function(habit) {
        var today = new Date().toISOString().split('T')[0];
        HabitService.logCompletion(habit.id, today, $scope.completionMap[habit.id])
            .then(function() {
                $scope.todayCompleted = Object.keys($scope.completionMap).filter(k => $scope.completionMap[k]).length;
                $scope.completionPercentage = $scope.totalHabits ? Math.round(($scope.todayCompleted / $scope.totalHabits) * 100) : 0;
            });
    };
    
    loadData();
});

// Habits Controller
app.controller('HabitsCtrl', function($scope, HabitService, NotificationService) {

    $scope.habits = [];
    $scope.showForm = false;
    $scope.form = {};
    $scope.editingHabit = null;

    // 🔹 Helper function (OUTSIDE)
// ✅ Convert backend time → display format
function formatTime(time) {
    if (!time) return '';

    // If already HH:mm:ss → convert to HH:mm
    if (typeof time === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(time)) {
        return time.substring(0, 5);
    }

    // If ISO format (1970-01-01T18:10:00.000Z)
    if (typeof time === 'string' && time.includes('T')) {
        const date = new Date(time);
        return date.toISOString().substr(11, 5);
    }

    return time;
}

// ✅ Convert input → MySQL format
function formatToMySQL(time) {
    if (!time) return null;

    if (time.length === 5) return time + ":00"; // 18:10 → 18:10:00
    return time;
}
    
    function loadHabits() {
    HabitService.getHabits().then(function(habits) {
        habits.forEach(function(habit) {
            habit.reminder_time = formatTime(habit.reminder_time);
        });
        $scope.habits = habits;
    });

}
    
    $scope.openForm = function() {
        $scope.showForm = true;
        $scope.form = {};
        $scope.editingHabit = null;
    };
    
    $scope.closeForm = function() {
        $scope.showForm = false;
        $scope.form = {};
        $scope.editingHabit = null;
    };
    
    $scope.editHabit = function(habit) {
        $scope.editingHabit = habit;
        $scope.form = {
            name: habit.name,
            category: habit.category,
            description: habit.description,
            reminder_time: habit.reminder_time 
    ? new Date('1970-01-01T' + formatTime(habit.reminder_time) + ':00')
    : null,
            reminder_enabled: habit.reminder_enabled
        };
        $scope.showForm = true;
    };
    
    $scope.saveHabit = function() {
        if ($scope.form.name && $scope.form.category) {
            var habitData = {
                name: $scope.form.name,
                category: $scope.form.category,
                description: $scope.form.description || '',
                reminder_time: $scope.form.reminder_time
    ? formatToMySQL(
        $scope.form.reminder_time.toTimeString().slice(0,5)
      )
    : null,
                reminder_enabled: $scope.form.reminder_enabled || false
            };
            
            if ($scope.editingHabit) {
                habitData.id = $scope.editingHabit.id;
                HabitService.updateHabit(habitData).then(function() {
                    if (habitData.reminder_enabled && habitData.reminder_time) {
                        NotificationService.scheduleReminder(habitData, habitData.reminder_time);
                    }
                    loadHabits();
                    $scope.closeForm();
                });
            } else {
                HabitService.addHabit(habitData).then(function(habit) {
                    if (habitData.reminder_enabled && habitData.reminder_time) {
                        NotificationService.scheduleReminder(habit, habitData.reminder_time);
                    }
                    loadHabits();
                    $scope.closeForm();
                });
            }
        }
    };
    
    $scope.deleteHabit = function(id) {
        if (confirm('Delete this habit?')) {
            HabitService.deleteHabit(id).then(function() {
                loadHabits();
            });
        }
    };
    
    $scope.enableNotifications = function() {
        NotificationService.requestPermission().then(function(granted) {
            $scope.notificationsEnabled = granted;
        });
    };
    
    $scope.notificationsSupported = NotificationService.supported;
    $scope.notificationsEnabled = NotificationService.permission === 'granted';
    
    loadHabits();
});

// Analytics Controller
app.controller('AnalyticsCtrl', function($scope, HabitService) {
    $scope.habits = [];
    $scope.calendarData = [];
    $scope.monthLabels = [];
    $scope.completionPercentage = 0;
    $scope.totalHabits = 0;
    $scope.filteredStats = { completed: 0 };
    $scope.loading = true;
    $scope.selectedHabit = ''; // Track selected habit

    function formatDateLocal(dateLike) {
        var d = (dateLike instanceof Date) ? dateLike : new Date(dateLike);
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }
    
    // Initialize date range (past 52 weeks)
    var today = new Date();
    var startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    
    $scope.dateRange = {
        start: startDate,
        end: today
    };
    
    function loadData() {
        HabitService.getHabits().then(function(habits) {
            $scope.habits = habits;
            $scope.totalHabits = habits.length;
            return generateHeatmapData();
        }).then(function() {
            return calculateStats();
        }).then(function() {
            $scope.loading = false;
        }).catch(function(error) {
            console.error('Analytics load error:', error);
            $scope.loading = false;
        });
    }
    
    function generateHeatmapData() {
        var startStr = formatDateLocal($scope.dateRange.start);
        var endStr = formatDateLocal($scope.dateRange.end);
        
        console.log('Generating heatmap data from', startStr, 'to', endStr);
        console.log('Selected habit:', $scope.selectedHabit);
        
        // If a specific habit is selected, use getCompletionForDateRange with habitId
        var dataPromise;
        if ($scope.selectedHabit) {
            dataPromise = HabitService.getCompletionForDateRange(startStr, endStr, $scope.selectedHabit)
                .then(function(result) {
                    // Convert to array format matching getHeatmapData
                    // For single habit, we need to get all dates and check completion
                    return HabitService.getSingleHabitHeatmapData(startStr, endStr, $scope.selectedHabit);
                });
        } else {
            dataPromise = HabitService.getHeatmapData(startStr, endStr);
        }
        
        return dataPromise.then(function(data) {
            console.log('Heatmap data received:', data);
            
            // Convert data to heatmap format
            var dataMap = {};
            data.forEach(function(item) {
                dataMap[item.log_date] = item;
            });
            
            // Generate calendar grid exactly like GitHub (52 weeks)
            var weeks = [];
            var today = new Date();
            var startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 364); // 52 weeks back
            
            // Align to Sunday
            var dayOfWeek = startDate.getDay();
            var daysFromSunday = dayOfWeek;
            startDate.setDate(startDate.getDate() - daysFromSunday);
            
            var currentDate = new Date(startDate);
            
            // Generate month labels
            var monthLabels = [];
            var currentMonth = null;
            
            // Generate exactly 52 weeks of data
            for (var w = 0; w < 52; w++) {
                var week = [];
                
                for (var d = 0; d < 7; d++) {
                    var dateStr = formatDateLocal(currentDate);
                    var item = dataMap[dateStr] || { 
                        completed_count: 0, 
                        total_habits: $scope.selectedHabit ? 1 : ($scope.totalHabits || 1), 
                        percentage: 0 
                    };
                    
                    // Check for new month label (only for first week of month)
                    var monthName = currentDate.toLocaleDateString('en-US', { month: 'short' });
                    if (monthName !== currentMonth && d === 0) {
                        monthLabels.push({
                            name: monthName,
                            offset: w
                        });
                        currentMonth = monthName;
                    }
                    
                    // Determine level based on percentage or completion
                    var percentage = item.percentage || 0;
                    var level = 0;
                    
                    if ($scope.selectedHabit) {
                        // For single habit, show 0 if not completed, 4 if completed
                        level = item.completed_count > 0 ? 4 : 0;
                    } else {
                        // For all habits, use percentage
                        if (percentage === 0) level = 0;
                        else if (percentage <= 25) level = 1;
                        else if (percentage <= 50) level = 2;
                        else if (percentage <= 75) level = 3;
                        else level = 4;
                    }
                    
                    week.push({
                        date: dateStr,
                        completed_count: item.completed_count,
                        total_habits: item.total_habits,
                        percentage: percentage,
                        level: level
                    });
                    
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                
                weeks.push(week);
            }
            
            // Remove duplicate month labels
            var uniqueMonthLabels = [];
            var lastMonth = null;
            monthLabels.forEach(function(label) {
                if (label.name !== lastMonth) {
                    uniqueMonthLabels.push(label);
                    lastMonth = label.name;
                }
            });
            
            console.log('Generated', weeks.length, 'weeks of data');
            console.log('Month labels:', uniqueMonthLabels);
            
            $scope.calendarData = weeks;
            $scope.monthLabels = uniqueMonthLabels;
        });
    }
    
    function calculateStats() {
        var startStr = formatDateLocal($scope.dateRange.start);
        var endStr = formatDateLocal($scope.dateRange.end);
        
        console.log('Calculating stats from', startStr, 'to', endStr);
        
        if ($scope.selectedHabit) {
            // For single habit, just get completion count
            return HabitService.getCompletionForDateRange(startStr, endStr, $scope.selectedHabit)
                .then(function(result) {
                    console.log('Single habit stats:', result);
                    $scope.filteredStats.completed = result.completed || 0;
                    $scope.completionPercentage = result.percentage || 0;
                });
        } else {
            return HabitService.getStats(startStr, endStr)
                .then(function(stats) {
                    console.log('Stats received:', stats);
                    $scope.filteredStats.completed = stats.completed || 0;
                    $scope.completionPercentage = stats.percentage || 0;
                });
        }
    }
    
    $scope.onHabitSelected = function() {
        $scope.loading = true;
        generateHeatmapData().then(function() {
            return calculateStats();
        }).then(function() {
            $scope.loading = false;
        }).catch(function(error) {
            console.error('Error updating heatmap:', error);
            $scope.loading = false;
        });
    };
    
    $scope.filterByDateRange = function() {
        $scope.loading = true;
        generateHeatmapData().then(function() {
            return calculateStats();
        }).then(function() {
            $scope.loading = false;
        });
    };
    
    $scope.resetDateRange = function() {
        var today = new Date();
        var startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 364);
        $scope.dateRange.start = startDate;
        $scope.dateRange.end = today;
        $scope.filterByDateRange();
    };
    
    loadData();
});

// Settings Controller
app.controller('SettingsCtrl', function($scope, AuthService, NotificationService, $location) {
    $scope.user = AuthService.getUser() || {};
    $scope.editProfile = false;
    $scope.profileSuccess = false;
    $scope.profileForm = {
        phone: '',
        email_notifications: false,
        sms_notifications: false
    };
    
    // Initialize form with current user data
    function initProfileForm() {
        $scope.profileForm.phone = $scope.user.phone || '';
        $scope.profileForm.email_notifications = $scope.user.email_notifications || false;
        $scope.profileForm.sms_notifications = $scope.user.sms_notifications || false;
        console.log('Profile form initialized:', $scope.profileForm);
    }
    initProfileForm();
    
    // Refresh user data from server to get latest phone/notifications
    AuthService.getProfile().then(function(user) {
        console.log('Profile loaded from server:', user);
        $scope.user = user;
        initProfileForm();
    }).catch(function(error) {
        console.log('Could not refresh profile:', error);
    });
    
    $scope.notificationsSupported = NotificationService.supported;
    $scope.notificationsEnabled = NotificationService.permission === 'granted';
    
    $scope.enableNotifications = function() {
        NotificationService.requestPermission().then(function(granted) {
            $scope.notificationsEnabled = granted;
        });
    };
    
    $scope.saveProfile = function() {
        console.log('Save button clicked, phone:', $scope.profileForm.phone);
        var phone = $scope.profileForm.phone ? String($scope.profileForm.phone).trim() : '';
        AuthService.updateProfile({
            name: $scope.user.name,
            phone: phone,
            email_notifications: $scope.profileForm.email_notifications,
            sms_notifications: $scope.profileForm.sms_notifications
        }).then(function(response) {
            console.log('Profile saved successfully:', response);
            $scope.user = response.user;
            $scope.profileSuccess = true;
            $scope.editProfile = false;
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.profileSuccess = false;
                });
            }, 2000);
        }).catch(function(error) {
            console.error('Save profile error:', error);
            alert('Failed to save profile: ' + (error.data?.error || error.message || 'Unknown error'));
        });
    };
    
    $scope.logout = function() {
        if (confirm('Sign out from your account?')) {
            AuthService.logout();
            $location.path('/login');
        }
    };
    $scope.toggleEdit = function () {
    console.log("Edit clicked"); // debug
    $scope.editProfile = true;
};
    
    $scope.reset = function() {
        if (confirm('This will delete all your habits and data from the server. Are you sure?')) {
            AuthService.logout();
            $location.path('/login');
        }
    };
});
