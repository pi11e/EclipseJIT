<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>RGraph - Tree Animation</title>

<!-- CSS Files -->
<link type="text/css" href="<%=request.getContextPath() %>/examples/css/base.css" rel="stylesheet" />
<link type="text/css" href="<%=request.getContextPath() %>/examples/css/RGraph.css" rel="stylesheet" />



<!-- JIT Library File -->
<script language="javascript" type="text/javascript" src="<%=request.getContextPath() %>/lib/jit.js"></script>

<!-- Example File -->
<script language="javascript" type="text/javascript" src="<%=request.getContextPath() %>/graph.js"></script>
</head>

<body onload="init();">
<div id="center-container">
	<div id="infovis"></div>    
</div>

<div id="log"></div>
</body>
</html>