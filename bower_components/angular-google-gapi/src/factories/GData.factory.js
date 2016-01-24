(function() {
    'use strict';
    angular.module('angular-google-gapi').factory('GData', ['$rootScope',
        function ($rootScope) {

            $rootScope.gapi = {};

            var isLogin = false;
            var user = null;
            var userId = null;

            return {

                getUserId : function() {
                    return userId;
                },

                setUserId : function(id) {
                    userId = id;
                },

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
                        userId = value.id;
                    }

                }

            }

        }]);
})();