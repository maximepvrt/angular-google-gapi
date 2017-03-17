(function() {
    'use strict';
    angular.module('angular-google-gapi').factory('GAuth', ['$q', 'GClient', '$window', '$localstorage',
        function($q, GClient, $window, $localstorage){

            var isLoad = false;
            var CLIENT_ID;
            var DOMAIN = undefined;
            var SCOPE = '';
            var RESPONSE_TYPE = 'token id_token';
            var gapiauth2GoogleAuth = null;

            function load(){
                //logt("GAuth.load function");
                var deferred = $q.defer();
                if (isLoad == false) {
                    GClient.get().then(function (){
                      logt("GClient.get().then");  
                      $window.gapi.load('auth2', function() {
                            logt("auth2 loaded");  
                            isLoad = true;
                            deferred.resolve();                                                
                        });
                    }).catch(function (resp){
                        //logTimer(resp);
                        deferred.reject();
                    });
                } 
                else {
                    deferred.resolve();
                }
                return deferred.promise;
            }

            function signin(mode, authorizeCallback) {

                //logTimer("GAuth.signin: " + mode);

                function executeSignin(mode, authorizeCallback){

                    //logTimer("GAuth.executeSignin: " + mode);

                    if (gapiauth2GoogleAuth){
                        if (gapiauth2GoogleAuth.isSignedIn.get() == true) {
                            //logTimer("GAuth.executeSignin RESOLVED! ARRIBA");                                
                            //resp.signIn().then(authorizeCallback);
                            authorizeCallback();
                        }
                        else{
                            //logTimer("GAuth.executeSignin RESOLVED! ABAJO");
                            gapiauth2GoogleAuth.signIn({prompt: 'select_account'}).then(authorizeCallback);    
                        }
                    }
                    else{

                        $window.gapi.auth2.init({
                          client_id: CLIENT_ID,
                          fetch_basic_profile: false,
                          scope: SCOPE,
                          authuser: -1,
                          immediate: false
                          }).then(function (resp) {

                                gapiauth2GoogleAuth = resp;

                                if (gapiauth2GoogleAuth.isSignedIn.get() == true) {
                                    //logTimer("GAuth.executeSignin RESOLVED! ARRIBA");                                
                                    //resp.signIn().then(authorizeCallback);
                                    authorizeCallback();
                                }
                                else{
                                    //logTimer("GAuth.executeSignin RESOLVED! ABAJO");
                                    gapiauth2GoogleAuth.signIn({prompt: 'select_account'}).then(authorizeCallback);    
                                }
                          });
                    }
                }
                
                if(!mode && isLoad === true){
                    // don't break the caller stack with async tasks
                    executeSignin(mode, authorizeCallback);
                } else {
                    load().then(function (){
                        executeSignin(mode, authorizeCallback);
                    });
                }
            }

            function offline() {
                /*
                var deferred = $q.defer();
                var origin = $location.protocol() + "//" + $location.hostname();
                if($location.port() != "" || ($location.port() != 443 && $location.protocol()== "https")) {
                    origin = origin + ':' + $location.port();
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
                */
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
                
                load: load,

                checkAuth: function(){

                    logt("GAuth.checkAuth");
                    var deferred = $q.defer();
                    load().then(function (){
                          $window.gapi.auth2.init({
                              client_id: CLIENT_ID,
                              fetch_basic_profile: false,
                              scope: SCOPE,
                              authuser: -1,
                              immediate: false
                          }).then(function (resp) {
                                gapiauth2GoogleAuth = resp;
                                if (resp.isSignedIn.get() == true) {
                                    deferred.resolve();
                                }
                                else{
                                    deferred.reject();
                                }
                          });
                      });

                    return deferred.promise;
                },

                login: function(){
                    var deferred = $q.defer();
                    signin(false, function() {
                        deferred.resolve();
                    });
                    return deferred.promise;
                },

                getToken: function(){
                    var deferred = $q.defer();
                    load().then(function (){
                            deferred.resolve(gapiauth2GoogleAuth.currentUser.get().getAuthResponse().access_token);
                        });
                    return deferred.promise;
                },

                logout: function(){
                    var deferred = $q.defer();
                    load().then(function() {
                        gapiauth2GoogleAuth.signOut().then(function() {                            
                            deferred.resolve();
                        });                         
                    });
                    return deferred.promise;
                },

                grant: function(scopes){
                    var deferred = $q.defer();

                    gapiauth2GoogleAuth.currentUser.get().grant({'scope': scopes}).then(
                        function(success){
                          deferred.resolve();
                        },
                        function(fail){
                          deferred.reject();
                        });
                    
                    return deferred.promise;
                },                

                offline: function(){
                    /*
                    var deferred = $q.defer();
                    offline().then( function(code){
                        deferred.resolve(code);
                    }, function(){
                        deferred.reject();
                    });
                    return deferred.promise;
                    */
                },

                isSignedIn: function(){
                    return gapiauth2GoogleAuth.isSignedIn.get();
                },
            }
        }]);
})();