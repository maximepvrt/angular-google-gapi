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
