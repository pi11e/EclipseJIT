var socket = undefined;
var kinectServerAddress = "ws://localhost:8181/KinectHtml5";
var useKinectKeyboardDebugMode = false;
//var kinectServerAddress = "ws://192.168.178.23:8181/KinectHtml5";

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
	
	if(useKinectKeyboardDebugMode)
	{
		enableKeyboardKinect();
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
    socket = new WebSocket(kinectServerAddress);
    

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
        	

        	var skeletonData = new Array();
        	
            // Display the skeleton joints.
            for (var i = 0; i < jsonObject.skeletons.length; i++) 
            {
            	var aSkeleton = new Object();
            	
                for (var j = 0; j < jsonObject.skeletons[i].joints.length; j++) 
                {
                    var joint = jsonObject.skeletons[i].joints[j];
                    aSkeleton[joint.name] = joint;
                    
                    if(canvas && context)
                    {
                    // Draw!!!
                    context.arc(parseFloat(joint.x), parseFloat(joint.y), 10, 0, Math.PI * 2, true);
                    }
                    
                    
                    
                    
                } // end of joint-loop within a skeleton
                
                // now, aSkeleton holds all joints accesible by their name (note: names are all lowercase in the form of $bodypart[left|right|center],
                // e.g. handleft, hipcenter etc.
                
                // save aSkeleton to skeletonData
                skeletonData[i] = aSkeleton;
            } // end of skeleton loop within jsonObject
            
            // now, skeletonData holds 1-2 skeletons along with their joints
            if(window.kinectComponent)
        	{
            	window.kinectComponent.dispatchHandMovement(skeletonData);
        	}
            
            
            if(canvas && context)
        	{
	            context.closePath();
	            context.fill();
        	}
            
            
            
    	} // end of _if(typeof jsonObject === 'JSONSkeletonCollection')_
        // if the incoming json represents a string message instead, append it to the console div
        else if(typeof jsonObject === 'string')
    	{
        	// log the string for debugging purposes
        	logJSONString(jsonObject);
        	// TODO:
        	// if the JSON string contains a gesture code, act accordingly by calling kinectComponent methods
        	// or possibly the gesture code dispatcher
        	if(jsonObject.match('^handconfig') && window.kinectComponent)
    		{
        		window.kinectComponent.dispatchHandInteraction(jsonObject);
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