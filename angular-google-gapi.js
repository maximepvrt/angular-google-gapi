var module = angular.module('angular-google-gapi', []);

module.factory('GClient', ['$document', '$q', '$timeout', '$interval',
        function ($document, $q, $timeout, $interval) {

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

        function load(calback) {
                loadScript(URL).then(function() {
                    var isok = function(calback) {
                        if(gapi.client != undefined) {
                            LOAD_GAE_API = true;
                            calback();
                            $interval.cancel(check);
                        }
                    }
                    isok(calback);
                    var check = $interval(function() {
                        isok(calback);
                    }, 10);
                    LOAD_GAE_API = true;
                    
                });
        }

        return {

            get: function(calback){
                if(LOAD_GAE_API)
                    calback();
                else
                    load(calback);

            }

        }

    }]);


module.factory('GAuth', ['$rootScope', '$q', 'GClient', 'GApi', '$interval',
    function($rootScope, $q, GClient, GApi, $interval){
        var isLoad = false;

        var CLIENT_ID;
        var SCOPES = 'https://www.googleapis.com/auth/userinfo.email';
        var RESPONSE_TYPE = 'token id_token';

        function load(calback){
                if (isLoad == false) {
                    var args = arguments.length;
                    GClient.get(function (){
                       gapi.client.load('oauth2', 'v2', function() {
                            isLoad = true;
                            if (args == 1)
                                calback();
                        });
                    });
                } else {
                    calback();
                }  

            }

        function signin(mode, authorizeCallback) {
            load(function (){
                gapi.auth.authorize({client_id: CLIENT_ID, scope: SCOPES, immediate: mode, response_type : RESPONSE_TYPE}, authorizeCallback);
            });
        }

        function offline() {

            var deferred = $q.defer();
            var origin = window.location.protocol + "//" + window.location.hostname;
            console.log(window.location.port);
            if(window.location.port != "") {
                origin = origin + ':' + window.location.port;
            }
            var win =  window.open('https://accounts.google.com/o/oauth2/auth?scope='+encodeURI(SCOPES)+'&redirect_uri=postmessage&response_type=code&client_id='+CLIENT_ID+'&access_type=offline&approval_prompt=force&origin='+origin, null, 'width=800, height=600'); 

            window.addEventListener("message", getCode);

            

            function getCode(event) {
                if (event.origin === "https://accounts.google.com") {
                    var data = JSON.parse(event.data);
                    window.removeEventListener("message", getCode);
                    data = gup(data.a[0], 'code');
                    if (data == undefined)
                        deferred.reject();
                    else
                        deferred.resolve();

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
            gapi.client.oauth2.userinfo.get().execute(function(resp) {
                if (!resp.code) {
                    GApi.isLogin(true);
                    GApi.executeCallbacks();
                    $rootScope.user = {};
                    $rootScope.user.email = resp.email;
                    $rootScope.user.picture = resp.picture;
                    $rootScope.user.id = resp.id;
                    if (resp.name == undefined)
                        $rootScope.user.name = resp.email;
                    else
                        $rootScope.user.name = resp.name;
                    $rootScope.user.link = resp.link;
                    $rootScope.$apply($rootScope.user);
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

            setScopes: function(scopes) {
                SCOPES = scopes;
            },

            load: function(calback){
                var args = arguments.length;
                GClient.get(function (){
                    gapi.client.load('oauth2', 'v2', function() {
                        if (args == 1)
                            calback();
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

            logout: function(){
                var deferred = $q.defer();
                load(function() {
                    gapi.auth.setToken(null);
                    GApi.isLogin(false);
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

module.factory('GApi', ['$q', 'GClient',
    function($q, GClient){

        var isLogin = false;
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
            gapi.client.load(api, version, function() {
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
                    if ((observerCallback.api == apiName || observerCallback.apiLoad) && (observerCallback.auth == false || isLogin == true)) {
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
            var api = gapi.client[api];
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

            isLogin : function(value) {
                if(arguments.length == 0)
                    return isLogin;
                isLogin = value;
            },

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