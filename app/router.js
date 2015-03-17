var router = angular.module('angular-google-api-example.router', []);

router
    .config(['$urlRouterProvider',
        function($urlRouterProvider) {

            $urlRouterProvider.otherwise("/login");

        }]);

router
    .config(['$stateProvider',
        function($stateProvider) {

            $stateProvider

                .state('login', {
                    url :'/login',
                    views :  {
                        '': {
                            templateUrl: 'partials/login.html',
                            controller: 'angular-google-api-example.controller.login',
                        },
                    },
                })

                .state('home', {
                    url :'/',
                    views :  {
                        '': {
                            controller: 'angular-google-api-example.controller.home',
                            templateUrl: 'partials/home.html',
                        },
                    },
                })

    }])