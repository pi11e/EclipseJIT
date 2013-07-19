/**
 * 
 */
// NOTE: RGraph rendering function at jit.custom.js line 8924

// used in getDistinctValuesForTag
var maximumNodes = 12;
// used to map which node is based on which tag
var nodeTagMap = {};

// regular node color light torqoise
var regularColor = "#278";
// highlighted color: light orange
var highlightedColor = "#F90";
// node color for leaf nodes
var leafNodeRegularColor = "#6495ED";

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
	
	// initial graph setup:
	// WARNING: when using graph_data.js, this is *only* done for the global root node, i.e. all nodes in the initial dataset. So no effect, really. Quite useless.
	// 
	// - setup with highlighting color
	// - hide all labels deeper than 1 (global root has depth 0)
	// http://philogb.github.io/jit/static/v20/Docs/files/Graph/Graph-js.html#Graph.Util.eachNode
	this.kinectComponent.rgraph.graph.eachNode(function(node)
		{
			// perform this for all nodes in the graph
			node.data.regularColor = regularColor;
			node.data.highlightColor = highlightedColor;
			node.data.isHighlighted = false;
			
			if(node._depth > 1)
			{
				// set its label to be hidden
				window.kinectComponent.rgraph.labels.getLabel(node.id).hidden = true;
			}
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
var getDistinctValuesForTag = function(tag, callback, filterList)
{
	// constructing a query that will do the following things:
	// - get a result set that's based on the distinct values (i.e. subnodes) for the given tag
	// - order by the amount of subnodes the values may have
	// - filter out the contents of a given $filterList 
	// - after all this is done, the query returns the first $maximumAmount entries of the result set
	
	// to achieve this, the query contains a helper function called "is-value-in-sequence", a filter list and the actual xquery statement using these (see below)
	// var query = "XQUERY " + xqueryFunction + xqueryFilter + xqueryStatement; 
	
	var maximumAmount = maximumNodes;
	var delimiter = ";";
	
	
	// this wraps an xquery representation of the above filter list 
	var xqueryFilter = " let $filter := (";
	
	if(filterList && filterList.length > 0)
	{
		for(var i = 0; i < filterList.length; i++)
		{
			var filterWord = filterList[i];
			
			if(i === filterList.length-1)
			{xqueryFilter += "'"+filterWord+"')";} // add last filter word and closing parenthesis
			else
			{xqueryFilter += "'"+filterWord+"',";} // add filter word and comma
		}
	}
	else
	{
		// no valid filterlist was supplied - xquery filter is empty
		xqueryFilter += "'') ";
	}
		

	// this wraps the string declaring an "is-value-in-sequence" function which we'll need in the query
	var xqueryFunction = "declare namespace functx = 'http://www.functx.com'; declare function functx:is-value-in-sequence( $value as xs:anyAtomicType? , $seq as xs:anyAtomicType* )  as xs:boolean { $value = $seq } ;"; 

	// note: this second let clause constructs an intermediate result set which excludes items whose names are in the filter list and applies certain criteria on 
	// the names; e.g. in some categories, the names should be longer than 1 and generally less than 23 characters long (otherwise there are display issues with the labels).
	var letClause = '';
	if(tag==='a55b2') // when going for the "Thema"-filter, there's a large number of single-letter entries that we don't want to see 
	{
		letClause = "let $resultset := for $x in distinct-values(//obj//"+tag+"/text()) where not(functx:is-value-in-sequence($x, $filter)) and string-length($x)>1 and string-length($x)<22 order by count(//obj["+tag+"=$x]) descending return $x ";
	}
	else if(tag === 'a55b3') // when going for the "Epoche"-filter, we only want those that actually have a number
	{
		//letClause = "let $resultset := for $x in distinct-values(//obj//"+tag+"/text()) where not(functx:is-value-in-sequence($x, $filter)) and starts-with($x, '1') order by count(//obj["+tag+"=$x]) descending return $x ";
		
		// this query works, but the nodes are seemingly not added in the same sequence as they are returned by BaseX 
		letClause = "let $resultset := for $x in distinct-values(//obj//"+tag+"/text()) where not(functx:is-value-in-sequence($x, $filter)) and starts-with($x, '1') order by number(substring($x, 1, 4)) descending return $x ";
	}
	else
	{
		letClause = "let $resultset := for $x in distinct-values(//obj//"+tag+"/text()) where not(functx:is-value-in-sequence($x, $filter)) and string-length($x)<22 order by count(//obj["+tag+"=$x]) descending return $x ";
	}
	
	var forClause =  "for $entry in subsequence($resultset, 1, "+maximumAmount+") return ($entry, '"+delimiter+"')";
	
	var query = "XQUERY " + xqueryFunction + xqueryFilter + letClause + forClause; 
		
	//console.log(query);
	queryDB(query, callback, false);
};

var createFirstGraphLevel = function()
{
	
	var startNode = window.kinectComponent.getNodeById("0");
	createFilterLevel(startNode);
	
}; // end of createFirstGraphLevel()


var createFilterLevel = function (rootNode)
{
	// the filter graph level should append a number of nodes to the given root node to represent the application of certain filters
	// each of these filters represents a specific tag
	
	/*
	 * Tag		Count	Dokumentation				Filter Name
	 * a55b3	 6.701	Ebene 3						"nach Epoche"
	 * a99d3	65.625	APS-Archiv					"nach Sammlung"
	 * a5220	38.943	Gattung						"nach Gattung"
	 * a55df	66.701	Schlagwort / Ikonographie	"nach Schlagwort"
	 * a99d2	11.260	APS-Katalog					"nach Katalog"
	 * a55b2	52.904	"Ebene 2" bzw. Thema		"nach Thema"
	 */
	var filterNames = ['nach Epoche', 'nach Sammlung', 'nach Gattung', 'nach Schlagwort', 'nach Katalog', 'nach Thema'];
	var filterTags = ['a55b3','a99d3','a5220','a55df','a99d2','a55b2'];
	
	
	// for orientation:
	// Level 0: "total" root of the tree, "Fotothek".
	// Level 1: filter nodes with names from the above filterNames array
	// Level 2: subnodes to each filter node have one of the available distinct values for the tag that represents the parent filter node (see filterTags array)
	// Level 3: sub-subnodes where the routine finds out the URLs for each object in the db that has $lvl1tag = $lvl2name
	
	
/** creates level 1 **/
	// create one node for each of the given filter names and append it to the given root node
	addNodesWithNamesToRoot(filterNames, rootNode);
	
	var blacklist_sammlungen = ["KUR-Peter", "APS", "MI-Retro", "Grasser"];
	var blacklist_schlagwort = ["Bildnis", "Portrait", "Gebirgslandschaften", "Hügellandschaften", "Sonstiges"];
	var blacklist_thema = ["Ortskatalog systematisch", "Schlagwort-Katalog", "Volkskunde", "Geschichte", "Volksbildung | Pädagogik", "Feinwerktechnik, Optik", "Grundlagen der Technik, Wissenschaft und Kultur", "Verbrauchsgüterindustrie"];
	
	var blacklist = new Object();
	blacklist["nach Sammlung"] = blacklist_sammlungen;
	blacklist["nach Schlagwort"] = blacklist_schlagwort;
	blacklist["nach Thema"] = blacklist_thema;
	
	
	//Konzept: for each tag, get all distinct values, count the amount of subnodes for these and only take the top 12
	for(var i = 0; i < filterNames.length; i++)
	{
		
		var rootNode = window.kinectComponent.getNodeByName(filterNames[i]);
		nodeTagMap[filterNames[i]] = filterTags[i]; // maps each node name to a tag, e.g. persists the struture explained in the first comments section of this function
		getDistinctValuesForTag(filterTags[i], function(data)
				{
					var tempData = data.split(';'); 
//					console.log(tempData);
//					console.log("#######");

						
/** creates level 2 **/
					// 2. now with all the distinct values as node names, add subnodes to each filter node
					addNodesWithNamesToRoot(tempData, rootNode);
								
					
				}, blacklist[filterNames[i]]);
	}
	
	// Now, all nodes for levels 0-1-2 have been added.
	// Next, we hide all labels for nodes in level 2
	hideLabelsDeeperThanLevel(1);
	
	// Set default zoom level to 140% to avoid display issues where a centered (root) node draws over its child nodes
	window.kinectComponent.rgraph.config.levelDistance *= 1.4;
	window.kinectComponent.rgraph.canvas.scale(1.2, 1.2);
	
	// get image urls for global root once (will trigger gallery population)
	getImageURLsForSubnodesOf(window.kinectComponent.getNodeById('0'));
};

var hideLabelsDeeperThanLevel = function(level)
{
	
	
	if(typeof level === 'number')
	{
		this.kinectComponent.rgraph.graph.eachNode(function(node)
				{
					if(node._depth > level)
					{
						// set its label to be hidden
						window.kinectComponent.rgraph.labels.getLabel(node.id).hidden = true;
					}
				}
			);
	}
};



var addNodesWithNamesToRoot = function(nodeNames, rootNode)
{

	nodeNames = removeDuplicatesFromArray(nodeNames);
	
	var rgraph = window.kinectComponent.rgraph;
//	var actualMaximumNodes = maximumNodes - 1;
	
	for(var i = 0; i < nodeNames.length; i++)
	{
		// abort at maximum nodes (see beginning of file)
//		if(i > actualMaximumNodes)
//			return;
		
		// create a new node for each given node name
		var nodeName = jQuery.trim(nodeNames[i]);
		if(nodeName.length < 2 || nodeName.indexOf('&') !== -1)
		{
			
				// skip invalid, i.e. empty/short/'&'-containing, node names
				continue;
			
		}

		var newNode = {
				   id:		Math.ceil(Math.random()*100000).toString(),
				   name:	nodeName,
				   data:	{
					   			highlightColor: highlightedColor,
					   			isHighlighted: false,
					   			regularColor: regularColor,
					   			parentName:	rootNode.name,
					   			cnt: undefined
					   		}
				
		   }; // end of newNode
		
		addChildCountToNode(newNode);
		
	    rgraph.graph.addAdjacence(rootNode, newNode);
	    
		   
	} // end of nodeNames for-loop
	
	// 3. reload graph 
    rgraph.refresh();
    rgraph.plot();
    
    
};

var addChildCountToNode = function(node)
{
	if(window.quickDraw) // do not add child count if the quick draw flag is set (because this takes quite some time)
		return;
	
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
		
		//console.log("Adding subnode count " + childAmount + " to node " + node.name);
		
		// what I want is this; watch out for correct type etc, child amount might be string, maybe should be trimmed first
		node.data.cnt = parseInt(childAmount);
		
	}, false);
};

/**
 * Eliminiates duplicates from a given array.
 */
var removeDuplicatesFromArray = function(array)
{
	array = $.grep(array, function(v, k){
	    return $.inArray(v ,array) === k;
	});
	
	return array;
};

var updateSelectionLabelWithText = function(text)
{
	// following line is is not necessary and does in fact work 'automatically':
	//var selection = document.getElementById("selection");
	if(text.substring(0, 4) === '<br>')
	{
		// slice this off
		text = text.slice(4);
	}
    selection.innerHTML = text;
};
