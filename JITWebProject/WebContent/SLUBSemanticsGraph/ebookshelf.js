/**
 * 
 */
// NOTE: RGraph rendering function at jit.custom.js line 8924
var interestingNodes = ["Architekturzeichnungen", "Arbeiterfotografie", "Archiv der Fotografen", "DFG-Karten", "Möbelarchiv Weimer", "Künstlerzeitschriften"];
// used in addNodesWithNamesToRoot
var maximumNodes = 20;
// used to map which node is based on which tag
var nodeTagMap = {};


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
	
	
	
	
	
    console.log('after');
},500);


var promptQueryAndExecute = function()
{
	var queryString = prompt("Enter XQuery:");
	queryDB(queryString, function(data){alert(data);});
};

var queryDB = function(queryString, callback, callAsync)
{
	// make sure the supplied callback is a function
	if(typeof callback !== 'function')
	{
		console.log("queryDB ERROR: invalid callback parameter. not a function.");
		return;
	}
	
	
	if(arguments.length === 3 && typeof callAsync === 'boolean') // async parameter supplied
	{
		// use callAsync parameter to set up jQuery AJAX accordingly
		jQuery.ajaxSetup({async:callAsync});
	}
	else
	{
		// default: asynchronous call (true)
		jQuery.ajaxSetup({async:true});
	}
	
	
	$.get(
		    "http://localhost:8080/JITWebProject/DataServlet",
		    {query : queryString},
		    callback
		);
};

/**
 * For a given tag, finds all distinct values found in the database delimited by semicolon.
 * @param tag - the tag to be evaluated for distinct values, e.g. 'a99d3'
 * @param callback - the callback function which is used to manipulate the returned data 
 */
var getDistinctValuesForTag = function(tag, callback)
{
	//e.g. for $x in distinct-values(//obj/a99d3) return ($x, '&#xa;')
	var delimiter = ";";
	var query = "XQUERY for $x in distinct-values(//obj//" + tag + ") return ($x, '" + delimiter + "')";
	
	
	queryDB(query, callback, false);
};

var createFirstGraphLevel = function()
{
	
	// DEMO
	//getDistinctValuesForTag("a99d3", demoCallback); // end of getDistinctValuesForTag
	
	var startNode = window.kinectComponent.getNodeById("0");
	createFilterLevel(startNode);
	
}; // end of createFirstGraphLevel()



var createFilterLevel = function (rootNode)
{
	// the filter graph level should append a number of nodes to the given root node to represent the application of certain filters
	// each of these filters represents a specific tag
	
	/*
	 * Tag		Count	Dokumentation				Filter Name
	 * a5064	 6.701	Datierung					"nach Epoche"
	 * a99d3	65.625	APS-Archiv					"nach Sammlung"
	 * a5220	38.943	Gattung						"nach Gattung"
	 * a55df	66.701	Schlagwort / Ikonographie	"nach Schlagwort"
	 * a99d2	11.260	APS-Katalog					"nach Katalog"
	 * a55b2	52.904	"Ebene 2" bzw. Thema		"nach Thema"
	 */
	var filterNames = ['nach Epoche', 'nach Sammlung', 'nach Gattung', 'nach Schlagwort', 'nach Katalog', 'nach Thema'];
	var filterTags = ['a5064','a99d3','a5220','a55df','a99d2','a55b2'];
	
	// create one node for each of the given filter names and append it to the given root node
	addNodesWithNamesToRoot(filterNames, rootNode);
	
	// then get distinct values for the given tags (1.) and create subnodes for those (2.)
	for(var i = 0; i < filterNames.length; i++)
	{
		nodeTagMap[filterNames[i]] = filterTags[i];
		
		var rootNode = window.kinectComponent.getNodeByName(filterNames[i]);
		// 1.		
		getDistinctValuesForTag(filterTags[i]+'//text()', function(data)
		{
			var tempData = data.split(';'); 
			
			// 2.
			addNodesWithNamesToRoot(tempData, rootNode);

		});
	}
};

var createSublevelForNode = function(parentName)
{
	console.log("Creating sublevel for node " + parentName);
	
	var delimiterChar = ' '; // note: when splitting by ' ', terms like "Die Naturfreunde" will be split as well, see note below.
	//var delimiterChar = ';';
	
	
	
	// Assume parentName is one of the possible distinct values of tag a99d3, e.g. 'Talleyrand' or 'Arbeiterfotografie'.
	// For the given name, display a number of subnodes depending on interaction design mode.
	var query = "XQUERY for $x in //obj[a99d3='"+parentName+"'] return (distinct-values($x//a55b3/text()), '"+delimiterChar+"')";
	var tempData;
	
	/*
	 * NOTE: 
	 * There's a bothersome duality in values for the a55df tag, because its usage differs.
	 * To demonstrate, here are some sample values:
	 * "Faschismus Antisemitismus Pogrome Verb�nde SA" i.e. several theme-based tags, delimited by a space character
	 * "Die Naturfreunde" i.e. one single semantic term not meant to be separated
	 * " E�zimmerm�bel | Ausziehtische Portfolio-M�beldesign-E�zimmerm�bel " i.e. a wild combination of both of the above cases PLUS a new delimiter-character "|"
	 */
	
	
	var rootNode = window.kinectComponent.getNodeByName(parentName);
	
	if(!rootNode)
	{
		console.log("Invalid parent node; node with name '" + parentName + "' not found.");
	}
	
	queryDB(query, function(data)
				{
					// data will contain several tags delimited by ';'
					tempData = data.split(delimiterChar);
					tempData = removeDuplicatesFromArray(tempData);
					console.log(tempData);
					addNodesWithNamesToRoot(tempData, rootNode);
				}, false);
};

var addNodesWithNamesToRoot = function(nodeNames, rootNode)
{

	nodeNames = removeDuplicatesFromArray(nodeNames);
	var filter = ['Kunst', 'des', '20.', 'Jahrhunderts', 'gedeckte'/*, 'Tische'*/];
	
	var rgraph = window.kinectComponent.rgraph;
	
	for(var i = 0; i < nodeNames.length; i++)
	{
		// abort at maximum nodes (see beginning of file)
		if(i > maximumNodes)
			return;
		
		// create a new node for each given node name
		var nodeName = jQuery.trim(nodeNames[i]);
		if(nodeName === "" || nodeName === " " || nodeName.length === 1 || nodeName.indexOf('&') !== -1 || jQuery.inArray(nodeName, filter) !== -1)
		{
			
				// skip invalid, i.e. empty/short/'&'-containing, node names
				continue;
			
		}

		var newNode = {
				   id:		Math.ceil(Math.random()*100000).toString(),
				   name:	nodeName,
				   data:	{
					   			highlightColor: "#F90",
					   			isHighlighted: false,
					   			regularColor: "#278",
					   			parentName:	rootNode.name,
					   			cnt: undefined
					   		}
				
		   }; // end of newNode
		
	   rgraph.graph.addAdjacence(rootNode, newNode);
	   //rgraph.refresh();
	   addChildCountToNode(newNode);
		   
	} // end of nodeNames for-loop
	
	// 3. reload graph 
    rgraph.refresh();
    rgraph.plot();
    
};

var demoCallback = function(data) 
{
	// data contains the server response
   var nodeNames = data.split(";");
   //console.log(nodeNames);
   
   var rgraph = window.kinectComponent.rgraph;
   
   
   // 1. create new node for each valid name in nodeNames
   
   
   for(var i = 0; i < nodeNames.length; i++)
   {
	   var nodeName = jQuery.trim(nodeNames[i]);
	   if(jQuery.inArray(nodeName, interestingNodes) === -1)
		   continue;
	   
	   
	   if(nodeName != undefined && nodeName !== "")
	   {
		   
		   var newNode = {
				   id:		i+10,//Math.ceil(Math.random()*100000).toString(),
				   name:	nodeName,
				   data:	{
					   			highlightColor: "#F90",
					   			isHighlighted: false,
					   			regularColor: "#278",
					   			cnt: undefined
					   		}
				
		   }; // end of newNode
		   

			// TODO: add book count for each node?
				var query = "XQUERY for $x in 1 return (count(//obj[a99d3='"+ newNode.name +"']), "+ newNode.id +")";
				  				
				queryDB(query, function(data)
				{
					// data is expected to match format $amount_of_objects $node_id
					var tempData = data.split(" ");
					var childAmount = tempData[0];
					var nodeId = tempData[1];
					
					// doesn't work. while the correct data.cnt gets set to the correct nodes, even when refreshed/plotted the numbers don't show
					//window.kinectComponent.getNodeById(nodeId).data.cnt = childAmount;
					
				}, false);
		   
		   var rootNode = rgraph.graph.getNode(rgraph.root);
		   
		   
		   
		   //console.log("created node " + newNode.name + " with id " + newNode.id);
		   rgraph.graph.addAdjacence(rootNode, newNode);
		   rgraph.refresh();
		   
		   
	   }
   } // end of node-creating for-loop
   
   // test
   // create 2nd graph level
//   rgraph.graph.eachNode(function(node)
//   {
//	   console.log("DEBUG A: " + node._depth);
//	   if(node._depth === 1)
//	   {
//		   console.log("DEBUG B");
//		   createSublevelForNode(node.name);
//	   }
//	   
//   });
   
   createSublevelForNode("M�belarchiv Weimer");
   
   
   // 3. reload graph 
   rgraph.refresh();
   rgraph.plot();
   
   
   
};

var addChildCountToNode = function(node)
{
	// get node name & the parent's tag
	
	// Explanation:
	// Start node is 'Fotothek'.
	// Following nodes are filters that represent the application of a distinct-values filter for a specific tag.
	//		This tag is stored, along with the displayed filter name, in the nodeTagMap.
	//		Example: nodeTagMap['nach Sammlung'] = 'a99d3'
	// All possible distinct values of this tag are displayed as subnodes of the filter.
	//		I'd like to know how many subnodes there can be, in terms of an XQuery:
	//		count the number of objects where the tag of the parent holds the value of a given child
	
	// Example:
	// Fotothek -> nach Sammlung (a99d3) -> APS -> subnode count for each of the nodes that are displayed here
	// XQUERY count(//obj[a99d3='APS'])
	// note that the node 'APS' is a child node of the 'nach Sammlung' node representing distinct values for the (parent's!) tag
	if(!node.data.parentName)
	{
		return;
	}
	
	var nodeName = node.name;
	var nodeTag = nodeTagMap[node.data.parentName];
	
	
	
	if(!nodeTag || !nodeName)
	{
		return;
	}
	
	var temp = nodeTag + "='" + nodeName + "'"; // e.g. a99d3='APS'
	
	// construct query to find the number of elements that have this value
	var query = "XQUERY for $x in 1 return (count(//obj["+ temp +"]), "+ node.id +")";
		
	queryDB(query, function(data)
	{
		// data is expected to match format ($amount_of_objects $node_id)
		var tempData = data.split(" ");
		var childAmount = tempData[0];
		var nodeId = tempData[1];
		
		console.log("Adding subnode count " + childAmount + " to node " + node.name);
		
		// what I want is this; watch out for correct type etc, child amount might be string, maybe should be trimmed first
		node.data.cnt = parseInt(childAmount);
		
	}, false);
};

/**
 * Eliminiates duplicates from a given array.
 */
var removeDuplicatesFromArray = function(array)
{
	// eliminate duplicates?
	array = $.grep(array, function(v, k){
	    return $.inArray(v ,array) === k;
	});
	
	return array;
};

var updateSelectionLabelWithText = function(text)
{
	// umm this is not necessary and does in fact work 'automatically':
	//var selection = document.getElementById("selection");
    selection.innerHTML = text;
};