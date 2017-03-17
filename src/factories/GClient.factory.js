(function() {
    'use strict';
    angular.module('angular-google-gapi').factory('GClient', ['$document', '$q', '$window',
        function ($document, $q, $window) {

            //logTimer("GClient LOAD Factory");

            var LOAD_GAE_API = false;
            var LOADING_GAE_API = false;
            var URL = 'https://apis.google.com/js/client:platform.js?onload=_gapiOnLoad';
            var API_KEY = null;
            var OBSERVER_CALLBACKS  = [];

            function loadScript(src) {
                
                //logTimer("GClient.loadScript: " + src);

                var deferred = $q.defer();
                $window._gapiOnLoad = function(){
                    deferred.resolve();
                }
                var script = $document[0].createElement('script');

                var a = $document[0].createAttribute("async");
                script.setAttributeNode(a);

                a = $document[0].createAttribute("defer");
                script.setAttributeNode(a);
                

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
                    
                    //logTimer("GClient.get - LOAD_GAE_API:" + LOAD_GAE_API);

                    var deferred = $q.defer();
                    if(LOAD_GAE_API)
                        deferred.resolve();
                    else {
                        if(LOADING_GAE_API) {
                            OBSERVER_CALLBACKS.push(deferred);
                        } else {
                            LOADING_GAE_API = true;

                            //logTimer("GClient.get - URL:" + URL);

                            //logTimer("PREPARE loadScript" + URL);
                            loadScript(URL).then(function() {
                                $window.gapi.client.setApiKey(API_KEY)
                                LOAD_GAE_API = true;
                                LOADING_GAE_API = false;
                                deferred.resolve();
                                //logTimer("FINISHED loadScript" + URL);
                                for(var i= 0; i < OBSERVER_CALLBACKS.length; i++){
                                    OBSERVER_CALLBACKS[i].resolve();
                                }
                            });
                        }
                    }
                    return deferred.promise;
                },

                setApiKey: function(apiKey){
                    //logTimer("GClient.setApiKey: " + apiKey);

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