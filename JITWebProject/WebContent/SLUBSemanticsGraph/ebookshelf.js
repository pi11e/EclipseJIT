/**
 * 
 */
//var graph = avgl.Graph.rgraph.canvas.getElement(); // rgraph undefined
// get canvas element
//var canvas = document.getElementById("ns-avgl-facetgraph-infovis-canvas");
//var ctx = document.getElementById("ns-avgl-facetgraph-infovis-canvas").getContext('2d');
//console.log(canvas);

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
	
	// print all properties of avgl.Graph:
//	for(var propertyName in avgl.Graph)
//	{
//		console.log(propertyName);
//	}
	
	// onclick for graph:
//	avgl.Graph.prototype._onClick
	
	var someId = 0;
	console.log("getSomeNodeId(" + someId + ") = " + getSomeNodeId(someId));
	
    console.log('after');
},500);


var getSomeNodeId = function (id)
{
	// graph.js 191:
	//   return this.rgraph.graph.getNode(id);
	// yields rgraph === undefined!

	return avgl.Graph.prototype._getNode(id);
};

// functions required for graph manipulation:

// - node highlighting 
//		(visually emphasizing one node, allowing clear distinction from other nodes)
// - node selection 
//		(animated centering of the node and its first level subnodes)
// - graph zooming
//		(animated extension/compression of edge lengths to increase / decrease on-screen node density)
// - open / close node details
//		(if selected node is a leaf - i.e. object - node, show its image and description)


// To Do:
// expose above functionality
// -> e.g. control node selection (onClick method) programmatically
