var controller = angular.module('angular-google-api-example.controller.edit', []);

controller.controller('angular-google-api-example.controller.edit', ['$scope', 'GApi', '$state', '$stateParams',
    function homeCtl($scope, GApi, $state, $stateParams) {
    	GApi.executeAuth('myContactApi', 'contact.get', {'id': $stateParams.id}).then(function(resp) {
            $scope.contact = resp;
        });
    	$scope.submitEdit = function() {
    		GApi.executeAuth('myContactApi', 'contact.update', $scope.contact).then(function(resp) {
            	$state.go('home');
        	});
    	}
    }
]);