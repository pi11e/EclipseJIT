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
	
	
	
	// stretching the canvas this way breaks the lines and labels
    //canvas.width = document.width;
    //canvas.height = document.height;
	
    console.log("canvas width = " + canvas.width +" | height = " + canvas.height);
    
    console.log('after');
},500);

