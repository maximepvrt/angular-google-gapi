var controller = angular.module('angular-google-api-example.controller.home', []);

controller.controller('angular-google-api-example.controller.home', ['$scope', 'GApi',
    function homeCtl($scope, GApi) {

        GApi.executeAuth('myContactApi', 'greetings.authed').then(function(resp) {
                $scope.name = resp.message;
            });
    }
]);