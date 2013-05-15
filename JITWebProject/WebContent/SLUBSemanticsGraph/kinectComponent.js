/**
 * 
 */

// NOTE: RGraph rendering function at jit.custom.js line 8924

// this.kinectComponent === window.kinectComponent
this.kinectComponent = 
{
		// reference to global context; this === window (usually)
		global: this, 
		// jit rgraph instance, set by avgl.Graph.prototype.init (graph.js line 117)
		rgraph : undefined, 
		// a highlighted Graph.Node instance, 
		// set by this.setHighlightedNode(node) which in turn is called by the avgl.Graph constructor (graph.js line 6)
		highlightedNode: undefined, 
		
		// note: in function scope, "this" is the kinect component itself
		//functions required for graph manipulation:

		//- node highlighting 
//				(visually emphasizing one node, allowing clear distinction from other nodes)
		setHighlightedNode : function(node)
		{
			// if given node isn't already highlighted,
			if(this.highlightedNode !== node) // note: this.highlightedNode may be undefined at this point if no previous highlighting has happened
			{
				console.log("setting highlight for node " + node.name); // log the new node
				
				// turn currently highlighted node "off"
				if(this.highlightedNode !== undefined)
					this.highlightedNode.data.isHighlighted = false;
				
				// set new highlighted node
				this.highlightedNode = node; 				
				
				// turn newly highlighted node "on"
				this.highlightedNode.data.isHighlighted = true;
				
				this.rgraph.plot(); 

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
			switch(kinectData)
			{
			case 1:
				// highlight next node
				break;
			case 2:
				// highlight prev node
				break;
			case 3:
				// center highlighted node
				break;
			case 4:
				// go back
				// node history contains the visited node ids in order of appearance
				console.log(this.rgraph.overallNodeHistory);
				
				// besser: pop last history item, then select (new) last history item
				
				
				// let i be the index of currently centered node in this.rgraph.overallNodeHistory;
				// => this.selectNode(this.rgraph.overallNodeHistory[i-1].id);
//				var i = 0;
//				while(i < this.rgraph.overallNodeHistory.length)
//				{
//					if(this.rgraph.overallNodeHistory[i] === this.rgraph.root)
//					{
//						console.log("reverting to node " + this.rgraph.graph.getNode(this.rgraph.overallNodeHistory[i-1]).name);
//						this.selectNode(this.rgraph.overallNodeHistory[i-1]);
//						break;
//					}
//					i++;
//				}
				
				
				break;
			case 5:
				// center home node (has id 0)
				this.selectNode(0);
				break;
			default:
				break;
			}
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


