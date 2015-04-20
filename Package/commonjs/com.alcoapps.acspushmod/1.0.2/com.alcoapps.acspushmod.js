/*
    ACSPush : Module to register iOS or Android device for ACS Push Notifications
    Based on code by Pablo Rodríguez from lineartpr.com
    Modified by Ricardo Alcocer - @ricardoalcocer, Kiat - @cng
    Blackberry support added by Hazem Khaled - @hazemkhaled

    Before being able to use this module you need to obtain your push notification keys:
    http://docs.appcelerator.com/titanium/3.0/#!/guide/Push_Notifications
*/

var Cloud = require('ti.cloud');

function ACSPush(acsuid,acspwd){
    this.acsuid=acsuid || false;
    this.acspwd=acspwd || false;
    this.token='';
}

ACSPush.prototype.registerDevice=function(channel_name,onReceive,onLaunched,onFocused,androidOptions,iosOptions,blackberryOptions){
    var that = this,
        token = '';

    function deviceTokenSuccess(e) {
        console.log('Device Token: ' + e.deviceToken);
        token = e.deviceToken;
        that.token=token;
        loginToACS(that.acsuid,that.acspwd,token,channel_name);
    }

    function deviceTokenError(e) {
        console.log('Token Error: ' + e.error);
    }

    function receivePush(e) {
        onReceive(e.data);
        console.log("push notification received: " + JSON.stringify(e.data));
    }

    if (OS_ANDROID){
        var CloudPush = require('ti.cloudpush');
        CloudPush.retrieveDeviceToken({
            success: deviceTokenSuccess,
            error: deviceTokenError
        });

        CloudPush.focusAppOnPush=androidOptions.focusAppOnPush || false;
        CloudPush.showAppOnTrayClick= androidOptions.showAppOnTrayClick || false;
        CloudPush.showTrayNotification= androidOptions.showTrayNotification || false;
        CloudPush.showTrayNotificationsWhenFocused=androidOptions.showTrayNotificationsWhenFocused || false;
        CloudPush.singleCallback= androidOptions.singleCallback || true;
        CloudPush.addEventListener('callback', onReceive);
        CloudPush.addEventListener('trayClickLaunchedApp', onLaunched);
        CloudPush.addEventListener('trayClickFocusedApp', onFocused);

    } else if (OS_IOS){
        // Check if the device is running iOS 8 or later
        if (parseInt(Ti.Platform.version.split(".")[0]) >= 8) {
            function registerForPush() {
                Ti.Network.registerForPushNotifications({
                    success: deviceTokenSuccess,
                    error: deviceTokenError,
                    callback: receivePush
                });
                // Remove event listener once registered for push notifications
                Ti.App.iOS.removeEventListener('usernotificationsettings', registerForPush);
            };

            // Wait for user settings to be registered before registering for push notifications
            Ti.App.iOS.addEventListener('usernotificationsettings', registerForPush);

            // Register notification types to use
            Ti.App.iOS.registerUserNotificationSettings({
                types: iosOptions.types,
                categories: iosOptions.categories
            });

        } else {
            // For iOS 7 and earlier
            Ti.Network.registerForPushNotifications({
                // Specifies which notifications to receive
                types: iosOptions.types,
                success: deviceTokenSuccess,
                error: deviceTokenError,
                callback: receivePush
            });
        }

    } else if (OS_BLACKBERRY) {
        Ti.BlackBerry.createPushService({
            appId : blackberryOptions.appId,
            ppgUrl : blackberryOptions.ppgUrl,
            usePublicPpg : blackberryOptions.usePublicPpg,
            launchApplicationOnPush : blackberryOptions.launchApplicationOnPush,
            onSessionCreated : function(e) {
                console.log('Session Created');
            },
            onChannelCreated : function(e) {
                console.log('Channel Created\nMessage: ' + e.message + '\nToken: ' + e.token);
                token = e.token;
                that.token = token;
                console.log("Device Token: " + token);
                loginToACS(that.acsuid, that.acspwd, token, channel_name);
            },
            onPushReceived : function(e) {
                onReceive(e.data);
                e.source.removeAllPushes();
            },
            onConfigError : function(e) {
                console.log('ERROR\nTitle: ' + e.errorTitle + +'\nMsg: ' + e.errorMessage);
            },
            onError : function(e) {
                console.log('ERROR\nTitle: ' + e.errorTitle + +'\nMsg: ' + e.errorMessage);
            },
            onAppOpened : function(e) {
                onLaunched(e.data);

                e.source.removePush(e.pushId);
            }
        });
    } else {
        alert("Push notification not implemented yet into acspushmod for " + Ti.Platform.osname);
    }
}

ACSPush.prototype.unsubscribeFromChannel=function(channel_name,token,onSuccess,onFail){

    var that=this;
    Cloud.PushNotifications.unsubscribe({
        channel: channel_name,
        device_token: token
    }, function (e) {
        if (e.success) {
            onSuccess(e);
        } else {
            onFail(e);
        }
    });
}

ACSPush.prototype.getToken=function(){
    return this.token;
}

function loginToACS(acsuid,acspwd,token,channel_name){
    if (!acsuid && !acspwd) {
        console.log("loginToACS -> subscribe as guest");
        subscribeForPushNotifications(token, channel_name, true);
        return;
    }
    Cloud.Users.login({
        login: acsuid,
        password: acspwd
    }, function (e) {
        if (e.success) {
            var user = e.users[0];
            console.log("loginToACS -> Status: Successful");
            subscribeForPushNotifications(token,channel_name);
        }else{
            console.log("loginToACS -> Error :"+e.message);
        }
    });
};

function subscribeForPushNotifications(token, channel_name, subscribeAsGuest) {
    var prams = {
        channel : channel_name,
        type : OS_IOS ? 'ios' : Ti.Platform.osname, // osname return iphone / ipad on iOS
        device_token : token
    };
    var callBack = function(e) {
        if (e.success) {
            console.log('subscribeForPushNotifications -> Status: Successful [' + channel_name + ']');
        } else {
            console.log('subscribeForPushNotifications -> Error ' + token + '(subscribeToServerPush) :\\n' + ((e.error && e.message) || JSON.stringify(e)));
        }
    };
    if (subscribeAsGuest) {
        Cloud.PushNotifications.subscribeToken(prams, callBack);
    } else {
        Cloud.PushNotifications.subscribe(prams, callBack);
    }
};

exports.ACSPush=ACSPush;
