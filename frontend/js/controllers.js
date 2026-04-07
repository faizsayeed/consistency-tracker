// Auth Controller
app.controller('AuthCtrl', function($scope, $location, AuthService) {
    $scope.form = {};
    $scope.isLogin = true;
    $scope.errorMsg = '';
    
    // Yeti animation variables
    var yetiInitialized = false;
    var mySVG, twoFingers, armL, armR, eyeL, eyeR, nose, mouth, mouthBG, mouthSmallBG, mouthMediumBG, mouthLargeBG, mouthMaskPath, mouthOutline, tooth, tongue, chin, face, eyebrow, outerEarL, outerEarR, earHairL, earHairR, hair, bodyBG, bodyBGchanged;
    var eyesCovered = false;
    var showPasswordClicked = false;
    var activeElement = null;
    var eyeScale = 1;
    
    // Initialize Yeti animations after view is rendered
    $scope.$on('$viewContentLoaded', function() {
        if ($scope.isLogin && !yetiInitialized) {
            setTimeout(initYetiAnimations, 100);
        }
    });
    
    function initYetiAnimations() {
        // Check if GSAP is available
        if (typeof gsap === 'undefined') {
            console.log('GSAP not loaded, skipping Yeti animations');
            return;
        }
        
        // Get DOM elements
        mySVG = document.querySelector('.mySVG');
        if (!mySVG) return;
        
        twoFingers = document.querySelector('.twoFingers');
        armL = document.querySelector('.armL');
        armR = document.querySelector('.armR');
        eyeL = document.querySelector('.eyeL');
        eyeR = document.querySelector('.eyeR');
        nose = document.querySelector('.nose');
        mouth = document.querySelector('.mouth');
        mouthBG = document.querySelector('.mouthBG');
        mouthSmallBG = document.querySelector('.mouthSmallBG');
        mouthMediumBG = document.querySelector('.mouthMediumBG');
        mouthLargeBG = document.querySelector('.mouthLargeBG');
        mouthMaskPath = document.querySelector('#mouthMaskPath');
        mouthOutline = document.querySelector('.mouthOutline');
        tooth = document.querySelector('.tooth');
        tongue = document.querySelector('.tongue');
        chin = document.querySelector('.chin');
        face = document.querySelector('.face');
        eyebrow = document.querySelector('.eyebrow');
        outerEarL = document.querySelector('.earL .outerEar');
        outerEarR = document.querySelector('.earR .outerEar');
        earHairL = document.querySelector('.earL .earHair');
        earHairR = document.querySelector('.earR .earHair');
        hair = document.querySelector('.hair');
        bodyBG = document.querySelector('.bodyBGnormal');
        bodyBGchanged = document.querySelector('.bodyBGchanged');
        
        // Set initial arm positions
        gsap.set(armL, { x: -93, y: 220, rotation: 105, transformOrigin: "top left" });
        gsap.set(armR, { x: -93, y: 220, rotation: -105, transformOrigin: "top right" });
        gsap.set(mouth, { transformOrigin: "center center" });
        
        // Start blinking
        startBlinking(5);
        
        yetiInitialized = true;
        console.log('Yeti animations initialized');
    }
    
    function startBlinking(delay) {
        if (!eyeL || !eyeR) return;
        var blinkDelay = delay || getRandomInt(12);
        gsap.to([eyeL, eyeR], 0.1, {
            delay: blinkDelay,
            scaleY: 0,
            yoyo: true,
            repeat: 1,
            transformOrigin: "center center",
            onComplete: function() {
                startBlinking();
            }
        });
    }
    
    function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }
    
    // Yeti event handlers
    $scope.onYetiEmailFocus = function() {
        activeElement = "email";
        if (yetiInitialized) {
            calculateFaceMove();
        }
    };
    
    $scope.onYetiEmailBlur = function() {
        activeElement = null;
        setTimeout(function() {
            if (activeElement !== "email" && yetiInitialized) {
                resetFace();
            }
        }, 100);
    };
    
    $scope.onYetiEmailInput = function() {
        if (yetiInitialized) {
            calculateFaceMove();
            var value = document.getElementById('yetiEmail').value;
            
            if (value.length > 0) {
                if (!value.includes("@")) {
                    // Medium mouth
                    gsap.to([mouthBG, mouthOutline, mouthMaskPath], 1, { morphSVG: mouthMediumBG, ease: "expo.out" });
                    gsap.to(tooth, 1, { x: 0, y: 0, ease: "expo.out" });
                    gsap.to(tongue, 1, { x: 0, y: 1, ease: "expo.out" });
                    gsap.to([eyeL, eyeR], 1, { scaleX: 0.85, scaleY: 0.85, ease: "expo.out" });
                    eyeScale = 0.85;
                } else {
                    // Large mouth (happy)
                    gsap.to([mouthBG, mouthOutline, mouthMaskPath], 1, { morphSVG: mouthLargeBG, ease: "expo.out" });
                    gsap.to(tooth, 1, { x: 3, y: -2, ease: "expo.out" });
                    gsap.to(tongue, 1, { y: 2, ease: "expo.out" });
                    gsap.to([eyeL, eyeR], 1, { scaleX: 0.65, scaleY: 0.65, ease: "expo.out", transformOrigin: "center center" });
                    eyeScale = 0.65;
                }
            } else {
                // Small mouth
                gsap.to([mouthBG, mouthOutline, mouthMaskPath], 1, { morphSVG: mouthSmallBG, ease: "expo.out" });
                gsap.to(tooth, 1, { x: 0, y: 0, ease: "expo.out" });
                gsap.to(tongue, 1, { y: 0, ease: "expo.out" });
                gsap.to([eyeL, eyeR], 1, { scaleX: 1, scaleY: 1, ease: "expo.out" });
                eyeScale = 1;
            }
        }
    };
    
    $scope.onYetiPasswordFocus = function() {
        activeElement = "password";
        if (yetiInitialized && !eyesCovered) {
            coverEyes();
        }
    };
    
    $scope.onYetiPasswordBlur = function() {
        activeElement = null;
        setTimeout(function() {
            if (activeElement !== "password" && activeElement !== "toggle" && yetiInitialized) {
                uncoverEyes();
            }
        }, 100);
    };
    
    $scope.togglePasswordVisibility = function() {
        var passwordInput = document.getElementById('yetiPassword');
        var showPasswordCheck = document.getElementById('showPasswordCheck');
        
        if (passwordInput && showPasswordCheck) {
            if (showPasswordCheck.checked) {
                passwordInput.type = "text";
                if (yetiInitialized) spreadFingers();
            } else {
                passwordInput.type = "password";
                if (yetiInitialized) closeFingers();
            }
        }
    };
    
    function calculateFaceMove() {
        if (!eyeL || !mySVG) return;
        
        var emailInput = document.getElementById('yetiEmail');
        if (!emailInput) return;
        
        var svgCoords = getPosition(mySVG);
        var emailCoords = getPosition(emailInput);
        var screenCenter = svgCoords.x + (mySVG.offsetWidth / 2);
        
        var eyeLCoords = { x: svgCoords.x + 84, y: svgCoords.y + 76 };
        var eyeRCoords = { x: svgCoords.x + 113, y: svgCoords.y + 76 };
        var noseCoords = { x: svgCoords.x + 97, y: svgCoords.y + 81 };
        var mouthCoords = { x: svgCoords.x + 100, y: svgCoords.y + 100 };
        
        var dFromC = screenCenter - (emailCoords.x + emailInput.offsetWidth / 2);
        var eyeLAngle = getAngle(eyeLCoords.x, eyeLCoords.y, emailCoords.x + emailInput.offsetWidth / 2, emailCoords.y + 25);
        var eyeRAngle = getAngle(eyeRCoords.x, eyeRCoords.y, emailCoords.x + emailInput.offsetWidth / 2, emailCoords.y + 25);
        var noseAngle = getAngle(noseCoords.x, noseCoords.y, emailCoords.x + emailInput.offsetWidth / 2, emailCoords.y + 25);
        var mouthAngle = getAngle(mouthCoords.x, mouthCoords.y, emailCoords.x + emailInput.offsetWidth / 2, emailCoords.y + 25);
        
        var eyeLX = Math.cos(eyeLAngle) * 20;
        var eyeLY = Math.sin(eyeLAngle) * 10;
        var eyeRX = Math.cos(eyeRAngle) * 20;
        var eyeRY = Math.sin(eyeRAngle) * 10;
        var noseX = Math.cos(noseAngle) * 23;
        var noseY = Math.sin(noseAngle) * 10;
        var mouthX = Math.cos(mouthAngle) * 23;
        var mouthY = Math.sin(mouthAngle) * 10;
        var mouthR = Math.cos(mouthAngle) * 6;
        var chinX = mouthX * 0.8;
        var chinY = mouthY * 0.5;
        var chinS = 1 - ((dFromC * 0.15) / 100);
        if (chinS > 1) {
            chinS = 1 - (chinS - 1);
            if (chinS < 0.5) chinS = 0.5;
        }
        var faceX = mouthX * 0.3;
        var faceY = mouthY * 0.4;
        var faceSkew = Math.cos(mouthAngle) * 5;
        var eyebrowSkew = Math.cos(mouthAngle) * 25;
        var outerEarX = Math.cos(mouthAngle) * 4;
        var outerEarY = Math.cos(mouthAngle) * 5;
        var hairX = Math.cos(mouthAngle) * 6;
        var hairS = 1.2;
        
        gsap.to(eyeL, 1, { x: -eyeLX, y: -eyeLY, ease: "expo.out" });
        gsap.to(eyeR, 1, { x: -eyeRX, y: -eyeRY, ease: "expo.out" });
        gsap.to(nose, 1, { x: -noseX, y: -noseY, rotation: mouthR, transformOrigin: "center center", ease: "expo.out" });
        gsap.to(mouth, 1, { x: -mouthX, y: -mouthY, rotation: mouthR, transformOrigin: "center center", ease: "expo.out" });
        gsap.to(chin, 1, { x: -chinX, y: -chinY, scaleY: chinS, ease: "expo.out" });
        gsap.to(face, 1, { x: -faceX, y: -faceY, skewX: -faceSkew, transformOrigin: "center top", ease: "expo.out" });
        gsap.to(eyebrow, 1, { x: -faceX, y: -faceY, skewX: -eyebrowSkew, transformOrigin: "center top", ease: "expo.out" });
        gsap.to(outerEarL, 1, { x: outerEarX, y: -outerEarY, ease: "expo.out" });
        gsap.to(outerEarR, 1, { x: outerEarX, y: outerEarY, ease: "expo.out" });
        gsap.to(earHairL, 1, { x: -outerEarX, y: -outerEarY, ease: "expo.out" });
        gsap.to(earHairR, 1, { x: -outerEarX, y: outerEarY, ease: "expo.out" });
        gsap.to(hair, 1, { x: hairX, scaleY: hairS, transformOrigin: "center bottom", ease: "expo.out" });
    }
    
    function resetFace() {
        if (!eyeL) return;
        gsap.to([eyeL, eyeR], 1, { x: 0, y: 0, ease: "expo.out" });
        gsap.to(nose, 1, { x: 0, y: 0, scaleX: 1, scaleY: 1, ease: "expo.out" });
        gsap.to(mouth, 1, { x: 0, y: 0, rotation: 0, ease: "expo.out" });
        gsap.to(chin, 1, { x: 0, y: 0, scaleY: 1, ease: "expo.out" });
        gsap.to([face, eyebrow], 1, { x: 0, y: 0, skewX: 0, ease: "expo.out" });
        gsap.to([outerEarL, outerEarR, earHairL, earHairR, hair], 1, { x: 0, y: 0, scaleY: 1, ease: "expo.out" });
    }
    
    function coverEyes() {
        if (!armL || !armR) return;
        gsap.killTweensOf([armL, armR]);
        gsap.set([armL, armR], { visibility: "visible" });
        gsap.to(armL, 0.45, { x: -93, y: 10, rotation: 0, ease: "quad.out" });
        gsap.to(armR, 0.45, { x: -93, y: 10, rotation: 0, ease: "quad.out", delay: 0.1 });
        if (bodyBG && bodyBGchanged) {
            gsap.to(bodyBG, 0.45, { morphSVG: bodyBGchanged, ease: "quad.out" });
        }
        eyesCovered = true;
    }
    
    function uncoverEyes() {
        if (!armL || !armR) return;
        gsap.killTweensOf([armL, armR]);
        gsap.to(armL, 1.35, { y: 220, ease: "quad.out" });
        gsap.to(armL, 1.35, { rotation: 105, ease: "quad.out", delay: 0.1 });
        gsap.to(armR, 1.35, { y: 220, ease: "quad.out" });
        gsap.to(armR, 1.35, {
            rotation: -105, ease: "quad.out", delay: 0.1, onComplete: function() {
                gsap.set([armL, armR], { visibility: "hidden" });
            }
        });
        if (bodyBG) {
            gsap.to(bodyBG, 0.45, { morphSVG: bodyBG, ease: "quad.out" });
        }
        eyesCovered = false;
    }
    
    function spreadFingers() {
        if (!twoFingers) return;
        gsap.to(twoFingers, 0.35, { transformOrigin: "bottom left", rotation: 30, x: -9, y: -2, ease: "power2.inOut" });
    }
    
    function closeFingers() {
        if (!twoFingers) return;
        gsap.to(twoFingers, 0.35, { transformOrigin: "bottom left", rotation: 0, x: 0, y: 0, ease: "power2.inOut" });
    }
    
    function getAngle(x1, y1, x2, y2) {
        return Math.atan2(y1 - y2, x1 - x2);
    }
    
    function getPosition(el) {
        var xPos = 0;
        var yPos = 0;
        while (el) {
            if (el.tagName == "BODY") {
                var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
                var yScroll = el.scrollTop || document.documentElement.scrollTop;
                xPos += (el.offsetLeft - xScroll + el.clientLeft);
                yPos += (el.offsetTop - yScroll + el.clientTop);
            } else {
                xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
                yPos += (el.offsetTop - el.scrollTop + el.clientTop);
            }
            el = el.offsetParent;
        }
        return { x: xPos, y: yPos };
    }
    
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
        yetiInitialized = false;
        
        // Reinitialize Yeti when switching back to login
        if ($scope.isLogin) {
            setTimeout(function() {
                initYetiAnimations();
            }, 100);
        }
    };
});

// Dashboard Controller
app.controller('DashboardCtrl', function($scope, HabitService, AuthService) {
    $scope.user = AuthService.getUser();
    $scope.habits = [];
    $scope.completionMap = {};
    $scope.loading = true;
    
    // Helper function to format date in local timezone (not UTC)
    function formatDateLocal(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }
    
    function loadData() {
        HabitService.getHabits().then(function(habits) {
            $scope.habits = habits;
            $scope.totalHabits = habits.length;
            
            // Use local date, not UTC
            var today = formatDateLocal(new Date());
            console.log('Dashboard loading for date:', today);
            return HabitService.getCompletionForDate(today);
        }).then(function(todayLogs) {
            console.log('Today logs received:', todayLogs);
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
        // Use local date, not UTC
        var today = formatDateLocal(new Date());
        var completed = $scope.completionMap[habit.id];
        console.log('Toggling habit:', habit.id, habit.name, 'Date:', today, 'Completed:', completed);
        
        HabitService.logCompletion(habit.id, today, completed)
            .then(function(response) {
                console.log('Log completion success:', response);
                $scope.todayCompleted = Object.keys($scope.completionMap).filter(k => $scope.completionMap[k]).length;
                $scope.completionPercentage = $scope.totalHabits ? Math.round(($scope.todayCompleted / $scope.totalHabits) * 100) : 0;
            })
            .catch(function(error) {
                console.error('Log completion error:', error);
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
    
    // Chart instances
    var barChart, pieChart, lineChart;

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
            return loadChartData();
        }).then(function() {
            $scope.loading = false;
        }).catch(function(error) {
            console.error('Analytics load error:', error);
            $scope.loading = false;
        });
    }
    
    // Load and initialize charts
    function loadChartData() {
        var startStr = formatDateLocal($scope.dateRange.start);
        var endStr = formatDateLocal($scope.dateRange.end);
        
        return HabitService.getChartData(startStr, endStr).then(function(chartData) {
            console.log('Chart data received:', chartData);
            initCharts(chartData);
        }).catch(function(error) {
            console.error('Chart data error:', error);
        });
    }
    
    // Initialize all charts
    function initCharts(data) {
        // Destroy existing charts if they exist
        if (barChart) barChart.destroy();
        if (pieChart) pieChart.destroy();
        if (lineChart) lineChart.destroy();
        
        // Common chart options for dark theme
        var commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#e5e5e5',
                        font: { size: 12 }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#a3a3a3' },
                    grid: { color: '#404040' }
                },
                y: {
                    ticks: { color: '#a3a3a3' },
                    grid: { color: '#404040' }
                }
            }
        };
        
        // Bar Chart - Habit Completion Rate
        var barCtx = document.getElementById('barChart');
        if (barCtx && data.barChart && data.barChart.labels.length > 0) {
            barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: data.barChart.labels,
                    datasets: [{
                        label: 'Completion Rate (%)',
                        data: data.barChart.data,
                        backgroundColor: data.barChart.colors,
                        borderColor: '#22c55e',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    ...commonOptions,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.parsed.y + '% completion rate';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                color: '#a3a3a3',
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            grid: { color: '#404040' }
                        },
                        x: {
                            ticks: { 
                                color: '#a3a3a3',
                                maxRotation: 45,
                                minRotation: 45
                            },
                            grid: { display: false }
                        }
                    }
                }
            });
        }
        
        // Pie Chart - Habit Distribution
        var pieCtx = document.getElementById('pieChart');
        if (pieCtx && data.pieChart && data.pieChart.labels.length > 0) {
            pieChart = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: data.pieChart.labels,
                    datasets: [{
                        data: data.pieChart.data,
                        backgroundColor: data.pieChart.colors,
                        borderColor: '#171717',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#e5e5e5',
                                font: { size: 11 },
                                boxWidth: 12,
                                padding: 10
                            }
                        }
                    }
                }
            });
        }
        
        // Line Chart - Completion Trend
        var lineCtx = document.getElementById('lineChart');
        if (lineCtx && data.lineChart && data.lineChart.labels.length > 0) {
            lineChart = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: data.lineChart.labels,
                    datasets: [
                        {
                            label: 'Completed Habits',
                            data: data.lineChart.completed,
                            borderColor: '#22c55e',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#22c55e',
                            pointBorderColor: '#171717',
                            pointBorderWidth: 2,
                            pointRadius: 4
                        },
                        {
                            label: 'Total Habits',
                            data: data.lineChart.total,
                            borderColor: '#525252',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            tension: 0.4,
                            pointBackgroundColor: '#525252',
                            pointBorderColor: '#171717',
                            pointBorderWidth: 2,
                            pointRadius: 3
                        }
                    ]
                },
                options: {
                    ...commonOptions,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#e5e5e5',
                                font: { size: 12 }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#a3a3a3' },
                            grid: { color: '#404040' }
                        },
                        x: {
                            ticks: { 
                                color: '#a3a3a3',
                                maxTicksLimit: 10
                            },
                            grid: { color: '#404040' }
                        }
                    }
                }
            });
        }
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
            
            // Generate calendar grid based on dateRange
            var startDate = new Date($scope.dateRange.start);
            var endDate = new Date($scope.dateRange.end);
            
            // Calculate number of weeks in the range
            var diffTime = Math.abs(endDate - startDate);
            var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            var numWeeks = Math.ceil(diffDays / 7);
            
            // Align to Sunday
            var dayOfWeek = startDate.getDay();
            var daysFromSunday = dayOfWeek;
            startDate.setDate(startDate.getDate() - daysFromSunday);
            
            var currentDate = new Date(startDate);
            var weeks = [];
            
            // Generate month labels
            var monthLabels = [];
            var currentMonth = null;
            
            // Generate weeks of data
            for (var w = 0; w < numWeeks; w++) {
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
                    
                    // Stop if we've passed the end date
                    if (currentDate > endDate) break;
                }
                
                weeks.push(week);
                
                // Stop if we've passed the end date
                if (currentDate > endDate) break;
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
            return loadChartData();
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
            return loadChartData();
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
