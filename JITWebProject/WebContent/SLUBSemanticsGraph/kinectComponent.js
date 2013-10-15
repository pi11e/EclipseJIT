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
		
		zHistory : new Array(),
		
		// note: in function scope, "this" is the kinect component itself
		//functions required for graph manipulation:

		/**
		 * Returns the node instance that is currently centered (i.e. the current root node).
		 */
		getRoot : function()
		{
			return this.getNodeById(this.rgraph.root);
		},
		
		/**
		 * Returns the currently highlighted node back to its regular state (including the hidden label 
		 * if the node is below level 1).
		 */
		turnOffHighlightedNode : function()
		{
			if(this.highlightedNode !== undefined && this.highlightedNode !== null)
			{
				this.highlightedNode.data.isHighlighted = false;
				// *new feature: hide label of unselected node - exclude global levels 0 and 1
				// plus: never hide the label of the current root
				if(!this.highlightedNode.getAdjacency(0) && this.highlightedNode.id !== this.rgraph.root)
					this.rgraph.labels.getLabel(this.highlightedNode.id).hidden = true;
			}
		},
		
		//- node highlighting 
//				(visually emphasizing one node, allowing clear distinction from other nodes)
		/**
		 * Highlights the given node.
		 */
		setHighlightedNode : function(node)
		{
			// NOTE: this function has several important implications to the display in both the gallery and graph components
			
			// ###### exclude special cases
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
			
			// ###### end of exclude special cases
			
			// if given node isn't already highlighted,
			if(this.highlightedNode !== node) // note: this.highlightedNode may be undefined at this point if no previous highlighting has happened
			{
				//console.log("setting highlight for node " + node.name); // log the new node
				
				// turn currently highlighted node "off"
				// note: this returns the current highlighted node back to its previous state with the regular color (blue-greenish)
				// and a hidden label if the node is lower than lvl 1
				this.turnOffHighlightedNode();
				
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
				
				
				
				// center image corresponding to new highlighted node
				var imgIndex = node.data.imgIndex;
				console.log("showing image at index " + imgIndex);
				
				this.showImageAtIndex(imgIndex);
				// show title for node
				this.showTitleForNode(node);
			}
			
			
		},
		
		showTitleForNode : function(node)
		{
			setTitleLabel("");
			
			if(this.getGlobalLevel(node) < 1)
			{
				// do nothing
			}
			else
			{
				// find the title of the image
				var imageURL = Galleria.get(0).getActiveImage().src;
				
				console.log("getting title for image " + imageURL);
								
				
				
				// gets description and title
				//var query = "XQUERY for $x in //obj where $x//a8470//text()='"+imageURL+"' return ($x//a5200//text(), ';', $x//a52df//text())";
				// just title:
				//var query = "XQUERY for $x in //obj where $x//a8470//text()='"+imageURL+"' return $x//a5200//text()";
				
				// optimized query:
				var query = "XQUERY //obj//a5200//text()[../../a8450/a8470='"+imageURL+"']";
				
				queryDB(query, function(data)
				{
					//var tempData = data.split(';');
					setTitleLabel(data);
				}, 
				false);
			}
			
						
		},
		
		/**
		 * From the currently loaded thumbnails, shows the one at the given index
		 */
		showImageAtIndex : function(imgIndex)
		{
			Galleria.get(0).show(imgIndex !== undefined ? imgIndex : 0);
		},
		
		/**
		 * Toggles diplaying the label of a node with the given ID.
		 * @param nodeId
		 */
		toggleLabelForNodeWithId : function(nodeId)
		{
			this.rgraph.labels.getLabel(nodeId).hidden = !this.rgraph.labels.getLabel(nodeId).hidden;
		},	
		
		/**
		 * Toggles diplaying the label of a given node.
		 * @param node
		 */
		toggleLabelForNode : function(node)
		{
			this.toggleLabelForNodeWithId(node.id);
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
				this.clearInteractionArtifacts();
				
				// if given node is at global lvl 2, its label will be hidden - we need to show it
				var currentNode = this.getNodeById(nodeId);
				if(this.getGlobalLevel(currentNode) === 2)
				{
					this.toggleLabelForNode(currentNode);
				}
				
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
		
		/**
		 * @unused
		 */
		getNodeByName : function(nodeName)
		{
			// this is more of a useful debugging tool to access from within the chrome console
			
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
				this.backOneLevel();
				
				
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
			

			

			if(countBackwards)
			{
				
				// it is possible the index of the "previous" node underruns the first subnodes index, i.e. is smaller than zero
				// - in this case, we start again from the back of the array.
				if(highlightedNodeNeighborIndexInSubnodes < 0)
					highlightedNodeNeighborIndexInSubnodes = subnodes.length-1;
			}
			else
			{
				
				// it is possible the index of the "next" node overruns the last subnodes index, i.e. is larger than subnodes.length-1
				// - in this case, we start again from the beginning of the array.
				if(highlightedNodeNeighborIndexInSubnodes > subnodes.length-1)
					highlightedNodeNeighborIndexInSubnodes = 0;
			} // <- note: with the encapsulated if-clauses above, this surrounding if/else for the countBackwards check is actually obsolete, but probably easier to read and maintain.
			
			
			this.setHighlightedNode(subnodes[highlightedNodeNeighborIndexInSubnodes]);
			
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
			if(typeof node === 'string')
			{
				// check if node could be retrieved by interpreting it as an id
				node = this.getNodeById(node);
			}
			
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
			if(this.rgraph.busy)
				return;
			

			for(var i = 0; i < skeletonData.length; i++)
			{
				var skeleton = skeletonData[i];
				
				var leftHand = skeleton["handleft"];
				var rightHand = skeleton["handright"];
				
				var leftElbow = skeleton["elbowleft"];
				var rightElbow = skeleton["elbowright"];
				
				// handles changes in the interaction zone for this user
				this.checkInteractionZone(skeleton["spine"].z);
				
				// documentation of handConfig:
				// this.handConfig.[left|right] = {active: [true|false], gripped: [true|false]}
				
				// factor should have a range of [-1,1]
				var accelerationFactor = 0;
				
				
				
				// if either hand is active:
				if(this.handConfig.left.active && this.handConfig.left.gripped)
				{
	        		// calculate acceleration factor based on hand distance from elbow
					var distance = leftHand.x - leftElbow.x;
					distance = this.clampToRange(distance, 60);
					
					// distance is in range [-60,60]
					
					// map to [-1, 1]
					accelerationFactor = distance / 60;
					// map to [0, 2]
					//accelerationFactor += 1;

				}
				else if(this.handConfig.right.active && this.handConfig.right.gripped)
				{
					var distance = rightHand.x - rightElbow.x;
					distance = this.clampToRange(distance, 60);
					// distance is in range [-60,60]
					
					// map to [-1, 1]
					accelerationFactor = distance / 60;
				}
				else
				{
					// if no hand is active, do nothing
					// maybe hide node w/ id 1?
//					this.rgraph.graph.removeNode("1");
					return;
				}
				
				// ########## add hand avatar node
				
				// hand avatar node should only be displayed when in global levels 0 or 1
				if(this.getGlobalLevel(this.getNodeById(this.rgraph.root)) > 1)
				{
					this.rgraph.graph.removeNode(this.getNodeById("1"));
					this.rgraph.plot();
					return;
				}
				
        		// radius for the new position, i.e. the polar norm, can be specified here. 
        		// the default value for the first node level, depending on zoom level, is 120 (i.e. visible subnodes will have a norm of 120)
        		var radius = 150;
				
				// create hand node
        		if(this.getNodeById("1") === undefined)
    			{
        			this.rgraph.graph.addNode({id: "1", name:"", data:{regularColor:"#F90", isHighlighted: false} });
        			// set default position?
        			this.getNodeById("1").setPos(new $jit.Polar(0,radius));
    			}
        		
        		

        		// adjust position of the hand node
        		var oldTheta = this.getNodeById("1").getPos().theta;
        		if(oldTheta === 0) {oldTheta = 2*Math.PI;}
        		
        		var baseSpeed = 0.1;
        		var newTheta = oldTheta + baseSpeed * accelerationFactor;
        		//console.log("acceleration: " + accelerationFactor + "; newTheta: " + newTheta);
        		
        		// Polar(theta, rho) where theta is the angle and rho the norm (i.e. radius)
        		var newPos = new $jit.Polar(newTheta, radius);  
        		this.getNodeById("1").setPos(newPos);
        		
        		// set highlight to closest graph node
        		var closestNode = this.getClosestNodeToHandCursor();
        		//console.log("found closest node: " + closestNode);
        		this.setHighlightedNode(closestNode);
        		
        		this.rgraph.plot();
				
			}
			
		},
		
		getClosestNodeToHandCursor : function()
		{
			return $jit.Graph.Util.getClosestNodeToNode(this.rgraph.graph, this.getNodeById("1"));
		},
		
		
		
		checkInteractionZone : function(currentDepth)
		{
	        /*
	         * Kinect field of view is split into three interaction zones based on z-axis:
	         * Far - a person is between 3 and 4 meters away from the sensor
	         * Medium - a person is between 2 and 3 meters away from the sensor
	         * Near - a person is closer than 2 meters
	         * 
	         * Each zone represents one graph level (graph levels are 0,1,2 / Far,Medium,Near).
	         * 
	         * ## Stepping into sublevels of the graph:
	         * 
	         * If the current level is 0 and the user is entering the medium range zone,
	         * the current level should switch to 1 by centering the currently selected node (if there is one).
	         * 
	         * If the current level is 1 and the user is entering the near range zone, 
	         * the current level should switch to 2 by centering the currently selected node (if there is one).
	         * 
	         * ## Stepping backwards, up the graph hierarchy:
	         * 
	         * If the current level is 1 and the user is entering the far range zone,
	         * the current level should switch to 0 by centering the global root.
	         * 
	         * If the current level is 2 and the user is entering the medium range zone,
	         * the current level should switch to 1 by going one step back in the node history (rgraph.nodesInPath property)
	         */
			
			
			// the currently centered node will give us the global level
			var currentLevel = this.getGlobalLevel(this.getNodeById(this.rgraph.root));
			// currentDepth is the distance of a person from the sensor in meters along the z axis
			
			var userEnteringFarZone = this.userInZone(currentDepth) === 0;
			var userEnteringMediumZone = this.userInZone(currentDepth) === 1;
			var userEnteringNearZone = this.userInZone(currentDepth) === 2;
			

			
			switch(currentLevel)
			{
				case 0:
					if(userEnteringMediumZone)
					{
						interactionZone.innerText = 'zone: medium';
						this.centerHighlightedNode();
					}
					break;
				case 1:
					if(userEnteringFarZone)
					{
						interactionZone.innerText = 'zone: far';
						this.backOneLevel();
					}
					else if(userEnteringNearZone)
					{
						interactionZone.innerText = 'zone: near';
						this.centerHighlightedNode();
					}
					break;
				case 2:
					if(userEnteringMediumZone)
					{
						interactionZone.innerText = 'zone: medium';
						this.backOneLevel();
					}
					break;
				default:
					break;
			}
		},
		
		/**
		 * Returns a number code representing an event whether a user has entered a new interaction zone.
		 * @param userDistance - user depth index, i.e. a z-axis value expected in meters
		 * @returns {Number} - a number code. -1 = no change, 0 = far zone, 1 = medium zone, 2 = near zone
		 */
		userInZone : function(userDistance)
		{
			// save last $zHistoryLength entries in zHistory
			var zHistoryLength = 60;
			
			var userEnteringFarZone = false;
			var userEnteringMediumZone = false;
			var userEnteringNearZone = false;
			
			if(this.zHistory.length < zHistoryLength)
			{
				// when starting fresh, fill the history up with values
				this.zHistory.push(userDistance);
				return;
			}
			else
			{
				// if it's already full, shift by one and push the new distance
				this.zHistory.shift();
				this.zHistory.push(userDistance);
			}
			
			// at this point, we will always have $zHistoryLength entries in the history
			/*
			 now we need to find out from which zone to which the user is going
			 pseudocode:
			 
			 if(last $zHistoryLength values are between 3 and 4 meters and the new value is smaller than 3)
			 	-> user entered medium zone (step into)
			 	
			 if(last $zHistoryLength values are between 2 and 3 meters and the new value is smaller than 2)
			 	-> user entered near zone (step into)
			 	
			 if(last $zHistoryLength values are < 2 meters and the new value is larger than 2)
			 	-> user entered medium zone (step back)
			 	
		 	if(last $zHistoryLength values are < 3 meters and the new value is larger than 3)
			 	-> user entered far zone (step back)
			 	
			 NOTE: with this design, changing the interaction zone will be locked for as long as it takes for the
			 	z history to fill up with values (e.g. with 60 entries, it should take about 2 seconds because the kinect sends at 30 FPS)
			*/
			
			for(var i = 0; i < zHistoryLength; i++)
			{
				var value = this.zHistory[i];
				if(3 < value && value < 4 && userDistance < 3)
				{
					// user stepping *into* medium zone
					userEnteringFarZone = false;
					userEnteringMediumZone = true;
					userEnteringNearZone = false;
				}
				else if(2 < value && value < 3 && userDistance < 2)
				{
					// user stepping *into* near zone
					userEnteringFarZone = false;
					userEnteringMediumZone = false;
					userEnteringNearZone = true;
				}
				else if(value < 2 && userDistance > 2)
				{
					// user stepping *back to* medium zone
					userEnteringFarZone = false;
					userEnteringMediumZone = true;
					userEnteringNearZone = false;
				}
				else if(2 < value && value < 3 && userDistance > 3)
				{
					// user stepping *back to* far zone
					userEnteringFarZone = true;
					userEnteringMediumZone = false;
					userEnteringNearZone = false;
				}
			}
			
			// now return a number code based on which zone the user entered
			if(userEnteringFarZone) return 0;
			if(userEnteringMediumZone) return 1;
			if(userEnteringNearZone) return 2;
			
			return -1;
			
		},
		
		clampToRange : function(value, maxDistance)
		{
			
			// clamp value between [-maxDistance, maxDistance]
			if(value > 0)
				{return Math.min(maxDistance, value);}
			else
				{return Math.max(-maxDistance, value);}
			
		},
		
		getAngleBetweenVectors : function(v1, v2)
		{
			return Math.acos( (v1.x * v2.x + v1.y * v2.y) / (Math.sqrt(v1.x*v1.x+v1.y*v1.y) * Math.sqrt(v2.x*v2.x+v2.y*v2.y)) );
		},
		
		radToDeg : function(radiansValue)
		{
			return radiansValue * 180 / Math.PI;
		},
		
		
		backOneLevel : function()
		{
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
				
			}
		},
		
		/**
		 * Removes the hand avatar node and resets the highlighted node to null.
		 */
		clearInteractionArtifacts : function()
		{

			// hide node (hand avatar node has id 1)
			this.rgraph.graph.removeNode("1");
			
			// reset highlightedNode
			this.turnOffHighlightedNode();
			this.highlightedNode = null;
			
			//this.rgraph.plot();
		}
				
}; 



var pushImagesToGallery = function(imageURLs, selectedNodeGlobalLevel)
{
	console.log("global level: " + selectedNodeGlobalLevel);
	console.log(imageURLs);
	
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
	
//	var selectedNodeGlobalLevel = window.kinectComponent.getGlobalLevel(node); // will be a value between 0 and 2
	
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
		
		if(imageURL.match(/jpg|png$/) !== null) // if its a valid image url, i.e. they have a png or jpg at the end
		{
			// construct a thumbnail path by exchanging "fotos" for "thumbs" in the path like so:
			// sample image URL:
			// http://fotothek.slub-dresden.de/fotos/df/ps/0006000/df_ps_0006095.jpg
			// sample thumb URL for same image:
			// http://fotothek.slub-dresden.de/thumbs/df/ps/0006000/df_ps_0006095.jpg
			
			// note: it's possible there is no "fotos" to replace, which happens with the 6 top level images
			// that are loaded from the server's data/toplevelimages folder
			var thumbnailURL = imageURL.replace("fotos", "thumbs");
			
			
			
			data.push({thumb: thumbnailURL, image: imageURL});
			
			
		}
		
	}	
	       
	
	// a number of flags to control gallery behavior
	var inFullscreenMode = false; // if the user is viewing images in fullscreen, stop slideshow
	//window.userChangedImage = false; // if the user changed an image by interacting, that image should stay for 10 seconds; otherwise, slideshow runs at 3 seconds per image
	 
	

	
	
	
	
	if(!Galleria.running)
	{
		
		Galleria.run('#galleria', 
				{
					dataSource: data,
					height: window.innerHeight*0.5,
					width: window.innerWidth,
					autoplay : false,
					pauseOnInteraction : inFullscreenMode,
					dummy : 'http://www.deutschefotothek.de/bilder/dflogo.png',
					imageTimeout : 30000
				});
		

		
		Galleria.running = true;
	}
	else
	{
		Galleria.get(0).load(data);
	}
	
	var autoplayValue = 3000; // default: slideshow with 3 seconds per image (= 3000 ms)
	if(inFullscreenMode || selectedNodeGlobalLevel < 2)
	{
		autoplayValue = false; // no slideshow when in levels 0 or 1 or when displaying a full screen image
	}
	else if(userChangedImage)
	{
		autoplayValue = 10000;
		
	}
	
	if(autoplayValue) 
	{
		console.log("running galleria with autoplay value = " + autoplayValue);
		Galleria.run('#galleria', {autoplay : autoplayValue});
	}
	// for possible options, see http://galleria.io/docs/options/

	
	window.userChangedImage = false; // this needs to be re-set to default false 
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
	
	console.log("selected node global level: " + selectedNodeGlobalLevel);
	
	// this method gets the image URLs for a given node based on its global level (
	
	if(selectedNodeGlobalLevel === 0)
	{
		// get image URLs for each of the (currently six) filter nodes
		// ... these images should illustrate the filter node (e.g. "nach Sammlung", "nach Thema" etc.)
		
		
		/*
		 * possibly use an xquery shuffle function:
		 * 
		 	declare function local:shuffle($seq as item()*)
			{
			   for $i in local:randIntSeq(fn:count($seq))
			   return $seq[$i]
			};
		 */
		
		
		
		// no shuffle function needed: image selection can be found in /data/toplevelimages/$nodename
		var subnodeIndex = 0;
		// iterate over each filter node
		for(var id in node.adjacencies)
		{
			var subnode = window.kinectComponent.getNodeById(id);
			console.log("parent node: " + node.name + "; subnode: " + subnode.name);
			
			subnode.data.imgIndex = subnodeIndex++; // the index for this image in galleria 
			var name = subnode.name;
			if(name === "Länder")
			{
				name = "Laender";
			}
			
			// each key represents one filter name
			var imgName = "http://localhost:8080/JITWebProject/data/toplevelimages/" + name + ".png";
			
			
			window.imageURLs.push(imgName);
		}
		
		pushImagesToGallery(window.imageURLs, selectedNodeGlobalLevel);
		
//		node.eachSubnode(function(subnode)
//		{
//			subnode.data.imgIndex = subnodeIndex++; // the index for this image in galleria 
//			var name = subnode.name;
//			if(name === "Länder")
//			{
//				name = "Laender";
//			}
//			
//			// each key represents one filter name
//			var imgName = "http://localhost:8080/JITWebProject/data/toplevelimages/" + name + ".png";
//			
//			console.log("pushing image URL for node " + name + ": " + imgName + " at index " + subnode.data.imgIndex);
//			window.imageURLs.push(imgName);
//			
//			
//			
//		});
	}
	else if(selectedNodeGlobalLevel === 1)
	{
		// example subnode: "Richard Wagner" (Parent: "Kollektionen") or "Deutschland" (Parent: "Länder").
		
		var subnodeIndex = 0;
		// for each subnode... 
		node.eachSubnode(function(subnode)
		{
			if(subnode.id === '0')
			{	/* do nothing*/	} 
			else
			{
				// get a random image from this node's children to display as its own
				// note: this query will respond with a single image URL, so a simple push will suffice
				subnode.data.imgIndex = subnodeIndex++; // the index for this image in galleria 
				query = subnode.data.ownImageQuery;
				if(!query)
				{
					console.log("invalid image data for node " + node.name + ". no own image query found.");
					return;
				}
	
				var callback = function(data)
				{
					console.log("pushing image data for lvl 1 node " + data);
					window.imageURLs.push(data);
					// push to gallery cannot occur within the query, because the query does only return single images
					// ... which means the query has to be synchronous so the push waits for the images
				};
				
				queryDB(query, callback, false);
				
			}
		});
		
		pushImagesToGallery(window.imageURLs, selectedNodeGlobalLevel);
		
	}
	else if(selectedNodeGlobalLevel === 2)
	{
		// get image URLs for the result set that sits behind each filter value
		// ... these images should represent the entire result set of a filter value (e.g. get all urls for objects that have "Archiv der Fotografen")
		
		query = node.data.childImageQuery;		
		if(!query)
		{
			console.log("invalid image data for node " + node.name + ". no child image query found.");
			return;
		}
		
		// note: this query will respond with a number of URLs split by delimiter ";" // note note: not anymore it won't; URLs will now only be split by a whitespace
		var callback = function(data)
		{
			var tempData = data.replace(/jpg/g, "jpg@");
			window.imageURLs = tempData.split("@");
			// push to gallery can occur within the query, since the query returns the entire result set
			pushImagesToGallery(window.imageURLs, selectedNodeGlobalLevel);
		};

		// note: queryDB is declared in ebookshelf.js
		queryDB(query, callback, true); // NOTE: ASYNC QUERY!
		
	}
	else
	{
		return null;
	}
	
	
	// every time we get new image URLs, we want them to be displayed in the gallery
	//pushImagesToGallery(window.imageURLs, node); // now handled inside the queries for increased performance
};

var setTitleLabel = function(title)
{
	// note: called by showImageAtIndex
	
	imgTitle.innerHTML = "<font size=5>"+title+"</font>";
		
};

//######### DEBUG CODE ###########

var simulateHandCursorMovement = function(left)
{
	// simulate node movement: excerpt from dispatchHandMovement
	
	// adjust position of the hand node
	var oldTheta = kinectComponent.getNodeById("1").getPos().theta;
	if(oldTheta === 0) {oldTheta = 2*Math.PI;}
	
	var baseSpeed = 0.1;
	var newTheta = oldTheta + baseSpeed * (left ? -1.5 : 1.5);
	        		
	// Polar(theta, rho) where theta is the angle and rho the norm (i.e. radius)
	var newPos = new $jit.Polar(newTheta, 150);  
	kinectComponent.getNodeById("1").setPos(newPos);
	
	// set highlight to closest graph node
	var closestNode = kinectComponent.getClosestNodeToHandCursor();
	//console.log("found closest node: " + closestNode);
	kinectComponent.setHighlightedNode(closestNode);
	
	kinectComponent.rgraph.plot();
};

var enableKeyboardKinect = function()
{
	

	 
	
	document.addEventListener('keydown', function(event) {
	    if(event.keyCode == 37) {
	        //alert('Left was pressed');
	    	simulateHandCursorMovement(true);
	    }
	    else if(event.keyCode == 38) {
	        //alert('UP was pressed');
	    	kinectComponent.centerHighlightedNode();
	    }
	    else if(event.keyCode == 39) {
	        //alert('Right was pressed');
	    	simulateHandCursorMovement(false);
	    }
	    else if(event.keyCode == 40) {
	        //alert('DOWN was pressed');
	    	kinectComponent.backOneLevel();
	    }
	});
};

//var getImageURLsForSubnodesOf = function(node)
//{
//	var controller = window.kinectComponent;
//	var selectedNodeGlobalLevel = controller.getGlobalLevel(node); // will be a value between 0 and 2
//	var filterValue = undefined;
//	var filterTag = undefined;
//	var query = undefined;
//	
//	// reset imageURLs
//	window.imageURLs = new Array();
//	
//	// this method gets the image URLs for a given node based on its global level (
//	
//	if(selectedNodeGlobalLevel === 0)
//	{
//		// get image URLs for each of the (currently six) filter nodes
//		// ... these images should illustrate the filter node (e.g. "nach Sammlung", "nach Thema" etc.)
//		
//		
//		
//		// no shuffle function needed: image selection can be found in /data/toplevelimages/$nodename
//		var subnodeIndex = 0;
//		// iterate over each filter node
//		node.eachSubnode(function(subnode)
//		{
//			subnode.data.imgIndex = subnodeIndex++; // the index for this image in galleria 
//			var name = subnode.name;
//			if(name === "Länder")
//			{
//				name = "Laender";
//			}
//			
//			// each key represents one filter name
//			var imgName = "http://localhost:8080/JITWebProject/data/toplevelimages/" + name + ".png";
//			
//			window.imageURLs.push(imgName);
//			
//			
//		});
//	}
//	else if(selectedNodeGlobalLevel === 1)
//	{
//		// get image URLs for each possible value of the given filter; the tag which is represented by the node can be found in the nodeTagMap
//		// - NOTE: nodeTagMap maps a nodename to a tag and is defined in ebookshelf.js
//		// ... these images should illustrate the filter node values (one image per filter subnode, e.g. "KUR-Projekt", "Archiv der Fotografen" etc.)
//		filterTag = nodeTagMap[node.name];
//		
//		
//		// for each subnode... 
//		node.eachSubnode(function(subnode)
//		{
//			if(subnode.id === '0')
//			{	return;	} // ... (excluding the global root)
//			else
//			{
//				// find a random image from the result set behind that subnode
//				filterValue = subnode.name;
//				//console.log("node name = " + node.name + "; filterTag = " + filterTag + "; filterValue = " + filterValue);
//				
//				// this returns all image URLs for the given filter tag and value
//				//query = "XQUERY for $x in //obj where $x//"+filterTag+"//text()='"+filterValue+"' return ($x//a8470//text(), ';')";
//				// we only want one (for each subnode), and it should be random
//				
////				 example query:
////				  
////				  - gets the entire result set
////					let $result := for $x in //obj where $x//a55b3//text()='1990 - Gegenwart' return ($x//a8470//text())
////					- creates a random index between 1 and length of result set
////					let $index := random:integer(count($result)) + 1
////					- returns the element at the random index... NOTE: index retrieval in BaseX/Xquery is 1-relative, not 0-relative!
////					- ... that's why the random index is manually set to +1 (otherwise it would start at 0)
////					- ... also IMPORTANT: the integer generation is maximum-exclusive, i.e. the actual count($result) will never be assigned! 
////					return ($index, ": ", $result[$index])
////				  
////				  
////				 
//				var firstLetClause = "let $result := for $x in //obj where $x//"+filterTag+"//text()='"+filterValue+"' return $x//a8470//text() ";
//				var secondLetClause = "let $index := random:integer(count($result)) + 1 ";
//				var returnClause = "return $result[$index]";
//				query = "XQUERY " + firstLetClause + secondLetClause + returnClause;
//	
//				var callback = function(data)
//				{
//					window.imageURLs.push(data);
//					
//				};
//				
//				queryDB(query, callback, false);
//				//window.imageURLs.push("http://www.deutschefotothek.de/cms/images/home-kartenforum.jpg");
//			}
//		});
//		
//	}
//	else if(selectedNodeGlobalLevel === 2)
//	{
//		// get image URLs for the result set that sits behind each filter value
//		// ... these images should represent the entire result set of a filter value (e.g. get all urls for objects that have "Archiv der Fotografen")
//		
//		// the filter tag we need to get from the parent of the selected node
//		
//		// getParents() fails when the filter value node is selected (is the root); getParents will return an empty array
//		// -> get the parent by looking up the path history, using the rgraph.nodesInPath property, which at this point will have 
//		// a length of 3 and look like this: ["0", $parentNode.id, node.id]
//		//var parentNode = node.getParents()[0];
//		
//		var parentNode = controller.getNodeById(controller.rgraph.nodesInPath[1]);
//		filterTag = nodeTagMap[parentNode.name];
//		filterValue = node.name;
//		query = "XQUERY for $x in //obj where $x//"+filterTag+"//text()='"+filterValue+"' return ($x//a8470//text(), ';')";
//		
//		
//		
//		var callback = function(data)
//		{
//			window.imageURLs = data.split(";");
//
//			
//		};
//
//		// note: queryDB is declared in ebookshelf.js
//		queryDB(query, callback, false);
//		
//	}
//	else
//	{
//		return null;
//	}
//	
//	
//	// every time we get new image URLs, we want them to be displayed in the gallery
//	pushImagesToGallery(window.imageURLs, node);
//};




