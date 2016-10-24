Angular Google GApi
=======================
[![Travis](https://img.shields.io/travis/maximepvrt/angular-google-gapi.svg)](https://travis-ci.org/maximepvrt/angular-google-gapi)
[![David](https://img.shields.io/david/maximepvrt/angular-google-gapi.svg)]()
[![npm](https://img.shields.io/npm/v/angular-google-gapi.svg)](https://www.npmjs.com/package/angular-google-gapi) [![Bower](https://img.shields.io/bower/v/angular-google-gapi.svg)](http://bower.io/search/?q=angular-google-gapi)

An AngularJS module for using all Google Apis and your Google Cloud Endpoints (Google App Engine) with OAuth.
This module uses [Google APIs Client Library for JavaScript](https://developers.google.com/api-client-library/javascript/), available for all GApis.

## Example

[Demo](http://maximepvrt.github.io/angular-google-gapi/)

[Code](https://github.com/maximepvrt/angular-google-gapi/tree/gh-pages)

## Requirements

- [Angular.js](http://angularjs.org)

## Installation
### Add library
This module is available as `bower` package, install it with this command:

```bash
$ bower install --save angular-google-gapi
```

it's also available as a `npm` package, install it with this command:

```bash
$ npm install --save angular-google-gapi
```

or you may download the [latest release](https://github.com/maximepvrt/angular-google-gapi/releases)

```html
<script type="text/javascript" src="/angular-google-gapi/dist/angular-google-gapi.min.js"></script>
```
### Add dependency

```javascript
var app = angular.module('myModule', ['angular-google-gapi']);
```

## Configuration
### without Google Auth

add `run()` in root module

```javascript
app.run(['GApi', 'GAuth',
    function(GApi, GAuth) {
        var BASE = 'https://myGoogleAppEngine.appspot.com/_ah/api';
        GApi.load('myApiName', 'v1', BASE).then(function(resp) {
            console.log('api: ' + resp.api + ', version: ' + resp.version + ' loaded');
        }, function(resp) {
            console.log('an error occured during loading api: ' + resp.api + ', resp.version: ' + version);
        });
    }
]);
```
### with Google Auth

add `run()` in root module

```javascript
app.run(['GAuth', 'GApi', 'GData', '$state', '$rootScope',
    function(GAuth, GApi, GData, $state, $rootScope) {

        $rootScope.gdata = GData;

        var CLIENT = 'yourGoogleAuthAPIKey';
        var BASE = 'https://myGoogleAppEngine.appspot.com/_ah/api';

        GApi.load('myApiName','v1',BASE);
        GApi.load('calendar','v3'); // for google api (https://developers.google.com/apis-explorer/)

        GAuth.setClient(CLIENT)
        // default scope is only https://www.googleapis.com/auth/userinfo.email
        GAuth.setScope('https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.readonly');

        // load the auth api so that it doesn't have to be loaded asynchronously
        // when the user clicks the 'login' button.
        // That would lead to popup blockers blocking the auth window
        GAuth.load();

        // or just call checkAuth, which in turn does load the oauth api.
        // if you do that, GAuth.load(); is unnecessary
        GAuth.checkAuth().then(
            function (user) {
                console.log(user.name + ' is logged in');
                $state.go('webapp.home'); // an example of action if it's possible to
                			  	        // authenticate user at startup of the application
            },
            function() {
		        $state.go('login'); // an example of action if it's impossible to
					  	          // authenticate user at startup of the application
            }
        );
    }
]);
```

### `GApi.load` Error handling

 ```javascript
GApi.load('myApiName', 'v1', BASE)
    .catch(function(api, version) {
        console.log('an error occured during loading api: ' + api + ', version: ' + version);
    });
```

## Usage

### Execute your api without params

```javascript
app.controller('myController', ['$scope', 'GApi',
    function myController($scope, GApi) {
        GApi.execute('youApi', 'you.api.method.name').then(function(resp) {
            $scope.value = resp;
        }, function() {
            console.log('error :(');
        });
    }
]);
```

### Execute your api with params

```javascript
app.controller('myController', ['$scope', 'GApi',
    function myController($scope, GApi) {
        GApi.execute('youApi', 'you.api.method.name', {param: value}).then(function(resp) {
            $scope.value = resp;
        }, function() {
            console.log('error :(');
        });
    }
]);
```

### Execute your api without params with Google Auth

```javascript
app.controller('myController', ['$scope', 'GApi',
    function myController($scope, GApi) {
         GApi.executeAuth('youApi', 'you.api.method.name').then(function(resp) {
            $scope.value = resp;
        }, function() {
            console.log('error :(');
        });
    }
]);
```

### Execute your api with params with Google Auth

```javascript
app.controller('myController', ['$scope', 'GApi',
    function myController($scope, GApi) {
        GApi.executeAuth('youApi', 'you.api.method.name', {param: value}).then(function(resp) {
            $scope.value = resp;
        }, function() {
            console.log('error :(');
        });
    }
]);
```

### Signup with Google

The login should be triggered by a user action, or you might run into issues with popup blockers. More information about this can be found in the [Google APIs Client Library Documentation](https://developers.google.com/api-client-library/javascript/features/authentication#specifying-your-client-id-and-scopes).

```javascript
app.controller('myController', ['$scope', 'GAuth', '$state',
    function myController($scope, GAuth, $state) {
        $scope.doSignup = function() {
            GAuth.login().then(function(user) {
                console.log(user.name + ' is logged in');
                $state.go('webapp.home'); // action after the user have validated that
        				                  // your application can access their Google account
            }, function() {
                console.log('login failed');
            });
        };
    }
]);
```

### Get user info

Get user info after login is very simple

```javascript
app.controller('myController', ['$rootScope',
    function myController($rootScope) {
        console.log($rootScope.gdata.getUser().name);
    }
]);
```

```html
<h1>{{gdata.getUser().name}}</h1>
```

User object:
 - `email`
 - `picture` (url)
 - `id` (Google id)
 - `name` (Google account name or email if don't exist)
 - `link` (link to Google+ page)

## Development

`gulp` is used to minify `angular-google-gapi.js` (using Uglify). Execute `npm install` (requires `Node.js` and `npm`) to install the required packages.

Run `gulp` to generate a minified version (`angular-google-gapi.min.js`). Note that this requires `gulp` to be installed globally (via `npm install -g gulp`).
