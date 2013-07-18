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
		
		handConfig : new Object(),
		
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
			
			// do not highlight global root or hand vector
			if(node.id === "0" || node.id === "1")
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
		
		highlightNextNode: function(countBackwards)
		{
			// what do we know?
			// 1. the current root 
			// 2. its immediate child nodes
			// 3. the node history (rgraph.nodesInPath())
			
			// considerations:
			// - selection of the predecessor node should not be allowed/possible
			// - selection should start at the top if no nodes have been selected
			

			// do not highlight if we're in global level 2, there are no valid subnodes here
			var currentNode = this.rgraph.graph.getNode(this.rgraph.root);
			if(this.getGlobalLevel(currentNode) === 2 || !this.isNode(currentNode))
				return;
			
			
			var subnodes = new Array();
			var highlightedNodeNeighborIndexInSubnodes = 0;
			
			currentNode.eachSubnode(function(node)
					{
						// exclude predecessor node
						if(node.id === '0')
							return;
						
						// save all subnodes to the subnodes array
						subnodes.push(node);
						if(node.data.isHighlighted)
						{
							// NOTE: after pushing to the subnodes array, the index of the current node
							// is equal to the array's length minus 1:
							// assert subnodes.indexOf(node) === subnodes.length - 1
							
							// if one of the subnodes is highlighted already, the index of the next node to highlight is saved
							if(countBackwards)
							{
								// if we're counting backwards, i.e. highlighting the previous node,
								// the index before this one (which at this point is equal to the length
								// of the subnodes array minus two) is saved
								highlightedNodeNeighborIndexInSubnodes = subnodes.length - 2;
							}
							else
							{
								// if we're in regular mode, i.e. highlighting the next node,
								// the index after this one (which at this point is equal to the length 
								// of the subnodes array) is saved
								highlightedNodeNeighborIndexInSubnodes = subnodes.length;
							}
							
						}
					});
			
			//console.log("next node to highlight = " + highlightedNodeNeighborIndexInSubnodes);
			

			if(countBackwards)
			{
				// center previous image in gallery
				Galleria.get(0).prev(); // this gets the (single) Galleria instance and shows the previous image
				
				// it is possible the index of the "previous" node underruns the first subnodes index, i.e. is smaller than zero
				// - in this case, we start again from the back of the array.
				if(highlightedNodeNeighborIndexInSubnodes < 0)
					highlightedNodeNeighborIndexInSubnodes = subnodes.length-1;
			}
			else
			{
				// center next image in gallery
				Galleria.get(0).next(); // this gets the (single) Galleria instance and shows the next image
				
				// it is possible the index of the "next" node overruns the last subnodes index, i.e. is larger than subnodes.length-1
				// - in this case, we start again from the beginning of the array.
				if(highlightedNodeNeighborIndexInSubnodes > subnodes.length-1)
					highlightedNodeNeighborIndexInSubnodes = 0;
			} // <- note: with the encapsulated if-clauses above, this surrounding if/else for the countBackwards check is actually obsolete, but probably easier to read and maintain.
			
			
			this.setHighlightedNode(subnodes[highlightedNodeNeighborIndexInSubnodes]);
			//console.log("subnodes: " + subnodes);
			
			// - if no node is highlighted, highlight the first child of the current root
			// - if a node has been highlighted, highlight the next child (relative to currently highlighted child) of the current root
			// - do not highlight the predecessor

			
		},
		
		highlightPreviousNode: function()
		{
			// do the same as highlightNextNode(), only in reverse order
			this.highlightNextNode(true);
			
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
		
		dispatchHandInteraction : function(data)
		{
			// expect a string message that says:
			// "handconfig:[left|right]:$isActive:$isGripped"
			// where $isActive is a boolean and $isGripped can be [Grip|GripRelease|None]
			var interactionData = data.split(":");
			// interaction data looks like this: 
			// ["handconfig", "right", "True", "GripRelease", ""] 
			// or this:
			// ["handconfig", "left", "False", "Grip", ""]
			
			// NOTE: the value "None" for $isGripped is only assigned if there is no user present
			
			var isLeftHand = interactionData[1] === 'left';
			var isActive = interactionData[2] === 'True';
			var isGripped = interactionData[3] === 'Grip';
			
			if(isLeftHand)
			{
				this.handConfig.left = {active : isActive, gripped : isGripped};
			}
			else
			{
				this.handConfig.right = {active : isActive, gripped : isGripped};
			}
			
		},
		
		/**
		 * @unused
		 * 
		 */
		dispatchJSON : function(data)
		{
			//console.log(data);
			if(data === "LeftHandSwipeRightGesture")
			{
				this.highlightNextNode();
			}
			else if(data === "RightHandSwipeLeftGesture")
			{
				this.highlightPreviousNode();
			}
			else if(data === "RightHandPullDownGesture")
			{
				this.centerHighlightedNode();
			}
		},
		
		dispatchHandMovement : function(skeletonData)
		{
			/*
			 * possible joint names:
			 
			ankleleft	ankleright	elbowleft
			elbowright	footleft	footright
			handleft	handright	head
			hipcenter	hipleft		hipright
			kneeleft	kneeright	shouldercenter
			wristleft	spine		shoulderleft
			shoulderright			wristright
			
			 */
			
			
			//console.log("dispatching hand movement");
			for(var i = 0; i < skeletonData.length; i++)
			{
				var skeleton = skeletonData[i];
				
				var leftHand = skeleton["handleft"];
				var rightHand = skeleton["handright"];
				var leftElbow = skeleton["elbowleft"];
				var rightElbow = skeleton["elbowright"];
				
				var spineDepth = skeleton["spine"].z;
				//console.log(spineDepth);
				
				// documentation of handConfig:
				// this.handConfig.[left|right] = {active: [true|false], gripped: [true|false]}
				
				
				// we need to find
				// a) the negative elbow vector
				// b) the vector from elbow to hand
				// with these, we want to calculate the angle between them and set that angle as position for the node
				
				var elbowToHandVector = new Object();
				var negativeElbowVector = new Object();
				var theta = 0;
				
				// if either hand is active:
				if(this.handConfig.left.gripped)
				{
					// compute vector between left hand and left elbow
					elbowToHandVector.x = leftHand.x - leftElbow.x;
					elbowToHandVector.y = leftHand.y - leftElbow.y;
					
					negativeElbowVector.x = leftElbow.x * -1;
					negativeElbowVector.y = leftElbow.y * -1;
					
					theta = this.getAngleBetweenVectors(elbowToHandVector, leftElbow);
					console.log("theta in degrees = " + this.radToDeg(theta));
					
				}
				else if(this.handConfig.right.gripped)
				{
					// compute vector between right hand and right elbow
					
				}
				else
				{
					// if no hand is active, do nothing
					return;
				}
				
				
				// create hand node
        		if(this.getNodeById("1") === undefined)
    			{
        			this.rgraph.graph.addNode({id: "1", name:"", data:""});
    			}
        		
        		// use elbow as origin         		
        		// calculate new position angle (theta) between elbow and hand vectors

        		// as per http://www.mathsisfun.com/polar-cartesian-coordinates.html,
        		// the required angle can be found using the tangent function where tan(theta) = y/x
        		// thus, theta = tan^-1 (y/x) = atan(y/x)
        		
        		// radius for the new position, i.e. the polar norm, can be specified here. 
        		// the default value for the first node level, depending on zoom level, is 120 (i.e. visible subnodes will have a norm of 120)
        		var radius = 100;
        		
        		
        		// Polar(theta, rho) where theta is the angle and rho the norm (i.e. radius)
        		var newPos = new $jit.Polar(theta, radius);  
        		this.getNodeById("1").setPos(newPos);
        		
        		// set highlight to closest graph node
        		//var closestNode = this.rgraph.graph.getClosestNodeToNode(this.getNodeById("1").getPos(), this.getNodeById("1"));
        		//console.log("found closest node: " + closestNode);
        		//this.setHighlightedNode(closestNode);
        		
        		this.rgraph.plot();
				
			}
			
		},
		
		getAngleBetweenVectors : function(v1, v2)
		{
			return Math.acos( (v1.x * v2.x + v1.y * v2.y) / (Math.sqrt(v1.x*v1.x+v1.y*v1.y) * Math.sqrt(v2.x*v2.x+v2.y*v2.y)) );
		},
		
		radToDeg : function(radiansValue)
		{
			return radiansValue * 180 / Math.PI;
		}
				
}; 



var pushImagesToGallery = function(imageURLs, node)
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
	
	var selectedNodeGlobalLevel = window.kinectComponent.getGlobalLevel(node); // will be a value between 0 and 2
	
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
			// construct a thumbnail path by exchanging "fotos" for "thumbs" in the path like so:
			// sample image URL:
			// http://fotothek.slub-dresden.de/fotos/df/ps/0006000/df_ps_0006095.jpg
			// sample thumb URL for same image:
			// http://fotothek.slub-dresden.de/thumbs/df/ps/0006000/df_ps_0006095.jpg
			
			
			var thumbnailURL = imageURL.replace("fotos", "thumbs");
			
			data.push({thumb: thumbnailURL, image: imageURL});
		}
		
	}	
	       
	console.log(data);
	
	// a number of flags to control gallery behavior
	var inFullscreenMode = false; // if the user is viewing images in fullscreen, stop slideshow
	var userChangedImage = false; // if the user changed an image by interacting, that image should stay for 10 seconds; otherwise, slideshow runs at 3 seconds per image
	 
	
	var autoplayValue = 3000; // default: slideshow with 3 seconds per image (= 3000 ms)
	if(inFullscreenMode || selectedNodeGlobalLevel < 3)
	{
		autoplayValue = false; // no slideshow when in levels 1 or 2 or when displaying a full screen image
	}
	else if(userChangedImage)
	{
		autoplayValue = 1000;
	}
	// for possible options, see http://galleria.io/docs/options/
	
	Galleria.run('#galleria', 
		{
			dataSource: data,
			height: $('#galleria').height,
			autoplay : autoplayValue,
			pauseOnInteraction : inFullscreenMode
		});
	
	userChangedImage = false; // this needs to be re-set to default false 
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
	
	// this method gets the image URLs for a given node based on its global level (
	
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
		
		
		// for each subnode... 
		node.eachSubnode(function(subnode)
		{
			if(subnode.id === '0')
			{	return;	} // ... (excluding the global root)
			else
			{
				// find a random image from the result set behind that subnode
				filterValue = subnode.name;
				console.log("node name = " + node.name + "; filterTag = " + filterTag + "; filterValue = " + filterValue);
				
				// this returns all image URLs for the given filter tag and value
				//query = "XQUERY for $x in //obj where $x//"+filterTag+"//text()='"+filterValue+"' return ($x//a8470//text(), ';')";
				// we only want one (for each subnode), and it should be random
				/*
				 * example query:
				 * 
				 * - gets the entire result set
					let $result := for $x in //obj where $x//a55b3//text()='1990 - Gegenwart' return ($x//a8470//text())
					- creates a random index between 1 and length of result set
					let $index := random:integer(count($result)) + 1
					- returns the element at the random index... NOTE: index retrieval in BaseX/Xquery is 1-relative, not 0-relative!
					- ... that's why the random index is manually set to +1 (otherwise it would start at 0)
					- ... also IMPORTANT: the integer generation is maximum-exclusive, i.e. the actual count($result) will never be assigned! 
					return ($index, ": ", $result[$index])
				 * 
				 * 
				 */
				var firstLetClause = "let $result := for $x in //obj where $x//"+filterTag+"//text()='"+filterValue+"' return $x//a8470//text() ";
				var secondLetClause = "let $index := random:integer(count($result)) + 1 ";
				var returnClause = "return $result[$index]";
				query = "XQUERY " + firstLetClause + secondLetClause + returnClause;
	
				var callback = function(data)
				{
					window.imageURLs.push(data);
					
				};
				
				queryDB(query, callback, false);
				//window.imageURLs.push("http://www.deutschefotothek.de/cms/images/home-kartenforum.jpg");
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
	pushImagesToGallery(window.imageURLs, node);
};

