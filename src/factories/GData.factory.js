(function() {
    'use strict';
    angular.module('angular-google-gapi').factory('GData', ['$rootScope', '$cookies',
        function ($rootScope, $cookies) {

            $rootScope.gapi = {};

            var isLogin = false;
            var user = null;

            return {

                isLogin : function(value) {
                    if(arguments.length == 0)
                        return isLogin;
                    isLogin = value;
                    $rootScope.gapi.login = value;
                },

                getUser : function(value) {
                    if(arguments.length == 0)
                        return user;
                    user = value;
                    if(value !== null) {
                        $cookies.put('userId', value.id);
                    } else {
                        $cookies.remove('userId');
                    }

                }

            }

        }]);
})();