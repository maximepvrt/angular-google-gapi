var controller = angular.module('angular-google-api-example.controller.login', []);

controller.controller('angular-google-api-example.controller.login', ['$scope', 'GAuth', 'GData', '$state',
    function clientList($scope, GAuth, GData, $state) {
    	if(GData.isLogin()){
    		$state.go('home');
    	}

        $scope.doLogin = function() {
            GAuth.login().then(function(){
            	$state.go('home');
            });
        };
    }
])