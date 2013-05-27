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
	
	
	createGraphLevelFromData();
	
	
    console.log('after');
},500);


var promptQueryAndExecute = function()
{
	var queryString = prompt("Enter XQuery:");
	queryDB(queryString);
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
       console.log(nodeNames);
       
       // TODO: create new json graph data with given names
       
       
       // Doesnt work!
//       jsonData = [];
//       for(var i = 0; i < nodeNames.length; i++)
//	   {
//    	   jsonData[i] = {"id":Math.ceil(Math.random()*1000000).toString(),"name":nodeNames[i],"adjacencies":["0"]};
//	   }
//       
//       console.log(jsonData);
//       new avgl.Graph(jsonData);
    });
};

