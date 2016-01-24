(function() {
    'use strict';
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
})();