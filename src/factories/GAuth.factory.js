(function () {
    'use strict';
    angular.module('angular-google-gapi').factory('GAuth', ['$rootScope', '$q', 'GClient', '$interval', '$window',
        function ($rootScope, $q, GClient, $interval, $window) {
            var isLoad = false;
            var isLoading = false;

            var INIT = false;
            var initing = false;

            var IS_LOGIN = false;
            var OBSERVER_CALLBACKS = [];
            var OBSERVER_CALLBACKS_INIT = [];


            function load() {
                var deferred = $q.defer();
                if (isLoad == false) {
                    if(!isLoading) {
                        isLoading = true;
                        GClient.get().then(function () {
                            $window.gapi.load('auth2', function () {
                                isLoad = true;
                                isLoading = false;
                                deferred.resolve();
                                for(var i= 0; i < OBSERVER_CALLBACKS.length; i++){
                                    OBSERVER_CALLBACKS[i].resolve();
                                    console.log('o2');
                                }
                            });
                        });
                    } else {
                        console.log('o');
                        OBSERVER_CALLBACKS.push(deferred);
                    }
                } else {
                    deferred.resolve();
                }
                return deferred.promise;
            }

            function init() {
                var deferred = $q.defer();

                console.log("i");

                if(INIT) {
                    console.log("ok "+GClient.getClient());
                    deferred.resolve($window.gapi.auth2);
                } else {
                    if(initing) {
                        console.log("wait");
                        OBSERVER_CALLBACKS_INIT.push(deferred);
                    } else {
                        initing = true;
                        load().then(function () {
                            console.log(GClient.getClient());
                            var config = {
                                client_id: GClient.getClient(),
                                scope: GClient.getScope(),
                            };
                            if (GClient.getDomain() != undefined) {
                                config.hosted_domain = GClient.getDomain();
                            }
                            $window.gapi.auth2.init(config).then(function () {
                                console.log("o");
                                deferred.resolve($window.gapi.auth2);
                                initing = false;
                                INIT = true;
                                for(var i= 0; i < OBSERVER_CALLBACKS_INIT.length; i++){
                                    OBSERVER_CALLBACKS_INIT[i].resolve($window.gapi.auth2);
                                    console.log("back "+GClient.getClient());
                                }
                            }, function () {
                                deferred.reject();
                                initing = false;
                                INIT = false;
                                for(var i= 0; i < OBSERVER_CALLBACKS_INIT.length; i++){
                                    OBSERVER_CALLBACKS_INIT[i].reject();
                                }
                            });
                        });
                    }
                }
                return deferred.promise;
            }

            function getAuthInstance() {
                console.log("grr");
                var deferred = $q.defer();
                init().then(function (auth2) {
                    console.log(auth2);
                    deferred.resolve(
                        auth2.getAuthInstance()
                    );
                });
                return deferred.promise;
            }

            function signIn() {
                //var deferred = $q.defer();

                getAuthInstance().then(function(auth) {
                    auth.signIn()/*.then(function () {
                        deferred.resolve();
                    }, function () {
                        deferred.reject();
                    });*/
                });

                //return deferred.promise;
            }

            function getUser() {
                var deferred = $q.defer();
                getAuthInstance().then(function (resp) {
                    if (!resp.code) {
                        var profile = resp.currentUser.get().getBasicProfile();
                        var userObj = {
                            email: profile.getEmail(),
                            id: profile.getId(),
                            given_name: profile.getGivenName(),
                            family_name: profile.getFamilyName(),
                            picture: profile.getImageUrl(),
                            name: profile.getName()
                        };
                        deferred.resolve(userObj);
                    } else {
                        deferred.reject();
                    }
                });
                return deferred.promise;
            }

            function isLogin() {
                return IS_LOGIN;
            }

            function signInListener() {
                console.log('ooooo');
                /*getAuthInstance().then(function (instance) {
                    console.log('ooo');
                    instance.isSignedIn.listen(listener);
                });*/
            }

            var listener = function (val) {
                console.log('Signin state changed to ', val);
            };

            return {
                isLogin: isLogin,
                signInListener: signInListener,
                getUser: getUser,
                signIn: signIn,
                init: init
            }

        }]);
})();
