# ACS Push Notifications Library

Titanium CommonJS Library to register device for ACS Push Notifications.  Simply add this file to your project and follow the usage instructions below.

## Motivation
Push notifications with Titanium is sometimes a bit esoteric.  With this library I'm simply trying to make it super easy.

## Status
This is a work in progress.  So far I have only tested on Android device (and it works).  I have not reason to believe it won't work on iOS, but haven't tested yet.

## Requirements
Before you use this library, you need to:

* Make sure your Titanium App is provisioned for Cloud Services.
* Obtain your Google Cloud Messaging credentials and Apple Push Notifications Certificate as explined [here](http://docs.appcelerator.com/titanium/3.0/#!/guide/Push_Notifications)

## Usage

	// set android-only options
	var androidOptions={
	    focusAppOnPush:false,
	    showAppOnTrayClick:true,
	    showTrayNotification:true,
	    showTrayNotificationsWhenFocused:false,
	    singleCallback:true
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
	
	// set the channel to subscribe to
	var channel='All users';
	
	// register this device
	ACSPush.registerDevice(channel,onReceive,onLaunched,onFocused,androidOptions);


## Credits
This module is based on code by my buddy [Pablo Rodríguez](https://github.com/pablorr18), now with some additional sugar converted into a reusable CommonJS Module.

## License
Licensed under the terms of the [MIT License](alco.mit-license.org)