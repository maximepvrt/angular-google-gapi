(function() {
    'use strict';
    angular.module('angular-google-gapi').factory('GAuth', ['$rootScope', '$q', 'GClient', 'GApi', 'GData', '$interval', '$window', '$location',
        function($rootScope, $q, GClient, GApi, GData, $interval, $window, $location){
            var isLoad = false;

            var CLIENT_ID;
            var DOMAIN = undefined;
            var SCOPE = 'https://www.googleapis.com/auth/userinfo.email';
            var RESPONSE_TYPE = 'token id_token';

            function load(){
                var deferred = $q.defer();
                if (isLoad == false) {
                    GClient.get().then(function (){
                        $window.gapi.client.load('oauth2', 'v2', function() {
                            isLoad = true;
                            deferred.resolve();
                        });
                    });
                } else {
                    deferred.resolve();
                }
                return deferred.promise;
            }

            function signin(mode, authorizeCallback) {
                function executeSignin(mode, authorizeCallback){
                    var config = {client_id: CLIENT_ID, scope: SCOPE, immediate: false, authuser: -1, response_type: RESPONSE_TYPE};
                    if(mode) {
                        config.user_id = GData.getUserId();
                        config.immediate = true;
                    }
                    if(DOMAIN != undefined)
                        config.hd = DOMAIN;
                    $window.gapi.auth.authorize(config, authorizeCallback);
                }
                
                if(!mode && isLoad === true){
                    // don't break the caller stack with async tasks
                    executeSignin(mode, authorizeCallback);
                } else {
                    load().then(function (){
                        executeSignin(mode, authorizeCallback);
                    });
                }
            }

            function offline() {
                var deferred = $q.defer();
                var origin = $location.protocol() + "//" + $location.hostname();
                if($location.port() != "" || ($location.port() != 443 && $location.protocol()== "https")) {
                    origin = origin + ':' + $location.port();
                }
                var win =  $window.open('https://accounts.google.com/o/oauth2/auth?scope='+encodeURI(SCOPE)+'&redirect_uri=postmessage&response_type=code&client_id='+CLIENT_ID+'&access_type=offline&approval_prompt=force&origin='+origin, null, 'width=800, height=600');

                $window.addEventListener("message", getCode);

                function getCode(event) {
                    if (event.origin === "https://accounts.google.com") {
                        var data = JSON.parse(event.data);
                        $window.removeEventListener("message", getCode);
                        data = gup(data.a[0], 'code');
                        if (data == undefined)
                            deferred.reject();
                        else
                            deferred.resolve(data);

                    }
                }

                function gup(url, name) {
                    name = name.replace(/[[]/,"\[").replace(/[]]/,"\]");
                    var regexS = name+"=([^&#]*)";
                    var regex = new RegExp( regexS );
                    var results = regex.exec( url );
                    if( results == null )
                        return undefined;
                    else
                        return results[1];
                }

                return deferred.promise;
            }

            function getUser() {

                var deferred = $q.defer();
                $window.gapi.client.oauth2.userinfo.get().execute(function(resp) {
                    if (!resp.code) {
                        GData.isLogin(true);
                        GApi.executeCallbacks();
                        if (!resp.name || 0 === resp.name.length)
                            resp.name = resp.email;
                        GData.getUser(resp);
                        deferred.resolve(resp);
                    } else {
                        deferred.reject();
                    }
                });
                return deferred.promise;
            }

            return {

                setClient: function(client) {
                    CLIENT_ID = client;
                },

                setDomain: function(domain) {
                    DOMAIN = domain;
                },

                setScope: function(scope) {
                    SCOPE = scope;
                },
                
                load: load,

                checkAuth: function(){
                    var deferred = $q.defer();
                    signin(true, function() {
                        getUser().then(function (user) {
                            deferred.resolve(user);
                        }, function () {
                            deferred.reject();
                        });
                    });
                    return deferred.promise;
                },

                login: function(){
                    var deferred = $q.defer();
                    signin(false, function() {
                        getUser().then(function (user) {
                            deferred.resolve(user);
                        }, function () {
                            deferred.reject();
                        });
                    });
                    return deferred.promise;
                },

                setToken: function(token){
                    var deferred = $q.defer();
                    load().then(function (){
                        $window.gapi.auth.setToken(token);
                        getUser().then(function () {
                            deferred.resolve();
                        }, function () {
                            deferred.reject();
                        });
                    });
                    return deferred.promise;
                },

                getToken: function(){
                    var deferred = $q.defer();
                    load().then(function (){
                        deferred.resolve($window.gapi.auth.getToken());
                    });
                    return deferred.promise;
                },

                logout: function(){
                    var deferred = $q.defer();
                    load().then(function() {
                        $window.gapi.auth.setToken(null);
                        GData.isLogin(false);
                        GData.getUser(null);
                        deferred.resolve();
                    });
                    return deferred.promise;
                },

                offline: function(){
                    var deferred = $q.defer();
                    offline().then( function(code){
                        deferred.resolve(code);
                    }, function(){
                        deferred.reject();
                    });
                    return deferred.promise;
                },


            }

        }]);
})();
