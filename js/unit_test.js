function unitTests() {
    var allTests = [
        // ALT: Function to automatically clear walkthrough alerts (to facilitate debugging). Place this at the start of the allTests array.
            function() {
                descAlert = function() {};
            },
        // P4. home page
            // Send home page data with zero credits and display page
                function() {
                    descAlert( "Let's start the unit test of the Home page. We'll prepopulate the page data and then display the populated page. There are two possible page states depending on the number of credits, so we'll test the zero-credits case first. The copy at the top will read 'You have 0 credits', with the number zero appearing in red. The 'Find a party' button will be disabled, and additional text just above the button will instruct the user to buy credits." );
                    // Let's start the unit test of the Home page by prepopulating the page data for the home page. The only initial page data is the number of credits. There are two possible page states depending on the number of credits, so we'll test the zero-credits case first.
                        homeServerRef.set({
                            pageData : {
                                creditsMsg : "0"
                            }
                        })
                    return( 0 );
                },
                function() {
                    // changePage to Home page
                        globalServerRef.child('currentPage').set ( { changePageMsg : "home" } )
                    // Add a delay to allow page transition
                        return( 1000 );
                },
            // Confirm display of Home page with page data
                function() {
                    // Confirm that we are on the home page
                        var currentText =  $.mobile.activePage.attr('id');
                        var expectedText ="home";
                        if (currentText != expectedText ) {
                            alert(
                                "Expecting value [ " +
                                expectedText +
                                " ]. Got value: [ "+
                                currentText +
                                " ]"
                            );
                            return( -1 );
                        };
                    return( 0 );
                },
                function() {
                    // Since we're testing a user with no credits, the copy at the top will read 'You have 0 credits, and the number zero will appear in red. The 'Find a party' button will be disabled, and the text just above the button will instruct the user to buy credits. Let's confirm that this is the case.
                    // Confirm that the number of credits appears
                        var currentText = $("#homeCredits").html();
                        var expectedText ="0";
                        if ( currentText != expectedText ) {
                            alert(
                                "Expecting value[ " +
                                expectedText +
                                " ]. Got value: [ "+
                                currentText +
                                " ]"
                            );
                            return( -1 );
                        };
                    // Confirm that the credits text number is red
                        if ( $(homeCredits).css('color') != 'rgb(153, 0, 0)') {
                            alert(
                                "Error: The credits text color should be rgb(153, 0, 0)  or (#990000)"
                            );
                            return( -1 );
                        };
                    // Confirm that the 'Find a party' button is disabled
                        if ( $("#ratingSubmit").hasClass('ui-disabled') != true) {
                            alert(
                                "Error: The 'Find a party' button should be disabled."
                            );
                            return( -1 );
                        };
                    return( 0 );
                },
            // send an irrelevant message and confirm that the page ignores it
                function() {
                    // irrelevant message
                        atPartyServerRef.child('pause').set( {
                            pauseMsg: true
                        } )
                    // Add a delay to allow time for Firebase delivery
                        return( 2000 );
                },
                function() {
                    // Since we're testing a user with no credits, the copy at the top will read 'You have 0 credits, and the number zero will appear in red. The 'Find a party' button will be disabled, and the text just above the button will instruct the user to buy credits. Let's confirm that this is the case.
                    // Confirm that the number of credits appears
                        var currentText = $("#homeCredits").html();
                        var expectedText ="0";
                        if ( currentText != expectedText ) {
                            alert(
                                "Expecting value[ " +
                                expectedText +
                                " ]. Got value: [ "+
                                currentText +
                                " ]"
                            );
                            return( -1 );
                        };
                    // Confirm that the credits text number is red
                        if ( $(homeCredits).css('color') != 'rgb(153, 0, 0)') {
                            alert(
                                "Error: The credits text color should be rgb(153, 0, 0)  or (#990000)"
                            );
                            return( -1 );
                        };
                    // Confirm that the 'Find a party' button is disabled
                        if ( $("#ratingSubmit").hasClass('ui-disabled') != true) {
                            alert(
                                "Error: The 'Find a party' button should be disabled."
                            );
                            return( -1 );
                        };
                    return( 0 );
                },
            // Server sends an alert
                function() {
                    descAlert( "The page and page data remain unchanged. Let's display an alert with a flag to remove a Waiting overlay if one is open. This also covers the case where an alert is displayed with no Waiting overlay, since that's a substate of this test: if no Waiting overlay is active, the command to remove it will be ignored." );
                    // Open the Waiting overlay
                        usr_sys_openWaiting();
                    return( 1000 );
                },
                function() {
                    // Send a message to Firebase containing an alert with a flag to remove a waiting overlay if one is present
                        globalServerAlertRef.set({
                            currentAlert : {
                                alertMsg : " [Alert text] (Home) ",
                                removeWaitingMsg : true
                            },
                        })
                    //  Include a small delay for app response
                        return( 1000 );
                },
                function() {
                    // Confirm receipt / display of alert text by app
                        var currentText = $('#homeAlertText').text()
                        var expectedText =" [Alert text] (Home) ";
                        if ( currentText != expectedText ) {
                            alert(
                                "Expecting text: [" +
                                expectedText +
                                "]. Got text: ["+
                                currentText +
                                "]"
                            );
                            return( -1 );
                        };
                        if ( $(homeAlertWrapper).css('display') != 'block') {
                            alert(
                                "Error: App should be displaying an alert."
                            );
                            return( -1 );
                        };
                    return( 50 );
                },
            // User selects alert to close it
                function() {
                    descAlert( "The alert was displayed and the Waiting overlay was removed. Let's click on the alert to test that a message is sent to Firebase to close the alert." );
                    // Click on the alert
                        $(homeAlertWrapper).click();
                    // Add a delay to allow for page transition
                        return( 1000 );
                },
                function() {
                    // Confirm display state change to Waiting
                        if ($(homeWaiting).parent().hasClass('ui-popup-hidden')) {
                            alert(
                                "Error: App should be in Waiting mode."
                            );
                            return( -1 );
                        };
                    // Initialize and assign a variable to hold the last value stored in the clientEvents part of the data map
                        GLOB.usr_homeCloseAlert = "";
                        // Use a listener to confirm that the value was properly stored in Firebase. The child_added function iterates through all children of clientEvents, so when the last iteration is complete, the last child added is assigned to the global variable. 
                        var checkGlobalClientRef = new Firebase('https://f30s.firebaseio.com/uniqueUserId12345/global/clientEvents/' );
                        checkGlobalClientRef.on('child_added', function(childSnapshot, prevChildName) {
                            var val = childSnapshot.val();
                            GLOB.usr_homeCloseAlert = JSON.stringify(val);
                        // Close the listener
                            checkGlobalClientRef.off()
                        });
                    // Add a delay to ensure the data is received
                        return( 1000 );
                },
                function() {
                    // Confirm that the 'Close_alert' message was received by Firebase
                        if (GLOB.usr_homeCloseAlert != '{"Close_alert":true}') {
                            alert(
                                'Expecting {"Close_alert":true }. Got: ' +
                                GLOB.usr_homeCloseAlert
                            );
                            return( -1 );
                        };
                    // Confirm that Waiting overlay is still present
                        if ($(homeWaiting).parent().hasClass('ui-popup-hidden')) {
                            alert(
                                "Error: App should be in Waiting mode."
                            );
                            return( -1 );
                        };
                },
            // Server removes an alert
                function() {
                },
                function() {
                    descAlert( "The Firebase message to close the alert was received. Let's simulate a server response to Firebase to close the alert. Firebase does this by setting the alert content to null (''). Since the Waiting overlay should also be closed,  we'll also send this instruction as part of the message." );
                    // Simulate a server message to Firebase to close the alert and the waiting overlay. This is done by setting the alertMsg value to null ("")
                        globalServerAlertRef.set({
                            currentAlert : {
                                alertMsg : "",
                                removeWaitingMsg : true
                                },
                        })
                    //  Include a small delay for app response
                        return( 1000 );
                },
                function() {
                    // Confirm that alert has been removed
                        if ( $(homeAlertWrapper).css('display') == 'block') {
                            alert(
                                "Error: App should not be displaying an alert."
                            );
                            return( -1 );
                        };
                    // Confirm that Waiting overlay has been removed
                        if ($(homeWaiting).parent().hasClass('ui-popup-active')) {
                            alert(
                                "Error: App should not be in Waiting mode."
                            );
                            return( -1 );
                        };
                    return( 50 );
                },
            // Server sends an alert while client is in Waiting mode
                function() {
                    descAlert( "The alert closed properly and the Waiting overlay was removed. Let's restore the Waiting overlay and test the alert again with the instruction to retain the Waiting overlay. The alert should be visible behind the translucent overlay." );
                    // Induce a waiting state
                        $(homeWaiting).popup('open');
                    // Add a delay to allow for page transition
                        return( 1000 );
                },
                function() {
                    // Send a message to Firebase containing an alert and the instruction to retain the Waiting overlay
                        globalServerAlertRef.set({
                            currentAlert : {
                                alertMsg : " [Alert text] (Home / Waiting) ",
                                removeWaitingMsg : false
                                },
                        })
                    // Add a delay to allow for page transition
                        return( 1000 );
                },
                function() {
                    // Confirm that Waiting overlay is still present
                        if ($(homeWaiting).parent().hasClass('ui-popup-hidden')) {
                            alert(
                                "Error: App should be in Waiting mode."
                            );
                            return( -1 );
                        };
                    // Confirm receipt / display of alert text by app
                        var currentText = $('#homeAlertText').text()
                        var expectedText =" [Alert text] (Home / Waiting) ";
                        if ( currentText != expectedText ) {
                            alert(
                                "Expecting text: [" +
                                expectedText +
                                "]. Got text: ["+
                                currentText +
                                "]"
                            );
                            return( -1 );
                        };
                        if ( $(homeAlertWrapper).css('display') != 'block') {
                            alert(
                                "Error: App should be displaying an alert."
                            );
                            return( -1 );
                        };
                    return( 0 );
                },
            // User clicks the 'Buy more credits' button
                // Let's select the 'Buy more credits' button and check that it opens a Waiting overlay and sends the proper message to Firebase.
                function() {
                    descAlert( "The server message displayed the alert behind the translucent Waiting overlay. Let's close them both, select the 'Buy credits' button and check that it opens the Waiting overlay and sends the proper message to Firebase." );
                    //  Close the alert and remove the Waiting overlay
                        globalServerAlertRef.set({
                            currentAlert : {
                                alertMsg : "",
                                removeWaitingMsg : true
                                },
                        })
                    // Add a delay to allow for page transition
                        return( 1000 );
                },
                function() {
                    // Click the 'Buy more credits' button
                        $( "#homeBuyCredits" ).click();
                    //  Include a delay to accommodate potential bandwidth delays between the app, Stripe, and Firebase.
                        return( 1000 );
                },
                function() {
                    // Confirm display state change to Waiting
                        if ($(homeWaiting).parent().hasClass('ui-popup-hidden')) {
                            alert(
                                "Error: App should be in Waiting mode."
                            );
                            return( -1 );
                        };
                    // Initialize and assign a variable to hold the most recent value stored in the clientEvents part of the data map
                        GLOB.usr_homeBuyCredits = "";
                        // Use a listener to confirm that the value was properly stored in Firebase. The child_added function iterates through all children of clientEvents, so when the last iteration is complete, the last child added is assigned to the global variable. 
                        var checkHomeClientRef = new Firebase('https://f30s.firebaseio.com/uniqueUserId12345/pages/home/clientEvents' );
                        checkHomeClientRef.on('child_added', function(childSnapshot, prevChildName) {
                            var val = childSnapshot.val();
                            GLOB.usr_homeBuyCredits = JSON.stringify(val);
                        // Close the listener
                            checkHomeClientRef.off()
                        });
                    // Add a delay to ensure the data is received
                        return( 1000 );
                },
                function() {
                    // Confirm that the 'Login_attempt' message was received by Firebase
                        if (GLOB.usr_homeBuyCredits != '{"homeBuyCredits":true}') {
                            alert(
                                'Expecting {"homeBuyCredits":true}. Got: ' +
                                GLOB.usr_homeBuyCredits +
                                "."
                            );
                            return( -1 );
                        };
                },
            // Server opens the Checkout overlay
                // Open the purchase overlay. The purchase process is handled by an external service called Stripe Checkout. The overlay is generated by Stripe within our app.
                function() {
                    descAlert( "The buyCredits message was received by Firebase. Let's simulate a Firebase response that closes the Waiting overlay and opens the purchase overlay." );
                    //  Firebase command to open Stripe
                        globalServerStripeRef.set({
                            stripeMsg: true
                        })
                    // Add a delay to allow for page transition. We'll double the normal interval since one overlay has to close before the other one opens.
                        return( 2000 );
                },
                // The app will respond by opening the Stripe overlay. The overlay is entirely external to the app and generated by Stripe's code checkout.js which is included in our HTML header. So it is outside our DOM. However, Stripe includes a handler with a callback when the overlay is opened that we can use to send a message to Firebase and confirm that the waiting overlay closes and the purchase overlay opens.
                function() {
                    // Initialize and assign a variable to hold the most recent value stored in the clientEvents part of the data map
                        GLOB.usr_checkoutOpened = "";
                        // Use a listener to confirm that the value was properly stored in Firebase. The child_added function iterates through all children of clientEvents, so when the last iteration is complete, the last child added is assigned to the global variable. 
                        stripeClientRef.on('child_added', function(childSnapshot, prevChildName) {
                            var val = childSnapshot.val();
                            GLOB.usr_checkoutOpened = JSON.stringify(val);
                        // Turn the listener off after retrieving the data
                            stripeClientRef.off();
                        });
                    // Add a delay to allow for page transition
                        return( 1000 );
                },
                function() {
                    // Confirm that the 'Login_attempt' message was received by Firebase
                        if (GLOB.usr_checkoutOpened != '{"Checkout_open":true}') {
                            alert(
                                'Expecting {"Checkout_open":true}. Got:' +
                                GLOB.usr_checkoutOpened +
                                "."
                            );
                            return( -1 );
                        };
                    // Confirm display state change to Waiting
                        if ($(homeWaiting).parent().hasClass('ui-popup-active')) {
                            alert(
                                "Error: App should not be in Waiting mode."
                            );
                            return( -1 );
                        };
                    return( 0 );
                },
            // User cancels purchase
                // Open the purchase overlay. The purchase process is handled by an external service called Stripe Checkout. The overlay is generated by Stripe within our app.
                function() {
                    descAlert( "Firebase received a message that the purchase overlay is open. Let's simulate the case where a user cancels the purchase and closes the overlay. Firebase will receive a message that the overlay was closed so it remains synchronous with the current client state." );
                    //  Simulate a user command to close the purchase overlay
                        handler.close();
                    // Add a delay to allow for page transition
                        return( 1000 );
                },
                // Stripe includes a handler with a callback when the overlay is closed. The callback sends a message to Firebase confirming that the overlay was closed.
                function() {
                    // Initialize and assign a variable to hold the most recent value stored in the clientEvents part of the data map
                        GLOB.usr_checkoutClosed = "";
                        // Use a listener to confirm that the value was properly stored in Firebase. The child_added function iterates through all children of clientEvents, so when the last iteration is complete, the last child added is assigned to the global variable. 
                        var checkStripeClientRef = new Firebase('https://f30s.firebaseio.com/uniqueUserId12345/Stripe/clientEvents' );
                        checkStripeClientRef.on('child_added', function(childSnapshot, prevChildName) {
                            var val = childSnapshot.val();
                            GLOB.usr_checkoutClosed = JSON.stringify(val);
                        // Turn off the listener
                            checkStripeClientRef.off();
                        });
                    // Add a delay to ensure the data is received
                        return( 1000 );
                },
                function() {
                    // Confirm that the 'Checkout_open' message was received by Firebase
                        if (GLOB.usr_checkoutClosed != '{"Checkout_open":false}') {
                            alert(
                                'Expecting {"Checkout_open":false}. Got:' +
                                GLOB.usr_checkoutClosed +
                                "."
                            );
                            return( -1 );
                        };
                },
            // User purchases credits
                // Let's test the case where a user purchases credits. This has to be done manually so we'll reopen the Checkout overlay and then provide a placeholder with a timer instructing the person running the unit test to enter test credit card credentials.
                function() {
                    //  Remove the Waiting overlay
                        sys_closeWaiting();
                    // Add a delay to allow for page transition
                        return( 1000 );
                },
                function() {
                    descAlert( "The server confirmed that the Checkout overlay closed. Let's reopen it and submit a successful purchase. After this alert is closed, instructions to enter a test credit card number will follow. On successful submission, a pay token will be sent by Stripe to Firebase. This token is to be used by the server to complete the purchase process. Refer to documentation at stripe.com for server implementation details." );
                    //  Open stripe overlay
                        handler.open();
                    // Add a delay to allow for the Stripe overlay
                        return( 0 );
                },
                function() {
                    //  Display instructions to complete a test purchase. 45 seconds will be provided to complete this process.
                    $('body').append("<div data-role='popup' class='purchase-instructions' id='testPayment'>Enter the test purchase credentials below.<br><br><b>Email:</b> abc@abc.com<br><b>Credit card:</b> 4242 4242 4242 4242<br><b>Expiration:</b> Any month / year in the future.<br><b>CVC:</b> Any 3-digit number.<div style='color:#cc0000; font-weight: bold''>Do NOT select the 'Remember Me' checkbox.</div><br>You have <span id='testPaymentTimer'></span> seconds.</div>");
                    //  Set the timer in the instructions to coincide with the timeout to complete this task.
                    $('#testPaymentTimer').countdown({until: +60, compact:true, format: 'S', onExpiry: function(){$(".purchase-instructions").hide();}});
                    // Add a listener for receipt of the token. Since this a user process, the listener will be open while the user completes the purchase process. When the server receives the token, it will kill the 60-second timer,  remove the instructional overlay (the pay overlay will already be removed as part of the purchase process), and proceed with the test.
                    // Add a delay to allow the timer to run.
                        return( 60500 );
                },
                // We've confirmed receipt of the pay token, so let's just confirm that the Waiting overlay is active and proceed. We want the waiting overlay to open so the server can update credits on the Home page before returning control to the user.
                function() {
                    // Confirm display state change to Waiting
                        if ($(homeWaiting).parent().hasClass('ui-popup-hidden')) {
                            alert(
                                "Error: App should be in Waiting mode."
                            );
                            return( -1 );
                        };
                    // Initialize and assign variables to hold the most recent value stored in the clientEvents part of the data map
                        GLOB.tokenString = "";
                        // Use a listener to confirm that the value was properly stored in Firebase. The child_added function iterates through all children of clientEvents, so when the last iteration is complete, the last child added is assigned to the global variable. 
                        var checkStripeTokenRef = new Firebase('https://f30s.firebaseio.com/uniqueUserId12345/Stripe/payTokens' );
                        checkStripeTokenRef.on('child_added', function(childSnapshot, prevChildName) {
                            var val = childSnapshot.val();
                            tokenVal = JSON.stringify(val.payToken)
                            GLOB.tokenString = tokenVal.substring (1,5);
                            GLOB.last4CC = val.payCard;
                            GLOB.purchaseEmail = JSON.stringify(val.purchaseEmail)
                        // Turn the listener off after retrieving the data
                            checkStripeTokenRef.off();
                        });
                    // Add a delay to ensure the data is received
                        return( 1000 );
                },
                function() {
                    // Confirm that the pay token, email used to purchase, and last 4 of the credit card was received by Firebase
                        if (GLOB.tokenString != 'tok_') {
                            alert(
                                "Expecting 'tok_'. Got: " +
                                GLOB.tokenString +
                                "'."
                            );
                            return (-1)
                        };
                        if (GLOB.last4CC != '4242') {
                            alert(
                                "Expecting '4242'. Got: " +
                                GLOB.last4CC +
                                "."
                            );
                            return (-1)
                        };
                        if (GLOB.purchaseEmail != 'abc@abc.com') {
                            alert(
                                "Expecting 'abc@abc.com'. Got: " +
                                GLOB.purchaseEmail +
                                "'."
                            );
                            return (-1)
                        };
                    return( 0 );
                },
            // Server updates credits
                function() {
                    // Let's update the home page to reflect a user who has credits.
                        homeServerRef.child('pageData').child('creditsMsg').set(
                            "10"
                        )
                    return( 50 );
                },
                function() {
                    // When a user has credits, the number of credits will change, and the number will appear in green. The 'Find a party' button will be enabled, and there will be no additional text instructing the user to buy credits.
                    // Confirm that the number of credits appears
                        var creditsText = $("#homeCredits").html();
                        var expectedCreditsText ="10";
                        if ( creditsText != expectedCreditsText ) {
                            alert(
                                "Expecting value[ " +
                                expectedCreditsText +
                                " ]. Got value: [ "+
                                creditsText +
                                " ]"
                            );
                            return( -1 );
                        };
                    // Confirm that the credits text number is green
                        if ( $(homeCredits).css('color') != 'rgb(0, 153, 0)') {
                            alert(
                                "Error: The credits text color should be rgb(0, 153, 0)  or (#009900)"
                            );
                            return( -1 );
                        };
                    // Confirm that the 'Find a party' button is enabled
                        if ( $("#homeFindParty").hasClass('ui-disabled') != false) {
                            alert(
                                "Error: The 'Find a party' button should be active."
                            );
                            return( -1 );
                        };
                    return( 0 );
                },
            // User clicks the Profile link in the footer
                function() {
                    // Click the Profile button.
                        $( "#homeProfile" ).click(); 
                    // Add a delay to allow for page transition
                        return( 1000 );
                },
                function() {
                    // Initialize and assign a variable to hold the last value stored in the clientEvents part of the data map
                        GLOB.usr_homeOpenProfile = "";
                        // Use a listener to confirm that the value was properly stored in Firebase. The child_added function iterates through all children of clientEvents, so when the last iteration is complete, the last child added is assigned to the global variable. 
                        var checkGlobalClientRef = new Firebase('https://f30s.firebaseio.com/uniqueUserId12345/global/clientEvents/' );
                        checkGlobalClientRef.on('child_added', function(childSnapshot, prevChildName) {
                            var val = childSnapshot.val();
                            GLOB.usr_homeOpenProfile = JSON.stringify(val);
                        // Turn the listener off after retrieving the data
                            checkGlobalClientRef.off();
                        });
                    // Add a delay to allow for page transition
                        return( 1000 );
                },
                function() {
                    // Confirm that the 'Open_profile' message was received by Firebase
                        if (GLOB.usr_homeOpenProfile != '{"Open_profile":true}') {
                            alert(
                                'Expecting {"Open_profile":true}. Got: {' +
                                GLOB.usr_homeOpenProfile +
                                "}"
                            );
                            return( -1 );
                        };
                    // Confirm display state change to "Waiting..."
                        if ($(homeWaiting).parent().hasClass('ui-popup-hidden')) {
                            alert(
                                "Error: App should be in Waiting mode."
                            );
                            return( -1 );
                        };
                    descAlert( "The Profile link opened the Waiting overlay and sent a message to Firebase. The server response is to change to the Profile page, which we'll cover in the Profile section of the unit test. Now let's remove the Waiting overlay, select 'Help' and confirm that it opens the Help overlay." );
                    //  Remove the Waiting overlay
                        sys_closeWaiting();
                    // Add a delay to ensure the data is received
                        return( 1000 );
                },
            // User clicks the Help link
                function() {
                    // Click the Help button to confirm that it works
                        $( "#homeHelpButton" ).click(); 
                    // Add a delay to allow for page transition
                        return( 1000 );
                },
                function() {
                    // Confirm that display opened the Help overlay
                        if ($(homeHelp).parent().hasClass('ui-popup-hidden')) {
                            alert(
                                "Error: The Help overlay should be open"
                            );
                            return( -1 );
                        };
                    descAlert( "The Help button works. Let's test the 'Close' button in the Help overlay and confirm that it works." );
                    // Click the 'close' link in the Help page
                        $( "#homeReturn" ).click(); 
                    // Add a delay to allow for page transition
                        return( 1000 );
                },
                // Return to Home page
                function() {
                    // Confirm that the app removes the overlay
                        if ($(homeHelp).parent().hasClass('ui-popup-active')) {
                            alert(
                                "Error: The Help overlay should be closed"
                            );
                            return( -1 );
                        };
                    // Add a delay to allow for page transition
                        return( 1000 );
                },
            // User clicks 'Find a party'
                // Click 'Find a Party' and confirm that the screen goes into waiting and the message is received by Firebase.
                function() {
                    descAlert( "The 'Close' button in the Help overlay works. Let's test the 'Find a party' button. This will put the app in Waiting mode and send a message to Firebase." ); 
                    $( "#homeFindParty" ).click();
                    return( 1000 );
                },
                // Confirm receipt of the Find_party message
                function() {
                    // Initialize and assign a variable to hold the last value stored in the clientEvents part of the data map
                        GLOB.usr_homeFindParty = "";
                        // Use a listener to confirm that the value was properly stored in Firebase. The child_added function iterates through all children of clientEvents, so when the last iteration is complete, the last child added is assigned to the global variable. 
                        var checkHomeClientRef = new Firebase('https://f30s.firebaseio.com/uniqueUserId12345/pages/home/clientEvents' );
                        checkHomeClientRef.on('child_added', function(childSnapshot, prevChildName) {
                            var val = childSnapshot.val();
                            GLOB.usr_homeFindParty = JSON.stringify(val);
                        // Close the listener
                            checkHomeClientRef.off()
                        });
                    // Add a delay to ensure the data is received
                        return( 1000 );
                },
                function() {
                    // Confirm display state change to "Waiting..."
                        if ($(homeWaiting).parent().hasClass('ui-popup-hidden')) {
                            alert(
                                "Error: App should be in Waiting mode."
                            );
                            return( -1 );
                        };
                    // Confirm that the 'logout' message was received by Firebase
                        if (GLOB.usr_homeFindParty != '{"Find_party":true}') {
                            alert(
                                'Expecting {"Find_party":true}. Got: {' +
                                GLOB.usr_homeFindParty +
                                "}"
                            );
                            return( -1 );
                        };
                },
                function() {
                    descAlert( "The 'Find a party' button put the app in Waiting mode and sent a message to Firebase. Let's check that the server can trigger the user's geolocation services to retrieve their location. We need this immediately to optimize a recommendation for the nearest party." ); 
                    //  Remove the Waiting overlay
                        sys_closeWaiting();
                    // Add a delay to allow for page transition
                        return( 1000 );
                },
            // Test the server's ability to access the device geolocation function
                function() {
                    // If the unit test is being run on a desktop, skip this part of the test
                        // Check whether Cordova is active or not
                        platform = (window.cordova === undefined);
                        // If it's not, skip the geolocation check.
                        if (platform == true) {
                            return (0);
                        };
                    //  We want to confirm that we can trigger the device's geolocation function, but we want to remove device variables from the unit test. So we'll test this by calling the function directly in the code base before testing that we can reach it via Firebase.
                        getLocation();
                    // Add a delay to allow for device response. Ten seconds should suffice for a device whose location services are set to high accuracy, but an increase in the delay may be required if this part of the unit test returns an error.
                        return( 10000 );
                },
                function() {
                    // If the unit test is being run on a desktop, skip this part of the test
                        // Check whether Cordova is active or not
                        platform = (window.cordova === undefined);
                        // If it's not, skip the geolocation check.
                        if (platform == true) {
                            return (0);
                        };
                    // Initialize and assign variables to hold the values stored in the geolocation part of the data map
                        GLOB.sys_startGeoLat = "0";
                        GLOB.sys_startGeoLong = "0";
                        // Use a listener to confirm that the value was properly stored in Firebase. The child_added function iterates through all children of clientEvents, so when the last iteration is complete, the last child added is assigned to the global variable. 
                        globalClientGeoRef.on('child_added', function(childSnapshot, prevChildName) {
                            var val = childSnapshot.val();
                            latVal = val.latitude;
                            longVal = val.longitude;
                            GLOB.sys_startGeoLat = latVal;
                            GLOB.sys_startGeoLong = longVal;
                        // Close the listener
                            globalClientGeoRef.off()
                        });
                    // Add a delay to ensure the data is received
                        return( 1000 );
                },
                function() {
                    // If the unit test is being run on a desktop, skip this part of the test
                        // Check whether Cordova is active or not
                        platform = (window.cordova === undefined);
                        // If it's not, skip the geolocation check.
                        if (platform == true) {
                            return (0);
                        };
                    // Confirm that coordinates were received by Firebase
                        if (GLOB.sys_startGeoLat == "0") {
                            alert(
                                'No value was received for latitude'
                            );
                            return( -1 );
                        };
                        if (GLOB.sys_startGeoLong == "0") {
                            alert(
                                'No value was received for longitude'
                            );
                            return( -1 );
                        };
                    return( 0 );
                },
            // Test the geo services polling function
                function() {
                    descAlert( "We've confirmed that we can retrieve geolocation coordinates from a user's device. Since we want to track the user's progress and confirm when they've arrived we need to check location periodically. The next test iterates through five cycles of the geolocation test. In production we'll provide ample time to receive coordinates but to streamline the intervals for the unit test we'll overwrite the core geolocation function we just tested so it sends dummy coordinates to Firebase, and confirm that they were received." ); 
                    //  Create a global variable to allow indexing of the number of cycles
                    GLOB.intervalCounter = 0
                    //  Overwrite the getLocation function so we can test the loop independently of device capabilities.
                        getLocation = function() {
                            var latCounter = 'lat' + GLOB.intervalCounter;
                            var lngCounter = 'lng' + GLOB.intervalCounter;
                            globalClientGeoRef.push( { 'latitude' : latCounter, 'longitude' : lngCounter } );
                            GLOB.intervalCounter++;
                        };
                    //  Send the server message
                        globalServerGeoRef.set({geoLoopMsg:true})
                    // Add a delay to allow for device response. Five seconds should suffice for a device whose location services are set to high accuracy, but an increase in the delay may be required if this part of the unit test returns an error.
                        return( 5000 );
                },
                function() {
                    // Stop the cycling of the function. Five cycles should have completed. This will also confirm that the 'stop polling location' function works, because we'll now check that exactly five message were received in the five second interval we allowed before stopping the function.
                        globalServerGeoRef.set({geoLoopMsg:false})
                    // Initialize and assign a variable to hold the values stored in the geolocation part of the data map
                        GLOB.locationCycle = "";
                        // Use a listener to confirm that the value was properly stored in Firebase. The child_added function iterates through all children of clientEvents, so when the last iteration is complete, the last child added is assigned to the global variable. 
                        var checkGlobalClientGeoRef = new Firebase('https://f30s.firebaseio.com/uniqueUserId12345/global/geolocation' );
                        checkGlobalClientGeoRef.on('child_added', function(childSnapshot, prevChildName) {
                            var val = childSnapshot.val();
                            GLOB.locationCycle = JSON.stringify(val);
                        // Turn the listener off after retrieving the data
                            checkGlobalClientGeoRef.off();
                        });
                    // Add a delay to ensure the data is received
                        return( 1000 );
                },
                function() {
                    // Confirm that coordinates were received by Firebase
                        if (GLOB.locationCycle != '{"latitude":"lat4","longitude":"lng4"}') {
                            alert(
                                'Expecting {"latitude":"lat4","longitude":"lng4"}. Got: {' +
                                GLOB.locationCycle +
                                "}"
                            );
                            return( -1 );
                        };
                    descAlert( "The dummy coordinates were received. This concludes the unit test for the Home page." ); 
                    return( 0 );
                },
        // End of test. Place this at the end of the allTests array.
            function() {
                $('body').append("<div data-role='popup' class='unit-test-end' id='testComplete'><b>Test complete!</b><br> Click below to reset the interface.<br><br><a href='#' id='resetButton' onClick='$(testComplete).hide(); initializeUnitTest()' data-role='button' style='font-size:18px; text-align: center;'>Reset</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href='#' id='resetButton' onClick='$(testComplete).hide()' data-role='button' style='font-size:18px; text-align: center;'>Close alert</a></div>");
            }
    ];
    runAllTests( allTests, 0, allTests.length );
}
