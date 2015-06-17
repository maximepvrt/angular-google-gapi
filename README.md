Angular Google GApi
=======================

An AngularJS module for use all Google Apis and your Google Cloud Endpoints (Google App Engine) with OAuth.
This module use [Google APIs Client Library for JavaScript](https://developers.google.com/api-client-library/javascript/), available for all GApis.

## Example

An example is executed here : http://maximepvrt.github.io/angular-google-gapi/

The code is available here : https://github.com/maximepvrt/angular-google-gapi/tree/gh-pages

## Requirements

- [AngularJS](http://angularjs.org)

## Installation
### Add library
This module is available as bower package, install it with this command:

```bash
bower install angular-google-gapi
```
or you may download the [latest release](https://github.com/maximepvrt/angular-google-gapi/releases)

```html
<script type="text/javascript" src="vendors/angular-google-gapi.min.js"></script>
```
### Add dependency

```javascript
var app = angular.module('myModule', ['angular-google-gapi']);
```

## Configuration
### without Google Auth

add run in root module

```javascript
app.run(['GApi', 'GAuth',
    function(GApi, GAuth) {
        var BASE = 'https://myGoogleAppEngine.appspot.com/_ah/api';
        GApi.load('myApiName','v1',BASE);
        GApi.load('calendar','v3'); // for google api (https://developers.google.com/apis-explorer/)
        GAuth.setScope("https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.readonly"); // default scope is only https://www.googleapis.com/auth/userinfo.email
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
      	GApi.execute('youApi', 'you.api.method.name').then( function(resp) {
	    $scope.value = resp;
	}, function() {
		console.log("error :(");
	});
    }
]);
```

### Execute your api with params

```javascript
app.controller('myController', ['$scope', 'GApi',
    function myController($scope, GApi) {
	GApi.execute('youApi', 'you.api.method.name', {parm1: value}).then( function(resp) {
	    $scope.value = resp;
	}, function() {
		console.log("error :(");
	});
    }
]);
```

### Execute your api without params with Google Auth

```javascript
app.controller('myController', ['$scope', 'GApi',
    function myController($scope, GApi) {
      	GApi.executeAuth('youApi', 'you.api.method.name').then( function(resp) {
	    $scope.value = resp;
	}, function() {
		console.log("error :(");
	});
    }
]);
```

### Execute your api with params with Google Auth

```javascript
app.controller('myController', ['$scope', 'GApi',
    function myController($scope, GApi) {
	GApi.executeAuth('youApi', 'you.api.method.name', {parm1: value}).then( function(resp) {
	    $scope.value = resp;
	}, function() {
		console.log("error :(");
	});
    }
]);
```

### Signup with google

```javascript
app.controller('myController', ['$scope', 'GAuth', '$state',
    function myController($scope, GAuth, $state) {
        
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

### Get user info

Get user info after login is very simple.

```javascript
app.controller('myController', ['$rootScope',
    function myController($rootScope) {
        console.log($rootScope.gapi.user)
    }
]);
```

```html
<h1>{{gapi.user.name}}</h1>
```
User object : 
 - user.email
 - user.picture (url)
 - user.id (Google id)
 - user.name (Google account name or email if don't exist)
 - user.link (link to Google+ page)


