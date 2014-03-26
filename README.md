# ACS Push Notifications Library

Titanium CommonJS Library to register device for ACS Push Notifications.  Simply add this file to your project and follow the usage instructions below.

## Motivation
Push notifications with Titanium are sometimes a bit esoteric.  With this library I'm simply trying to make it super easy to implement

## Status
This is a work in progress.  So far I have only tested on Android device (and it works). I have not reason to believe it won't work on iOS, but haven't tested yet.

## Requirements
Before you use this library, you need to:

* Make sure your Titanium App is provisioned for Cloud Services.
* Obtain your Google Cloud Messaging credentials and Apple Push Notifications Certificate as explained [here](http://docs.appcelerator.com/titanium/3.0/#!/guide/Push_Notifications)
* Request BlackBerry 10 appId [docs](https://gist.github.com/pec1985/8ad59783cd5b4adc45a2), official support in 3.3.0.GA

## Usage

	// set android-only options
	var androidOptions={
	    focusAppOnPush:false,
	    showAppOnTrayClick:true,
	    showTrayNotification:true,
	    showTrayNotificationsWhenFocused:false,
	    singleCallback:true
	}

	// set blackberry-only options
	var blackberryOptions={
	    appId : "4427-7h6l37627mrr0I3956a74om7643M17l7921",
            ppgUrl : "http://cp4427.pushapi.eval.blackberry.com",
            usePublicPpg : true,
            launchApplicationOnPush : true
	}

	// set cross-platform event
	var onReceive=function(evt){
	    alert('A push notification was received!');
	    console.log('A push notification was received!' + JSON.stringify(evt));
	}

	// set android-only event
	var onLaunched=function(evt){
	    alert('A push notification was received - onLaunched');
	    console.log('A push notification was received!' + JSON.stringify(evt));
	}

	// set android-only event
	var onFocused=function(evt){
	    alert('A push notification was received - onFocused');
	    console.log('A push notification was received!' + JSON.stringify(evt));
	}

	// load library
	var ACSP=require('acspush');
	
	// create instance with your own or the user's username and password
	var ACSPush=new ACSP.ACSPush('your_acs_admin_uid','your_acs_admin_pwd');
	
	// or make it as guest
	//var ACSPush=new ACSP.ACSPush('your_acs_admin_uid','your_acs_admin_pwd');
	
	// set the channel to subscribe to
	var channel='All users';
	
	// register this device
	ACSPush.registerDevice(channel,onReceive,onLaunched,onFocused,androidOptions,blackberryOptions);


## Credits
This module is based on code by my buddy [Pablo Rodríguez](https://github.com/pablorr18), now with some additional sugar and converted into a reusable CommonJS Module.

BlackBerry 10 support by [Hazem Khaled](http://github.com/hazemkhaled)

## License
Licensed under the terms of the [MIT License](alco.mit-license.org)
