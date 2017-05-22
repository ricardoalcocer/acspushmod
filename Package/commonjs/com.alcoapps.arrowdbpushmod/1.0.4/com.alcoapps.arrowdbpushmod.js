/*
    ArrowDBPush : Module to register iOS or Android device for ArrowDB Push Notifications
    Based on code by Pablo Rodríguez from lineartpr.com
    Modified by Ricardo Alcocer - @ricardoalcocer, Kiat - @cng
    Blackberry support added by Hazem Khaled - @hazemkhaled

    Before being able to use this module you need to obtain your push notification keys to upload on ArrowDB:
    http://docs.appcelerator.com/platform/latest/#!/guide/Push_Notifications
*/

var Cloud = require('ti.cloud');

var ANDROID = Ti.Platform.name === 'android';
var IOS = ! ANDROID && (Ti.Platform.name === 'iPhone OS');
var BLACKBERRY = ! ANDROID && ! IOS && (Ti.Platform.name === 'blackberry');

function ArrowDBPush(arrowdbuid, arrowdbpwd) {
    this.arrowdbuid = arrowdbuid || false;
    this.arrowdbpwd = arrowdbpwd || false;
    this.token = '';
}

/**
 * Register the device against ArrowDB in order to be able to receive Push Notifications depending
 * on the platform(s) you want to support, for a specific channel.
 *
 * @param  {String} channel_name           [required]
 * @param  {callable} onReceive            [required]
 * @param  {Object} iosOptions             [required if iOS support]
 * @param  {Object} androidOptions         [optional]
 * @param  {Object} blackberryOptions      [required if Blackberry support]
 * @param  {callable} onAndroidFocused     [optional]
 * @param  {callable} onAndroidLaunched    [optional]
 * @param  {callable} onBlackberryLaunched [optional]
 * @return {void}
 */
ArrowDBPush.prototype.registerDevice = function(channel_name, onReceive, iosOptions, androidOptions, blackberryOptions, onAndroidFocused, onAndroidLaunched, onBlackberryLaunched)
{
    var that = this,
        token = '';

    // Setting some default config values for Android
    _.defaults(androidOptions, {
        focusAppOnPush: false,
        showAppOnTrayClick: false,
        showTrayNotification: false,
        showTrayNotificationsWhenFocused: false,
        singleCallback: true
    });
    // Setting some default config values for BlackBerry
    _.defaults(blackberryOptions, {
        usePublicPpg: true,
        launchApplicationOnPush: true
    });

    // Verifying some required config values are present
    if (IOS) {
        _.each(['types', 'categories'], function(key) {
            if (! _.has(iosOptions, key)) {
                throw new Error("[ArrowDBPush] Options for iOS configuration are missing.");
            }
        });
    } else if (BLACKBERRY) {
        _.each(['appId', 'ppgUrl'], function(key) {
            if (! _.has(blackberryOptions, key)) {
                throw new Error("[ArrowDBPush] Options for Blackberry configuration are missing.");
            }
        });
    }

    // Those Android + Blackberry callbacks are optionals
    onAndroidLaunched = onAndroidLaunched || function(){};
    onAndroidFocused = onAndroidFocused || function(){};
    onBlackberryLaunched = onBlackberryLaunched || function(){};

    function deviceTokenSuccess(e) {
        console.log('[ArrowDBPush] Device Token: ' + e.deviceToken);
        token = e.deviceToken;
        that.token = token;
        loginToArrowDB(that.arrowdbuid, that.arrowdbpwd, token, channel_name);
    }

    function deviceTokenError(e) {
        console.log('[ArrowDBPush] Token Error: ' + e.error);
    }

    function receivePush(e) {
        onReceive(e.data);
        console.log("[ArrowDBPush] Push notification received: " + JSON.stringify(e.data));
    }

    if (ANDROID) {
        var CloudPush = require('ti.cloudpush');
        CloudPush.retrieveDeviceToken({
            success: deviceTokenSuccess,
            error: deviceTokenError
        });
        CloudPush.focusAppOnPush = androidOptions.focusAppOnPush;
        CloudPush.showAppOnTrayClick = androidOptions.showAppOnTrayClick;
        CloudPush.showTrayNotification = androidOptions.showTrayNotification;
        CloudPush.showTrayNotificationsWhenFocused = androidOptions.showTrayNotificationsWhenFocused;
        CloudPush.singleCallback = androidOptions.singleCallback;
        CloudPush.addEventListener('callback', onReceive);
        CloudPush.addEventListener('trayClickLaunchedApp', onAndroidLaunched);
        CloudPush.addEventListener('trayClickFocusedApp', onAndroidFocused);
    } else if (IOS){
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
    } else if (BLACKBERRY) {
        Ti.BlackBerry.createPushService({
            appId: blackberryOptions.appId,
            ppgUrl: blackberryOptions.ppgUrl,
            usePublicPpg: blackberryOptions.usePublicPpg,
            launchApplicationOnPush: blackberryOptions.launchApplicationOnPush,
            onSessionCreated: function(e) {
                console.log('[ArrowDBPush] Session Created');
            },
            onChannelCreated: function(e) {
                console.log('[ArrowDBPush] Channel Created\nMessage: ' + e.message + '\nToken: ' + e.token);
                token = e.token;
                that.token = token;
                console.log("[ArrowDBPush] Device Token: " + token);
                loginToArrowDB(that.arrowdbuid, that.arrowdbpwd, token, channel_name);
            },
            onPushReceived: function(e) {
                receivePush(e);
                e.source.removeAllPushes();
            },
            onConfigError: function(e) {
                console.log('[ArrowDBPush] ERROR\nTitle: ' + e.errorTitle + +'\nMsg: ' + e.errorMessage);
            },
            onError: function(e) {
                console.log('[ArrowDBPush] ERROR\nTitle: ' + e.errorTitle + +'\nMsg: ' + e.errorMessage);
            },
            onAppOpened: function(e) {
                onBlackberryLaunched(e.data);
                e.source.removePush(e.pushId);
            }
        });
    } else {
        alert("Push notification not implemented yet into arrowdbpushmod for " + Ti.Platform.osname);
    }
};

/**
 * Un-register a device from ArrowDB Push Notification Services so it won't receive any more push
 * notificiations for a specific channel.
 *
 * @param  {String} channel_name [required]
 * @param  {String} token        [required]
 * @param  {callable} onSuccess  [optional]
 * @param  {callable} onFail     [optional]
 * @return {void}
 */
ArrowDBPush.prototype.unsubscribeFromChannel = function(channel_name, token, onSuccess, onFail)
{
    var that = this;

    onSuccess = onSuccess || function(){};
    onFail = onFail || function(){};

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
};

/**
 * Retrieve the Device Token previously saved which is empty by default.
 *
 * @return {String} Device Token
 */
ArrowDBPush.prototype.getToken = function()
{
    var token = this.token;

    if (_.isEmpty(token)) {
        console.warn("[ArrowDBPush] Apparently the device token for ArrowDB push notifications is"+
        "not set yet. You need to register your device using ArrowDBPush.registerDevice() in order"
        +" to get a device token.");
    }

    return token;
};

/**
 * Authenticate against ArrowDB Cloud API or not. If the first two parameters
 * are "false", it will register push notifications as a guest.
 *
 * @param  {String|Boolean} arrowdbuid ArrowDB Unique ID used to connect.
 * @param  {String|Boolean} arrowdbpwd ArrowDB Password used to connect.
 * @param  {String} token              Device Token
 * @param  {String} channel_name       Channel used for push notifications.
 * @return {void}
 */
function loginToArrowDB(arrowdbuid, arrowdbpwd, token, channel_name) {
    if (! arrowdbuid && ! arrowdbpwd) {
        console.log("[ArrowDBPush] loginToArrowDB -> subscribe as guest");
        subscribeForPushNotifications(token, channel_name, true);
        return;
    }
    Cloud.Users.login({
        login: arrowdbuid,
        password: arrowdbpwd
    }, function (e) {
        if (e.success) {
            var user = e.users[0];
            console.log("[ArrowDBPush] loginToArrowDB -> Status: Successful");
            subscribeForPushNotifications(token, channel_name);
        } else {
            console.log("[ArrowDBPush] loginToArrowDB -> Error :"+e.message);
        }
    });
}

/**
 * Here we will subscribe for push notifications using ArrowDB Cloud services for
 * a specific channel and a specific device.
 *
 * @param  {String} token             Device token
 * @param  {String} channel_name      Channel name identifier
 * @param  {Boolean} subscribeAsGuest Authenticated or not
 * @return {void}
 */
function subscribeForPushNotifications(token, channel_name, subscribeAsGuest) {
    var prams = {
        channel: channel_name,
        type: IOS ? 'ios' : Ti.Platform.osname, // osname return iphone / ipad on iOS
        device_token: token
    };
    var callBack = function(e) {
        if (e.success) {
            console.log('[ArrowDBPush] subscribeForPushNotifications -> Status: Successful [' + channel_name + ']');
        } else {
            console.log('[ArrowDBPush] subscribeForPushNotifications -> Error ' +
            token + '(subscribeToServerPush) :\\n' + ((e.error && e.message) || JSON.stringify(e)));
        }
    };
    if (subscribeAsGuest) {
        Cloud.PushNotifications.subscribeToken(prams, callBack);
    } else {
        Cloud.PushNotifications.subscribe(prams, callBack);
    }
};

exports.ArrowDBPush = ArrowDBPush;
