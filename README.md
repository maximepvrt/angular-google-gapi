Angular Cloud Endpoints
=======================

An AngularJS module for use Google Cloud Endpoints.

## Requirements

- ([AngularJS](http://angularjs.org))

## Installation
### Loading
Load the script files in your application:

```html
<script type="text/javascript" src="vendors/angular-cloud-endpoints-0.1.js"></script>
```

add dependencies on AngularJS:

```javascript
var app = angular.module('myModule', ['angular-cloud-endpoints']);
```

## Configuration
### without Google Auth

add run in root module

```javascript
app.run(['GApi',
    function(GApi) {
        var BASE = 'https://myGoogleAppEngine.appspot.com/_ah/api';
        GApi.load('myApiName','v1',BASE);
    }
]);
```
### with Google Auth

add run in root module

```javascript
app.run(['GAuth', 'GApi', '$state',
    function(GAuth, GApi, $state) {

        var CLIENT = 'yourGoogleAuthAPIKey';
        var BASE = 'https://myGoogleAppEngine.appspot.com/_ah/api';

        GAuth.setClient(CLIENT);
        GAuth.setLoginSuccess(function() {
            $state.go('webapp.home');  // an example of action if it's possible to
                                       // authenticate user at startup of the application
        });
        GAuth.setLoginFail(function() {
            $state.go('webapp.login'); // an example of action if it's impossible to
                                       // authenticate user at startup of the application
        });
        GAuth.load(function () {
            GAuth.login(function () {
                GApi.load('myApiName','v1',BASE);
            });
        });
    }
```

## Use

### Execute your api without params

```javascript
app.controller('myController', ['$scope', 'GApi',
    function clientList($scope, GAuth) {
      GApi.get('you.api.method.name', function(resp) {
			  $scope.value = resp;
        $scope.$apply($scope.value);
		  });
    }
]);
```

### Execute your api with params

```javascript
app.controller('myController', ['$scope', 'GApi',
    function clientList($scope, GAuth) {
      GApi.get('you.api.method.name', {alarmClockId: $localStorage.alarmClockId}, function(resp) {
			  $scope.value = resp;
        $scope.$apply($scope.value);
		  });
    }
]);
```

### Signup with google

```javascript
app.controller('myController', ['$scope', 'GAuth', '$state',
    function clientList($scope, GAuth, $state) {
        
      $scope.doSingup = function() {
        GAuth.signin(function(){
          $state.go('webapp.home'); // action after the user have validated that
                                    // your application can access their Google account.
        });
      };
    }
]);
```
