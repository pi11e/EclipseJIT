var socket;
var closeConnection = function(){
	
	if(socket)
		socket.close();
};


window.onload = function () {
    var status = document.getElementById("status");
    var canvas = document.getElementById("canvas");
    var consoleDiv = document.getElementById("console");
    var context = canvas.getContext("2d");

    // add border to canvas
    canvas.style.border = "red 1px solid"
    
    canvas.width = window.innerWidth / 2;
    canvas.height = window.innerHeight / 2;

    if (!window.WebSocket) {
        status.innerHTML = "Your browser does not support web sockets!";
        return;
    }

    status.innerHTML = "Connecting to server...";

    // Initialize a new web socket.
    socket = new WebSocket("ws://localhost:8181/KinectHtml5");

    // Connection established.
    socket.onopen = function () {
        status.innerHTML = "Connection successful.";
    };

    // Connection closed.
    socket.onclose = function () {
        status.innerHTML = "Connection closed.";
    };

    // Receive data FROM the server!
    socket.onmessage = function (evt) {
    	
    	
    	
        status.innerHTML = "Kinect data received.";

        // Get the data in JSON format.
        var jsonObject = eval('(' + evt.data + ')');

        
        
        
        // if the incoming json represents skeleton data, draw it in the canvas
        if(jsonObject.type === 'JSONSkeletonCollection')
    	{
        	context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = "#FF0000";
            context.beginPath();

            // Display the skeleton joints.
            for (var i = 0; i < jsonObject.skeletons.length; i++) {
                for (var j = 0; j < jsonObject.skeletons[i].joints.length; j++) {
                    var joint = jsonObject.skeletons[i].joints[j];

                    // Draw!!!
                    context.arc(parseFloat(joint.x), parseFloat(joint.y), 10, 0, Math.PI * 2, true);
                }
            }

            context.closePath();
            context.fill();
            
    	}
        // if the incoming json represents a string message, append it to the console div
        else if(typeof jsonObject === 'string')
    	{
        	// log the string for debugging purposes
        	logJSONString(jsonObject);
        	// TODO:
        	// if the JSON string contains a gesture code, act accordingly by calling kinectComponent methods
        	// or possibly the gesture code dispatcher
    	}

        // Inform the server about the update.
        //socket.send("Skeleton updated on: " + (new Date()).toDateString() + ", " + (new Date()).toTimeString());
    };
};

/**
 * Shows the given string in a message div
 */
var logJSONString = function(JSONstring)
{
	//console.log("message received: " + JSONstring);
	
	// add a fadeIn / fadeOut effect for better noticeability
	$("#messageDiv").fadeIn(100).fadeOut(10).fadeIn(10);
	// set inner html to display the actual string
	$("#messageDiv").html("<p>"+JSONstring+"</p>");
};