/**
 * An AngularJS module for use all Google Apis and your Google Cloud Endpoints
 * @version 1.0.0-SNAPSHOT
 * @link https://github.com/maximepvrt/angular-google-gapi
 */

angular.module('angular-google-gapi', ['ngCookies'])

angular.module('angular-google-gapi').factory('GClient', ['$document', '$q', '$window',
        function ($document, $q, $window) {

        var LOAD_GAE_API = false;
        var LOADING_GAE_API = false;
        var URL = 'https://apis.google.com/js/client.js?onload=_gapiOnLoad';
        var API_KEY = null;
        var OBSERVER_CALLBACKS  = [];

        function loadScript(src) {
                var deferred = $q.defer();
                $window._gapiOnLoad = function(){
                  deferred.resolve();
                }
                var script = $document[0].createElement('script');
                script.onerror = function (e) {
                    $timeout(function () {
                        deferred.reject(e);
                    });
                };
                script.src = src;
                $document[0].body.appendChild(script);
                return deferred.promise;
        };

        return {

            get: function(){
                var deferred = $q.defer();
                if(LOAD_GAE_API)
                    deferred.resolve();
                else {
                  if(LOADING_GAE_API) {
                    OBSERVER_CALLBACKS.push(deferred);
                  } else {
                    LOADING_GAE_API = true;
                    loadScript(URL).then(function() {
                      $window.gapi.client.setApiKey(API_KEY)
                      LOAD_GAE_API = true;
                      LOADING_GAE_API = false;
                      deferred.resolve();
                      for(var i= 0; i < OBSERVER_CALLBACKS.length; i++){
                        OBSERVER_CALLBACKS[i].resolve();
                      }
                    });
                  }
                }
                return deferred.promise;
            },

            setApiKey: function(apiKey){
                API_KEY = apiKey;
                if(LOAD_GAE_API) {
                    $window.gapi.client.setApiKey(API_KEY);
                }
            },

            getApiKey: function(){
                return API_KEY;
            }

        }

    }]);

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


angular.module('angular-google-gapi').factory('GAuth', ['$rootScope', '$q', 'GClient', 'GApi', 'GData', '$interval', '$cookies', '$window', '$location', '$q',
    function($rootScope, $q, GClient, GApi, GData, $interval, $cookies, $window, $location, $q){
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

            load().then(function (){
              var config = {client_id: CLIENT_ID, scope: SCOPE, immediate: false, authuser: -1, response_type: RESPONSE_TYPE};
              if(mode) {
                config.user_id = $cookies.get('userId');
                config.immediate = true;
              } else {
                config.immediate = false;
              }
              if(DOMAIN != undefined)
                config.hd = DOMAIN;
              $window.gapi.auth.authorize(config, authorizeCallback);
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
                    if (!resp.name || 0 === resp.name.length)
                        user.name = resp.email;
                    else
                        user.name = resp.name;
                    user.link = resp.link;
                    GData.getUser(user);
                    deferred.resolve(user);
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
                        deferred.resolve();
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
            GClient.get().then(function (){
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

        function createRequest(api, method, params) {
            var pathMethod = method.split('.');
            var api = $window.gapi.client[api];
            for(var i= 0; i < pathMethod.length; i++) {
                api = api[pathMethod[i]];
            }
            return api(params);
        }

        function runGapi(api, method, params, deferred) {
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

            load: load,
            createRequest: createRequest,

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
