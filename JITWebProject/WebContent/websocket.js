var socket = undefined;
var closeConnection = function(){
	
	if(socket)
		socket.close();
};

var openConnection = function()
{
	if(socket)
	{
		console.log("Connection to kinect server already established.");
		return;
	}
		
	
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
        if(jsonObject.type === 'JSONSkeletonCollection')
    	{
        	if(canvas && context)
    		{
        		context.clearRect(0, 0, canvas.width, canvas.height);
                context.fillStyle = "#FF0000";
                context.beginPath();	
    		}
        	

            // Display the skeleton joints.
            for (var i = 0; i < jsonObject.skeletons.length; i++) {
                for (var j = 0; j < jsonObject.skeletons[i].joints.length; j++) {
                    var joint = jsonObject.skeletons[i].joints[j];

                    if(canvas && context)
                    {
                    // Draw!!!
                    context.arc(parseFloat(joint.x), parseFloat(joint.y), 10, 0, Math.PI * 2, true);
                    }
                    
                    
                    var isLeftHand = joint.name === "handleft";
                    var isRightHand = joint.name === "handright";
                    if(isLeftHand || isRightHand)
                	{
                    	// draw node on graph?
                        if(window.kinectComponent)
                    	{
                        	var controller = window.kinectComponent;
                        	var rgraph = controller.rgraph;
                        	
                        	if(isLeftHand)
                    		{
                        		console.log("lh.x = " + joint.x + "; lh.y = " + joint.y);
                        		// scale joint coords to a 100x100 quad
                        		var factor = Math.PI * 8;
                        		var scaledX = joint.x / factor;
                        		var scaledY = joint.y / factor;
                        		if(controller.getNodeById("1") === undefined)
                    			{
                        			rgraph.graph.addNode({id: "1", name:"", data:""});
                    			}
                        		
                        		
                        		//controller.getNodeById("1").setPos(new $jit.Complex(scaledX, scaledY));
                        		//controller.getNodeById("1").setPos(new $jit.Polar(scaledX, 120));
                        		
                        		// set highlight to closest graph node
                        		//var closestNode = rgraph.graph.getClosestNodeToNode(controller.getNodeById("1").getPos(), controller.getNodeById("1"));
                        		//console.log("found closest node: " + closestNode);
                        		//controller.setHighlightedNode(closestNode);
                        		
                        		//rgraph.plot();
                    		}
                        	
                        	
                    	}
                	}
                }
            }

            if(canvas && context)
        	{
	            context.closePath();
	            context.fill();
        	}
            
            
            
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
    }; // end of socket.onmessage()
    
};

window.onload = function () 
{
	this.openConnection();
    

};

/**
 * Shows the given string in a message div
 */
var logJSONString = function(JSONstring)
{
	
	
	//console.log("message received: " + JSONstring);
	if($("#messageDiv") && $("#messageDiv").length > 0)
	{
		var stringArray = JSONstring.split(";");
		htmlString = "";
		for(var index in stringArray)
		{
			var string = stringArray[index];
			htmlString += "<br>" + string;
		}
		// add a fadeIn / fadeOut effect for better noticeability
		//$("#messageDiv").fadeIn(100).fadeOut(10).fadeIn(10);
		// set inner html to display the actual string
		$("#messageDiv").html(htmlString);
	}

};