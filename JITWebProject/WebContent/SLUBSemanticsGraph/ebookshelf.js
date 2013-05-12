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
	var rgraph = this.kinectComponent.rgraph;
	
	console.log("this = " + this); // this = [object Window]
	console.log("this.kinectComponent.rgraph = " + rgraph);
	
	var someId = 840468; // node name "Beugungsintegral"
	var someNode = rgraph.graph.getNode(someId);
	
	console.log("getSomeNodeId(" + someId + ") = " + someNode + " with name " + someNode.name);
	console.log(window.hasOwnProperty('$jit'));
	
    console.log('after');
},500);




// To Do:
// expose above functionality
// -> e.g. control node selection (onClick method) programmatically
