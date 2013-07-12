/**
 * TODO:
 *  - customize CSS for proper size arrangement of RGraph-canvas
 *  - implement the following functions:
 *  	> callbackHandler cases
 *  - bugs / irregularities:
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
			if(this.rgraph.busy)
				return; // force user to wait until animation is done

			if(!this.isNode(node))
				return;
			
			// only allow highlighting of  visible nodes, i.e.
			// the current root/centered node's immediate successors
			// see jit.custom render method, e.g.
			// /* Change 14 Begin insert */ in jit.custom.js
			if(node._depth > 1)
				return;
			
			// do not allow highlighting of already visited nodes?
			// check if nodes are in nodesInPath list
			// ...
			if(jQuery.inArray(node.id, this.rgraph.nodesInPath) !== -1) // meaning node.id IS in the nodesInPath array
				return;
			
			
			// if given node isn't already highlighted,
			if(this.highlightedNode !== node) // note: this.highlightedNode may be undefined at this point if no previous highlighting has happened
			{
				console.log("setting highlight for node " + node.name); // log the new node
				
				// turn currently highlighted node "off"
				if(this.highlightedNode !== undefined)
				{
					this.highlightedNode.data.isHighlighted = false;
					// *new feature: hide label of unselected node - exclude global levels 0 and 1
					if(!this.highlightedNode.getAdjacency(0))
						this.rgraph.labels.getLabel(this.highlightedNode.id).hidden = true;
				}
				
				// set new highlighted node
				this.highlightedNode = node; 				
				
				// turn newly highlighted node "on"
				this.highlightedNode.data.isHighlighted = true;
				
				// re-draw graph
				this.rgraph.plot(); 

				updateSelectionLabelWithText(node.name);
				
				// *new feature: show label of selected node - exclude global levels 0 and 1
				if(!node.getAdjacency(0))
					this.rgraph.labels.getLabel(node.id).hidden = false;
				
				// bug with new feature:
				/*
				 * fotothek -> nach Gattung -> * Skulptur, wird sichtbar
				 * - zurücknavigieren zu fotothek -> gattung unsichtbar
				 * - wieder vor navigieren zu gattung -> Skulptur noch immer sichtbar
				 */
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
//			if(this.rgraph.busy)
//				return;
			
			if(this.isNode(this.rgraph.graph.getNode(nodeId)))
			{
				// the node we're looking for does indeed exist
				this.rgraph.onClick(nodeId, {  
					 hideLabels: false  // keep showing labels during transition
				});
				
				getImageURLsForSubnodesOf(this.getNodeById(nodeId));
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
				this.highlightNextNode();
				break;
			case 2:
				// highlight prev node
				this.highlightPreviousNode();
				break;
			case 3:
				// center highlighted node
				this.centerHighlightedNode();
				break;
			case 4:
				// go back 1 level
				
				// node history contains the visited node ids in order of appearance
								
				var nodePath = this.rgraph.nodesInPath;
				
				// nodePath now contains an array of node ids from "0" node to current node
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
					//var tempNodeName = this.rgraph.graph.getNode(nodePath[nodePath.length-2]).name;
					//console.log("moving up one level to node " + tempNodeName);
				}
				
				
				break;
			case 5:

				// center home node (has id 0)
				this.centerNodeWithId(0);
				// clear node history
				this.rgraph.clearNodesInPath("0");
				
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
		},
		
		showLabels : function(show)
		{
			this.rgraph.labels.hideLabels(!show);
		},
		
		highlightNextNode: function()
		{
			// what do we know?
			// 1. the current root 
			// 2. its immediate child nodes
			// 3. the node history (rgraph.nodesInPath())
			
			// considerations:
			// - selection of the predecessor node should not be allowed/possible
			// - selection should start at the top if no nodes have been selected
			
			// find all subnodes, exclude predecessor node
			// id of predecessor will always be the second to last id in the history:
			var predecessorId = this.rgraph.nodesInPath[this.rgraph.nodesInPath.length-2];
			var currentRootId = this.rgraph.root;
			var subnodes = this.rgraph.graph.getNode(currentRootId).getSubnodes();
			
			// - if no node is highlighted, highlight the first child of the current root
			// - if a node has been highlighted, highlight the next child (relative to currently highlighted child) of the current root
			// - do not highlight the predecessor
//			if(subnodes && subnodes.length > 0)
//			{
//				// if subnodes exist...
//				if(!highlightedNode)
//				{
//					// ... and none of those have been highlighted
//					if(subnodes && subnodes.length > 0)
//					{
//						this.setHighlightedNode(subnodes[0]);
//					}
//				}
//				else
//				{
//					// another node has been highlighted previously; we need to make sure to highlight exactly the next one in line
//					// for this, find the index of the currently highlighted node in the subnodes array
//					for(var i = 0; i < subnodes.length)
//					{
//						if(node.id === highlightedNode.id)
//						{
//						
//						}
//						else
//					}
//				}
//			}
			
		},
		
		highlightPreviousNode: function()
		{
			this.highlightNextNode();
		},
		
		/**
		 * This function calculates the global level of a node, assuming the levels are
		 * 0 - global root node 
		 * 1 - the individual filter nodes
		 * 2 - the value nodes for those filters
		 * @param node - a node whose global level should be found
		 * @returns {Number} - a number representing the global level (a value between 0-2) or null if no such node was found.
		 */
		getGlobalLevel: function(node)
		{
			if(this.isNode(node))
			{
				if(node.id === "0")
				{	return 0;	}
				else if(node.getAdjacency(0))
				{	return 1;	}
				else
				{	return 2;	}
			}
			else
			{
				return null;
			}
			
		},
				
}; 

var pushImagesToGallery = function(imageURLs)
{
	// imageURLs as an array of string urls to jpg images
	
	// galleria wants data in this format:
	/*	
	var data = [
    { image: "http://www.deutschefotothek.de/bilder/dflogo.png" },
    { image: "http://www.deutschefotothek.de/bilder/dflogo.png" },
	];
	
	// and then to (re)start galleria, call the run method: 
	Galleria.run('#galleria', {
    dataSource: data,
	});
	*/
	var data = new Array();
	// transform image urls for galleria:
	for(var index in imageURLs)
	{
		var imageURL = imageURLs[index];
		if(imageURL.match(/jpgh/))
		{
			// image url is malformed because of tag misuse,
			// meaning the tag was declared multiple times resulting in a string like this:
			// imageURL = http://url1.jpghttp://url2.jpg
			// in this case, we only want to use the first image specified
			imageURL = imageURL.substring(0, imageURL.indexOf('jpg')+3);
		}
		
		if(imageURL.match(/jpg|png$/) !== null) // if its a valid image url
		{
			data.push({image: imageURL});
		}
		
	}	
	       
	console.log(data);
	
	Galleria.run('#galleria', 
		{
			dataSource: data,
		});
	
};

/**
 * For a given filter tag (e.g. "a99d3") and its value (e.g. "KUR-Projekt"),
 * this function gets the image urls for all object nodes that have this value.
 * These image URLs are then stored in window.imageURLs so they are globally accessible.
 */
var getImageURLsForSubnodesOf = function(node)
{
	var controller = window.kinectComponent;
	var selectedNodeGlobalLevel = controller.getGlobalLevel(node); // will be a value between 0 and 2
	var filterValue = undefined;
	var filterTag = undefined;
	var query = undefined;
	
	// reset imageURLs
	window.imageURLs = new Array();
	
	if(selectedNodeGlobalLevel === 0)
	{
		// get image URLs for each of the (currently six) filter nodes
		// ... these images should illustrate the filter node (e.g. "nach Sammlung", "nach Thema" etc.)
		
		// get a number of random images for each tag
		var amountOfImagesPerTag = 1;
		
		/*
		 * we will probably need an xquery shuffle function for that. here's one:
		 * 
		 	declare function local:shuffle($seq as item()*)
			{
			   for $i in local:randIntSeq(fn:count($seq))
			   return $seq[$i]
			};
		 */
		
		// iterate over each filter node
		for(var key in nodeTagMap) // see http://stackoverflow.com/questions/684672/loop-through-javascript-object
		{
			// make sure the key exists
			if(nodeTagMap.hasOwnProperty(key))
			{
				filterTag = nodeTagMap[key];
				// construct a query that asks for $amountOfImagesPerTag image URLs from a (random?) object that has the given tag
				window.imageURLs.push("http://www.deutschefotothek.de/bilder/dflogo.png");
			}
		}
	}
	else if(selectedNodeGlobalLevel === 1)
	{
		// get image URLs for each possible value of the given filter; the tag which is represented by the node can be found in the nodeTagMap
		// - NOTE: nodeTagMap maps a nodename to a tag and is defined in ebookshelf.js
		// ... these images should illustrate the filter node values (one image per filter subnode, e.g. "KUR-Projekt", "Archiv der Fotografen" etc.)
		filterTag = nodeTagMap[node.name];
		
		node.eachSubnode(function(node)
		{
			if(node.id === '0')
			{	return;	}
			else
			{
				window.imageURLs.push("http://www.deutschefotothek.de/cms/images/home-kartenforum.jpg");
			}
		});
		
	}
	else if(selectedNodeGlobalLevel === 2)
	{
		// get image URLs for the result set that sits behind each filter value
		// ... these images should represent the entire result set of a filter value (e.g. get all urls for objects that have "Archiv der Fotografen")
		
		// the filter tag we need to get from the parent of the selected node
		
		// getParents() fails when the filter value node is selected (is the root); getParents will return an empty array
		// -> get the parent by looking up the path history, using the rgraph.nodesInPath property, which at this point will have 
		// a length of 3 and look like this: ["0", $parentNode.id, node.id]
		//var parentNode = node.getParents()[0];
		
		var parentNode = controller.getNodeById(controller.rgraph.nodesInPath[1]);
		filterTag = nodeTagMap[parentNode.name];
		filterValue = node.name;
		query = "XQUERY for $x in //obj where $x//"+filterTag+"//text()='"+filterValue+"' return ($x//a8470//text(), ';')";
		
		var callback = function(data)
		{
			window.imageURLs = data.split(";");
			//console.log(imageURLs);
			
		};

		// note: queryDB is declared in ebookshelf.js
		queryDB(query, callback, false);
		
	}
	else
	{
		return null;
	}
	
	console.log(window.imageURLs.length);
	// every time we get new image URLs, we want them to be displayed in the gallery
	pushImagesToGallery(window.imageURLs);
};

