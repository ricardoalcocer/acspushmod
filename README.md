# ACS Push Notifications Library

Titanium CommonJS Library to register device for ACS Push Notifications.  Simply add this file to your project and follow the usage instructions below.

## Motivation
Push notifications with Titanium are sometimes a bit esoteric.  With this library I'm simply trying to make it super easy to implement

## Requirements
This library support Push Notifications via ACS for iOS, Android and Blackberry.  Before you use this library, you need to:

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
	//var ACSPush=new ACSP.ACSPush();
	
	// set the channel to subscribe to
	var channel='All users';
	
	// register this device
	ACSPush.registerDevice(channel,onReceive,onLaunched,onFocused,androidOptions,blackberryOptions);

## Sending messages to your subscribers

To send to your iOS or Android registered devices simply log on to your ACS Dashboard, go to the Push Notifications Tab, fill out the screen and send.

![acsiosandroid](http://s27.postimg.org/5ixtazxwz/Screen_Shot_2014_03_31_at_11_51_28_AM.png)

To send to your Blackberry registered devices, you can use a [web-based form](https://0a247e8f40a42e51d63974fe36709dea14d95fab.cloudapp.appcelerator.com/?#) ([Source Code here](https://github.com/pec1985/BB10-Push-Server)) created by [Pedro Enrique](https://github.com/pec1985).

## Credits
This module is based on code by my buddy [Pablo Rodríguez](https://github.com/pablorr18), now with some additional sugar and converted into a reusable CommonJS Module.

BlackBerry 10 support by [Hazem Khaled](http://github.com/hazemkhaled)

## License
Licensed under the terms of the [MIT License](alco.mit-license.org)
