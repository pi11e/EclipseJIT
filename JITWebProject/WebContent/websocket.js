var socket;
var closeConnection = function(){
	
	if(socket)
		socket.close();
};


window.onload = function () 
{
    var status = document.getElementById("kinect_status");
    var canvas = document.getElementById("kinect_canvas");
    var consoleDiv = document.getElementById("kinect_console");
    var context;

    if(canvas && status)
	{
    	context = canvas.getContext("2d");
    	// add border to canvas
        canvas.style.border = "red 1px solid"
        
        canvas.width = window.innerWidth / 2;
        canvas.height = window.innerHeight / 2;

        if (!window.WebSocket) {
            status.innerHTML = "Your browser does not support web sockets!";
            return;
        }

        status.innerHTML = "Connecting to server...";
	}
    

    // Initialize a new web socket.
    socket = new WebSocket("ws://localhost:8181/KinectHtml5");

    // Connection established.
    socket.onopen = function () 
    {
    	if(status)
    	{	status.innerHTML = "Connection successful.";}
    	console.log("Connection successful.");
    };

    // Connection closed.
    socket.onclose = function () {
    	if(status)
    	{	status.innerHTML = "Connection closed.";}
    	console.log("Connection closed.");
    };

    // Receive data FROM the server!
    socket.onmessage = function (evt) {
    	
    	
    	if(status)
        {status.innerHTML = "Kinect data received.";}
    	

        // Get the data in JSON format.
        var jsonObject = eval('(' + evt.data + ')');

        
        
        
        // if the incoming json represents skeleton data, draw it in the canvas
        if(canvas && context && jsonObject.type === 'JSONSkeletonCollection')
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
        	if(window.kinectComponent)
    		{
        		window.kinectComponent.dispatchJSON(jsonObject);
    		}
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
	if($("#messageDiv") && $("#messageDiv").length > 0)
	{
		// add a fadeIn / fadeOut effect for better noticeability
		$("#messageDiv").fadeIn(100).fadeOut(10).fadeIn(10);
		// set inner html to display the actual string
		$("#messageDiv").html("<p>"+JSONstring+"</p>");
	}

};