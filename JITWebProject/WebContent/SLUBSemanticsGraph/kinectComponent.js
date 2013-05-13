/**
 * 
 */

// this.kinectComponent === window.kinectComponent
this.kinectComponent = {
		global: this, // reference to global context; this === window (usually)
		rgraph : undefined, // jit rgraph instance
		highlightedNode: undefined, // a highlighted Graph.Node instance
		
		// note: in function scope, "this" is the kinect component itself
		//functions required for graph manipulation:

		//- node highlighting 
//				(visually emphasizing one node, allowing clear distinction from other nodes)
		toggleHighlightForNode : function(node)
		{
			if(this.isNode(node))
			{
				// does the node have a highlighted color?
				// does the node have a regular color?
				
				
			}
		},
		setHighlightedNode : function(node)
		{
			// if given node isn't already highlighted,
			if(this.highlightedNode !== node) // note: this.highlightedNode may be undefined at this point if no previous highlighting has happened
			{
				console.log("setting highlight for node " + node.name); // log the new node
				this.toggleHighlightForNode(this.highlightedNode); // turn currently highlighted node "off"
				this.highlightedNode = node; // set new highlighted node
				this.toggleHighlightForNode(this.highlightedNode); // turn currently highlighted node "on"
			}
		},
		//- node selection 
//				(animated centering of the node and its first level subnodes)
		selectNode : function(nodeId)
		{
			if(this.isNode(this.rgraph.graph.getNode(nodeId)))
			{
				// the node we're looking for does indeed exist
				this.rgraph.onClick(nodeId, {  
					 hideLabels: false  // keep showing labels during transition
				});
			}
		},
		selectHighlightedNode : function()
		{
			if(this.isNode(this.highlightedNode))
			{
				this.selectNode(this.highlightedNode.id);
			}
		},
		//- graph zooming
//				(animated extension/compression of edge lengths to increase / decrease on-screen node density)
		setZoomLevel : function(zoom)
		{

		},
		//- open / close node details
//				(if selected node is a leaf - i.e. object - node, show its image and description)
		toggleNodeDetails : function(nodeId)
		{
			
		},
		
		
		// helper functions
		kinectCallbackHandler : function(kinectData)
		{
			
		},
		
		isNode : function(nodeObject)
		{
			if(nodeObject != undefined)
			{
				var jitDeclared = window.hasOwnProperty('$jit');
				var isJitGraphNode = nodeObject.constructor === $jit.Graph.Node; 
				var nodeInGraph = typeof this.rgraph.graph.getNode(nodeObject.id) !== 'undefined';
				
				return jitDeclared && isJitGraphNode && nodeInGraph;
			}
		}
}; 


