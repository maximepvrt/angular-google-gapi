/**
 * An AngularJS module for use all Google Apis and your Google Cloud Endpoints
 * @version v0.1.2
 * @link https://github.com/maximepvrt/angular-google-gapi
 */

angular.module('angular-google-gapi', [])

angular.module('angular-google-gapi').factory('GClient', ['$document', '$q', '$timeout', '$interval', '$window',
        function ($document, $q, $timeout, $interval, $window) {

        var LOAD_GAE_API = false;
        var URL = 'https://apis.google.com/js/client.js';

        function loadScript(src) {
                var deferred = $q.defer();
                var script = $document[0].createElement('script');
                script.onload = function (e) {
                    $timeout(function () {
                        deferred.resolve(e);
                    });
                };
                script.onerror = function (e) {
                    $timeout(function () {
                        deferred.reject(e);
                    });
                };
                script.src = src;
                $document[0].body.appendChild(script);
                return deferred.promise;
        };

        function load(callback) {
                loadScript(URL).then(function() {
                    var isok = function(callback) {
                        if($window.gapi.client != undefined) {
                            callback();
                            $interval.cancel(check);
                        }
                    }
                    isok(callback);
                    var check = $interval(function() {
                        isok(callback);
                    }, 10);
                    LOAD_GAE_API = true;
                });
        }

        return {

            get: function(callback){
                if(LOAD_GAE_API)
                    callback();
                else
                    load(callback);

            }

        }

    }]);

angular.module('angular-google-gapi').factory('GData', ['$rootScope',
        function ($rootScope) {

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
                $rootScope.gapi.user = value;
            }

        }

    }]);


angular.module('angular-google-gapi').factory('GAuth', ['$rootScope', '$q', 'GClient', 'GApi', 'GData', '$interval', '$window', '$location',
    function($rootScope, $q, GClient, GApi, GData, $interval, $window){
        var isLoad = false;

        var CLIENT_ID;
        var SCOPE = 'https://www.googleapis.com/auth/userinfo.email';
        var RESPONSE_TYPE = 'token id_token';

        function load(callback){
             if (isLoad == false) {
                 var args = arguments.length;
                 GClient.get(function (){
                    $window.gapi.client.load('oauth2', 'v2', function() {
                         isLoad = true;
                         if (args == 1)
                             callback();
                     });
                 });
             } else {
                 callback();
             }

         }

        function signin(mode, authorizeCallback) {
            load(function (){
                $window.gapi.auth.authorize({client_id: CLIENT_ID, scope: SCOPE, immediate: mode, response_type : RESPONSE_TYPE}, authorizeCallback);
            });
        }

        function offline() {
            var deferred = $q.defer();
            var origin = $location.protocol + "//" + $location.hostname;
            if($location.port != "") {
                origin = origin + ':' + $location.port;
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
                    var user = {};
                    user.email = resp.email;
                    user.picture = resp.picture;
                    user.id = resp.id;
                    if (resp.name == undefined)
                        user.name = resp.email;
                    else
                        user.name = resp.name;
                    user.link = resp.link;
                    GData.getUser(user);
                    deferred.resolve();
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

            setScope: function(scope) {
                SCOPE = scope;
            },

            load: function(callback){
                var args = arguments.length;
                GClient.get(function (){
                    $window.gapi.client.load('oauth2', 'v2', function() {
                        if (args == 1)
                            callback();
                    });
                });

            },

            checkAuth: function(){
                var deferred = $q.defer();
                signin(true, function() {
                    getUser().then(function () {
                        deferred.resolve();
                    }, function () {
                        deferred.reject();
                    });
                });
                return deferred.promise;
            },

            login: function(){
                var deferred = $q.defer();
                signin(false, function() {
                    getUser().then(function () {
                        deferred.resolve();
                    }, function () {
                        deferred.reject();
                    });
                });
                return deferred.promise;
            },

            setToken: function(token){
                var deferred = $q.defer();
                load(function (){
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
                load(function (){
                    deferred.resolve($window.gapi.auth.getToken());
                });
                return deferred.promise;
            },

            logout: function(){
                var deferred = $q.defer();
                load(function() {
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

angular.module('angular-google-gapi').factory('GApi', ['$q', 'GClient', 'GData', '$window',
    function($q, GClient, GData, $window){

        var apisLoad  = [];

        var observerCallbacks = [];

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
            GClient.get(function (){
                $window.gapi.client.load(api, version, function() {
                    console.log(api+" "+version+" api loaded");
                    apisLoad.push(api);
                    executeCallbacks(api);
                }, url)
            });
        }

        function executeCallbacks(api){
            var apiName = api;

            for(var i= 0; i < observerCallbacks.length; i++){
              var observerCallback = observerCallbacks[i];
              if ((observerCallback.api == apiName || observerCallback.apiLoad) && (observerCallback.auth == false || GData.isLogin() == true)) {
                  runGapi(observerCallback.api, observerCallback.method, observerCallback.params, observerCallback.deferred);
                  if (i > -1) {
                      observerCallbacks.splice(i--, 1);
                  }
              } else {
                  if (observerCallback.api == apiName)
                      observerCallbacks[i]['apiLoad'] = true;
              }
            };

        }

        function runGapi(api, method, params, deferred) {

            var pathMethod = method.split('.');
            var api = $window.gapi.client[api];
            for(var i= 0; i < pathMethod.length; i++) {
                api = api[pathMethod[i]];
            }
            api(params).execute(function (response) {
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
                runGapi(api, method, params, deferred);
            }
            else
                registerObserverCallback(api, method, params, auth, deferred);
            return deferred.promise;
        }

        return {

            executeCallbacks : function() {
                executeCallbacks();
            },

            load: function(name, version, url){
                load(name, version, url);
            },

            execute: function(api, method, params){
                if(arguments.length == 3)
                    return execute(api, method, params, false);
                if(arguments.length == 2)
                    return execute(api, method, null, false);
            },

            executeAuth: function(api, method, params){
                if(arguments.length == 3)
                    return execute(api, method, params, true);
                if(arguments.length == 2)
                    return execute(api, method, null, true);
            },
        }
    }]);
