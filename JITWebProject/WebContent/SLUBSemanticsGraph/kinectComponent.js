/**
 * TODO:
 *  - customize CSS for proper size arrangement of RGraph-canvas
 *  - implement the following functions:
 *  	> callbackHandler cases
 *  - bugs / irregularities:
 *  	> nodes will still be highlighted even if not visible,
 *  		-> nodes are still "there" when not in visible level!!
 *  		-> nodes must be unavailable for highlighting when invisible
 *  	> hightlighting must only be applied to sublevel nodes, i.e. not the centered one
 *  		and not the "history" node which is the centered node's predecessor (in rgraph.nodesInPath)
 *  	> when reverting 1 level back up to start, only the second time works even though it logs twice
 */

// NOTE: RGraph rendering function at jit.custom.js line 8924

// this.kinectComponent === window.kinectComponent
window.kinectComponent = 
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

			if(!this.isNode(node))
				return;
			
			// only allow highlighting of  visible nodes, i.e.
			// the current root/centered node's immediate successors
			// see jit.custom render method, e.g.
			// /* Change 14 Begin insert */ in jit.custom.js

			if(node._depth > 1)
				return;
			
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
				
				// re-draw graph
				this.rgraph.plot(); 

				updateSelectionLabelWithText(node.name);
			}
		},
		/**
		 * Triggers an animated view centering to the given node.
		 * @param node
		 */
		centerNode : function(node)
		{
			this.centerNodeWithId(node.id);
		},
		/**
		 * Triggers an animated view centering to the given node id.
		 * @param nodeId
		 */
		centerNodeWithId : function(nodeId)
		{
			if(this.isNode(this.rgraph.graph.getNode(nodeId)))
			{
				// the node we're looking for does indeed exist
				this.rgraph.onClick(nodeId, {  
					 hideLabels: false  // keep showing labels during transition
				});
			}
		},
		/**
		 * Centers the currently highlighted node
		 * @see setHighlightedNode
		 */
		centerHighlightedNode : function()
		{
			if(this.isNode(this.highlightedNode))
			{
				console.log("centering highlighted node " + this.highlightedNode.name);
				this.centerNodeWithId(this.highlightedNode.id);
			}
		},
		
		//- graph zooming
//				(animated extension/compression of edge lengths to increase / decrease on-screen node density)
		/**
		 * Zooms the graph by a given zoom factor
		 * @param zoom - a zoom factor (default 1.0 = 100%)
		 */
		setZoomLevel : function(zoom)
		{
			var rgraph = this.rgraph;
			
			window.$jit.Graph.Util.eachNode(rgraph.graph, function(n) { 
				n.endPos.rho = n._depth * rgraph.config.levelDistance * zoom; });
				rgraph.fx.animate({
				    modes:['polar']
				});
		},
		//- open / close node details
//				(if selected node is a leaf - i.e. object - node, show its image and description)
		toggleNodeDetails : function(nodeId)
		{
			
		},
		
		getNodeById : function(nodeId)
		{
			return this.rgraph.graph.getNode(nodeId);
		},
		
		getNodeByName : function(nodeName)
		{
			var nodeFound = null;
			this.rgraph.graph.eachNode(function(node)
					{
						if(node.name === nodeName)
						{
							nodeFound = node;
							return;
						}
					});
			
			return nodeFound;
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
				this.centerHighlightedNode();
				break;
			case 4:
				// go back
				// node history contains the visited node ids in order of appearance
				
				
				var nodePath = this.rgraph.nodesInPath;
				
				// nodePath now contains an array of node ids from "start" node to current node
				// to move up the path by one level, we need to center on the node that appears
				// in the second to last position in this list
				
				// if no valid path longer than 1 node exists, do nothing
				if(nodePath === undefined || nodePath.length < 2)
					return;  
				else
				{   // we can safely assume nodePath contains at least two elements
					// in this case, we want to select the node whose id is precursor to the last
					// id in the current nodePath
					
					// example: 
					// nodePath = ["0", "10", "101"]; we want to select node id "10"
					// nodePath.length = 3, last element index is 2, index of "10" is 1
					this.centerNodeWithId(nodePath[nodePath.length-2]);
					
					// DEBUG
					var tempNodeName = this.rgraph.graph.getNode(nodePath[nodePath.length-2]).name;
					console.log("moving up one level to node " + tempNodeName);
				}
				
				
				break;
			case 5:
				// center home node (has id 0)
				this.centerNodeWithId(0);
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


