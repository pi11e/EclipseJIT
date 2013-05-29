/**
 * 
 */
// NOTE: RGraph rendering function at jit.custom.js line 8924


console.log('before');
setTimeout(function()
{
	
	
	var infovisDiv = document.getElementById("ns-avgl-facetgraph-infovis");
	
	/*
	infovisDiv looks like this:
	-----
	<div id="ns-avgl-facetgraph-infovis">
		<div id="ns-avgl-facetgraph-infovis-canvaswidget" ...>
			<canvas id="ns-avgl-facetgraph-infovis-canvas" ...></canvas>
			<div id="ns-avgl-facetgraph-infovis-label" ...>
				... labels ... (a bunch of divs)
			</div>
		</div>
	</div>
	-----
	... BUT ONLY AFTER execution of the graph initialization and injection code, 
	which includes the starting animation.
	Solution: Either force this portion to wait (see setTimeout method) until the animation
	is finished OR set JIT/Rgraph to not play the animation when just starting.
	*/

	//console.log(infovisDiv);
	//console.log(canvasElement.getContext("2d"));

	var canvas = document.getElementById("ns-avgl-facetgraph-infovis-canvas");
	var context = canvas.getContext("2d");
	var rgraph = this.kinectComponent.rgraph;
	
	console.log("this = " + this); // this = [object Window]
	console.log("this.kinectComponent.rgraph = " + rgraph);
	
//	var someId = 840468; // node name "Beugungsintegral"
//	var someNode = rgraph.graph.getNode(someId);
//	
//	console.log("getSomeNodeId(" + someId + ") = " + someNode + " with name " + someNode.name);
//	console.log(window.hasOwnProperty('$jit'));
	
	// setup with highlighting color
	// http://philogb.github.io/jit/static/v20/Docs/files/Graph/Graph-js.html#Graph.Util.eachNode
	this.kinectComponent.rgraph.graph.eachNode(function(node)
		{
			// perform this for all nodes in the graph
			node.data.regularColor = "#278";
			node.data.highlightColor = "#F90";
			node.data.isHighlighted = false;
		}
	);
	
	
	
	
	
    console.log('after');
},500);


var promptQueryAndExecute = function()
{
	var queryString = prompt("Enter XQuery:");
	queryDB(queryString, function(data){alert(data);});
};

var queryDB = function(queryString, callback, callAsync)
{
	// make sure the supplied callback is a function
	if(typeof callback !== 'function')
	{
		console.log("queryDB ERROR: invalid callback parameter. not a function.");
		return;
	}
	
	
	if(arguments.length === 3 && typeof callAsync === 'boolean') // async parameter supplied
	{
		// use callAsync parameter to set up jQuery AJAX accordingly
		jQuery.ajaxSetup({async:callAsync});
	}
	else
	{
		// default: asynchronous call (true)
		jQuery.ajaxSetup({async:true});
	}
	
	
	$.get(
		    "http://localhost:8080/JITWebProject/DataServlet",
		    {query : queryString},
		    callback
		);
};


var getDistinctValuesForTag = function(tag, callback)
{
	//e.g. for $x in distinct-values(//obj/a99d3) return ($x, '&#xa;')
	var delimiter = ";";
	var query = "XQUERY for $x in distinct-values(//obj/" + tag + ") return ($x, '" + delimiter + "')";
	
	
	queryDB(query, callback);
};

var createFirstGraphLevel = function()
{
	getDistinctValuesForTag("a99d3", 
	function(data) 
    {
    	// data contains the server response
       var nodeNames = data.split(";");
       //console.log(nodeNames);
       
       var rgraph = window.kinectComponent.rgraph;
       
       // TODO: create new json graph data with given names
       
       // 1. create new node for each valid name in nodeNames
       
       
       for(var i = 0; i < nodeNames.length; i++)
	   {
    	   var nodeName = nodeNames[i];
    	   
    	   if(nodeName != undefined && nodeName !== "")
		   {
    		   
    		   var newNode = {
    				   id:		i+10,//Math.ceil(Math.random()*100000).toString(),
    				   name:	jQuery.trim(nodeName),
    				   data:	{
    					   			highlightColor: "#F90",
    					   			isHighlighted: false,
    					   			regularColor: "#278",
    					   			cnt: undefined
    					   		}
    				
    		   }; // end of newNode
    		   

    			// TODO: add book count for each node?
  				var query = "XQUERY for $x in 1 return (count(//obj[a99d3='"+ newNode.name +"']), "+ newNode.id +")";
  				  				
   				queryDB(query, function(data)
   				{
   					// data is expected to match format $amount_of_objects $node_id
   					var tempData = data.split(" ");
   					var childAmount = tempData[0];
   					var nodeId = tempData[1];
   					
   					// doesn't work. while the correct data.cnt gets set to the correct nodes, even when refreshed/plotted the numbers don't show
   					window.kinectComponent.getNodeById(nodeId).data.cnt = childAmount;
   					
   				}, false);
    		   
    		   var rootNode = rgraph.graph.getNode(rgraph.root);
    		   //console.log("created node " + newNode.name + " with id " + newNode.id);
    		   rgraph.graph.addAdjacence(rootNode, newNode);
    		   
    		   
    		   
		   }
	   } // end of node-creating for-loop
       
       // test
       createSublevelForNode("Arbeiterfotografie");
       
       
       // 3. reload graph 
       rgraph.refresh();
       rgraph.plot();
       
       
       
    }); // end of getDistinctValuesForTag
	
	
	
}; // end of createFirstGraphLevel()

var createSublevelForNode = function(parentNodeName)
{
	// Assume parentNodeName is one of the possible distinct values of tag a99d3, e.g. 'Talleyrand' or 'Arbeiterfotografie'.
	// For the given name, display a number of subnodes depending on interaction design mode.
	var query = "XQUERY for $x in //obj[a99d3='"+parentNodeName+"'] return (distinct-values($x//a55df/text()), ';')";
	var tempData;
	
	queryDB(query, function(data)
				{
					// data will contain several tags delimited by ';'
					tempData = data.split(";");
					console.log(tempData);
				});
};

var addNodesWithNames = function(nodeNames)
{
	for(var i = 0; i < nodeNames.length; i++)
	{
		// create a new node for each given node name
		var nodeName = nodeNames[i];
		
		var newNode = {
				   id:		Math.ceil(Math.random()*100000).toString(),
				   name:	jQuery.trim(nodeName),
				   data:	{
					   			highlightColor: "#F90",
					   			isHighlighted: false,
					   			regularColor: "#278",
					   			cnt: undefined
					   		}
				
		   }; // end of newNode
	}
};