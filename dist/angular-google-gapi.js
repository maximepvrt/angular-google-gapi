/**
 * An AngularJS module for use all Google Apis and your Google Cloud Endpoints
 * @version 1.1.0
 * @link https://github.com/maximepvrt/angular-google-gapi
 */

(function() {
    'use strict';
    angular.module('angular-google-gapi', []);
})();
(function() {
    'use strict';
    angular.module('angular-google-gapi').factory('GApi', ['$q', 'GClient', 'GAuth', '$window',
        function($q, GClient, GAuth, $window){

            var apisLoad  = [];
            var observerCallbacks = [];
            var firstAuthExecute = true;

            function registerObserverCallback(api, method, params, auth, deferred){
                var observerCallback = {};
                observerCallback.api = api;
                observerCallback.apiLoad = false;
                observerCallback.method = method;
                observerCallback.params = params;
                observerCallback.auth = auth;
                observerCallback.deferred = deferred;
                observerCallbacks.push(observerCallback);
            };

            function load(api, version, url) {
                var deferred = $q.defer();
                GClient.get().then(function (){
                    $window.gapi.client.load(api, version, undefined, url).then(function(response) {
                        var result = {'api': api, 'version': version, 'url': url};
                        if(response && response.hasOwnProperty('error')) {
                            console.log('impossible to load ' + api + ' ' + version);
                            deferred.reject(result);
                        } else {
                            deferred.resolve(result);
                            apisLoad.push(api);
                            executeCallbacks(api);
                        }
                    });
                });
                return deferred.promise;
            }

            function executeCallbacks(api){
                var apiName = api;

                for(var i= 0; i < observerCallbacks.length; i++){
                    var observerCallback = observerCallbacks[i];
                    if ((observerCallback.api == apiName || observerCallback.apiLoad) && (observerCallback.auth == false || GAuth.isLogin())) {
                        runGApi(observerCallback.api, observerCallback.method, observerCallback.params, observerCallback.deferred);
                        if (i > -1) {
                            observerCallbacks.splice(i--, 1);
                        }
                    } else {
                        if (observerCallback.api == apiName)
                            observerCallbacks[i]['apiLoad'] = true;
                    }
                };

            }

            function createRequest(api, method, params) {
                var pathMethod = method.split('.');
                var api = $window.gapi.client[api];
                for(var i= 0; i < pathMethod.length; i++) {
                    api = api[pathMethod[i]];
                }
                return api(params);
            }

            function runGApi(api, method, params, deferred) {
                createRequest(api, method, params).execute(function (response) {
                    if (response.error) {
                        deferred.reject(response);
                    } else {
                        deferred.resolve(response);
                    }
                });
            }

            function execute(api, method, params, auth) {
                var deferred = $q.defer();
                if (apisLoad.indexOf(api) > -1) {
                    runGApi(api, method, params, deferred);
                } else {
                    registerObserverCallback(api, method, params, auth, deferred);
                }
                return deferred.promise;
            }

             function retryExecute(actionPromise, args) {
                 var queryResults = $q.defer();
                 var iter = 0;
                 retry(actionPromise, iter);
                 function retry(actionPromise, iter) {
                     actionPromise.apply(this, args).then(function(body) {
                         queryResults.resolve(body);
                     }).catch(function(error){
                         if((error.code == 403 && error.message.toLowerCase().indexOf('limit exceeded')>-1) || error.code == 503){
                             var base = 2;
                             var ms = 1000;
                             var randomMilliseconds = Math.floor((Math.random() * 1000) + 1);
                             if(iter < 5){
                                 setTimeout(function(){
                                     retry(actionPromise, ++iter);
                                 }, (ms * Math.pow(base, iter)) + randomMilliseconds);
                             }
                             else{
                                 queryResults.reject(error);
                             }
                         }
                         else{
                             queryResults.reject(error);
                         }
                     });
                 }
                 return queryResults.promise;
             }


            return {

                executeCallbacks : function() {
                    executeCallbacks();
                },

                load: load,
                createRequest: createRequest,

                execute: function(api, method, params){
                    if(arguments.length == 3)
                        return execute(api, method, params, false);
                    if(arguments.length == 2)
                        return execute(api, method, null, false);
                },

                executeAuth: function(api, method, params){
                    if(firstAuthExecute) {
                        console.log('test');
                        GAuth.signInListener(/*function () {
                            console.log('ok');
                            executeCallbacks();
                        }*/);
                        firstAuthExecute = false;
                    }
                    if(arguments.length == 3)
                        return retryExecute(execute, arguments); //return execute(api, method, params, true)
                    if(arguments.length == 2)
                        return retryExecute(execute, arguments); //return execute(api, method, null, true)
                },
            }
        }]);
})();
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

(function() {
    'use strict';
    angular.module('angular-google-gapi').factory('GClient', ['$document', '$q', '$window', '$timeout',
        function ($document, $q, $window, $timeout) {

            var LOAD_GAE_API = false;
            var LOADING_GAE_API = false;
            
            var URL = 'https://apis.google.com/js/client:platform.js?onload=_gapiOnLoad';
            var OBSERVER_CALLBACKS  = [];

            var CLIENT_ID;
            var API_KEY = null;
            var DOMAIN = undefined;
            var SCOPE = ['https://www.googleapis.com/auth/userinfo.email'];

            function loadScript(src) {
                var deferred = $q.defer();
                $window._gapiOnLoad = function(){
                    deferred.resolve();
                };
                var script = $document[0].createElement('script');
                script.onerror = function (e) {
                    $timeout(function () {
                        deferred.reject(e);
                    });
                };
                script.src = src;
                $document[0].body.appendChild(script);
                return deferred.promise;
            }

            function get(){
                var deferred = $q.defer();
                if(LOAD_GAE_API)
                    deferred.resolve();
                else {
                    if(LOADING_GAE_API) {
                        OBSERVER_CALLBACKS.push(deferred);
                    } else {
                        LOADING_GAE_API = true;
                        loadScript(URL).then(function() {
                            LOAD_GAE_API = true;
                            LOADING_GAE_API = false;
                            //TODO add Config API Key
                            deferred.resolve();
                            for(var i= 0; i < OBSERVER_CALLBACKS.length; i++){
                                OBSERVER_CALLBACKS[i].resolve();
                            }
                        });
                    }
                }
                return deferred.promise;
            }

            return {

                get: get,

                setClient: function(client) {
                    CLIENT_ID = client;
                },

                getClient: function () {
                    return CLIENT_ID;
                },

                setDomain: function(domain) {
                    DOMAIN = domain;
                },

                getDomain: function() {
                    return DOMAIN;
                },

                setScope: function(scope) {
                    SCOPE = scope;
                },

                getScope: function() {
                    return SCOPE;
                }

            }

        }]);
})();
(function () {
    'use strict';
    angular.module('angular-google-gapi')
        .directive('googleSignIn', ['$window', 'GAuth', function($window, GAuth) {
            return {
                restrict: 'E',
                template:'<div id="g-signin2"></div>',
                replace:false,
                link:function(scope, el, attrs){
                    GAuth.init().then(function () {
                        $window.gapi.signin2.render('g-signin2', {
                            'width': attrs.width || 250,
                            'height': attrs.height || 50,
                            'longtitle': attrs.longtitle==='false'?false:true,
                            'theme': attrs.theme || 'light'
                        });
                    });
                }
            };
        }]);
})();
