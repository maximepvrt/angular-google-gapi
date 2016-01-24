var controller = angular.module('angular-google-api-example.controller.home', []);

controller.controller('angular-google-api-example.controller.home', ['$scope', 'GApi',
    function homeCtl($scope, GApi) {

        GApi.executeAuth('myContactApi', 'contact.all').then(function(resp) {
                $scope.contacts = resp.items;
            });

        $scope.remove = function(contact){
            GApi.executeAuth('myContactApi', 'contact.remove', {'id' : contact.id}).then( function(resp) {
                for(var i= 0; i < $scope.contacts.length; i++){
                    if($scope.contacts[i]['id'] == contact.id) {
                        if (i > -1) {
                            $scope.contacts.splice(i--, 1);
                        }
                    }
                }
            });
        };
    }
]);