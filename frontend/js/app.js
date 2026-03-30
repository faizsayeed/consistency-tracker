// Initialize App Module
var app = angular.module('trackerApp', ['ngRoute']);

// Configure Routes
app.config(function($routeProvider) {
    $routeProvider
        .when('/login', {
            templateUrl: 'views/login.html',
            controller: 'AuthCtrl'
        })
        .when('/dashboard', {
            templateUrl: 'views/dashboard.html',
            controller: 'DashboardCtrl'
        })
        .when('/habits', {
            templateUrl: 'views/habits.html',
            controller: 'HabitsCtrl'
        })
        .when('/analytics', {
            templateUrl: 'views/analytics.html',
            controller: 'AnalyticsCtrl'
        })
        .when('/settings', {
            templateUrl: 'views/settings.html',
            controller: 'SettingsCtrl'
        })
        .otherwise({ redirectTo: '/login' });
});

// Main Controller
app.controller('MainController', function($scope, $location, $rootScope, $timeout, StorageService, AuthService) {
    
    // Entry animation
    $scope.showEntryAnimation = true;
    $timeout(function() {
        $scope.showEntryAnimation = false;
    }, 2000);
    
    $scope.isDarkMode = StorageService.getTheme() === 'dark';
    $scope.isLoggedIn = function() { 
        return AuthService.isLoggedIn(); 
    };
    
    $scope.logout = function() {
        AuthService.logout();
        $location.path('/login');
    };
    
    $scope.toggleTheme = function() {
        $scope.isDarkMode = !$scope.isDarkMode;
        StorageService.setTheme($scope.isDarkMode ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', $scope.isDarkMode ? 'dark' : 'light');
    };
    
    $rootScope.$on('$routeChangeStart', function(event, next) {
        if (next.$$route && !AuthService.isLoggedIn() && next.$$route.controller !== 'AuthCtrl') {
            event.preventDefault();
            $location.path('/login');
        }
        $scope.currentRoute = next.$$route ? next.$$route.controller.replace('Ctrl', '').toLowerCase() : '';
    });
    
    // Initialize theme
    document.documentElement.setAttribute('data-theme', $scope.isDarkMode ? 'dark' : 'light');
});
