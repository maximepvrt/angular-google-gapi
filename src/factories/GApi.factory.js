(function() {
    'use strict';
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
                var deferred = $q.defer();
                GClient.get().then(function (){
                    $window.gapi.client.load(api, version, undefined, url).then(function(response) {
                        var result = {'api': api, 'version': version, 'url': url};
                        if(response && response.hasOwnProperty('error')) {
                            console.log(version);
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
})();