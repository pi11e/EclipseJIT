<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>RGraph - Tree Animation</title>

<!-- CSS Files -->
<link type="text/css" href="<%=request.getContextPath() %>/css/base.css" rel="stylesheet" />
<link type="text/css" href="<%=request.getContextPath() %>/css/RGraph.css" rel="stylesheet" />



<!-- JIT Library File -->
<script language="javascript" type="text/javascript" src="<%=request.getContextPath() %>/lib/jit.js"></script>

<!-- Example File -->
<script language="javascript" type="text/javascript" src="<%=request.getContextPath() %>/examples/RGraph/example1.js"></script>
</head>

<body onload="init();">
<div id="container">

<div id="left-container">



<div class="text">
<h4>
Tree Animation; context path: 
</h4> 

            A static JSON Tree structure is used as input for this visualization.<br /><br />
            <b>Click</b> on a node to move the tree and center that node.<br /><br />
            The centered node's children are displayed in a relations list in the right column.<br /><br />
            <b>Use the mouse wheel</b> to zoom and <b>drag and drop the canvas</b> to pan.
            
</div>

<div id="id-list"></div>


<div style="text-align:center;"><a href="<%=request.getContextPath() %>/examples/RGraph/example1.js">See the Example Code</a></div>            
</div>

<div id="center-container">
    <div id="infovis"></div>    
</div>

<div id="right-container">

<div id="inner-details"></div>

</div>

<div id="log"></div>
</div>
</body>
</html>