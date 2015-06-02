// HOUSEKEEPING FUNCTIONS FOR PROGRAMMING PURPOSES

	// Create a global variable array for use throughout the code.
		GLOB = [];
		GLOB.deviceUuid = "";
	// Reset function: Refresh the app and return to the splash page.
		function initializeUnitTest() {
			// Return the page to the Splash page
			$.mobile.changePage('#splash');
			// Perform a page reset to clear all data fields.
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

// SCRIPTS TO SUPPORT PLUGINS AND AUTHENTICATION
	// Retrieve the value stored with the key "f30sUserId" in localStorage
	GLOB.currentUserId = window.localStorage.getItem("f30sUserId");
	// If there's already a value for GLOB.currentUserId in localStorage
	if (GLOB.currentUserId != null) {
		// Redefine the primary reference to include the f30UserID value in the reference name
		var first30SecondsRef = new Firebase('https://f30s.firebaseio.com/' + GLOB.currentUserId)
		var pageReadyRef = first30SecondsRef.child('pageReady');
	} else {
		// create an arbitrary reference so the DOM can load.
		// This is only necessary to run the unit test from a desktop and can be removed in production.								
		var first30SecondsRef = new Firebase('https://f30s.firebaseio.com/placeholder');
	};

	
	function newUserConfirmation() {
		usr_sys_openWaiting();
		newUserIdRequestRef.push( { "deviceUuid" : GLOB.deviceUuid } );
	};


		function restorePaidUser( formObj ) {
			// Check if either field was left blank.
			if (($('#creditEmail').val() == "") || ($('#creditLast4').val() == "")) {
			// If yes, display an alert notifying the user.
				$('#newUserAlertText').html("You left a required field blank. Please fill in the blank and try again.");				
				$(newUserAlertWrapper).show();
				// Use this to adjust the height of the space allocated to the alert so that 
				// it never covers the page text or elements below it
				var containerHeight = $(".alert").height()
				var containerHeightTrim = parseInt(containerHeight) + 37;			
				$('.alertWrapper').css("height", containerHeightTrim);
			} else {
				// If email and password fields are both populated:
				// Open "Waiting..." overlay to disable user controls.
				usr_sys_openWaiting();
				// Send a "Login_attempt" message to the server with the entered username and password
				newUserIdRequestRef.push( {  
					"deviceUuid" : GLOB.deviceUuid,
					"payEmail" : $('#creditEmail').val(),
					"payCard" : $('#creditLast4').val(),
				} ); 
			}
			return false; // We don't want the form to trigger a page load. We want to do that through js. 
		}



	// Authenticate the user
	// Check if there is a value in localStorage for an f30sId. 
		// If this value is null, then this is the first time the device has connected to our servers via Firebase. 
		// (A factory reset or OS upgrade may also reset this value.) In that case, the client sends a device id 
		// to Firebase in a common public directory. We use Phonegap's 'device.uuid' call which returns 
		// the Android_ID.

	// Retrieve Phonegap device.uuid and use as primary Firebase reference
		// Device reference 	


	// Google Cloud Messagking device registration and push notifications
		// Main device reference. We use a placeholder until we're sure we can retrieve an f30sID from localStorage.
		// This prevents errors when 
		// When we have that we replace 'placholder' with the value of f30sID.	
 		// Reference for the public Firebase directory to which a new user's device will send its device ID.
		var newUserIdRequestRef = new Firebase('https://f30s.firebaseio.com/newUserIdRequests/' );

		// Create a temporary placeholder for the Firebase reference where the server will deposit
		// a new f30sUserId. This reference will change to include a device ID when one is received
		// by the device. This happens during the Phonegap 'deviceReady' event listener which follows this function.
		// It is also used to complete the unit test on a desktop, since no device ID is generated in that case.
		GLOB.newUserIDResponseRef = new Firebase('https://f30s.firebaseio.com/deviceId/' );


		// Phonegap event listener. The event fires when Phonegap's device APIs have loaded. We use this to:
		// register mobile device with Google Cloud Messaging for push notifications.
		// check localStorage for a device ID assigned by F30s and if one isn't send a new user request
			document.addEventListener("deviceready", function() {
				GLOB.deviceUuid = device.uuid;
				GLOB.newUserIdResponseRef = new Firebase('https://f30s.firebaseio.com/' + device.uuid);

				if (GLOB.currentUserId == null) {
					$.mobile.changePage("#newUser")
					GLOB.newUserIdResponseRef.on('child_added', function(childSnapshot, prevChildName) {
						var val = childSnapshot.val();
						window.localStorage.setItem("f30sUserId", val);
						$.mobile.changePage("#splash")
						document.location.reload(true);
					});
				} else {
					var pushNotification = window.plugins.pushNotification;
					pushNotification.register(successHandler, errorHandler,{"senderID":"663432953781","ecb":"onNotificationGCM"});

				};

				// Set up the function to process event handlers for Google Cloud Messaging push notifications
			});

 		var globalClientDeviceIDRef = first30SecondsRef.child('global/clientEvents/GCMPushNotificationsID');
			
		// Success handler. Result should be "OK". This is not assessed by the unit test, 
		// since the return of a Registration ID is sufficient proof of successful registration.
			function successHandler (result) {
			// We can send a notification to Firebase that registration succeeded, but since the Registration ID
			// proves this, and we have a handler for registration errors, this becomes a redundant message that only adds
			// to our Firebase overhead. So we'll keep it but comment it out in case it turns out there's a reason to keep it. 
			//	deviceRef.push( { "GCM_registration" : result } );
			}

		// Error handler. Sends any error message to Firebase. This is not included in the unit test, 
		// since the return of a Registration ID is sufficient proof of a successful registration.
			function errorHandler (error) {
				globalClientDeviceIDRef.push( { "GCM_registration_error" : error } );
			}

		// Event handler . Several cases are documented as listed. 
			function onNotificationGCM(e) {
				switch( e.event ) {
					// If a Registration ID is successfully generated, send it to Firebase and use it as the identifying
					// label for all other subsequent messages from this device.
					case 'registered':
						if ( e.regid.length > 0 ) {
							GLOB.GCMId = e.regid;
						//	alert ("GLOB.GCMId is " + GLOB.GCMId)
 							pageReadyRef.push( { "GCM_Push_Notifications_Id" : e.regid } );
						}
					break;
					// this is the actual push notification. its format depends on the data model from the push server
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
				// When you create a Stripe account, you're given two publishable keys: one for test and one for 
				// when your app is live. Below is the test key that was used for development. This should be replaced
				// with a test / live key from the final Stripe account.
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
					stripeTokenRef.push( { "payToken" : token.id , "payCard" : token.card.last4} );
					// Open the waiting overlay. This allows the server to update credits before returning
					// control to the user.
					usr_sys_openWaiting();
				}
			});

	// Cropit
		// The imageUpload page uses the Cropit image upload plugin by Scott Cheng. This allows the user to open
		// an image from their device and then zoom, pan, crop, and upload it to Firebase. For API and details 
		// on its use, refer to http://scottcheng.github.io/cropit/

		// The cropit plugin must be called within the Firebase function that provides initial page data. Refer
		// to the imageUpload section for specifics of the plugin implementation.

// GLOBAL FUNCTIONS
	// Global functions can occur on multiple pages or all pages.
 	

	// Server updates rating of an otherUser
		// The function updates the rating associated with the UID, updates the parent thumbnail
		// display on the #party page and returns the user to that page.
		function sys_globalRateDisplay( jsonRating, UID ) {
			// Change the rating on the #Party page to reflect what the user selected. 
			// It uses the value on the selector at the time of submit.
			// If the user hasn't selected a rating, display "Please Review" as the rating text
			if (jsonRating == '-1') {
				$('#rating' + UID).html("Please review");
			};
			// If the user's selected the "Not Interested" element from the pulldown, the value
			// of the pulldown will be zero and the corresponding element's rating text will
			// change to say "Not interested"
			if (jsonRating == '0') {
				$('#rating' + UID).html("Not interested");
			};
			// Otherwise, the value will be 1 - 5, which will be converted to a string of the symbol 
			// '♥' of the corresponding length, so a rating of 3 will display ♥♥♥.
			if ( (jsonRating > '0') && (jsonRating < '6') ) {
				var newHearts = Array(+ jsonRating + 1).join("♥");
				// Display the string created on the atParty page.
				$('#rating' + UID).html( newHearts );
			}		
		}

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

	// User or server opens 'Waiting...' overlay.
		// Uses current page ID to close the proper instance of the overlay.
		// if this were the Home page, the div being closed would have ID "homeWaiting"
		function usr_sys_openWaiting() {
			// Determine the current page and append 'Waiting' to it to get the ID
			// of the waiting overlay to be opened.
			var currentWaiting = '#' +  $.mobile.activePage.attr('id') + "Waiting"
			// Append 'Text' to the result to get the ID of the text presented in the 
			// Waiting overlay, which has a separate ID. We'll need this to customize 
			// or reset the text.
			var currentWaitingText = currentWaiting + "Text"
			// Reset the "Waiting..." overlay text in case it was customized on the previous use.  
			$(currentWaitingText).html('Waiting...');			
			// Open the overlay.
			$(currentWaiting).popup('open');				
		}

	// Server closes 'Waiting...' overlay 
		// Uses current page as ID to close the proper instance of the overlay.
		// if this were the Home page, the div being closed would have ID "homeWaiting"
		function sys_closeWaiting() {
			// User the current page's name to determine which Waiting overlay we're checking.
			var currentWaiting = '#' +  $.mobile.activePage.attr('id') + "Waiting"
			// Check if the Waiting overlay is active. This prevents errors in 
			// the unit test when testing only segments of code. If it's active,
			// close the overlay.
			if ($(currentWaiting).parent().hasClass('ui-popup-active')) {
				$(currentWaiting).popup('close');
			}
		}

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

	// Manually close an alert. We need this for automatic alerts generated by faulty form submission 
	// before the user is authenticated.
	function manualAlertClose() {
		$('.alertWrapper').hide();
		$('.alert').html("");
	};

	// Firebase reference for server messages for the Stripe Checkout overlay
	var globalServerStripeRef = first30SecondsRef.child('Stripe/serverEvents');

	// Server opens the Stripe overlay
		globalServerStripeRef.on('child_added', function(childSnapshot, prevChildName) {
			// Retrieve the JSON string stored in alertMsg	
			var val = childSnapshot.val();
			// If "stripeMsg" message is sent by the server with a flag of "true", close 
			// the Waiting overlay and open the Stripe credit card overlay. Note that once triggered, any 
			// prior stripeMsg message must be removed from Firebase before sending a subsequent
			// 'stripeMsg: true' message, or else the child_added listener won't be triggered.
			if (val == true) {		
				sys_closeWaiting();
				handler.open();	
			};
		});

	// Firebase references for server and client messages related to geolocation functions
	var globalServerGeoRef = first30SecondsRef.child('global/serverEvents/geolocation');	
	var globalClientGeoRef = first30SecondsRef.child('global/geolocation');

	// Server requests geolocation data from the client
		globalServerGeoRef.on('child_added', function(childSnapshot, prevChildName) {
			// Retrieve the JSON string stored in alertMsg	
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
			// Retrieve the JSON string stored in alertMsg	
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
		
	// Geolocation functions called by the Firebase geolocation listeners above 
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

		// This function is called to poll for location periodically. For test purposes, it has been set
		// to one second. In production, this should be set to 30 seconds.		
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
			setTimeout ("usr_sys_openWaiting();", 250);
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
			usr_sys_openWaiting();
			var currentPage = $.mobile.activePage.attr('id')
			// send Close_alert message with 'true' value to Firebase
			globalClientRef.push( { Close_alert : true } );
		}

// LOGIN PAGE 
	/* Setting this aside for possible re-use.
	// Firebase reference for client-generated events on the Login page
	var loginClientRef = first30SecondsRef.child('pages/login/clientEvents');

	// LOGIN PAGE CLIENT RESPONSE FUNCTIONS

	// User attempts login
		// Called when a user enters his user name and password and clicks the Submit 
		// button. It checks required fields for content and if both fields are populated,
		// sends a 'Login_attempt' message to the server with the user name and password.
		function usr_loginAttempt( formObj ) {
			// Check if either field was left blank.
			if (($('#loginEmail').val() == "") || ($('#loginPw').val() == "")) {
			// If yes, display an alert notifying the user.
				$('#loginAlertText').html("You left a required field blank. Please fill in the blank and try again.");				
				$(loginAlertWrapper).show();
				// Use this to adjust the height of the space allocated to the alert so that 
				// it never covers the page text or elements below it
				var containerHeight = $(".alert").height()
				var containerHeightTrim = parseInt(containerHeight) + 37;			
				$('.alertWrapper').css("height", containerHeightTrim);
				return false; // We don't want to send the message to Firebase.
			} 
			// If email and password fields are both populated:
			// Open "Waiting..." overlay to disable user controls.
			usr_sys_openWaiting();
			// Send a "Login_attempt" message to the server with the entered username and password
			loginClientRef.push( { 
				Login_attempt: true, 
				Username : formObj.loginEmail.value,
				Password : formObj.loginPw.value
			} );
			return false; // We don't want the form to trigger a page load. We want to do that through js.  
		}

	// User selects 'Forgot Password' link 
		function usr_loginForgot() {
			// Get the value in the email field
			var forgotEmail = $('#loginEmail').val();
			// If the email address is blank, stop script and display an inline alert.			
			if (forgotEmail == "") {
				$('#loginAlertText').html("Please enter an email address in the 'Email' field so we can send you a password reset.");				
				$(loginAlertWrapper).show();
				return false; // We don't want the 'forgot password' message to get to Firebase.
			};
			// Otherwise, open the Waiting overlay. We do this from here instead of in the HTML link
			// because it's conditional upon the Email field being populated.
			usr_sys_openWaiting()
			// send Forgot_password message with 'true' value to Firebase
			loginClientRef.push( { 
				Forgot_password : true, 
				email_addrs: forgotEmail
			} );
		}

	// #login user event: Create an account
		// Sends a Create_account message to Firebase. Opens a Waiting overlay that is closed when
		// the server acknowledges receipt of the Create_account message. 
		function usr_loginCreateAccount() {
		// Open "Waiting..." overlay to disable user controls.
			usr_sys_openWaiting();
		// Send a "Login_attempt" message to the server asking it to validate username and password
			loginClientRef.push( { Create_account : true } );
		}
	*/

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
				$('#homeFindParty').addClass('ui-disabled');
			// Else it will appear green on both pages and the "Find a party" button 
			// will be active.
			} else {
				$('#homeCredits').css('color', '#009900');
				$('#homeFindParty').removeClass('ui-disabled');
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
				$('#homeFindParty').addClass('ui-disabled');
			// Else it will appear green on both pages and the "Find a party" button 
			// will be active.
			} else {
				$('#homeCredits').css('color', '#009900');
				$('#homeFindParty').removeClass('ui-disabled');
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
		// Display the page data from the snapshot to populate start time and 
		// distance from current location.
			$('#partyTime').html(val.partyTimeMsg);
			$('#partyDistance').html(val.partyDistanceMsg);
		});

	// Server changes page data
		inviteServerRef.on('child_changed', function(childSnapshot, prevChildName) {
		// Assign snapshot JSON to a variable
			var val = childSnapshot.val();
		// Display the page data from the snapshot to populate start time and 
		// distance from current location.
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
			usr_sys_openWaiting();
			// send clientProximityTimeout message with 'true' value to Firebase
			inTransitClientRef.push( { clientProximityTimeout : true } );
		}

	// Client cancels the party invitation
		function usr_inTransitConfirmCancellation() {
			// Open the Waiting overlay, disabling user controls pending system response.
			// A setTimeout is required to avoid colliding with the dialog popup while it's closing.
			setTimeout ("usr_sys_openWaiting();", 250);
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
		// send Leave_party message with 'true' value to Firebase
			atPartyClientRef.push( { Leave_party : true } );
		}

	// Client declines a 'Better Party' invitation 
		function usr_atPartyBetterPartyDeclined() {
			// Close the 'Better Party' popup
			$(betterParty).popup('close');
			// Open the Waiting overlay on a delay to give time to close the 'Better Party' overla
			setTimeout ("usr_sys_openWaiting();", 250);
		// send Decline_betterParty message with 'true' value to Firebase
			atPartyClientRef.push( { Decline_betterParty : true } );
		}

	// Client accepts a 'Better Party' invitation
		function usr_atPartyBetterPartyAccepted() {
			// Close the 'Better Party' popup
			$(betterParty).popup('close');
			// Open the Waiting overlay on a delay to give time to close the 'Better Party' overla
			setTimeout ("usr_sys_openWaiting();", 250);
			// send Accept_betterParty message with 'true' value to Firebase
			atPartyClientRef.push( { Accept_betterParty : true } );
		}

	// Client selects an otherUser to open the rateOtherUser page
		function usr_atPartyRateOtherUser( jsonUID ) {
			// Open the Waiting overlay
			usr_sys_openWaiting();
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
	//		$("#rateOtherUserRating").val( rateOtherUserRateVal )
			$(document).on("pageinit", "#rateOtherUser", function () {
				$('#rateOtherUserRating').val( rateOtherUserRateVal ).selectmenu("refresh", true);
				//$('#rateOtherUserRating').trigger('change');
			});
			// If rateOtherUserRatingMsg has a value of -1, that means the otherUser hasn't been rated by the user yet
			// and the 'submit' button should be disabled.
			if (rateOtherUserRateVal == "-1"){
				$('#ratingSubmit').addClass('ui-disabled');
			};
			// Otherwise the value must be between 0 and 5 inclusive. If rateOtherUserRatingMsg falls in that range,
			// the user has previously rated this otherUser and the 'submit' button should be enabled.
			if ( (rateOtherUserRateVal > "-1") && (rateOtherUserRateVal < "6") ) {
				$('#ratingSubmit').removeClass('ui-disabled');
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
	//		$("#rateOtherUserRating").val( rateOtherUserRateVal )
//			$(document).on("pageinit", "#rateOtherUser", function () {
			$('#rateOtherUserRating').val( rateOtherUserRateVal ).selectmenu("refresh", true);
				// $('#rateOtherUserRating').trigger('change');
//			});
			// If rateOtherUserRatingMsg has a value of -1, that means the otherUser hasn't been rated by the user yet
			// and the 'submit' button should be disabled.
			if (rateOtherUserRateVal == "-1"){
				$('#ratingSubmit').addClass('ui-disabled');
			};
			// Otherwise the value must be between 0 and 5 inclusive. If rateOtherUserRatingMsg falls in that range,
			// the user has previously rated this otherUser and the 'submit' button should be enabled.
			if ( (rateOtherUserRateVal > "-1") && (rateOtherUserRateVal < "6") ) {
				$('#ratingSubmit').removeClass('ui-disabled');
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
		// send Close_match message to Firebase with value 'true'
			matchClientRef.push( { Close_match : true } );
		}

	// User can't find a match
		function usr_matchCantFind() {
		// send Cant_find_match message to Firebase with value 'true'
			matchClientRef.push( { Cant_find_match : true } );
		}

	// User reports offensive behavior
		function usr_matchTOS() {
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
			// If yes, display an alert notifying the user.
				$('#profileAlertText').html("You left a required field blank. Please complete the form and submit again.");				
				$(profileAlertWrapper).show();				
			} else {
				// If name and age fields are both populated:
				// Open "Waiting..." overlay to disable user controls.
				usr_sys_openWaiting();
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

	// User opts to closee the Profile page and requests a response from the server.
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
						$('#imageUploadSave').removeClass('ui-disabled');
					}
				});
				if (val.disableCancelMsg == true) {
					$('#imageUploadCancel').hide();
				};
				if (val.disableCancelMsg == false) {
					$('#imageUploadCancel').show();
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
						$('#imageUploadSave').removeClass('ui-disabled');
					}
				});
				if (val.disableCancelMsg == true) {
					$('#imageUploadCancel').hide();
				};
				if (val.disableCancelMsg == false) {
					$('#imageUploadCancel').show();
				};
			});


			// Cropit function called when the user clicks 'Save profile photo'
			$('.export').click(function() {
				var imageData = $('.image-editor').cropit('export');
				// window.open(imageData);
				imageUploadClientRef.push( { New_profile_image : imageData } );
			});

			// Disable the 'Save profile photo' button when the plugin is initialized.
			$('#imageUploadSave').addClass('ui-disabled');
		});



	// User uploads new profile message
		function usr_imageUploadCancel() {
			// send New_otherUserRating message with the numerical rating value to Firebase
			imageUploadClientRef.push( { Return_toProfile : true } );
		}

// INITIALIZATION

	// Specify which function listens for incoming messages
	// Redirect if page id is missing
		function initialize() {
			// We don't want to allow pages without a page id. If there is no 
			// page id, we send the user to an error page.

 			// if( GLOB.pageId == null )
 				// window.location.href = "missingId.html";

		// Define location and remove previous listeners

			// Retrieve the value stored with the key "f30sUserId" in localStorage
				// GLOB.currentUserId = window.localStorage.getItem("f30sUserId");
			// If there's already a value for GLOB.currentUserId in localStorage
				// if (GLOB.currentUserId != null) {
				// create a reference to deposit the pageReady message
	       	    //	userIdRef = first30SecondsRef.child('pageReady');
	       	    // Remove any previous listeners
					first30SecondsRef.off();
					first30SecondsRef.remove();
					window.localStorage.setItem ('f30sUserId','uniqueUserId12345')

				// Send the pageReady message to the new Firebase reference
        	    //	userIdRef.push( {"PageReadyMsg" : GLOB.currentUserId} )					
				// };
		}

		window.onload = initialize();