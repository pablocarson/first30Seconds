// HOUSEKEEPING FUNCTIONS FOR PROGRAMMING PURPOSES
	// Create a global variable array to separate our globals from the rest of the DOM.
	GLOB = [];
	// Initialize the global variable for android device UUID
	GLOB.deviceUuid = "";

 	// Reset function: Initialize the unit test.
	function initializeUnitTest() {
		// Return the page to the Splash page.
		$.mobile.changePage('#splash');
		// Perform a page reset to clear all data.
		document.location.reload(true);
	};

// CODE REQUIRED FOR UNIT TEST
	// This allows us to run the unit test as an array of individual test components.
	// The unit tests are in an array, allTests, defined as allTests = [ function() { ... }, function() { ... }, etc ]
	// runAllTests iterates through the functions in the array sequentially, 
	// and determines a pause interval between each function as specified within the unit test.
   function runAllTests( allTests, startTestNum, endTestNum ) {
	   var returnVal = null;
	   function runAllTests1( allTests, testNum ) {
			if( testNum == endTestNum ) {
				return( true );
			}
			var func = allTests[ testNum ];
			var pauseLength = func();
			if( pauseLength == -1 ) {
				return( false );
			};
			pauser = setTimeout(
				function() {
					runAllTests1( allTests, testNum + 1 );
				},
				pauseLength
			); 
		};
		// Give subscribe enough time to work, then run tests
		setTimeout(
			function() {
				runAllTests1( allTests, startTestNum );
			},
			1000
		);
	};

// DISABLE THE BACK BUTTON
	// We need to disable Android's 'back' button within the client, otherwise
	// the user could subvert the perceived state of the client by changing pages, etc.
	// This is a Phonegap event.

	document.addEventListener("backbutton", onBackKeyDown, false);

	function onBackKeyDown(e) {
		e.preventDefault();
	}


// CODE TO INITIALIZE CLIENT
	// Set the initial Firebase reference based on whether the client is authenticated or not.
	// Retrieve the value stored with the key "f30sUserId" in localStorage. This is a value sent 
	// by the f30s server to the client via Firebase as an authentication token.
	GLOB.currentUserId = window.localStorage.getItem("f30sUserId");
	// If there's already a value for f30sUserId in localStorage:
	if (GLOB.currentUserId != null) {
		// Redefine the primary reference to use the f30UserID value as the primary Firebase reference for all 
		// client-server communications.
		GLOB.first30SecondsRef = new Firebase('https://f30s.firebaseio.com/' + GLOB.currentUserId)
	// If there's no value, the user has not been authenticated, so we'll create an arbitrary Firebase reference
	// so the DOM can load.
	} else {
		// create an arbitrary reference so the client can initialize. This reference will
		// be reset once the client is authenticated.
		GLOB.first30SecondsRef = new Firebase('https://f30s.firebaseio.com/placeholder');
	};

// CHILD REFERENCES TO THE PRIMARY FIREBASE REFERENCE
	// Firebase pageReady reference, used when app is fully initialized


	// initialize the listeners with the above references
	updateListeners( GLOB.currentUserId );	

	// Reference for client to send a user's unique device ID(device.uuid) to Firebase. Unlike other references,
	// this one is not authenticated but is open for new users as part of the authentication process, so it's
	// set as an absolute reference.
	GLOB.newUserIdRequestRef = new Firebase('https://f30s.firebaseio.com/newUserIdRequests/' );

// CODE TO SUPPORT PLUGINS AND AUTHENTICATION
	// Phonegap's deviceReady event listener
	// The event fires when Phonegap's device APIs have loaded and is the last event fired during initialization.
	// It registers the device with Google Cloud Messaging for push notifications and performs initial authentication 
	// functions based on the device's UUID.
	document.addEventListener("deviceready", function() {
	// Firebase reference for a device that hasn't been authenticated. If no authentication token exists in localStorage, 
	// the client's device ID will be sent to this reference when the user interacts with the newUser page. 
	// This directory will be used by all new clients so proper security restrictions should be imposed on this directory to prevent exploits.
		// Take the device's universal unique identifier (UUID) and place it in a global variable
		GLOB.deviceUuid = device.uuid;
		// If there is no authentication token in localStorage, we need to authenticate the user.
		if (GLOB.currentUserId == null) {
			// change to the newUser page. The client will send the device UUID based on user interaction with this page.
			$.mobile.changePage("#newUser")
			// Create a unique Firebase reference based on the device UUID. We set this as a global function so the reference remains
			// accessible after the deviceReady event functions are complete.
			GLOB.newUserIdResponseRef = new Firebase('https://f30s.firebaseio.com/' + device.uuid + '/authenticationToken');
			// Create a listener based on this reference. Since it's unique, the server will use it to send an authentication
			// token to the device. 
			GLOB.newUserIdResponseRef.on('child_added', function(childSnapshot, prevChildName) {
				var val = childSnapshot.val();
				// Place the received authentication token in localStorage
				window.localStorage.setItem("f30sUserId", val);
				// For test purposes, change to the splash page. Refer to the first30Seconds logic table to determine which page
				// should be the destination on completion of this function.
				$.mobile.changePage("#splash")

				// overwrite the listeners with the new references
				updateListeners( val );
				// register device for push notifications
				var pushNotification = window.plugins.pushNotification;
				pushNotification.register(successHandler, errorHandler,{"senderID":"663432953781","ecb":"onNotificationGCM"});
			});

			// Firebase reference for server alert messages for the newUser page only. We need a separate reference because
			// if we're on the newUser page we don't have an authentication token yet, so we use the device.uuid channel.
			GLOB.newUserServerAlertRef = new Firebase('https://f30s.firebaseio.com/' + device.uuid + '/alerts');
			
			// Server creates an alert for the newUser page. 
			GLOB.newUserServerAlertRef.on('child_added', function(childSnapshot, prevChildName) {
				// Retrieve the JSON string stored in alertMsg	
				var val = childSnapshot.val();
				// If the server set the removeWaiting flag to true, close any open 'Waiting...' overlay.
				// If a waiting overlay isn't open, the command will be ignored.
				if (val.removeWaitingMsg == true) {
					sys_closeWaiting();
				};
				// If the alert message is empty, close the alert.
				if (val.alertMsg == "") {
					$('.newUserAlertWrapper').hide();
				} else {
					// Extract the alert text from the message		
					var jsonAlert = JSON.stringify( val.alertMsg );
					// Populate the text in the alert. By specifying the entire class, we ensure that 
					// the current page alert text is populated regardless of what that page is.
					$('.newUserAlert').html(val.alertMsg);
					// Use a slight timeout to avoid collision with the command to populate the alert
					setTimeout (function() {
						// Display the alert component. By specifying the entire class, we ensure that 
						// the alert is displayed on the page that's currently active.
						$('.newUserAlertWrapper').show();
						// Derive the current page ID
						var currentPage = $.mobile.activePage.attr('id')
						// Convert this to the alert ID for the current page. For example,
						// if the page ID is inTransit, the relevant alert ID is #inTransiTAlertText				
						var currentAlertId = "#" + currentPage + "AlertText";
						// Derive the height of the populated alert box and adjust the height of the 
						// space allocated to the alert so that it never covers the page text or elements 
						// below it, regardless of how many lines of text may be in the alert.
						var containerHeight = $(currentAlertId).height()
						var containerHeightTrim = parseInt(containerHeight) + 37;			
						$('.newUserAlertWrapper').css("height", containerHeightTrim);
					}, 10);		
				};		
			});

			// Server changes an alert for the newUser page. 
			GLOB.newUserServerAlertRef.on('child_changed', function(childSnapshot, prevChildName) {
				// Retrieve the JSON string stored in alertMsg	
				var val = childSnapshot.val();
				// If the server set the removeWaiting flag to true, close any open 'Waiting...' overlay.
				// If a waiting overlay isn't open, the command will be ignored.
				if (val.removeWaitingMsg == true) {
					sys_closeWaiting();
				};
				// If the alert message is empty, close the alert.
				if (val.alertMsg == "") {
					$('.newUserAlertWrapper').hide();
				} else {
					// Extract the alert text from the message		
					var jsonAlert = JSON.stringify( val.alertMsg );
					// Populate the text in the alert. By specifying the entire class, we ensure that 
					// the current page alert text is populated regardless of what that page is.
					$('.newUserAlert').html(val.alertMsg);
					// Use a slight timeout to avoid collision with the command to populate the alert
					setTimeout (function() {
						// Display the alert component. By specifying the entire class, we ensure that 
						// the alert is displayed on the page that's currently active.
						$('.newUserAlertWrapper').show();
						// Derive the current page ID
						var currentPage = $.mobile.activePage.attr('id')
						// Convert this to the alert ID for the current page. For example,
						// if the page ID is inTransit, the relevant alert ID is #inTransiTAlertText				
						var currentAlertId = "#" + currentPage + "AlertText";
						// Derive the height of the populated alert box and adjust the height of the 
						// space allocated to the alert so that it never covers the page text or elements 
						// below it, regardless of how many lines of text may be in the alert.
						var containerHeight = $(currentAlertId).height()
						var containerHeightTrim = parseInt(containerHeight) + 37;			
						$('.newUserAlertWrapper').css("height", containerHeightTrim);
					}, 10);		
				};		
			});

			// Reference for client events on the newUser page. Because the user's not authenticated yet, we 
			// send the request to a reference based on device.uuid.
			GLOB.newUserClientAlertRef = new Firebase('https://f30s.firebaseio.com/' + device.uuid + '/clientEvents');

			// User clicks on a newUser page server-generated alert to request that it be closed.
			$(document).on( "click", ".newUserAlertWrapper", function() {
				// Open the waiting overlay. Unlike the other functions, this is not triggered by an anchor link.
				// Anchor links trigger the waiting overlay using the HREF="" tag in the HTML. So we have to call 
				// the Waiting overlay from here instead.
				sys_openWaiting();
				GLOB.newUserClientAlertRef.push( { Close_alert : true } );
			});


		// If an authentication token already exists in localStorage, register with Google Cloud Messaging (GCM) and retrieve a GCM
		// ID for pushnotifications. 
		} else {
			var pushNotification = window.plugins.pushNotification;
			pushNotification.register(successHandler, errorHandler,{"senderID":"663432953781","ecb":"onNotificationGCM"});
		};
	});

	// Push notification functions called by the deviceReady event
	// Reference for push notifications.	
	var globalClientDeviceIDRef = GLOB.first30SecondsRef.child('global/clientEvents/GCMPushNotificationsID');
		
	// Success handler for GCM registration. Result should be "OK".
	function successHandler (result) {
	// We can send this notification to Firebase, but since the Registration ID is only sent as a success condition, 
	// and we have error handlers (below), this becomes a redundant message that only adds to our Firebase overhead. 
	// So we'll keep it but comment it out in case we decide to include it later. 
	//	deviceRef.push( { "GCM_registration" : result } );
	}

	// Error handler for GCM registration. Sends a received error message to Firebase. 
	function errorHandler (error) {
		globalClientDeviceIDRef.push( { "GCM_registration_error" : error } );
	}

	// Notification event handler for GCM registration and push notifications. 
	function onNotificationGCM(e) {
		switch( e.event ) {
			// If a Registration ID is successfully generated, send it to Firebase. The server will need this ID to
			// generate push notifications via GCM.
			case 'registered':
				if ( e.regid.length > 0 ) {
					GLOB.GCMId = e.regid;
					// Send the result to Firebase. Since this will be the first authenticated client to Firebase, 
					// and the reference name includes the authentication token sent by the server, sending of the 
					// GCH push notification ID using this reference provides all information needed by the server'
					// to engage the user. deviceReady is also the last event fired on initialization. 
					// This is therefore sent as the 'Page Ready' message.
 					GLOB.pageReadyRef.push( { "GCM_Push_Notifications_Id" : e.regid } );
				}
			break;
			// this is the case for an actual push notification.
			case 'message':
				alert('message = ' + e.message + ' msgcnt = ' + e.msgcnt);
			break;
			// If an error happens during a push notification, send the error to Firebase
			case 'error':
				globalClientDeviceIDRef.push( { "GCM_error" : e.msg } );
			break;
			// Any other outcome, send an "unknown event" message to Firebase.
			default:
				globalClientDeviceIDRef.push( { "GCM_unknown_event" : true } );
			break;
		}
	}

	// Function to handle Stripe checkout process
	var handler = StripeCheckout.configure({
		// When a Stripe merchant account is created, you're given two publishable keys: one for testing and one for 
		// when the app is live. Below is the test key that was used for development. This should be replaced
		// with a test / live key from the Stripe account to be used in production.
		key: 'pk_test_9hivJ7TpkhcQkukMYt57spj1',
		// The name, description and purchase amount will be presented in the Stripe overlay. Currently this is
		// set for one purchase type: ten credits for ten dollars.
		name: 'First 30 Seconds',
		description: '10 party credits',
		amount: 1000,
		// When a stripe overlay opens, a message is sent to Firebase to notify the server. This helps 
		// reduce the potential for asynchronous conflicts.
		opened: function() {
			GLOB.stripeClientRef.push( { Checkout_open : true } );
		},
		// When a stripe overlay is closed by the user, a message is sent to Firebase to notify the server. 
		// This helps reduce the potential for asynchronous conflicts.
		closed: function() {
			GLOB.stripeClientRef.push( { Checkout_open : false } );
		},
		// Generate a pay token (token.id) when the purchase is successfully completed.
		// Use the token to create the charge with a server-side script.
		token: function(token) {
			GLOB.stripeTokenRef.push( { "payToken" : token.id , "payCard" : token.card.last4 , "purchaseEmail" : token.email} );
			// Open the waiting overlay. This allows the server to update credits before returning
			// control to the user.
			sys_openWaiting();
		}
	});

	// Cropit
	// The imageUpload page uses the Cropit image upload plugin by Scott Cheng. This allows the user to open
	// an image from their device and then zoom, pan, crop, and upload it to Firebase. For API and details 
	// on its use, refer to http://scottcheng.github.io/cropit/

	// The cropit plugin must be called within the Firebase function that provides page data for the imageUpload page. 
	// Refer to the imageUpload section for specifics of the plugin implementation.

// GLOBAL FUNCTIONS
	// Global functions can occur on multiple pages or all pages.
 	
	// Server updates rating of an otherUser
	// The function updates the rating associated with the unique ID of the otherUser, updates the parent thumbnail
	// display on the #party page and returns the user to that page.
	function sys_globalRateDisplay( jsonRating, UID ) {
		// Change the rating on the #Party page to reflect what the user selected. 
		// It uses the value on the selector at the time of submit.
		// If the user hasn't selected a rating, display "Please Review" as the rating text
		if (jsonRating == '-1') {
			$('#rating' + UID).html("Please review");
		};
		// If the user's selected the "Not Interested" element from the pulldown, the pulldown value
		// is zero and the corresponding element's rating text will change to say "Not interested"
		if (jsonRating == '0') {
			$('#rating' + UID).html("Not interested");
		};
		// Otherwise, the value will be 1 - 5, which will be converted to a string of heart symbols 
		// (&hearts;) of the corresponding length. For example, a rating of 3 will display as three heart symbols.
		// The native HTML &hearts; code won't render the color properly, so we're currently using a small base64 image to render the hearts.
		if ( (jsonRating > '0') && (jsonRating < '6') ) {
			var newHearts = Array(+ jsonRating + 1).join("<img src='data:image/gif;base64,R0lGODlhDAAMANU/AP8QEP8FBf8lJf8XF/8LC/8AAP8BAf/w8P8CAv/v7/+YmP8bG//X1/8ICP/29v8GBv9tbf9JSf9CQv8MDP8fH/+qqv+Xl/+7u/8qKv/7+/8VFf8zM/+Skv+IiP+Dg/9BQf/T0/+MjP/g4P/8/P8gIP/r6//t7f/o6P/n5/+Pj//5+f9wcP+zs//l5f/Fxf/Hx/+1tf/u7v8cHP90dP/6+v8mJv81Nf9UVP++vv+/v/+rq/+Tk/+Njf+Jif+Cgv///yH5BAEAAD8ALAAAAAAMAAwAAAZnwN/hpbu0HCUGCKU6cGyyGoTliUhWLpzAUChMPoBu4xYKdLvh84D3OBcabkBOgOgiuF0D5rDbENwFASQ9QjAUbgYRFSY/PzQWfwUIAwoJjY0JPhoBCzMMI5eNMSkLHSIZoZcnCiKhQQA7' />");
			// Display the string created on the atParty page.
			$('#rating' + UID).html( newHearts );
		}		
	}

	// Manually close an alert. 
	// We need this for the newUser page: since there's no way for the server to know
	// if a faulty form submission was executed by an unauthenticated user, the user must close the alert manually.
	$(document).on( "click", ".manualAlertWrapper", function() {
		$('.manualAlertWrapper').hide();
	});


	// Waiting overlay functions
	// Client opens Waiting overlay (loader)
	$(document).on( "click", ".show-page-loading-msg", function() {
		var $this = $( this ),
		msgText = $this.jqmData( "msgtext" ) || $.mobile.loader.prototype.options.text,
		textVisible = $this.jqmData( "textvisible" ) || $.mobile.loader.prototype.options.textVisible,
		textonly = !!$this.jqmData( "textonly" );
		html = $this.jqmData( "html" ) || "";
			$.mobile.loading( 'show', {
			  text: msgText,
			  textVisible: textVisible,
			  theme: 'a',
			  textonly: textonly,
			  html: html
		});
	})

	// Server opens Waiting overlay.
	// Uses current page ID to open the proper instance of the overlay. The waiting overlay is unique for each
	// page and includes the page ID in its own ID. For example, if the client is on the Home page, the div 
	// being opened would have the ID "homeWaiting"
	function sys_openWaiting() {
		$.mobile.loading( "show", {
			text: "Waiting...",
			textVisible: true,
			theme: "a",
		});				
	}

	// Server closes Waiting overlay 
	// Uses current page ID to close the proper instance of the overlay. The waiting overlay is unique for each
	// page and includes the page ID in its own ID. For example, if the client is on the Home page, the div 
	// being opened would have the ID "homeWaiting"
	function sys_closeWaiting() {
		$.mobile.loading("hide")
	}

	// Geolocation functions	
	// Retrieve the device's current latitude and longitude.
	var getLocation = function() {
		navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true });
	}

	// success callbacks for getLocation()
	function onSuccess(position) {
		//Lat long will be fetched and stored in session variables
		//These variables will be used while storing data in local database 
		lat = position.coords.latitude;
		lng = position.coords.longitude;
		// Send the lat and lng values to Firebase
		GLOB.globalClientGeoRef.push( { 'latitude' : lat, 'longitude' : lng } );
	}
		
	// failure callback if an error is returned by the geolocation function
	function onError(error) {
		console.log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
	}

	// This function is called to poll for location periodically so we can track the user's progress to
	// the party destination. For test purposes, it has been set to one second. In production, this should 
	// be set to 30 seconds.		
	function cycleLocation(){
		GLOB.cycle = setInterval( getLocation, 1000)
	}
		
	// Stop the geolocation polling function
	function stopLocation(){
		clearInterval(GLOB.cycle)
	}

// SERVER LISTENERS
	// This function contains the code for all Firebase listeners for server-generated messages. For authenticated users, this function is called 
	// after the Firebase references are loaded to ensure server messages are sent to an authenticated channel. For new users, the Firebase references 
	// are set to placeholders until an authentication token is received, and this function is called again after the Firebase references are updated.
	function updateListeners( authToken) {
				// Reset all Firebase references using the authentication token as the top-level identifier. 
				// Primary Firebase reference
				GLOB.first30SecondsRef = new Firebase('https://f30s.firebaseio.com/' + authToken );
				// Firebase pageReady reference, used when app is fully initialized
				GLOB.pageReadyRef = GLOB.first30SecondsRef.child('pageReady');
				// Firebase reference for Stripe-related messages generated by the client.
				GLOB.stripeClientRef = GLOB.first30SecondsRef.child('Stripe/clientEvents');
				// Firebase reference for Stripe to send a pay token after a successful purchase.
				GLOB.stripeTokenRef = GLOB.first30SecondsRef.child('Stripe/payTokens');
				// Firebase reference for global server messages, primarly used for currentPage messages that set the displayed page.
				GLOB.globalServerRef = GLOB.first30SecondsRef.child('global/serverEvents');
				// Firebase reference for global client messages
				GLOB.globalClientRef = GLOB.first30SecondsRef.child('global/clientEvents');
				// Firebase reference for server alert messages (global)
				GLOB.globalServerAlertRef = GLOB.first30SecondsRef.child('global/alerts');
				// Firebase reference for server messages for the Stripe Checkout overlay. Though we're currently only using it 
				// on the Home page, the Stripe overlay can be called from any page, therefore we'll treat it as global.
				GLOB.globalServerStripeRef = GLOB.first30SecondsRef.child('Stripe/serverEvents');
				// Firebase references for server and client messages related to geolocation functions
				GLOB.globalServerGeoRef = GLOB.first30SecondsRef.child('global/serverEvents/geolocation');	
				GLOB.globalClientGeoRef = GLOB.first30SecondsRef.child('global/geolocation');
				// Since GLOB.newUserIdRequestRef is not an authenticated channel, the reference doesn't need to be updated and isn't
				// included in this list.
				// Firebase references for server and client messages for the imageUpload page
				GLOB.imageUploadServerRef = GLOB.first30SecondsRef.child('pages/imageUpload/serverEvents');
				GLOB.imageUploadClientRef = GLOB.first30SecondsRef.child('pages/imageUpload/clientEvents');
				// Firebase references for server and client messages for the profile page
				GLOB.profileServerRef = GLOB.first30SecondsRef.child('pages/profile/serverEvents');
				GLOB.profileClientRef = GLOB.first30SecondsRef.child('pages/profile/clientEvents');
				// Firebase references for server and client messages for the Home page
				GLOB.homeServerRef = GLOB.first30SecondsRef.child('pages/home/serverEvents');
				GLOB.homeClientRef = GLOB.first30SecondsRef.child('pages/home/clientEvents');
				// Firebase references for server and client messages for Invite page
				GLOB.inviteServerRef = GLOB.first30SecondsRef.child('pages/invite/serverEvents');
				GLOB.inviteClientRef = GLOB.first30SecondsRef.child('pages/invite/clientEvents');
				// Firebase references for server and client messages for the inTransit page
				GLOB.inTransitServerRef = GLOB.first30SecondsRef.child('pages/inTransit/serverEvents')
				GLOB.inTransitClientRef = GLOB.first30SecondsRef.child('pages/inTransit/clientEvents');
				// Firebase references for server and client messages for the atParty page
				GLOB.atPartyServerRef = GLOB.first30SecondsRef.child('pages/atParty/serverEvents/');
				GLOB.atPartyClientRef = GLOB.first30SecondsRef.child('pages/atParty/clientEvents');
				// Firebase server reference to add an otherUser to the atParty page
				GLOB.atPartyOtherUserRef = GLOB.first30SecondsRef.child('pages/atParty/otherUser');
				// Firebase references for server and client messages for the rateOtherUser page
				GLOB.rateOtherUserServerRef = GLOB.first30SecondsRef.child('pages/rateOtherUser/serverEvents');
				GLOB.rateOtherUserClientRef = GLOB.first30SecondsRef.child('pages/rateOtherUser/clientEvents');
				// Firebase references for server and client messages for the Match page
				GLOB.matchServerRef = GLOB.first30SecondsRef.child('pages/match/serverEvents');
				GLOB.matchClientRef = GLOB.first30SecondsRef.child('pages/match/clientEvents');
		// Global listeners	

		// Server sets initial page to be displayed
		GLOB.globalServerRef.child('currentPage').on('child_added', function(childSnapshot, prevChildName) {
			// Retrieve the JSON string stored in alertMsg	
			var val = childSnapshot.val();
			// If a message to change the current page is received, change to that page.	
			$.mobile.changePage("#" + val);					
		});

		// Server changes page to be displayed
		GLOB.globalServerRef.child('currentPage').on('child_changed', function(childSnapshot, prevChildName) {
			// Retrieve the JSON string stored in alertMsg	
			var val = childSnapshot.val();
			$.mobile.changePage("#" + val);
		});

		// Alert listneres
			
		// Server creates an alert
		GLOB.globalServerAlertRef.on('child_added', function(childSnapshot, prevChildName) {
			// Retrieve the JSON string stored in alertMsg	
			var val = childSnapshot.val();
			// If the server set the removeWaiting flag to true, close any open 'Waiting...' overlay.
			// If a waiting overlay isn't open, the command will be ignored.
			if (val.removeWaitingMsg == true) {
				sys_closeWaiting();
			};
			// If the alert message is empty, close the alert.
			if (val.alertMsg == "") {
				$('.alertWrapper').hide();
			} else {
				// Extract the alert text from the message		
				var jsonAlert = JSON.stringify( val.alertMsg );
				// Populate the text in the alert. By specifying the entire class, we ensure that 
				// the current page alert text is populated regardless of what that page is.
				$('.alert').html(val.alertMsg);
				// Use a slight timeout to avoid collision with the command to populate the alert
				setTimeout (function() {
					// Display the alert component. By specifying the entire class, we ensure that 
					// the alert is displayed on the page that's currently active.
					$('.alertWrapper').show();
					// Derive the current page ID
					var currentPage = $.mobile.activePage.attr('id')
					// Convert this to the alert ID for the current page. For example,
					// if the page ID is inTransit, the relevant alert ID is #inTransiTAlertText				
					var currentAlertId = "#" + currentPage + "AlertText";
					// Derive the height of the populated alert box and adjust the height of the 
					// space allocated to the alert so that it never covers the page text or elements 
					// below it, regardless of how many lines of text may be in the alert.
					var containerHeight = $(currentAlertId).height()
					var containerHeightTrim = parseInt(containerHeight) + 37;			
					$('.alertWrapper').css("height", containerHeightTrim);
				}, 10);		
			};		
		});

		// Server changes an alert
		GLOB.globalServerAlertRef.on('child_changed', function(childSnapshot, prevChildName) {
			// Retrieve the JSON string stored in alertMsg	
			var val = childSnapshot.val();
			// If the server set the removeWaiting flag to true, close any open 'Waiting...' overlay.
			// If a waiting overlay isn't open, the command will be ignored.
			if (val.removeWaitingMsg == true) {
				sys_closeWaiting();
			};
			// If the alert message is empty, close the alert.
			if (val.alertMsg == "") {
				$('.alertWrapper').hide();
			} else {
				// Extract the alert text from the message		
				var jsonAlert = JSON.stringify( val.alertMsg );
				// Populate the text in the alert. By specifying the entire class, we ensure that 
				// the current page alert text is populated regardless of what that page is.
				$('.alert').html(val.alertMsg);
				// Use a slight timeout to avoid collision with the command to populate the alert
				setTimeout (function() {
					// Display the alert component. By specifying the entire class, we ensure that 
					// the alert is displayed on the page that's currently active.
					$('.alertWrapper').show();
					// Derive the current page ID
					var currentPage = $.mobile.activePage.attr('id')
					// Convert this to the alert ID for the current page. For example,
					// if the page ID is inTransit, the relevant alert ID is #inTransiTAlertText				
					var currentAlertId = "#" + currentPage + "AlertText";
					// Derive the height of the populated alert box and adjust the height of the 
					// space allocated to the alert so that it never covers the page text or elements 
					// below it, regardless of how many lines of text may be in the alert.
					var containerHeight = $(currentAlertId).height()
					var containerHeightTrim = parseInt(containerHeight) + 37;			
					$('.alertWrapper').css("height", containerHeightTrim);
				}, 10);		
			};		
		});

		// Stripe checkout listeners

		// Server opens the Stripe overlay
		GLOB.globalServerStripeRef.on('child_added', function(childSnapshot, prevChildName) {
			// Retrieve the JSON string stored in alertMsg	
			var val = childSnapshot.val();
			// If "stripeMsg" message is sent by the server with a flag of "true", close the Waiting overlay and open 
			// the Stripe credit card overlay. Note that the user closes this overlay manually, because this overlay
			// is created by Stripe. We are notified when the user closes the overlay, but this means there's no 
			// reason for a child_changed listener since this can only be set to true. Therefore, once triggered, any 
			// prior stripeMsg message MUST be removed from Firebase before sending a subsequent'stripeMsg: true' message, 
			// or else the child_added listener won't be triggered.
			if (val == true) {		
				sys_closeWaiting();
				handler.open();	
			};
		});

		// Geolocation listeners

		// Server requests geolocation data from the client
		GLOB.globalServerGeoRef.on('child_added', function(childSnapshot, prevChildName) {
			// Retrieve the JSON string stored in geoMsg	
			var val = childSnapshot.val();
			// If geoMsg is true, call the getLocation function immediately and then every 30 seconds. For test 
			// purposes, the interval has been set to 10 seconds but should be a minimum of 30 seconds in production.
			if (val == true){
				// getLocation is the actual geolocation polling function. We want to call it immediately first 
				// to get an initial user location ASAP.
				getLocation();
				// Call the setInterval 
				cycleLocation();
			};
			// If geoMsg is false, stop the geolocation function.
			if (val == false){
				// getLocation is the actual geolocation polling function. We want to call it immediately first 
				// to get an initial user location ASAP.
				stopLocation();
			};
		});
			
		// Server changes cilent geolocation request
		GLOB.globalServerGeoRef.on('child_changed', function(childSnapshot, prevChildName) {
			// Retrieve the JSON string stored in geoMsg	
			var val = childSnapshot.val();
			// If geoMsg is true, call the getLocation function immediately and then every 30 seconds. For test 
			// purposes, the interval has been set to 10 seconds but should be a minimum of 30 seconds in production.
			if (val == true){
				// getLocation is the actual geolocation polling function. We want to call it immediately first 
				// to get an initial user location ASAP.
				getLocation();
				// Call the setInterval 
				cycleLocation();
			};
			// If geoMsg is false, stop the geolocation function.
			if (val == false){
				// getLocation is the actual geolocation polling function. We want to call it immediately first 
				// to get an initial user location ASAP.
				stopLocation();
			};
		});

		// Home page listeners

		// Server sends initial page data to client
		GLOB.homeServerRef.on('child_added', function(childSnapshot, prevChildName) {
			// Close Waiting overlay if it's open. If not, this command will be ignored.
			sys_closeWaiting();
			// Assign snapshot JSON to a variable
			var val = childSnapshot.val();
			// Update number of credits
			// If user has zero credits, the number of credits will be color coded red, the
			// "Find a Party" button will be disabled and additional instructional copy will appear.
			$('#homeCredits').html(val.creditsMsg);
			if (val.creditsMsg == "0"){
				$('#homeCredits').css('color', '#990000');
				$(document).on("pageinit", "#home", function () {
					$('#homeFindParty').button('disable');
				});
			// Else it will appear green on both pages and the "Find a party" button will be active.
			} else {
				$('#homeCredits').css('color', '#009900');
				$('#homeFindParty').button('enable');
			}
		});

		// Server changes page data
		GLOB.homeServerRef.on('child_changed', function(childSnapshot, prevChildName) {
			// Close "Waiting..." overlay if it's open. If not, this command will be ignored.
			sys_closeWaiting();
			// Assign snapshot JSON to a variable
			var val = childSnapshot.val();
			// Update number of credits
			$('#homeCredits').html(val.creditsMsg);
			// If user has zero credits, the number of credits will be color coded red, the
			// "Find a Party" button will be disabled and additional instructional copy will appear.
			if (val.creditsMsg == "0"){
				$('#homeCredits').css('color', '#990000');
				$('#homeFindParty').button('disable');
			// Else it will appear green on both pages and the "Find a party" button will be active.
			} else {
				$('#homeCredits').css('color', '#009900');
				$('#homeFindParty').button('enable');
			}
		});

		// Invite page listeners

		// Server sends initial page data to Firebase
		GLOB.inviteServerRef.on('child_added', function(childSnapshot, prevChildName) {
		// Assign snapshot JSON to a variable
			var val = childSnapshot.val();
		// Display the page data from the snapshot to populate start time and distance from current location.
			$('#partyTime').html(val.partyTimeMsg);
			$('#partyDistance').html(val.partyDistanceMsg);
		});

		// Server changes page data
		GLOB.inviteServerRef.on('child_changed', function(childSnapshot, prevChildName) {
		// Assign snapshot JSON to a variable
			var val = childSnapshot.val();
		// Display the page data from the snapshot to populate start time and distance from current location.
			$('#partyTime').html(val.partyTimeMsg);
			$('#partyDistance').html(val.partyDistanceMsg);
		});

		// inTransit page listeners

		// Server sends initial page data to Firebase
		GLOB.inTransitServerRef.on('child_added', function(childSnapshot, prevChildName) {
		// Assign snapshot JSON to a variable
			var val = childSnapshot.val();
			// Display the venue location data from the snapshot to populate the countdown, venue name, 
			// address, city, state, zip and phone number. The countdown timer uses the Countdown plugin 
			// by Keith Wood. Specs and API can be found at http://keith-wood.name/countdown.html
			if (val.countdownTimerMsg != "") {
				// If a value was previously set, initialize the timer before sending a new value	
				$('#countdownTimer').countdown('destroy');
				$('#countdownTimer').countdown({until: +val.countdownTimerMsg, compact:true, format: 'MS', onExpiry:cli_inTransitProximityTimeout});
			};
			$('#partyNameText').html(val.partyNameMsg);
			$('#partyAddress1Text').html(val.partyAddress1Msg);
			$('#partyAddress2Text').html(val.partyAddress2Msg);
			$('#partyCityText').html(val.partyCityMsg);
			$('#partyStateText').html(val.partyStateMsg);
			$('#partyZipText').html(val.partyZipMsg);
			$('#partyPhoneText').html(val.partyPhoneMsg);
			//Populate the 'tel:' link reference
			$('#partyPhoneLinkText').attr('href','tel:'+ val.partyPhoneLinkMsg);
			// Populate the map thumbnail image
			$('#partyMap').attr('src', val.partyMapImageMsg);
			// Populate the map link reference
			$('#mapLink').attr('href', val.partyMapLinkMsg);
		});

		// Server changes page data
		GLOB.inTransitServerRef.on('child_changed', function(childSnapshot, prevChildName) {
		// Assign snapshot JSON to a variable
			var val = childSnapshot.val();
			// Display the venue location data from the snapshot to populate the countdown, venue name, 
			// address, city, state, zip and phone number. The countdown timer uses the Countdown plugin 
			// by Keith Wood. Specs and API can be found at http://keith-wood.name/countdown.html
			if (val.countdownTimerMsg != "") {
				// If a value was previously set, initialize the timer before sending a new value	
				$('#countdownTimer').countdown('destroy');
				$('#countdownTimer').countdown({until: +val.countdownTimerMsg, compact:true, format: 'MS', onExpiry:cli_inTransitProximityTimeout});
			};
			$('#partyNameText').html(val.partyNameMsg);
			$('#partyAddress1Text').html(val.partyAddress1Msg);
			$('#partyAddress2Text').html(val.partyAddress2Msg);
			$('#partyCityText').html(val.partyCityMsg);
			$('#partyStateText').html(val.partyStateMsg);
			$('#partyZipText').html(val.partyZipMsg);
			$('#partyPhoneText').html(val.partyPhoneMsg);
			//Populate the 'tel:' link reference
			$('#partyPhoneLinkText').attr('href','tel:'+ val.partyPhoneLinkMsg);
			// Populate the map thumbnail image
			$('#partyMap').attr('src', val.partyMapImageMsg);
			// Populate the map link reference
			$('#mapLink').attr('href', val.partyMapLinkMsg);
		});

		// atParty page listeners

		// There is no page data required before loading this page.

		// Server response to 'Pause Matches' request
		GLOB.atPartyServerRef.child('pause').on('child_added', function(childSnapshot, prevChildName) {
			var val = childSnapshot.val();
			sys_closeWaiting();
				if (val == true) {			
				$('#atPartyIntroPaused').show();
				$('#atPartyIntro').hide();
			};
			if (val == false) {	
				$('#atPartyIntroPaused').hide();
				$('#atPartyIntro').show();
			};
		});

		// Server response to 'Pause Matches' request
		GLOB.atPartyServerRef.child('pause').on('child_changed', function(childSnapshot, prevChildName) {
			var val = childSnapshot.val();
			sys_closeWaiting();
				if (val == true) {			
				$('#atPartyIntroPaused').show();
				$('#atPartyIntro').hide();
			};
			if (val == false) {	
				$('#atPartyIntroPaused').hide();
				$('#atPartyIntro').show();
			};
		});

		// Server adds an otherUser to the atParty list
		// This listener dynamically creates the thumbnail of an otherUser for display in the party list 
		// including image, name, age, rating, and a link to the rateOtherUser page. Description is also
		// carried into the div for use in rateOtherUser and Match pages but is hidden here.
		// These data elements will also be used for potential creation of rateOtherUser and Match pages.		
		GLOB.atPartyOtherUserRef.on('child_added', function(childSnapshot, prevChildName) {
			var val = childSnapshot.val();
			// Retrieve the Unique ID, which is the key value for the dataset. The UID is incorporated into 
			// all data elements needed for display of otherUser data. For example, the ID for an image tied
			// to a unique ID with value 'UID1' is 'imageUID1'.
			var UID = childSnapshot.key();
			// Insert the div after div partyList. This div contains the sample code mentioned above.
			$('#atPartyList').after(
				// Create the link to the rateOtherUser page for this attendee and use the attendee's unique ID to label the link ID.
				"<a href='#atPartyWaiting' id='link" + UID + "' data-rel='popup' data-position-to='window' onClick='usr_atPartyRateOtherUser(&#34;" + UID + "&#34; );'>" + 
					// Create the outer div of the thumbnail and use the attendee's unique ID to label the div ID.	
					"<div class='otherUserWrapper' id='div" + UID + "' style='hidden'>" + 
						// Insert the image and use the attendee's unique ID to label the imageID.
						"<img src='" + val.otherUserImageMsg + "' class='thumbnail' id='image" + UID + "'>" + 
						// Create the internal div element that contains the name, age, and rating element.
						"<div class='description'><span class='description_content'>" + 
							// Use the otherUser's uniqueID to label the name span ID
							"<span id='name" + UID + "'>" + 
								val.otherUserNameMsg +
							"</span>, " + 
							// Use the attendee's unique ID to label the attendee age span ID
							"<span id='age" + UID + "'>" +
							// Insert the attendee's age
								val.otherUserAgeMsg +
							"</span><br>" +
							// Use the otherUser's unique ID to label the attendee rating span ID. Once
							// the div is constructed we'll populate this span with the otherUser's rating
							// using sys_globalRateDisplay.
							"<span class='rating' id='rating" + UID + "'></span>" + 
							// Store the numerical value of the rating for use by rateOtherUser page
							"<span id='ratingNumber" + UID + "' class='hidden'>" + val.otherUserRatingMsg + "</span>" + 
							// Create a hidden div to contain the attendee's description to carry 
							// into #rateOtherUser and #match pages.
							"<span id='desc" + UID + "' class='hidden'>" + val.otherUserDescMsg + "</span></span>" + 
						"</div>" + 
					"</div>"  +
				"</a>"
			);

			// Update the rating display element with the converted rating value
			sys_globalRateDisplay(val.otherUserRatingMsg, UID);	
			// Fade in the thumbnail
			$('#div' + UID).fadeIn(500);
		});

		// Server changes one or more elements of data for user with a unique ID.
		// These data elements will also be used for potential creation of rateOtherUser and Match pages.		
		GLOB.atPartyOtherUserRef.on('child_changed', function(childSnapshot, prevChildName) {
			var val = childSnapshot.val();
			// Retrieve the Unique ID, which is the key value for the dataset. The UID is incorporated into 
			// all data elements needed for display of otherUser data. For example, the ID for an image tied
			// to a unique ID with value 'UID1' is 'imageUID1'.
			var UID = childSnapshot.key();
			// Update the Name display element with the new Name value
			$('#name' + UID).html(val.otherUserNameMsg);
			// Update the Age display element with the new Age value
			$('#age' + UID).html(val.otherUserAgeMsg);
			// Update the Rating display element with the new Rating value
			sys_globalRateDisplay(val.otherUserRatingMsg, UID);	
			// Update the Image display element with the new Image value
			$('#image' + UID).attr('src', val.otherUserImageMsg );
			// Update the Image display element with the new Image value
			$('#desc' + UID).html(val.otherUserDescMsg);
			// Check if this otherUser's curretnly being rated by the User, by checking if the 
			// rateOtherUser page is currently the active page. If so, pass on the changed field
			// to the rateOtherUser page.	
			var currentPage = $.mobile.activePage.attr('id');	
			if (currentPage == "rateOtherUser") {		
				var rateOtherUserUID = $("#rateOtherUserUID").html();
				if (UID == rateOtherUserUID) {			
					// Update the Name display element with the new Name value
					$('#rateOtherUserName').html(val.otherUserNameMsg);
					// Update the Age display element with the new Age value
					$('#rateOtherUserAge').html(val.otherUserAgeMsg);
					// The server is not expected to ever change a rating for an existing otherUser.
					// Update the Image display element with the new Image value
					$('#rateOtherUserImage').attr('src', val.otherUserImageMsg );
					// Update the Image display element with the new Image value
					$('#rateOtherUserDesc').html(val.otherUserDescMsg);			
				}
			}
			// Check if this otherUser's curretnly matched with the User, by checking if the 
			// match page is currently the active page. If so, pass on the changed field
			// to the match page.				
			if (currentPage == "match") {			
				var matchUID = $("#matchUID").html();
				if (UID == matchUID) {			
				// Update the Name display element with the new Name value
					$('#matchName').html(val.otherUserNameMsg);
				// Update the Age display element with the new Age value
					$('#matchAge').html(val.otherUserAgeMsg);
				// The server is not expected to ever change a rating for an existing otherUser.
				// Update the Image display element with the new Image value
					$('#matchImage').attr('src', val.otherUserImageMsg );
				// Update the Image display element with the new Image value
					$('#matchDesc').html(val.otherUserDescMsg);			
				}
			}
		});

		// Server removes an otherUser from the atParty list
		GLOB.atPartyOtherUserRef.on('child_removed', function(oldChildSnapshot) {
			// Retrieve the Unique ID, which is the key value for the dataset and used as 
			// the data identifier for the entire thumbnail set.
			var UID = oldChildSnapshot.key();
			// Remove the link to the rateOtherUser page for this ID
			$('#div' + UID).unwrap();			
			// Remove the thumbnail with a fade out so it's clear to the user that the system 
			// is deliberately removing the otherUser
			$('#div' + UID).fadeOut(500, function() { $(this).remove(); });
		});

		// Server sends a message to open or close a 'Better Party' overlay
		GLOB.atPartyServerRef.child('betterParty').on('child_added', function(childSnapshot, prevChildName) {
			var val = childSnapshot.val();
			// If Better_party = true, open the 'Better Party' dialog
			if (val == true) {
				// Close the Waiting overlay if it's open
				sys_closeWaiting();
				// Close the Help overlay if it's open
				$('#atPartyHelp').popup('close');
				// Open the 'Better Party' dialog on a delay to avoid collision if the above overlays are closing
				setTimeout (function(){
					$('#betterParty').popup("open");
				}, 500)
			};
			// If Better_party = false, close the 'Better Party' dialog
			if (val == false) {			
				$('#betterParty').popup("close");
			};
		});

		// Server sends a message to open or close a 'Better Party' overlay
		GLOB.atPartyServerRef.child('betterParty').on('child_changed', function(childSnapshot, prevChildName) {
			var val = childSnapshot.val();
			// If Better_party = true, open the 'Better Party' dialog
			if (val == true) {
				// Close the Waiting overlay if it's open
				sys_closeWaiting();
				// Close the Help overlay if it's open
				$('#atPartyHelp').popup('close');
				// Open the 'Better Party' dialog on a delay to avoid collision if the above overlays are closing
				setTimeout (function(){
					$('#betterParty').popup("open");
				}, 500)
			};
			// If Better_party = false, close the 'Better Party' dialog
			if (val == false) {			
				$('#betterParty').popup("close");
			};
		});

		// rateOtherUser page listeners

		// Server sends a unique ID which is used to populate the rateOtherUser page.
		GLOB.rateOtherUserServerRef.child('pageData').on('child_added', function(childSnapshot, prevChildName) {
			// Retrieve the unique ID from the Firebase message
			var UID = childSnapshot.val();
			// Use the unique ID and use it to identify the current instance of the page. This will be needed 
			// when the client returns the rating for this otherUser.
			$('#rateOtherUserUID').html( UID );
			// Retrieve the existing data from the thumbnail on the atParty page and populate the corresponding
			// rateOtherUser page component 
			var otherUserImage  = $('#image' + UID ).attr('src')
			$('#rateOtherUserName').html( $('#name' + UID).html() );
			$('#rateOtherUserAge').html( $('#age' + UID).html() );					
			$('#rateOtherUserImage').attr('src', otherUserImage );
			$('#rateOtherUserDesc').html( $('#desc' + UID).html() );
			// Retrieve the string denoting the value for the current rating
			var rateOtherUserRateVal = $("#ratingNumber" + UID).html()
	 		// Populate the corresponding page element.
			$(document).on("pageinit", "#rateOtherUser", function () {
				$('#rateOtherUserRating').val( rateOtherUserRateVal ).selectmenu("refresh", true);
				// If rateOtherUserRatingMsg has a value of -1, that means the otherUser hasn't been rated by the user yet
				// and the 'submit' button should be disabled.
				if (rateOtherUserRateVal == "-1"){
					$('#ratingSubmit').button('disable');
				};
				// Otherwise the value must be between 0 and 5 inclusive. If rateOtherUserRatingMsg falls in that range,
				// the user has previously rated this otherUser and the 'submit' button should be enabled.
				if ( (rateOtherUserRateVal > "-1") && (rateOtherUserRateVal < "6") ) {
					$('#ratingSubmit').button('enable');
				};
			});
		});

		// Server sends a new unique ID which is used to repopulate the rateOtherUser page.
		GLOB.rateOtherUserServerRef.child('pageData').on('child_changed', function(childSnapshot, prevChildName) {
			// Retrieve the unique ID from the Firebase message
			var UID = childSnapshot.val();
			// Use the unique ID and use it to identify the current instance of the page. This will be needed 
			// when the client returns the rating for this otherUser.
			$('#rateOtherUserUID').html( UID );
			// Retrieve the existing data from the thumbnail on the atParty page and populate the corresponding
			// rateOtherUser page component 
			var otherUserImage  = $('#image' + UID ).attr('src')
			$('#rateOtherUserName').html( $('#name' + UID).html() );
			$('#rateOtherUserAge').html( $('#age' + UID).html() );					
			$('#rateOtherUserImage').attr('src', otherUserImage );
			$('#rateOtherUserDesc').html( $('#desc' + UID).html() );
			// Retrieve the string denoting the value for the current rating
			var rateOtherUserRateVal = $("#ratingNumber" + UID).html()
	 		// Populate the corresponding page element.
			$('#rateOtherUserRating').val( rateOtherUserRateVal ).selectmenu("refresh", true);
			// If rateOtherUserRatingMsg has a value of -1, that means the otherUser hasn't been rated by the user yet
			// and the 'submit' button should be disabled.
			if (rateOtherUserRateVal == "-1"){
				$('#ratingSubmit').button('disable');
			};
			// Otherwise the value must be between 0 and 5 inclusive. If rateOtherUserRatingMsg falls in that range,
			// the user has previously rated this otherUser and the 'submit' button should be enabled.
			if ( (rateOtherUserRateVal > "-1") && (rateOtherUserRateVal < "6") ) {
				$('#ratingSubmit').button('enable');
			};
		});

		// match page listeners

		// Server sends a unique ID which is used to populate the match page.
		GLOB.matchServerRef.child('pageData').on('child_added', function(childSnapshot, prevChildName) {
			// Retrieve the unique ID from the Firebase message
			var UID = childSnapshot.val();
			// Retrieve the existing data from the thumbnail on the atParty page and populate the corresponding
			// Match page component 
			var matchImg  = $('#image' + UID ).attr('src')
			$('#matchUID').html( UID );
			$('#matchName').html( $('#name' + UID).html() );
			$('#matchAge').html( $('#age' + UID).html() );					
			$('#matchImage').attr('src', matchImg );
			$('#matchDesc').html( $('#desc' + UID).html() );
		});

		// Server sends another unique ID which is used to repopulate the match page.
		GLOB.matchServerRef.child('pageData').on('child_changed', function(childSnapshot, prevChildName) {
			// Retrieve the unique ID from the Firebase message
			var UID = childSnapshot.val();
			// Retrieve the existing data from the thumbnail on the atParty page and populate the corresponding
			// Match page component 
			var matchImg  = $('#image' + UID ).attr('src')
			$('#matchUID').html( UID );
			$('#matchName').html( $('#name' + UID).html() );
			$('#matchAge').html( $('#age' + UID).html() );					
			$('#matchImage').attr('src', matchImg );
			$('#matchDesc').html( $('#desc' + UID).html() );
		});

		// profile page listeners

		// Server sends existing profile data to Firebase
		GLOB.profileServerRef.on('child_added', function(childSnapshot, prevChildName) {
			var val = childSnapshot.val();
			// Prepopulate profile form fields with existing profile data
			$('#profileName').val(val.profileNameMsg);
			$('#profileDesc').val(val.profileDescMsg);
			$('#profileImage').attr('src', val.profileImageMsg);
			// Initialize the age sliders			
			$(document).on('pagebeforeshow', '#profile',function(){ 
				// Populate the age sliders with values from the Firebase message      
				$('#profileAge').val(val.profileAgeMsg);
				$('#minAge').val(val.minAgeMsg);
				$('#maxAge').val(val.maxAgeMsg);
				// Refresh the sliders. Unlike most form and page elements, the sliders must be manually refreshed.
				$('#profileAge').slider('refresh');
				$('#minAge').slider('refresh');
				$('#maxAge').slider('refresh');
			});
		});

		// Server updates profile image
		GLOB.profileServerRef.on('child_changed', function(childSnapshot, prevChildName) { 
			var val = childSnapshot.val();
			// Add or replace the current profile image with the new profile image
			$('#profileImage').attr('src', val.profileImageMsg);
		});

		// imageUpload page listeners

		// Server sends imageUpload page data. The pageinit event handler is required for the plugin to function properly, 
		// so the .export event is included here as part of the plugin function set.
		$(document).on("pageinit", "#imageUpload", function () {
			GLOB.imageUploadServerRef.on('child_added', function(childSnapshot, prevChildName) {
				var val = childSnapshot.val();
				// The imageUpload page uses the Cropit image upload plugin by Scott Cheng. This allows the user to open
				// an image from their device and then zoom, pan, crop, and upload it to Firebase. For API and details 
				// on its use, refer to http://scottcheng.github.io/cropit/
				// Function to execute the Cropit plugin
				$('.image-editor').cropit({
					// Post an image to the page display. Val is the variable representing the childSnapshot data 
					// from the Firebase initialization message.
					imageState: {
						src: val.currentImageMsg
					},
					// If an image is already at full resolution, the plugin disables the zoom slider, so hide it.
					onZoomDisabled:function(){			
						$('#zoomElement').hide();
					},
					// If an image can be zoomed, display the zoom slider.
					onZoomEnabled:function(){
						$('#zoomElement').show();
					},
					// The 'Save profile photo' button is enabled when a new image is uploaded.
					onFileChange:function(){								
						$('#imageUploadSave').button('enable');
					}
				});
				if (val.hideCancelButtonMsg == true) {
					$('#imageUploadCancel').button('disable');
				};
				if (val.hideCancelButtonMsg == false) {
					$('#imageUploadCancel').button('enable');
				};
			});

			// Server changes imageUpload page data
			GLOB.imageUploadServerRef.on('child_changed', function(childSnapshot, prevChildName) {
				var val = childSnapshot.val();
				// The imageUpload page uses the Cropit image upload plugin by Scott Cheng. This allows the user to open
				// an image from their device and then zoom, pan, crop, and upload it to Firebase. For API and details 
				// on its use, refer to http://scottcheng.github.io/cropit/
				// Function to execute the Cropit plugin
				$('.image-editor').cropit({
					// Post an image to the page display. Val is the variable representing the childSnapshot data 
					// from the Firebase initialization message.
					imageState: {
						src: val.currentImageMsg
					},
					// If an image is already at full resolution, the plugin disables the zoom slider, so hide it.
					onZoomDisabled:function(){			
						$('#zoomElement').hide();
					},
					// If an image can be zoomed, display the zoom slider.
					onZoomEnabled:function(){
						$('#zoomElement').show();
					},
					// The 'Save profile photo' button is enabled when a new image is uploaded.
					onFileChange:function(){								
						$('#imageUploadSave').button('enable');
					}
				});
				if (val.hideCancelButtonMsg == true) {
					$('#imageUploadCancel').button('disable');
				};
				if (val.hideCancelButtonMsg == false) {
					$('#imageUploadCancel').button('enable');
				};
			});

			// Cropit function called when the user clicks 'Save profile photo'
			$('.export').click(function() {
				var imageData = $('.image-editor').cropit('export');
				// window.open(imageData);
				GLOB.imageUploadClientRef.push( { New_profile_image : imageData } );
			});
				// Disable the 'Save profile photo' button when the plugin is initialized.
			$('#imageUploadSave').button('disable');
		});
	};


// CLIENT FIREBASE FUNCTIONS

	// Global client Firebase functions
	
	// User clicks 'profile', requesting access to the Profile page.
	$(document).on( "click", ".profileButton", function() {
		// send Open_profile message with 'true' value to Firebase
		GLOB.globalClientRef.push( { Open_profile : true } );
	});

	// User clicks on an inline alert to request that it be closed.
	$(document).on( "click", ".alertWrapper", function() {
		// Open the waiting overlay. Unlike the other functions, this is not triggered by an anchor link.
		// Anchor links trigger the waiting overlay using the HREF="" tag in the HTML. So we have to call 
		// the Waiting overlay from here instead.
		sys_openWaiting();
		var currentPage = $.mobile.activePage.attr('id')
		// send Close_alert message with 'true' value to Firebase
		GLOB.globalClientRef.push( { Close_alert : true } );
	});

	// newUser page client Firebase functions

	// Send a message to Firebase with the client device's unique ID. 
	// This function is called when the user clicks "Join the party" from the newUser page.
	$(document).on( "click", "#joinParty", function() {
		GLOB.newUserIdRequestRef.push( { "deviceUuid" : GLOB.deviceUuid } );
	});

	// Paid user authentication
	// If a paid user migrates to a new device or factory resets an existing device, or otherwise removes the authentication
	// token from localStorage, the server will need to reauthenticate to restore their credits and profile info. The 
	// user triggers this function from the newUser page by submitting the email address and the last four digits of the 
	// credit card used to purchase credits. The server responds to a valid submission by sending an authentication token.
	function restorePaidUser( formObj ) {
		// Check if either field was left blank.
		if (($('#creditEmail').val() == "") || ($('#creditLast4').val() == "")) {
		// Since the default action is to open the Waiting overlay, we want to close it when displaying the error,
		// allowing the user to fill the required field and resubmit.
			$.mobile.loading('hide')
//			$('#newUserManualAlertText').html("You left a required field blank. Please fill in the blank and try again.");				
			$(newUserManualAlertWrapper).show();
			// Use this to adjust the height of the space allocated to the alert so that 
			// it never covers the page text or elements below it.
			var containerHeight = $(".alert").height()
			var containerHeightTrim = parseInt(containerHeight) + 37;			
			$('.alertWrapper').css("height", containerHeightTrim);
		} else {
			// Send a message to the server with the client device's UUID, the entered email address and 
			// last 4 digits of the paid user's credit card
			$('.manualAlertWrapper').hide();
			$.mobile.loading('show', {text:"Waiting...", textVisible: true});
			GLOB.newUserIdRequestRef.push( {  
				"deviceUuid" : GLOB.deviceUuid,
				"payEmail" : $('#creditEmail').val(),
				"payCard" : $('#creditLast4').val(),
			} ); 
		}
		return false; // We don't want the form to trigger a page load. We want to do that through js. 
	}

	// imageUpload page client Firebase functions

	// User cancels the image upload
	$(document).on( "click", "#imageUploadCancel", function() {
		// send a message to Firebase requesting return to the Profile page
		GLOB.imageUploadClientRef.push( { Return_toProfile : true } );
	});

	// profile page client Firebase functions

	// User submits updated profile form
		function usr_profileUpdate() {
			// Send the data in the form to Firebase
			// Check if either field was left blank.
			if (($('#profileName').val() == "") || ($('#profileAge').val() == "")) {
			// If yes, hide the waiting overlay and display an alert notifying the user.
				$.mobile.hidePageLoadingMsg();
				$(profileManualAlertWrapper).show();				
			} else {
				// Send profile data to Firebase
				$(profileAlertWrapper).hide();
				GLOB.profileClientRef.push( {
					profileUpdate : true,
					newProfileName : $('#profileName').val(),
					newProfileAge : $('#profileAge').val(),
					newProfileMinAge : $('#minAge').val(),
					newProfileMaxAge : $('#maxAge').val(),
					newProfileDesc : $('#profileDesc').val(),
				}); 
			};
			return false; // We don't want the form to trigger a page load. We want to do that through js. 
		}

	// User requests to upload a new profile image.
		$(document).on( "click", "#profileUploadButton", function() {
		// send Change_image message with a value of 'true'
			GLOB.profileClientRef.push( { Change_image : true } );
		});

	// User opts to close the Profile page and requests a response from the server.
		$(document).on( "click", "#profileClose", function() {
		// send Close_profile message with a value of 'true'
			GLOB.profileClientRef.push( { Close_profile : true } );
		});
	// home page client Firebase functions

	// User selects 'Buy credits', requesting server response
	$(document).on( "click", "#homeBuyCredits", function() {
		// send homeBuyCredits message with 'true' value to Firebase
		GLOB.homeClientRef.push( { homeBuyCredits : true } );
	});

	// User selects 'Find a party', requesting server response
	$(document).on( "click", "#homeFindParty", function() {
		// send Find_party message with 'true' value to Firebase
		GLOB.homeClientRef.push( { Find_party : true } );
	});

	// invite page client Firebase functions

	// User selects 'Decline invitation', requests server response
		$(document).on( "click", "#inviteDecline", function() {
		// send Decline_invitation message with 'true' value to Firebase
			GLOB.inviteClientRef.push( { Decline_invitation : true } );
		});

	// User accepts an invitation
		$(document).on( "click", "#inviteAccept", function() {
		// send Accept_invitation message with 'true' value to Firebase
			GLOB.inviteClientRef.push( { Accept_invitation : true } );
		});

	// inTransit page client Firebase functions

	// This function is triggered when client countdown reaches zero before the user arrives at the destination
		function cli_inTransitProximityTimeout() {
			// open Waiting overlay
			sys_openWaiting();
			// send clientProximityTimeout message with 'true' value to Firebase
			GLOB.inTransitClientRef.push( { clientProximityTimeout : true } );
		}

	// Client cancels the party invitation
		$(document).on( "click", "#confirmCancelInvite", function() {
			// Close the confirmation popup
			$( "#userCancel" ).popup( "close" );
			// Send the server a message that user cancelled the party invitation
			GLOB.inTransitClientRef.push( { Cancel_invitation : true } );
		});

	// Client opened the 'cancel party' overlay but decides to close the overlay instead. No message sent to Firebase.
		$(document).on( "click", "#returnToinTransit", function() {
			// Close the confirmation popup
			$( "#userCancel" ).popup( "close" );
		});

	// atParty page client Firebase functions

	// Client pauses matches at the party
		$(document).on( "click", "#pause", function() {
			// send Pause_matches message with 'true' value to Firebase
			GLOB.atPartyClientRef.push( { Pause_matches : true } );
		});

	// Client resumes matches at the party
		$(document).on( "click", "#endPause", function() {
			// send Pause_matches message with 'false' value to Firebase
			GLOB.atPartyClientRef.push( { Pause_matches : false } );
			return false;
		});

	// Client leaves party
		$(document).on( "click", "#leavePartyConfirm", function() {
		// close the 'leave party' dialog
			$('#leavePartyDialog').popup('close');
		// send Leave_party message with 'true' value to Firebase
			GLOB.atPartyClientRef.push( { Leave_party : true } );
		});

	// Client opens 'leave party' dialog but chooses not to leave party
		$(document).on( "click", "#leavePartyCancel", function() {
		// close the 'leave party' dialog
			$('#leavePartyDialog').popup('close');
		});

	// Client declines a 'Better Party' invitation 
		$(document).on( "click", "#stayHere", function() {
			// Close the 'Better Party' popup
			$(betterParty).popup('close');
			// Open the Waiting overlay on a delay to give time to close the 'Better Party' overla
			setTimeout ("sys_openWaiting();", 250);
			// send Decline_betterParty message with 'true' value to Firebase
			GLOB.atPartyClientRef.push( { Decline_betterParty : true } );
		});

	// Client accepts a 'Better Party' invitation
		$(document).on( "click", "#goBetterParty", function() {
			// Close the 'Better Party' popup
			$(betterParty).popup('close');
			// Open the Waiting overlay on a delay to give time to close the 'Better Party' overla
			setTimeout ("sys_openWaiting();", 250);
			// send Accept_betterParty message with 'true' value to Firebase
			GLOB.atPartyClientRef.push( { Accept_betterParty : true } );
		});

	// Client selects an otherUser to open the rateOtherUser page. Because the thumbnails that execute
	// this are dynamically created, we use the onClick event to call this function.
		function usr_atPartyRateOtherUser( jsonUID ) {
			// Open the Waiting overlay
			sys_openWaiting();
			// send Rate_otherUser message with the selected otherUser ID value to Firebase
			GLOB.atPartyClientRef.push( { Rate_otherUser : jsonUID } );
		}

	// rateOtherUser page client Firebase functions

	// User rates an otherUser
		$(document).on( "click", "#ratingSubmit", function() {
			// Retrieve the new rating from the selected value of the Rating select menu
			var newRating = $('#rateOtherUserRating').val();
			// send New_otherUserRating message with the numerical rating value to Firebase
			GLOB.rateOtherUserClientRef.push( { New_otherUserRating : newRating } );
		});

	// User reports offensive behavior
		$(document).on( "click", "#rateOtherUserConfirmTOS", function() {
			// close the TOS dialog
			$('#rateOtherUserTOSDialog').popup('close')
			// Retrieve the otherUser's unique ID
			var UID = $('#rateOtherUserUID').html();
			// send New_otherUserRating message with the numerical rating value to Firebase
			GLOB.rateOtherUserClientRef.push( { rateOtherUser_TOSViolation : UID } );
		});

	// User opens 'report offensive behavior' dialog but decides to close the dialog instead
		$(document).on( "click", "#rateOtherUserCancelTOS", function() {
			// close the TOS dialog
			$('#rateOtherUserTOSDialog').popup('close')
			// Retrieve the otherUser's unique ID
			var UID = $('#rateOtherUserUID').html();
		});

	// match page client Firebase functions

	// User closes a match
		$(document).on( "click", "#matchDoneConfirm", function() {
		// close the confirmation dialog
			$('#matchDone').popup('close')
		// send Close_match message to Firebase with value 'true'
			GLOB.matchClientRef.push( { Close_match : true } );
		});

	// User opened the 'close match dialog' but stays on the match page instead. No message sent to Firebase.
		$(document).on( "click", "#matchDoneCancel", function() {
		// close the confirmation dialog
			$('#matchDone').popup('close')
		});

	// User can't find a match
		$(document).on( "click", "#cantFindConfirm", function() {
		// close the confirmation dialog
			$('#cantFindMatch').popup('close')
		// send Cant_find_match message to Firebase with value 'true'
			GLOB.matchClientRef.push( { Cant_find_match : true } );
		});

	// User opens the 'can't find match' dialog but decides to close the dialog instead. No message sent to Firebase.
		$(document).on( "click", "#cantFindCancel", function() {
		// close the confirmation dialog
			$('#cantFindMatch').popup('close')
		});

	// User reports offensive behavior
		$(document).on( "click", "#matchConfirmTOS", function() {
		// close the TOS dialog
			$('#matchTOSDialog').popup('close')
		// Retrieve the otherUser's unique ID
			var UID = $('#matchUID').html();
		// send match_TOSViolation message with the otherUser's ID to Firebase
			GLOB.matchClientRef.push( { match_TOSViolation : UID } );
		});

	// User opens 'report offensive behavior' dialog but chooses to cancel instead. No message sent to Firebase.
		$(document).on( "click", "#matchCancelTOS", function() {
		// close the TOS dialog
			$('#matchTOSDialog').popup('close')
		});

// INITIALIZATION

	// Since deviceReady is now the last event called on initialization, authentication and pageReady 
	// functions have been deferred to the deviceReady event. We will still remove any previous listeners
	// ahead of the deviceReady event being called.

		function initialize() {
			// Remove any previous listeners
			GLOB.first30SecondsRef.off();
			GLOB.first30SecondsRef.remove();

		}

		window.onload = initialize();