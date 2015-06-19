// HOUSEKEEPING FUNCTIONS FOR PROGRAMMING PURPOSES

	// Create a global variable array to separate our globals from the rest of the DOM.
	GLOB = [];
	// Set the global variable for android device UUID
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


// SCRIPTS TO HANDLE "WAITING" LOADER
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

.on( "click", ".hide-page-loading-msg", function() {
  $.mobile.loading( "hide" );
});




// SCRIPTS TO SUPPORT PLUGINS AND AUTHENTICATION

	// Set the initial Firebase reference based on whether the client is authenticated or not.
		// Retrieve the value stored with the key "f30sUserId" in localStorage. This is a value sent 
		// by the f30s server to the client via Firebase as an authentication token.
		GLOB.currentUserId = window.localStorage.getItem("f30sUserId");
		// If there's already a value for f30sUserId in localStorage:
		if (GLOB.currentUserId != null) {
			// Redefine the primary reference to use the f30UserID value as the primary Firebase reference for all 
			// client-server communications.
			var first30SecondsRef = new Firebase('https://f30s.firebaseio.com/' + GLOB.currentUserId)
			var pageReadyRef = first30SecondsRef.child('pageReady');
		// If there's no value, the user has not been authenticated, so we'll create an arbitrary Firebase reference
		// so the DOM can load.
		} else {
			// create an arbitrary reference so the DOM can load. This reference won't be used by the client and will
			// be reset once the client is authenticated.
			var first30SecondsRef = new Firebase('https://f30s.firebaseio.com/placeholder');
		};

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
				GLOB.newUserIdResponseRef = new Firebase('https://f30s.firebaseio.com/' + device.uuid);
				// Create a listener based on this reference. Since it's unique, the server will use it to send an authentication
				// token to the device. 
				GLOB.newUserIdResponseRef.on('child_added', function(childSnapshot, prevChildName) {
					var val = childSnapshot.val();
					// Place the received authentication token in localStorage
					window.localStorage.setItem("f30sUserId", val);
					// For test purposes, change to the splash page. Refer to the first30Seconds logic table to determine which page
					// should be the destination on completion of this function.
					$.mobile.changePage("#splash")
					// Re-initialize the web code (HTML, javascript, css, etc.) to reset all Firebase references 
					// using the token as the top-level identifier. 
					document.location.reload(true);
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
 		var globalClientDeviceIDRef = first30SecondsRef.child('global/clientEvents/GCMPushNotificationsID');
			
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
 							pageReadyRef.push( { "GCM_Push_Notifications_Id" : e.regid } );
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

	// Stripe Checkout 
		// Firebase reference for Stripe-related messages generated by the client.
		var stripeClientRef = first30SecondsRef.child('Stripe/clientEvents');
		// Firebase reference for Stripe to send a pay token after a successful purchase.
		var stripeTokenRef = first30SecondsRef.child('Stripe/payTokens');

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
					stripeClientRef.push( { Checkout_open : true } );
				},
				// When a stripe overlay is closed by the user, a message is sent to Firebase to notify the server. 
				// This helps reduce the potential for asynchronous conflicts.
				closed: function() {
					stripeClientRef.push( { Checkout_open : false } );
				},
				// Generate a pay token (token.id) when the purchase is successfully completed.
				// Use the token to create the charge with a server-side script.
				token: function(token) {
					stripeTokenRef.push( { "payToken" : token.id , "payCard" : token.card.last4 , "purchaseEmail" : token.email} );
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
			// Otherwise, the value will be 1 - 5, which will be converted to a string of the symbol 
			// '♥' of the corresponding length. For example, a rating of 3 will display as ♥♥♥.
			if ( (jsonRating > '0') && (jsonRating < '6') ) {
				var newHearts = Array(+ jsonRating + 1).join("♥");
				// Display the string created on the atParty page.
				$('#rating' + UID).html( newHearts );
			}		
		}

	// changePage functions
		// Firebase reference for currentPage messages. These set the currently displayed page within the app.
		var globalServerRef = first30SecondsRef.child('global/serverEvents');

		// Server sets initial page to be displayed
			globalServerRef.child('currentPage').on('child_added', function(childSnapshot, prevChildName) {
				// Retrieve the JSON string stored in alertMsg	
				var val = childSnapshot.val();
				// If a message to change the current page is received, change to that page.	
				$.mobile.changePage("#" + val);					
			});

		// Server changes page to be displayed
			globalServerRef.child('currentPage').on('child_changed', function(childSnapshot, prevChildName) {
				// Retrieve the JSON string stored in alertMsg	
				var val = childSnapshot.val();
				$.mobile.changePage("#" + val);
			});

	// Waiting overlay functions
		// User or server opens Waiting overlay.
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

	// Alert functions
		// Firebase reference for server alert messages
		var globalServerAlertRef = first30SecondsRef.child('global/alerts');
		
		// Server creates an alert
			globalServerAlertRef.on('child_added', function(childSnapshot, prevChildName) {
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
			globalServerAlertRef.on('child_changed', function(childSnapshot, prevChildName) {
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

		// Manually close an alert. 
			// We need this for the newUser page: since there's no way for the server to know
			// if a faulty form submission was executed by an unauthenticated user, the user must close the alert manually.
			function manualAlertClose() {
				$('.alertWrapper').hide();
				$('.alert').html("");
			};

	// Stripe checkout functions
		// Firebase reference for server messages for the Stripe Checkout overlay. Though we're currently only using it 
		// on the Home page, the Stripe overlay can be called from any page, therefore we'll treat it as global.
		var globalServerStripeRef = first30SecondsRef.child('Stripe/serverEvents');

		// Server opens the Stripe overlay
			globalServerStripeRef.on('child_added', function(childSnapshot, prevChildName) {
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

	// Geolocation functions
		// Firebase references for server and client messages related to geolocation functions
		var globalServerGeoRef = first30SecondsRef.child('global/serverEvents/geolocation');	
		var globalClientGeoRef = first30SecondsRef.child('global/geolocation');

		// Server requests geolocation data from the client
			globalServerGeoRef.on('child_added', function(childSnapshot, prevChildName) {
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
			globalServerGeoRef.on('child_changed', function(childSnapshot, prevChildName) {
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
				globalClientGeoRef.push( { 'latitude' : lat, 'longitude' : lng } );
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

	// Firebase reference for global client-generated event messages. 
	var globalClientRef = first30SecondsRef.child('global/clientEvents');

	// User clicks 'Logout' and confirms via confirmation dialog, requesting a logout.
		function usr_logout() {
			// Open the "Waiting..." overlay, disabling user controls pending system response.
			// A setTimeout is required to avoid colliding with the confirmation dialog 
			// while it's closing.
			setTimeout ("sys_openWaiting();", 250);
			// Send logout message with 'true' value to Firebase
			globalClientRef.push( { logout : true } );
		}

	// User clicks 'profile', requesting access to the Profile page.
		function usr_openProfile() {
			// send Open_profile message with 'true' value to Firebase
			globalClientRef.push( { Open_profile : true } );
		}

	// User clicks on an inline alert to request that it be closed.
		function usr_closeAlerts() {
			// Open the waiting overlay. Unlike the other functions, this is not triggered by an anchor link.
			// Anchor links trigger the waiting overlay using the HREF="" tag in the HTML. So we have to call 
			// the Waiting overlay from here instead.
			sys_openWaiting();
			var currentPage = $.mobile.activePage.attr('id')
			// send Close_alert message with 'true' value to Firebase
			globalClientRef.push( { Close_alert : true } );
		}

// NEWUSER PAGE

	// newUser page references
		// Reference to send a user's unique device ID. This 
		var newUserIdRequestRef = new Firebase('https://f30s.firebaseio.com/newUserIdRequests/' );

	// Send a message to Firebase with the client device's unique ID. 
		//	This function is called when the user clicks "Join the party" from the newUser page.
		function newUserConfirmation() {
			newUserIdRequestRef.push( { "deviceUuid" : GLOB.deviceUuid } );
		};

	// Paid user authentication
		// If a paid user migrates to a new device or factory resets an existing device, or otherwise removes the authentication
		// token from localStorage, the server will need to reauthenticate to restore their credits and profile info. The 
		// user triggers this function from the newUser page by submitting the email address and the last four digits of the 
		// credit card used to purchase credits. The server responds to a valid submission by sending an authentication token.
		function restorePaidUser( formObj ) {
			// Check if either field was left blank.
			if (($('#creditEmail').val() == "") || ($('#creditLast4').val() == "")) {
			// If yes, display an alert notifying the user. No message is sent to Firebase.
				$.mobile.loading('hide')
				$('#newUserAlertText').html("You left a required field blank. Please fill in the blank and try again.");				
				$(newUserAlertWrapper).show();
				// Use this to adjust the height of the space allocated to the alert so that 
				// it never covers the page text or elements below it.
				var containerHeight = $(".alert").height()
				var containerHeightTrim = parseInt(containerHeight) + 37;			
				$('.alertWrapper').css("height", containerHeightTrim);
			} else {
				// Send a message to the server with the client device's UUID, the entered email address and 
				// last 4 digits of the paid user's credit card
				$('.alertWrapper').hide();
				$.mobile.loading('show', {text:"Waiting...", textVisible: true});
				newUserIdRequestRef.push( {  
					"deviceUuid" : GLOB.deviceUuid,
					"payEmail" : $('#creditEmail').val(),
					"payCard" : $('#creditLast4').val(),
				} ); 
			}
			return false; // We don't want the form to trigger a page load. We want to do that through js. 
		}

// HOME PAGE
	// Firebase reference for page data for Home page
	var homeServerRef = first30SecondsRef.child('pages/home/serverEvents');

	// Server sends initial page data to client
		homeServerRef.on('child_added', function(childSnapshot, prevChildName) {
			// Close Waiting overlay if it's open. If not, this command will be ignored.
			sys_closeWaiting();
			// Assign snapshot JSON to a variable
			var val = childSnapshot.val();
				// Update number of credits
			$('#homeCredits').html(val.creditsMsg);
			// If user has zero credits, the number of credits will be color coded red, the
			// "Find a Party" button will be disabled and additional instructional copy will appear.
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
		homeServerRef.on('child_changed', function(childSnapshot, prevChildName) {
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

	// Firebase reference for client-generated event messages. 
	var homeClientRef = first30SecondsRef.child('pages/home/clientEvents');

	// User selects 'Buy credits', requesting server response
		function usr_homeBuyCredits() {
			// send homeBuyCredits message with 'true' value to Firebase
			homeClientRef.push( { homeBuyCredits : true } );
		}

	// User selects 'Find a party', requesting server response
		function usr_homeFindParty() {
			// send Find_party message with 'true' value to Firebase
			homeClientRef.push( { Find_party : true } );
		}

// INVITE PAGE
	// Firebase reference for page data for Invite page
	var inviteServerRef = first30SecondsRef.child('pages/invite/serverEvents');

	// Server sends initial page data to Firebase
		inviteServerRef.on('child_added', function(childSnapshot, prevChildName) {
		// Assign snapshot JSON to a variable
			var val = childSnapshot.val();
		// Display the page data from the snapshot to populate start time and distance from current location.
			$('#partyTime').html(val.partyTimeMsg);
			$('#partyDistance').html(val.partyDistanceMsg);
		});

	// Server changes page data
		inviteServerRef.on('child_changed', function(childSnapshot, prevChildName) {
		// Assign snapshot JSON to a variable
			var val = childSnapshot.val();
		// Display the page data from the snapshot to populate start time and distance from current location.
			$('#partyTime').html(val.partyTimeMsg);
			$('#partyDistance').html(val.partyDistanceMsg);
		});

	// Firebase reference for client-generated event messages. 
	var inviteClientRef = first30SecondsRef.child('pages/invite/clientEvents');

	// User selects 'Decline invitation', requests server response
		function usr_inviteDecline() {
		// send Decline_invitation message with 'true' value to Firebase
			inviteClientRef.push( { Decline_invitation : true } );
		}

	// User accepts an invitation
		function usr_inviteAccept() {
		// send Accept_invitation message with 'true' value to Firebase
			inviteClientRef.push( { Accept_invitation : true } );
		}

// INTRANSIT PAGE
	// Firebase reference for page data for inTransit page
	var inTransitServerRef = first30SecondsRef.child('pages/inTransit/serverEvents')

	// Server sends initial page data to Firebase
		inTransitServerRef.on('child_added', function(childSnapshot, prevChildName) {
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

	// Server changes initial page data
		inTransitServerRef.on('child_changed', function(childSnapshot, prevChildName) {
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

	// Firebase reference for client-generated event messages. 
	var inTransitClientRef = first30SecondsRef.child('pages/inTransit/clientEvents');

	// Client's countdown stops before they arrive at the destination
		function cli_inTransitProximityTimeout() {
			// open Waiting overlay
			sys_openWaiting();
			// send clientProximityTimeout message with 'true' value to Firebase
			inTransitClientRef.push( { clientProximityTimeout : true } );
		}

	// Client cancels the party invitation
		function usr_inTransitConfirmCancellation() {
			// Close the confirmation popup
			$( "#userCancel" ).popup( "close" );
			// Send the server a message that user cancelled the party invitation
			inTransitClientRef.push( { Cancel_invitation : true } );
		}

// ATPARTY PAGE
	// There is no page data required before loading this page.
	// Firebase reference for atParty server events
	var atPartyServerRef = first30SecondsRef.child('pages/atParty/serverEvents/');

	// Listener: Server response to 'Pause Matches' request
		atPartyServerRef.child('pause').on('child_added', function(childSnapshot, prevChildName) {
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

	// Listener: Server response to 'Pause Matches' request
		atPartyServerRef.child('pause').on('child_changed', function(childSnapshot, prevChildName) {
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

	// Firebase reference for 'otherUser' server messages
	var atPartyOtherUserRef = first30SecondsRef.child('pages/atParty/otherUser');

	// Server adds an otherUser to the atParty list
		// This listener dynamically creates the thumbnail of an otherUser for display in the party list 
		// including image, name, age, rating, and a link to the rateOtherUser page. Description is also
		// carried into the div for use in rateOtherUser and Match pages but is hidden here.
		// These data elements will also be used for potential creation of rateOtherUser and Match pages.		
		atPartyOtherUserRef.on('child_added', function(childSnapshot, prevChildName) {
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
				"</a>");
		// Update the rating display element with the converted rating value
			sys_globalRateDisplay(val.otherUserRatingMsg, UID);	
		// Fade in the thumbnail
			$('#div' + UID).fadeIn(500);
		});

	// Server changes one or more elements of data for user with a unique ID.
		// These data elements will also be used for potential creation of rateOtherUser and Match pages.		
		atPartyOtherUserRef.on('child_changed', function(childSnapshot, prevChildName) {
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
		atPartyOtherUserRef.on('child_removed', function(oldChildSnapshot) {
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
		atPartyServerRef.child('betterParty').on('child_added', function(childSnapshot, prevChildName) {
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
		atPartyServerRef.child('betterParty').on('child_changed', function(childSnapshot, prevChildName) {
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

	// Firebase reference for client-generated event messages. 
	var atPartyClientRef = first30SecondsRef.child('pages/atParty/clientEvents');

	// Client pauses matches at the party
		function usr_atPartyPause() {
			// send Pause_matches message with 'true' value to Firebase
			atPartyClientRef.push( { Pause_matches : true } );
		}

	// Client pauses matches at the party
		function usr_atPartyEndPause() {
			// send Pause_matches message with 'false' value to Firebase
			atPartyClientRef.push( { Pause_matches : false } );
			return false;
		}

	// Client leaves party
		function usr_atPartyLeave() {
		// close the 'leave party' dialog
			$('#leavePartyDialog').popup('close');
		// send Leave_party message with 'true' value to Firebase
			atPartyClientRef.push( { Leave_party : true } );
		}

	// Client declines a 'Better Party' invitation 
		function usr_atPartyBetterPartyDeclined() {
			// Close the 'Better Party' popup
			$(betterParty).popup('close');
			// Open the Waiting overlay on a delay to give time to close the 'Better Party' overla
			setTimeout ("sys_openWaiting();", 250);
			// send Decline_betterParty message with 'true' value to Firebase
			atPartyClientRef.push( { Decline_betterParty : true } );
		}

	// Client accepts a 'Better Party' invitation
		function usr_atPartyBetterPartyAccepted() {
			// Close the 'Better Party' popup
			$(betterParty).popup('close');
			// Open the Waiting overlay on a delay to give time to close the 'Better Party' overla
			setTimeout ("sys_openWaiting();", 250);
			// send Accept_betterParty message with 'true' value to Firebase
			atPartyClientRef.push( { Accept_betterParty : true } );
		}

	// Client selects an otherUser to open the rateOtherUser page
		function usr_atPartyRateOtherUser( jsonUID ) {
			// Open the Waiting overlay
			sys_openWaiting();
			// send Rate_otherUser message with the selected otherUser ID value to Firebase
			atPartyClientRef.push( { Rate_otherUser : jsonUID } );
		}

// RATEOTHERUSER PAGE
	// Firebase reference for page data for rateOtheruser page
	var rateOtherUserServerRef = first30SecondsRef.child('pages/rateOtherUser/serverEvents');

	// Server sends a unique ID which is used to populate the rateOtherUser page.
		rateOtherUserServerRef.child('pageData').on('child_added', function(childSnapshot, prevChildName) {
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
			});
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

	// Server sends a new unique ID which is used to repopulate the rateOtherUser page.
		rateOtherUserServerRef.child('pageData').on('child_changed', function(childSnapshot, prevChildName) {
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

	// Firebase reference for client-generated event messages. 
	var rateOtherUserClientRef = first30SecondsRef.child('pages/rateOtherUser/clientEvents');

	// User rates an otherUser
		function usr_rateOtherUserSendRating() {
			// Retrieve the new rating from the selected value of the Rating select menu
			var newRating = $('#rateOtherUserRating').val();
			// send New_otherUserRating message with the numerical rating value to Firebase
			rateOtherUserClientRef.push( { New_otherUserRating : newRating } );
		}

	// User reports offensive behavior
		function usr_rateOtherUserTOS() {
		// close the TOS dialog
			$('#rateOtherUserTOSDialog').popup('close')
		// Retrieve the otherUser's unique ID
			var UID = $('#rateOtherUserUID').html();
			// send New_otherUserRating message with the numerical rating value to Firebase
			rateOtherUserClientRef.push( { rateOtherUser_TOSViolation : UID } );
		}

// MATCH PAGE
	// Firebase reference for page data for rateOtheruser page
	var matchServerRef = first30SecondsRef.child('pages/match/serverEvents');

	// Server sends a unique ID which is used to populate the match page.
		matchServerRef.child('pageData').on('child_added', function(childSnapshot, prevChildName) {
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

	// Listener: Server sends another unique ID which is used to repopulate the match page.
		matchServerRef.child('pageData').on('child_changed', function(childSnapshot, prevChildName) {
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

	// Firebase reference for client-generated event messages. 
	var matchClientRef = first30SecondsRef.child('pages/match/clientEvents');

	// User closes a match
		function usr_matchClose() {
		// close the confirmation dialog
			$('#matchDone').popup('close')
		// send Close_match message to Firebase with value 'true'
			matchClientRef.push( { Close_match : true } );
		}

	// User can't find a match
		function usr_matchCantFind() {
		// close the confirmation dialog
			$('#cantFindMatch').popup('close')
		// send Cant_find_match message to Firebase with value 'true'
			matchClientRef.push( { Cant_find_match : true } );
		}

	// User reports offensive behavior
		function usr_matchTOS() {
		// close the TOS dialog
			$('#matchTOSDialog').popup('close')
		// Retrieve the otherUser's unique ID
			var UID = $('#matchUID').html();
		// send match_TOSViolation message with the otherUser's ID to Firebase
			matchClientRef.push( { match_TOSViolation : UID } );
		}

// PROFILE PAGE
	// Firebase reference for page data for inTransit page
	var profileServerRef = first30SecondsRef.child('pages/profile/serverEvents');

	// Server sends existing profile data to Firebase
		profileServerRef.on('child_added', function(childSnapshot, prevChildName) {
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
		profileServerRef.on('child_changed', function(childSnapshot, prevChildName) { 
			var val = childSnapshot.val();
			// Add or replace the current profile image with the new profile image
			$('#profileImage').attr('src', val.profileImageMsg);
		});

	// Firebase reference for client-generated event messages. 
	var profileClientRef = first30SecondsRef.child('pages/profile/clientEvents');

	// User submits updated profile form
		function usr_profileUpdate() {
			// Send the data in the form to Firebase
			// Check if either field was left blank.
			if (($('#profileName').val() == "") || ($('#profileAge').val() == "")) {
			// If yes, hide the waiting overlay and display an alert notifying the user.
				$.mobile.hidePageLoadingMsg();
				$('#profileAlertText').html("You left a required field blank. Please complete the form and submit again.");				
				$(profileAlertWrapper).show();				
			} else {
				// Send profile data to Firebase
				$(profileAlertWrapper).hide();
					profileClientRef.push( {
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
		function usr_changeImage() {
		// send Change_image message with a value of 'true'
			profileClientRef.push( { Change_image : true } );
		}

	// User opts to close the Profile page and requests a response from the server.
		function usr_profileClose() {
		// send Close_profile message with a value of 'true'
			profileClientRef.push( { Close_profile : true } );
		}

// IMAGEUPLOAD PAGE
	// Firebase reference for page data for imageUpload page
	var imageUploadServerRef = first30SecondsRef.child('pages/imageUpload/serverEvents');
	var imageUploadClientRef = first30SecondsRef.child('pages/imageUpload/clientEvents');

	// Listener: imageUpload page data
		$(document).on("pageinit", "#imageUpload", function () {
			imageUploadServerRef.on('child_added', function(childSnapshot, prevChildName) {
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

			imageUploadServerRef.on('child_changed', function(childSnapshot, prevChildName) {
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
				imageUploadClientRef.push( { New_profile_image : imageData } );
			});

			// Disable the 'Save profile photo' button when the plugin is initialized.
			$('#imageUploadSave').button('disable');
		});


	// User cancels the image upload
		function usr_imageUploadCancel() {
			// send a message to Firebase requesting return to the Profile page
			imageUploadClientRef.push( { Return_toProfile : true } );
		}

// INITIALIZATION

	// Since deviceReady is now the last event called on initialization, authentication and pageReady 
	// functions have been deferred to the deviceReady event. We will still remove any previous listeners
	// ahead of the deviceReady event being called.

		function initialize() {
			// Remove any previous listeners
			first30SecondsRef.off();
			first30SecondsRef.remove();

		}

		window.onload = initialize();