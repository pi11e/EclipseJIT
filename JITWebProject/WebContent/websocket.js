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
        else 
    	{
        	consoleDiv.innerHTML = "<p>server message:</p><p>"+jsonObject+"</p>";
        	//console.log(jsonObject.message);
        	//jQuery("#console").append("<p> " + jsonObject + "</p>");
    	}

        // Inform the server about the update.
        //socket.send("Skeleton updated on: " + (new Date()).toDateString() + ", " + (new Date()).toTimeString());
    };
};