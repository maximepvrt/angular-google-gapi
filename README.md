Angular Google GApi
=======================

An AngularJS module for use all Google Apis and your Google Cloud Endpoints.

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
var app = angular.module('myModule', ['angular-google-gapi']);
```

## Configuration
### without Google Auth

add run in root module

```javascript
app.run(['GApi',
    function(GApi) {
        var BASE = 'https://myGoogleAppEngine.appspot.com/_ah/api';
        GApi.load('myApiName','v1',BASE);
        GApi.load('calendar','v3'); // for google api (https://developers.google.com/apis-explorer/)
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

	GApi.load('myApiName','v1',BASE);

        GAuth.setClient(CLIENT);
        
        GAuth.checkAuth().then(
            function () {
                $state.go('webapp.home'); // an example of action if it's possible to
                			  // authenticate user at startup of the application
            },
            function() {
		$state.go('login');       // an example of action if it's impossible to
					  // authenticate user at startup of the application
            }
        );
        
    }
```

## Use

### Execute your api without params

```javascript
app.controller('myController', ['$scope', 'GApi',
    function myController($scope, GApi) {
      	GApi.execute('youApi', 'you.api.method.name', function(resp) {
	    $scope.value = resp;
	});
    }
]);
```

### Execute your api with params

```javascript
app.controller('myController', ['$scope', 'GApi',
    function myController($scope, GApi) {
	GApi.execute('youApi', 'you.api.method.name', {parm1: value}, function(resp) {
	    $scope.value = resp;
	});
    }
]);
```

### Execute your api without params with Google Auth

```javascript
app.controller('myController', ['$scope', 'GApi',
    function myController($scope, GApi) {
      	GApi.executeAuth('youApi', 'you.api.method.name', function(resp) {
	    $scope.value = resp;
	});
    }
]);
```

### Execute your api with params with Google Auth

```javascript
app.controller('myController', ['$scope', 'GApi',
    function myController($scope, GApi) {
	GApi.executeAuth('youApi', 'you.api.method.name', {parm1: value}, function(resp) {
	    $scope.value = resp;
	});
    }
]);
```

### Signup with google

```javascript
app.controller('myController', ['$scope', 'GAuth', '$state',
    function clientList($scope, GAuth, $state) {
        
	$scope.doSingup = function() {
      	    GAuth.login().then(function(){
        	$state.go('webapp.home'); // action after the user have validated that
        				  // your application can access their Google account.
            }, function() {
            	console.log('login fail');
            });
      };
    }
]);
```
