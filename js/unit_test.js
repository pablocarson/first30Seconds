function unitTests() {
    var allTests = [
        // Walkthrough notes are displayed in the console (no pauses)
            function() {
                descAlert = function( txt ) { console.log (txt); }
            },
        // P1. NewUser page / about page
            // Let's start with an anonymous (unauthenticated user.) 
            // Check for an authentication token in localStorage and assign it to a global variable. If a value is set, all 'new user' tests will be skipped. If it's null, they will run. This way, the same test can be run for anonymous and authenticated users.
                function() {
                    GLOB.f30sUserId = window.localStorage.getItem("f30sUserId");
                },
            // Confirm that we are on the newUser page
                function() {
                    if (GLOB.f30sUserId == null) {
                        // If the value of f30sUserId in localStorage is null, a newUser page is automatically displayed with two choices.
                            // 'Join the party'
                                // A 'new user' who's coming to the site for the first time
                                // A previous user who never purchased credits. We treat them as new users for all practical purposes.
                            // 'Restore profile and credits
                                // A user who has purchased credits but is coming from an unrecognized device and needs to provide some credentials to restore their credits and profile.
                        var screen =  $.mobile.activePage.attr('id');
                        var expectedScreen ="newUser";
                        if (screen != expectedScreen ) {
                            alert(
                                "Expecting value [ " +
                                expectedScreen +
                                " ]. Got value: [ "+
                                screen +
                                " ]"
                            );
                            return( -1 );
                        };
                    };
                },
            // New user joins
                function() {
                    if (GLOB.f30sUserId == null) {
                        descAlert( "Let's check the authentication functions of the unit test for an anonymous user. Such a user has two options, the first being to simply confirm that they're a new user. When the user selects 'Join the Party', a message is sent to Firebase from the client. Let's click the button and confirm that the message was received.")
                        $("#joinParty").click();
                        // Allow time for the value to be retrieved
                            return( 1000 );
                    };
                },
                function() {
                    // Since this is a test element for an anonymous user, run it only if there's no value for f30sUserId in localStorage.
                    if (GLOB.f30sUserId == null) {
                        // Confirm display state change to Waiting
                            if ($(".ui-loader-background").css('display') != 'block') {
                                alert(
                                    "Error: App should be in Waiting mode."
                                );
                                return( -1 );
                            };
                        // Initialize and assign a variable to hold the last value stored in the newUserIdRequests part of the data map
                            GLOB.newUserDeviceId = "";
                            // Create a listener to assign the last value received by Firebase to the global variable
                            var checkNewUserIdRequestRef = new Firebase('https://f30s.firebaseio.com/newUserIdRequests/' );
                            checkNewUserIdRequestRef.on('child_added', function(childSnapshot, prevChildName) {
                                var val = childSnapshot.val();
                                GLOB.newUserDeviceId = JSON.stringify(val);
                            // Close the listener
                                checkNewUserIdRequestRef.off()
                            });
                        // Allow time for the value to be retrieved
                            return( 1000 );
                    };
                },
                function() {
                    // Since this is a test element for an anonymous user, run it only if there's no value for f30sUserId in localStorage.
                    if (GLOB.f30sUserId == null) {
                        // Confirm that a 'newUserIdRequests' message was received by Firebase using the value stored 
                            if (GLOB.newUserDeviceId == "") {
                                alert(
                                    'No device ID was received from Firebase.'
                                );
                                return( -1 );
                            };
                    };
                },
            // Anonymous user who bought credits submits credentials
                // Paid user submits with blank email
                    // Confirm that the form checks for blank required fields during submission. First we'll submit with a blank email field and confirm that the proper alert appears.
                    function() {
                        // Since this is a test element for an anonymous user, run it only if there's no value for f30sUserId in localStorage.
                        if (GLOB.f30sUserId == null) {
                            descAlert( "The waiting overlay opened and a 'new user' message was received by Firebase. Before we attempt a server response, let's confirm that the function to restore a paid user works. We want the page to display an alert if either form field is blank." );
                            // Close the Waiting overlay
                                sys_closeWaiting();
                            // Allow time for page transition
                                return( 1000 );
                        };
                    },
                    function() {
                        // Since this is a test element for an anonymous user, run it only if there's no value for f30sUserId in localStorage.
                        if (GLOB.f30sUserId == null) {
                            // Populate the form fields and click submit
                                $('#creditEmail').val(''); 
                                $('#creditLast4').val('4444'); 
                                $( "#paidUserSubmitButton" ).click();
                            // Allow time for submission
                                return( 1000 );
                        };
                    },
                    function() {
                        // Since this is a test element for an anonymous user, run it only if there's no value for f30sUserId in localStorage.
                        if (GLOB.f30sUserId == null) {
                            // Confirm that the text populates the alert box
                                var expectedText ="You left a required field blank. Please fill in the blank and try again.";
                                var alertText = $('#newUserAlertText').text()
                                if ( alertText != expectedText ) {
                                    alert(
                                        "Expecting text: [" +
                                        expectedText +
                                        "]. Got text: ["+
                                        alertText +
                                        "]"
                                    );
                                    return( -1 );
                                };
                            // Confirm that the alert element is displayed (since it's hidden by default)
                                if ( $(newUserAlertWrapper).css('display') != 'block') {
                                    alert(
                                        "Error: App should have displayed 'Blank Form Field' alert."
                                    );
                                    return( -1 );
                                };
                            descAlert( "The 'Required field is blank' alert was displayed properly. Now let's test that we get the same error alert when we attempt submission with a blank password field. Since it's the same alert, we'll close the current alert first.");
                            // Close the alert and the Waiting overlay
                                $('.alertWrapper').hide();
                                sys_closeWaiting();
                            // Add a delay to allow for display update
                                return( 1000 );
                        };
                    },
                // User selects alert to close it
                    function() {
                        if (GLOB.f30sUserId == null) {
                            descAlert( "The alert was displayed and the Waiting overlay was removed. For this page only, the alert closes when the user clicks on it without server interaction. Let's click on the alert and confirm that it closes." );
                            // Click on the alert
                                $(newUserAlertWrapper).click();
                            // Add a delay to allow for display update
                                return( 1000 );
                        };
                    },
                    function() {
                        if (GLOB.f30sUserId == null) {
                            // Confirm that alert has been removed
                                if ( $(newUserAlertWrapper).css('display') == 'block') {
                                    alert(
                                        "Error: App should not be displaying an alert."
                                    );
                                    return( -1 );
                                };
                            // Confirm that Waiting overlay has been removed
                                if ($(".ui-loader-background").css('display') != 'none') {
                                    alert(
                                        "Error: App should not be in Waiting mode."
                                    );
                                    return( -1 );
                                };
                        };
                    },
                // Paid user logs in with blank credit card field
                    // Now let's test that we get the same error alert when we attempt submission with a blank password field. 
                    function() {
                        // Since this is a test element for an anonymous user, run it only if there's no value for f30sUserId in localStorage.
                        if (GLOB.f30sUserId == null) {
                            // Populate the form fields and submit
                                $('#creditEmail').val('paul@gmail.com'); 
                                $('#creditLast4').val(''); 
                                $( "#paidUserSubmitButton" ).click();
                            // Confirm that the text populates the alert box
                                var expectedText ="You left a required field blank. Please fill in the blank and try again.";
                                var alertText = $('#newUserAlertText').text()
                                if ( alertText != expectedText ) {
                                    alert(
                                        "Expecting text: [" +
                                        expectedText +
                                        "]. Got text: ["+
                                        alertText +
                                        "]"
                                    );
                                    return( -1 );
                                };
                            // Confirm that the alert element is displayed (since it's hidden by default)
                                if ( $(newUserAlertWrapper).css('display') != 'block') {
                                    alert(
                                        "Error: App should have displayed 'Blank Form Field' alert."
                                    );
                                    return( -1 );
                                };
                        };
                    },
                // Paid user submits request with both fields populated
                    // Let's simulate a user entering a username / password combination, and confirm that the app goes into the proper Waiting state and a 'paid user' message is received by Firebase containing the submitted email and credit card info. This is handled client-side so it must be tested separately from other alerts. 
                    function() {
                        // Since this is a test element for an anonymous user, run it only if there's no value for f30sUserId in localStorage.
                        if (GLOB.f30sUserId == null) {
                            descAlert( "The 'Required field is blank' alert was displayed properly. Let's remove the alert and simulate a user entering an email / credit card combination, and confirm that the app goes into the proper Waiting state and a 'paid user' message is received by Firebase containing the submitted ID and password. This is handled client side so it must be tested separately from other alerts. ");
                            // Close the alert
                                $('.alertWrapper').hide();
                            // Populate the form fields and submit
                                $('#creditEmail').val('paul@gmail.com'); 
                                $('#creditLast4').val('4444'); 
                                $( "#paidUserSubmitButton" ).click();
                            // Add a delay to allow for display update
                                return( 1000 );
                        };
                    },
                    function() {
                        // Since this is a test element for an anonymous user, run it only if there's no value for f30sUserId in localStorage.
                        if (GLOB.f30sUserId == null) {
                            // Initialize and assign a variable to hold the value stored in the clientEvents part of the data map
                                // Set the Firebase reference. We'll be specific to ensure that this is in the proper place in the data architecture map.
                                GLOB.paidUserAttemptEmail = "";
                                GLOB.paidUserAttemptLast4 = "";
                                GLOB.paidUserAttemptDevice = "";
                                // Use the listening function to confirm that the value was properly stored in Firebase. Though the child_added function iterates through all children of clientEvents, the random value generated by 'push' ensures that the last iteration will be the most recent child added. 
                                var checkPaidUserIdRequestRef = new Firebase('https://f30s.firebaseio.com/newUserIdRequests/' );
                                checkPaidUserIdRequestRef.on('child_added', function(childSnapshot, prevChildName) {
                                    var val = childSnapshot.val();
                                    GLOB.paidUserAttemptEmail = val.payEmail;
                                    GLOB.paidUserAttemptLast4 = val.payCard;
                                    GLOB.paidUserAttemptDevice = val.deviceUuid;
                                // Turn the listener off after retrieving the data
                                    checkPaidUserIdRequestRef.off();
                                });
                            // Add a delay to allow for display update
                                return( 1000 );
                        };
                    },
                    function() {
                        // Since this is a test element for an anonymous user, run it only if there's no value for f30sUserId in localStorage.
                        if (GLOB.f30sUserId == null) {
                            // Confirm that the 'paid user' message was received by Firebase
                                if (GLOB.paidUserAttemptEmail != "paul@gmail.com") {
                                    alert(
                                        "Expecting 'paul@gmail.com'. Got: " + 
                                        GLOB.paidUserAttemptEmail + 
                                        "." 
                                    );
                                    return( -1 );
                                };
                                if (GLOB.paidUserAttemptLast4 != "4444") {
                                    alert(
                                        "Expecting '4444'. Got: " + 
                                        GLOB.paidUserAttemptLast4 + 
                                        "." 
                                    );
                                    return( -1 );
                                };
                                if (GLOB.paidUserAttemptDevice == "") {
                                    alert(
                                        "A value for device.uuid was not received by Firebase."
                                    );
                                    return( -1 );
                                };
                            // Confirm display state change to Waiting
                                if ($(".ui-loader-background").css('display') != 'block') {
                                    alert(
                                        "Error: App should be in Waiting mode."
                                    );
                                    return( -1 );
                                };
                        };
                    },
            // User clicks 'About this app' link
                function() {
                    if (GLOB.f30sUserId == null) {
                        // Let's test the "About this app" link. The client should respond by opening the "About this app" page. The page is static so no information is sent to Firebase. 
                        descAlert( "Let's test the 'About this app' link. The client should respond by opening the 'About this app' page.");
                        // Remove the Waiting overlay
                            sys_closeWaiting();
                        return( 1000 );
                    };
                },
                function() {
                    if (GLOB.f30sUserId == null) {
                        // Click the 'About this app' link
                            $( "#newUserAbout" ).click(); 
                        // Add a delay to allow for display update
                            return( 1000 );
                    };
                },
                function() {
                    if (GLOB.f30sUserId == null) {
                        // Confirm the link brought us to the About page
                            var expectedPage = "about"
                            var currentPage = $.mobile.activePage.attr("id");
                            if (expectedPage != currentPage) {
                                alert(
                                    "Expecting page: [ " +
                                    expectedPage +
                                    " ]. Got page: [ "+
                                    currentPage +
                                    " ]"
                                );
                                return( -1 );
                            };
                        descAlert( "The display changed to the 'About this app' page. Let's test that the 'Return to login' button brings us back to the Login page.");
                        // While we're on the "About this app" page, let's test the "Return" link, which should bring us back to the Login page.
                        // Test the 'Return' button in the 'About this app' page
                            $( "#aboutReturn" ).click();
                        // Add a delay to allow for display update
                            return( 1000 );
                    };
                },
            // Click the 'return' button
                function() {
                    if (GLOB.f30sUserId == null) {
                        descAlert( "The display changed to the 'About this app' page. Let's test that the 'Return to login' button brings us back to the Login page.");
                        // While we're on the "About this app" page, let's test the "Return" link, which should bring us back to the Login page.
                        // Test the 'Return' button in the 'About this app' page
                            $( "#aboutReturn" ).click();
                        // Add a delay to allow for display update
                            return( 1000 );
                    };
                },
                function() {
                    // Confirm that we're back on the newUser page
                        if (GLOB.f30sUserId == null) {
                            var expectedPage = "newUser"
                            var currentPage = $.mobile.activePage.attr("id");
                            if (expectedPage != currentPage) {
                                alert(
                                    "Expecting page: [ " +
                                    expectedPage +
                                    " ]. Got page: [ "+
                                    currentPage +
                                    " ]"
                                );
                                return( -1 );
                            };
                        };
                },
            // server sends an authentication token
                function() {
                    // Since this is a test element for an anonymous user, run it only if there's no value for f30sUserId in localStorage.
                    if (GLOB.f30sUserId == null) {
                        // When the server detects that a new device ID has been sent to Firebase, it sends a Firebase message with an f30sUserID to a reference created from the device ID.
                        descAlert( "The message containing the device ID was received by FIrebase. The server uses the device ID to return a unique server-generated ID to the client as an authentication certificate. The client takes this ID and places it in localStorage. If successful, the app will reboot so the user ID can be incorporated into all Firebase references and listeners. (new user dialogs will go here)")
                        // Server sends Firebase message containing a unique f30s user ID.
                            GLOB.newUserIdResponseRef.set ( { f30sUserIdMsg : "uniqueUserId12345" } )
                        // Add a delay for Firebase response
                            return( 1000 );
                    };
                },
            // client sends authenticated pageReady command.
                function() {
                    // If the unit test is run and this client / device has previously been authenticated (there's an authentication token in localStorage), this will be the first unit test element. Confirm that the app sent a pageReady message to Firebase using a reference created from the previous portion of the unit test.
                    // Initialize and assign a variable to hold the last value stored in the newUserIdRequests part of the data map
                        GLOB.usr_existingUserId = "";
                        // Create a listener to assign the last value received by Firebase to the global variable
                        var checkuserIdRef = new Firebase('https://f30s.firebaseio.com/uniqueUserId12345/' );
                        checkuserIdRef.on('child_added', function(childSnapshot, prevChildName) {
                            var val = childSnapshot.val();
                            GLOB.usr_existingUserId = JSON.stringify(val);
                        // Close the listener
                            checkuserIdRef.off()
                        });
                    // Allow time for the value to be retrieved
                        return( 1000 );
                },
                function() {
                    // Confirm that a 'page ready' message was received by Firebase. If one wasn't, GLOB.usr_existingUserId will be null. We can't specify the exact value returned because the GCM push notifications ID, which is passed at this time, is unique to each device.
                        if (GLOB.usr_existingUserId == null) {
                            alert(
                                'There was an f30sUserId in localStorage, but a pageReady message was not received from Firebase.'
                            );
                            return( -1 );
                        };
                },
        // End of test. Place this at the end of the allTests array.
            function() {
                $('body').append("<div data-role='popup' class='unit-test-end' id='testComplete'><b>Test complete!</b><br> Click below to reset the interface.<br><br><a href='#' id='resetButton' onClick='$(testComplete).hide(); initializeUnitTest()' data-role='button' style='font-size:18px; text-align: center;'>Reset</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href='#' id='resetButton' onClick='$(testComplete).hide()' data-role='button' style='font-size:18px; text-align: center;'>Close alert</a></div>");
            }
    ];
    runAllTests( allTests, 0, allTests.length );
}
