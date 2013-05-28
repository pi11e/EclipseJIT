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

var queryDB = function(queryString, callback)
{
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

var createGraphLevelFromData = function()
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
       //		node = {id:"", name:"", data:{...}}
       //		data has additional values 
       /*highlightColor: "#F90"
       isHighlighted: false
       regularColor: "#278"
       */
       
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
    		   
    		   console.log("name result = " + newNode.name);
  				var query = "XQUERY count(//obj[a99d3='"+ newNode.name +"'])";
   				//console.log("trying query = " + query);
   				queryDB(query, function(data)
   				{
   					console.log("server response to " + query + " = " + data);
   					// get correct node
   					
   				});
    		   
    		   var rootNode = rgraph.graph.getNode(rgraph.root);
    		   //console.log("created node " + newNode.name + " with id " + newNode.id);
    		   rgraph.graph.addAdjacence(rootNode, newNode);
    		   
    		   
    		   
		   }
	   }
       


   	
       
       // 3. reload graph 
       rgraph.refresh();
       rgraph.plot();
       
       
       
    }); // end of getDistinctValuesForTag
	
	// add book count for each node?
	
	
};

