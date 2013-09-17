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
//
//console.log('initializing canvas... ');
//setTimeout(function()
//{
//	
//	
//    console.log('done.');
//},500);

var filterNames = ['Fotografen', 'Epochen', 'Kollektionen', 'Gattungen', 'Länder', 'Themen'];


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
 * @unused
 */
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
	
	var filterTags = ['a8450/a8490','a5064/a5071','a55df','a5220','a5108/a511a','a55b1'];
	
	
	// for orientation:
	// Level 0: "total" root of the tree, "Fotothek".
	// Level 1: filter nodes with names from the above filterNames array
	// Level 2: subnodes to each filter node have one of the available distinct values for the tag that represents the parent filter node (see filterTags array)
	// Level 3: sub-subnodes where the routine finds out the URLs for each object in the db that has $lvl1tag = $lvl2name
	
	
/** creates level 1 **/
	// create one node for each of the given filter names and append it to the given root node
	addNodesWithNamesToRoot(filterNames, rootNode);
	
		
	// for each tag, get all distinct values, count the amount of subnodes for these and only take the top 12
	for(var i = 0; i < filterNames.length; i++)
	{
		
		var rootNode = window.kinectComponent.getNodeByName(filterNames[i]);
		nodeTagMap[filterNames[i]] = filterTags[i]; // maps each node name to a tag, e.g. persists the struture explained in the first comments section of this function
		
		var levelOneChildNodesQuery = getChildNodesForLevelOne(filterNames[i]);
		
		var callback = function(data)
		{
			var tempData = data.split(';');
			addNodesWithNamesToRoot(tempData, rootNode);
		};

		/** creates level 2 **/
		queryDB(levelOneChildNodesQuery, callback, false);
		
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
		
		// When a level two node is added, it should know how to get its children's image URLs.
		// 1. Find out whether the currently added node is a level two node. This can be done by finding out whether this node's parent node (the rootNode parameter in this method) is contained in the filterNodes list.
		// 2. Lookup the childNodes query
		// 3. Store it in the data.childNodeQuery property
		if(jQuery.inArray(rootNode.name, filterNames) !== -1) // meaning rootNode.name IS in the filterNames array
		{
			// submit this query to find all child node images
			newNode.data.childImageQuery = getImageQueryForLevelTwoNode(rootNode.name, nodeName);
			// submit this query to find one representative image for this node
			newNode.data.ownImageQuery = getRandomImageQueryForLevelTwoNode(rootNode.name, nodeName);
		}
		
		// disable child counts
//		addChildCountToNode(newNode);
		
	    rgraph.graph.addAdjacence(rootNode, newNode);
	    
		   
	} // end of nodeNames for-loop
	
	// 3. reload graph 
    rgraph.refresh();
    rgraph.plot();
    
    
};

/**
 * @unused
 */
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

/**
 * Gets an XQUERY expression for the given filter name.
 */ 
var getChildNodesForLevelOne = function(levelOneNodeName)
{
	var maximumAmount = maximumNodes;

	var query = null;
	switch(levelOneNodeName)
	{
		/*
		 * Note: For the more complex constructed queries, image url retrieval is non-trivial.
		 * 
		 * If a set of subnodes is based on a single path, that path can be used to resolve the image URLs. 
		 * This is easy for the following filter nodes: 
		 * 	'Fotografen' //obj//a8450/a8490/text() 
		 * 	'Gattungen' //obj//a5220/text()
		 * 	'Themen' //obj//aob00/a55b3/text()
		 * 
		 * For the filter nodes 'Epochen', 'Kollektionen' and 'Länder', this gets more complicated.
		 * 	'Epochen' has completely arbitrarily constructed subnodes made of a list of centuries. Its childnodes actually represent specific years which
		 * 		should be grouped by a minimum and maximum value to map them to a century node. This means each century node should know how to retrieve
		 * 		its child nodes so it can use this information to retrieve all child node's image urls.
		 * 	The same is true for Kollektionen and Länder nodes, as they are constructed in a similar manner.
		 * 
		 * Approach:
		 * Attach to each level one node the query to get its level two child nodes. Use this query to retrieve the image and thumbnail URLs. 
		 */
	
		case "Fotografen":
			// passt - explizite whitelist mit 11 einträgen im query
			query = "XQUERY declare namespace functx = 'http://www.functx.com'; declare function functx:is-value-in-sequence( $value as xs:anyAtomicType? , $seq as xs:anyAtomicType* )  as xs:boolean { $value = $seq } ; let $filter := ('Blossfeldt, Karl', 'Donadini, Ermenegildo Antonio', 'Lübeck, Oswald', 'Peter, Richard jun.', 'John, Paul W.', 'Danigel, Gerd', 'Helbig, Konrad', 'Aufsberg, Lala', 'Peter, Richard sen.', 'Eschen, Fritz', 'Borchert, Christian') for $x in distinct-values(//obj//a8450/a8490/text()) where (functx:is-value-in-sequence($x, $filter)) return ($x, ';') ";
			break;
		case "Epochen":
			
			//var childNodes = "XQUERY let $min := 1900 let $max := 2000 for $x in distinct-values(//obj/a5064/a5071/text()) where xs:integer($x) < $max and xs:integer($x) > $min  order by xs:integer($x) return ($x, ';')";
			// Manuelle Jahrhunderte; später beim Hinzufügen nach min/max gehen, s. Notiz
			query = "XQUERY let $epoch := ('21. Jh.', '20. Jh.', '19. Jh.', '18. Jh.', '17. Jh.', '16. Jh.', '15. Jh.', '14. Jh.', '13. Jh.', 'älter') for $x in $epoch return ($x, ';')";
			break;
		case "Kollektionen":
			// zwei Kollektionen: Pöppelmann und Wagner; beide haben Unterkollektionen, Filterknoten sollen "M.D. Pöppelmann" und "Richard Wagner" heißen
			// query bringt alle unterkollektionen, also z.B.
			/*
			 * 
			 * Portfolio-Richard-Wagner-Pläne-und-Städtebilder 
 				Portfolio-Richard-Wagner-missing 
 				Portfolio-Pöppelmann-Person 
 				Portfolio-Pöppelmann-Varia 
			 */
			//var childNodes = "XQUERY for $x in distinct-values(//obj//a55df/text()) where starts-with($x,'Portfolio-Richard-Wagner') or starts-with($x, 'Portfolio-Pöppelmann') return ($x, ';') ";
			// Manuelle Portfolio-Knoten, später beim Hinzufügen der Kindknoten nach obigem Query gehen, s. Notiz
			query = "XQUERY for $x in ('M. D. Pöppelmann', 'Richard Wagner') return ($x, ';')";
			break;
		case "Gattungen":
			// passt - explizite whitelist mit 7 einträgen im query; achtung: zwei knoten Druckgraphik und Druckgrafik, evtl. vereinen
			query = "XQUERY declare namespace functx = 'http://www.functx.com'; declare function functx:is-value-in-sequence( $value as xs:anyAtomicType? , $seq as xs:anyAtomicType* )  as xs:boolean { $value = $seq } ; let $filter := ('Druckgrafik', 'Kunsthandwerk', 'Bauskulptur', 'Möbeldesign', 'Malerei', 'Skulptur', 'Architektur') for $x in distinct-values(//obj//a5220/text()) where (functx:is-value-in-sequence($x, $filter)) return ($x, ';')";
			break;
		case "Länder":
			/*
			 * Naiver query:
			 *  let $part1 := for $x in (//obj/aob26/a260a) return $x
			 *  let $part2 := for $x in (//obj/a5108/a511a) return $x
			 *  return (distinct-values($part1), distinct-values($part2))
			 *  
			 *  Enthält Dopplungen, z.B. "IndienIndien" oder "DeutschlandDeutschlandDeutschland". Doppelte Vorkommnisse werden per Vergleich
			 *  1. Worthälfte != 2. Worthälfte entfernt; da "DeutschlandDeutschlandDeutschland" das einzige dreifach vorkommende Land ist, wird es
			 *  manuell gefiltert:
			 *   
			 *  let $part1 := for $x in (//obj/aob26/a260a) return $x
			 *  let $part2 := for $x in (//obj/a5108/a511a) return $x
			 *  let $sum := ($part1, $part2)
			 *  for $x in distinct-values($sum) where substring($x, 1, string-length($x) div 2)!=substring($x, string-length($x) div 2 + 1) and string-length($x) > 2 and $x != 'DeutschlandDeutschlandDeutschland' return $x
			 *  ... dauert rund 2876ms
			 *  ... liefert 73 Treffer?
			 *  
			 *  let $part1 := for $x in (//obj/aob26/a260a) return $x 
			 *  let $part2 := for $x in (//obj/a5108/a511a) return $x 
			 *  let $sum := ($part1, $part2) 
			 *  for $x in distinct-values($sum) where substring($x, 1, string-length($x) div 2)!=substring($x, string-length($x) div 2 + 1) and string-length($x) > 2 and $x != 'DeutschlandDeutschlandDeutschland' order by count(index-of($sum, $x)) descending return ($x, ' ',  count(index-of($sum, $x)),'&#xa;')
			 *  ... wie oben, nur nach Unterknoten geordnet
			 *  
			 *  let $part1 := for $x in (//obj/aob26/a260a) return $x 
			 *  let $part2 := for $x in (//obj/a5108/a511a) return $x 
			 *  let $sum := ($part1, $part2) 
			 *  let $result := for $x in distinct-values($sum) where substring($x, 1, string-length($x) div 2)!=substring($x, string-length($x) div 2 + 1) and string-length($x) > 2 and $x != 'DeutschlandDeutschlandDeutschland' order by count(index-of($sum, $x)) descending return ($x)
			 *  for $entry in subsequence($result, 1, 12) return ($entry, ';')
			 *  ... wie oben, nur die ersten $maximumAmount knoten mit ';' delimiter
			 */
			query = "XQUERY let $part1 := for $x in (//obj/aob26/a260a) return $x let $part2 := for $x in (//obj/a5108/a511a) return $x let $sum := ($part1, $part2) let $result := for $x in distinct-values($sum) where substring($x, 1, string-length($x) div 2)!=substring($x, string-length($x) div 2 + 1) and string-length($x) > 2 and $x != 'DeutschlandDeutschlandDeutschland' order by count(index-of($sum, $x)) descending return ($x) for $entry in subsequence($result, 1, "+maximumAmount+") return ($entry, ';')";
			break;
		case "Themen":
			// query removes "Verschiedenes" as well as very long items, such as "Geschäfte | Gaststätten | Hotels"; afterwards takes the top $maximumAmount by count of their children
			query = "XQUERY let $result := for $x in distinct-values(//obj//aob00/a55b3) where string-length($x) < 20 and $x != 'Verschiedenes' order by count(//obj/aob00[a55b3=$x]) descending return $x for $entry in subsequence($result, 1, "+maximumAmount+") return ($entry, ';')";
			break;
		default:
			break;
	}
	
	return query;
};

var getImageQueryForLevelTwoNode = function(levelOneParentName, levelTwoParentName)
{
	// levelOneParentName tells us the category we're in, e.g. 'Gattungen' or 'Kollektionen' etc.
	var query = null;
	var resultSet = null;
	
	// cap returning result sets at this maximum:
	var maximumResults = 100;
	// assuming the original result is provided in the form of "let $resultset := ..."
	// note: the amount of maximum results in the queries is doubled, because for every item returned, the query adds a delimiter character (";")
	//	this means a resultset looking like this "result1;result2;result3;" actually has length 6 for the query engine, "result1" is the first item, ";" is the second item and so forth
	//	this also means to get the amount specified by maximumResults, we have to actually double this factor since all the delimiter chars are thrown away later on
	var returnUpToMaximum = "return subsequence($resultSet, 1,"+2*maximumResults+")";
	
	switch(levelOneParentName)
	{
		/*
		 * Approach:
		 * Attach to each level one node the query to get its level two child nodes. Use this query to retrieve the image and thumbnail URLs. 
		 */
		case "Fotografen":
			resultSet = "for $x in //obj where $x//a8450/a8490/text()='"+levelTwoParentName+"' return ($x//a8470//text(), ';') ";
			
			break;
		case "Epochen":
			{ // epochen = 21. - 13. jh, danach "älter"
				// wenn levelTwoParentName === '20. Jh.', dann soll century == 2000 sein; 20. Jh. ist > 1899 und < 2000, es geht von 1900 bis 1999, d.h. min = 1899 und max = 2000
			
				var century = levelTwoParentName.substring(0,2) * 100;
				var min, max;
				if(typeof century !== 'number')
				{
					max = 1300;
					min = -9999;
				}
				else
				{
					max = century;
					min = max-101;
				}
				
				resultSet  = "for $x in //obj where count($x/a5064/a5071/text())=1 and xs:integer($x/a5064/a5071/text()) < "+max+" and xs:integer($x/a5064/a5071/text()) > "+min+"  order by xs:integer($x/a5064/a5071/text()) descending return ($x//a8470//text(), ';') ";
				
			}
			break;
		case "Kollektionen":
			{
				var startsWithPrefix = null;
				if(levelTwoParentName === 'Richard Wagner')
				{
					startsWithPrefix = 'Portfolio-Richard-Wagner';
				}
				else if(levelTwoParentName === 'M. D. Pöppelmann')
				{
					startsWithPrefix = 'Portfolio-Pöppelmann';
				}
				
				resultSet = "for $x in //obj where count($x//a55df)=1 and starts-with($x//a55df,'"+startsWithPrefix+"') return ($x//a8470//text(), ';') ";
			}
			break;
		case "Gattungen":
			resultSet = "for $x in //obj where $x//a5220/text()='"+levelTwoParentName+"' return ($x//a8470//text(), ';') ";
			break;
		case "Länder":
			// find childnodes of both $part1 and $part2
			resultSet = "let $part1 := for $x in //obj where $x/aob26/a260a/text()='"+levelTwoParentName+"' return ($x//a8470//text(), ';') let $part2 := for $x in //obj where $x/a5108/a511a/text()='"+levelTwoParentName+"' return ($x//a8470//text(), ';') let $sum := ($part1, $part2) return ($sum) ";
			break;
		case "Themen":
			resultSet = "for $x in //obj where $x//aob00/a55b3/text()='"+levelTwoParentName+"' return ($x//a8470//text(), ';') ";
			break;
		default:
			break;
	}
	
	query = "XQUERY let $resultSet := " + resultSet + returnUpToMaximum;
	return query;
};

var getRandomImageQueryForLevelTwoNode = function(levelOneParentName, levelTwoParentName)
{
	// the random query should get the entire result set and then retrieve one random image from that
	// to make use of the optimization techniques of BaseX, this should entirely be handled by the DB and NEVER by the JS frontend,
	// since it will have horrible performance
	
	// to get the entire result set query, strip the "XQUERY " prefix from an image query
	var resultSet = getImageQueryForLevelTwoNode(levelOneParentName, levelTwoParentName).substring(7);
	
	var firstLetClause = "let $result := "+ resultSet;
	var secondLetClause = " let $index := random:integer(count($result)) + 1 ";
	var returnClause = "return $result[$index]";
	
	return "XQUERY " + firstLetClause+secondLetClause+returnClause;

};

