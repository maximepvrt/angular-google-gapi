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