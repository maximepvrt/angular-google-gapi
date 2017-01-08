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