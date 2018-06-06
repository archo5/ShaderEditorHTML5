


var dims2type = { "1": "float", "2": "float2", "3": "float3", "4": "float4" }
var type2glsl = { "1": "float", "2": "vec2", "3": "vec3", "4": "vec4" }
var labelsXYZW = ["X", "Y", "Z", "W"]
var labelsRGBA = ["R", "G", "B", "A"]
var labelsHSVA = ["H", "S", "V", "A"]

var nodeRsrcNames = { uniform: "Uniform", varying: "Varying", sampler2D: "2D Texture" }

window.ARG_NONUMEDIT = 0x01

function nodeResourceGenerateDesc(type, name)
{
	var rsrcInfo = nodeResources[type][name]
	if (rsrcInfo.desc)
		return rsrcInfo.desc
	if (type == "uniform" || type == "varying")
		return dims2type[rsrcInfo.dims]
	if (type == "variable")
		return dims2type[rsrcInfo.dims] + " " + rsrcInfo.type
	return ""
}



function rgbFromHSV(hsv)
{
	const cor = [hsv[0] % 1, hsv[1], hsv[2]]
	const hi = Math.floor(Math.floor(cor[0] * 6) % 6)
	const f = (cor[0] * 6) - Math.floor(cor[0] * 6)
	const p = cor[2] * (1 - cor[1])
	const q = cor[2] * (1 - (f * cor[1]))
	const t = cor[2] * (1 - ((1 - f) * cor[1]))
	switch (hi)
	{
	case 0: return [cor[2], t, p]
	case 1: return [q, cor[2], p]
	case 2: return [p, cor[2], t]
	case 3: return [p, q, cor[2]]
	case 4: return [t, p, cor[2]]
	case 5: return [cor[2], p, q]
	}
	return [0, 0, 0]
}
function minFromRGB(rgb) { return Math.min(rgb[0], Math.min(rgb[1], rgb[2])) }
function maxFromRGB(rgb) { return Math.max(rgb[0], Math.max(rgb[1], rgb[2])) }
function hueFromRGB(rgb)
{
	const M = maxFromRGB(rgb)
	const m = minFromRGB(rgb)
	const C = M - m
	if (C == 0)
		return 0
	var h = 0
	if (M == rgb[0])
		h = ((rgb[1] - rgb[2]) / C) % 6
	else if (M == rgb[1])
		h = (rgb[2] - rgb[0]) / C + 2
	else if (M == rgb[2])
		h = (rgb[0] - rgb[1]) / C + 4
	return h / 6
}
function satFromRGB(rgb)
{
	const M = maxFromRGB(rgb)
	const m = minFromRGB(rgb)
	return M == 0 ? 0 : (M - m) / M
}
function valFromRGB(rgb)
{
	return maxFromRGB(rgb)
}
function hsvFromRGB(rgb) { return [hueFromRGB(rgb), satFromRGB(rgb), valFromRGB(rgb)] }



var defArg = [0,0,0,1]
function constructArgValue(val)
{
	if (val)
	{
		const out = []
		for (var i = 0; i < 4; ++i)
			out.push(i < val.length ? val[i] : defArg[i])
		return out
	}
	return defArg.slice(0, 4)
}



var nodeMap = {}
store.set("nodeMap", nodeMap)
store.set("functions",
{
	main:
	{
		retDims: 4,
		nodeCols: []
	},
})

function funcCreate(name, dims, args)
{
	var outNode = nodeConstruct("output")
	outNode.x = 0
	outNode.y = 0
	outNode.func = name
	var func =
	{
		retDims: dims,
		args: args.map((x) => ({ dims: x.dims, name: x.name })),
		nodeCols: [[outNode.id]],
		outputNode: outNode.id,
	}
	funcGetMap()[name] = func
}

function funcMove(name, oldName, dims, args)
{
	var nfm = funcGetMap()
	var func =
	{
		retDims: dims,
		args: args.map((x) => ({ dims: x.dims, name: x.name })),
		nodeCols: nfm[oldName].nodeCols,
		outputNode: nfm[oldName].outputNode,
	}
	delete nfm[oldName]
	nfm[name] = func

	// change output function editor if fixed
	nodeArgAdjustFixedEditors(func.outputNode, 0, dims)
	// TODO remap args of function nodes
}

function funcNameValidate(name)
{
	return name.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
}

function funcSetCur(name)
{
	store.set("editor/curFunc", name)
	storeUpdateCurFunc()
}

function funcGetCurName()
{
	return store.get("editor/curFunc")
}

function funcGetData(name)
{
	return store.get("functions/" + name)
}

function funcGetDataAll(name)
{
	return funcGetData(name) || nodeResources.func[name]
}

function funcGetCurData()
{
	return store.get("functions/" + funcGetCurName())
}

function funcGetArgDimsCache(name)
{
	const fnData = funcGetData(name)
	var cache = fnData.cachedArgDimsByName
	if (!cache)
	{
		fnData.cachedArgDimsByName = cache = {}
		for (var i = 0; i < fnData.args.length; ++i)
			cache[fnData.args[i].name] = fnData.args[i].dims
	}
	return cache
}

function storeUpdateCurFuncNodes()
{
	store.update("nodeMap")
	//store.update(`functions/${funcGetCurName()}/nodeCols`)
	store.update("functions")
}

function storeUpdateCurFunc()
{
	store.update("editor/globalUpdateTrigger")
}

function funcGetMap()
{
	return store.get("functions")
}

function funcGetCurNodeCols()
{
	return store.get(`functions/${funcGetCurName()}/nodeCols`)
}



function _nodeResolve(node)
{
	return (typeof node === "string" || typeof node === "number") ? nodeMap[node] : node
}

function nodeGetArgCount(node)
{
	node = _nodeResolve(node)
	const nt = nodeTypes[node.type]
	if (nt.getArgCount)
		return nt.getArgCount(node)
	return 0
}

function nodeArgGetName(node, argNum)
{
	node = _nodeResolve(node)
	const nt = nodeTypes[node.type]
	argNum |= 0
	if (argNum < 0 || argNum >= nodeGetArgCount(node))
		throw "[nodeArgGetName] index out of bounds"
	return nt.getArgName(node, argNum)
}

function nodeArgGetDefDims(node, argNum)
{
	node = _nodeResolve(node)
	const nt = nodeTypes[node.type]
	argNum |= 0
	if (argNum < 0 || argNum >= nodeGetArgCount(node))
		throw "[nodeArgGetDefDims] index out of bounds"
	return nt.getArgDims(node, argNum)
}

function nodeArgGetFlags(node, argNum)
{
	node = _nodeResolve(node)
	const nt = nodeTypes[node.type]
	argNum |= 0
	if (argNum < 0 || argNum >= nodeGetArgCount(node))
		throw "[nodeArgGetFlags] index out of bounds"
	return nt.getArgFlags(node, argNum)
}

function funcArgGetDefDimsByName(func, argName)
{
	var cache = funcGetArgDimsCache(func)
	return cache[argName] || null
}

function nodeArgGetEditor(node, argNum)
{
	return _nodeResolve(node).args[argNum].ed
}

function nodeArgSetEditor(node, argNum, ed)
{
	node = _nodeResolve(node)
	if (node.args[argNum].ed === ed)
		return
	var arg = node.args[argNum]
	var olded = arg.ed
	if ((ed == "colhsv" || ed == "colhsva") && olded != "colhsv" && olded != "colhsva")
	{
		const hsv = hsvFromRGB(arg.value)
		arg.hsva = [hsv[0], hsv[1], hsv[2], arg.value[3]]
	}
	/*else if (olded == "colhsv" || olded == "colhsva")
	{
		const rgb = rgbFromHSV(arg.hsva)
		arg.value = [rgb[0], rgb[1], rgb[2], arg.hsva[3]]
	}*/
	if ((ed == "collum" || ed == "colluma") && olded != "collum" && olded != "colluma")
	{
		const dims = nodeArgGetDefDims(node, argNum)
		var lum
		if (olded == "num1" || (olded == "numauto" && dims == 1))
			lum = arg.value[0]
		else if (olded == "num2" || (olded == "numauto" && dims == 2))
			lum = (arg.value[0] + arg.value[1]) / 2
		else
			lum = 0.2126 * arg.value[0] + 0.7152 * arg.value[1] + 0.0722 * arg.value[2]
		arg.value = [lum, lum, lum, arg.value[3]]
	}
	node.args[argNum].ed = ed
	store.update(`nodeMap/${node.id}`)
}

function nodeArgAdjustFixedEditors(node, argNum, dims)
{
	node = _nodeResolve(node)
	var ed = node.args[argNum].ed
	if (ed == "num1" || ed == "num2" || ed == "num3" || ed == "num4")
		nodeArgSetEditor(node, argNum, "num" + dims)
}



function _nodesCheckColEmpty(colID)
{
	var nodeCols = funcGetCurNodeCols()
	var col = nodeCols[colID]
	if (col.length != 0)
		return
	nodeCols.splice(colID, 1)
	for (var i = colID; i < nodeCols.length; ++i)
	{
		for (var j = 0; j < nodeCols[i].length; ++j)
		{
			nodeMap[nodeCols[i][j]].x = i
			nodeMap[nodeCols[i][j]].y = j
		}
	}
}

function _nodeAdjustArgs(node)
{
	node = _nodeResolve(node)
	var argCount = nodeGetArgCount(node)
	if (argCount > 64)
		argCount = 64
	while (node.args.length < argCount)
		node.args.push(nodeArgConstruct(node, node.args.length, null))
}

function nodeArgConstruct(node, argNum, srcData)
{
	const arg =
	{
		node: null,
		swizzle: srcData ? srcData.swizzle : "",
		ed:      srcData ? srcData.ed      : nodeArgGetFlags(node, argNum) & ARG_NONUMEDIT ? "defval" : "numauto",
		value:   srcData ? srcData.value.slice(0) : constructArgValue(nodeTypes[node.type].getArgDefVal(node, argNum)),
		hsva:    srcData ? srcData.hsva.slice(0) : [0,0,0,1],
		varName: srcData ? srcData.varName : null,
	}
	return arg
}

function nodeConstruct(type, /*opt*/ srcData)
{
	if (!(type in nodeTypes))
		throw `Node type '${type}' is not a node`
	var nt = nodeTypes[type]
	var node =
	{
		id: ++window.nodeIDGen,
		type: type,
		x: null,
		y: null,
		showPreview: srcData ? srcData.showPreview : false,
		rsrc: srcData ? srcData.rsrc : (nt.defRsrc || null),
		args: [],
		outNodes: {},
		toBeRemoved: false,
	}
	if (srcData)
	{
		const argCount = nodeGetArgCount(node)
		for (var i = 0; i < argCount; ++i)
		{
			node.args.push(nodeArgConstruct(node, i, srcData ? srcData.args[i] : null))
		}
	}
	nodeMap[node.id] = node
	return node
}

function nodeRemoveFromCols(node)
{
	var nodeCols = funcGetCurNodeCols()
	node = _nodeResolve(node)
	if (node.x !== null)
	{
		var col = nodeCols[node.x]
		col.splice(node.y, 1)
		for (var i = node.y; i < col.length; ++i)
			nodeMap[col[i]].y = i
		_nodesCheckColEmpty(node.x)
		node.x = null
		node.y = null
		node.func = null
	}
}

function nodeDelete(node)
{
	node = _nodeResolve(node)
	for (var k in node.outNodes)
	{
		var on = nodeMap[k]
		for (var i = 0; i < on.args.length; ++i)
		{
			if (on.args[i].node === node.id)
			{
				on.args[i].node = null
			}
		}
	}
	for (var i = 0; i < node.args.length; ++i)
	{
		if (node.args[i].node !== null)
			nodeArgSetLink(node, i, null)
	}
	nodeRemoveFromCols(node)
	delete nodeMap[node.id]
	storeUpdateCurFuncNodes()
}

function nodeArgGetLink(node, argNum)
{
	node = _nodeResolve(node)
	_nodeAdjustArgs(node)
	const arg = node.args[argNum]
	return arg.node
}

function _nodeArgUnlink(node, argNum)
{
	node = _nodeResolve(node)
	_nodeAdjustArgs(node)
	const arg = node.args[argNum]
	if (arg.node !== null)
	{
		const prevNode = nodeMap[arg.node]
		arg.node = null
		var hasAny = false
		for (var i = 0; i < node.args.length; ++i)
		{
			if (node.args[i].node === prevNode.id)
			{
				hasAny = true
				break
			}
		}
		if (!hasAny)
		{
			delete prevNode.outNodes[node.id]
		}
	}
}

function nodeArgSetLink(node, argNum, tgtNode)
{
	node = _nodeResolve(node)
	_nodeAdjustArgs(node)
	const arg = node.args[argNum]
	if (tgtNode)
	{
		tgtNode = _nodeResolve(tgtNode)
		if (arg.node === tgtNode.id)
			return
		_nodeArgUnlink(node, argNum)
		tgtNode.outNodes[node.id] = true
		arg.node = tgtNode.id
	}
	else
	{
		_nodeArgUnlink(node, argNum)
	}
	storeUpdateCurFuncNodes()
}

function nodeArgSetValue(node, argNum, value)
{
	node = _nodeResolve(node)
	_nodeAdjustArgs(node)
	const arg = node.args[argNum]
	if (arg.ed != "num1" && arg.ed != "num2" && arg.ed != "num3" && arg.ed != "num4" && arg.ed != "numauto")
		nodeArgSetEditor(node, argNum, "numauto")
	for (var i = 0; i < 4; ++i)
		arg.value[i] = i < value.length ? value[i] : (i == 3 ? 1 : 0)
}

function nodeSetArgVariable(node, argNum, varName)
{
	node = _nodeResolve(node)
	_nodeAdjustArgs(node)
	const arg = node.args[argNum]
	if (arg.ed != "var")
		nodeArgSetEditor(node, argNum, "var")
	arg.varName = varName
}

function nodeSetArgSwizzle(node, argNum, swizzle)
{
	node = _nodeResolve(node)
	_nodeAdjustArgs(node)
	const arg = node.args[argNum]
	arg.swizzle = swizzle
}

function nodeColsInsertCol(x, /*opt*/ nodes)
{
	var nodeCols = funcGetCurNodeCols()
	x = Math.max(0, Math.min(nodeCols.length, x))
	for (var i = x; i < nodeCols.length; ++i)
		for (var j = 0; j < nodeCols[i].length; ++j)
			nodeMap[nodeCols[i][j]].x++
	nodes = nodes || []
	for (var j = 0; j < nodes.length; ++j)
	{
		nodes[j] = _nodeResolve(nodes[j])
		if (nodes[j].x !== null)
			throw `Node ${nodes[j].id} already inserted, remove it first`
		nodes[j].x = x
		nodes[j].y = j
		nodes[j].func = funcGetCurName()
		nodes[j] = nodes[j].id
	}
	nodeCols.splice(x, 0, nodes)
	storeUpdateCurFuncNodes()
}

function nodeInsertIntoCols(node, x, y)
{
	var nodeCols = funcGetCurNodeCols()
	node = _nodeResolve(node)
	if (node.x !== null)
		throw `Node ${node.id} already inserted, remove it first`
	x = Math.max(0, Math.min(nodeCols.length - 1, x))
	var col = nodeCols[x]
	y = Math.max(0, Math.min(col.length, y))
	for (var i = y; i < col.length; ++i)
		nodeMap[col[i]].y++
	col.splice(y, 0, node.id)
	node.x = x
	node.y = y
	node.func = funcGetCurName()
	storeUpdateCurFuncNodes()
}

function nodeInsertAtCol(node, x)
{
	var nodeCols = funcGetCurNodeCols()
	node = _nodeResolve(node)
	if (x > nodeCols.length)
		x = nodeCols.length
	if (x == nodeCols.length)
		nodeColsInsertCol(x, [node])
	else
		nodeInsertIntoCols(node, x, nodeCols[x].length)
}

function nodeInsertBehind(node, behind)
{
	var nodeCols = funcGetCurNodeCols()
	node = _nodeResolve(node)
	behind = _nodeResolve(behind)
	if (behind.x === null)
		throw `Node ${behind.id} not inserted, cannot know where 'behind' is`
	nodeInsertAtCol(node, behind.x + 1)
}

function nodeReadsFrom(node, fromNode)
{
	node = _nodeResolve(node)
	fromNode = _nodeResolve(fromNode).id
	if (node.id == fromNode)
		return true
	const argNum = nodeGetArgCount(node)
	for (var i = 0; i < argNum; ++i)
	{
		if (node.args[i].node && nodeReadsFrom(node.args[i].node, fromNode))
			return true
	}
	return false
}

function nodeArgGetSrcDims(node, argNum, tgtDims)
{
	node = _nodeResolve(node)
	_nodeAdjustArgs(node)
	const arg = node.args[argNum]
	if (arg.node)
	{
		var argNode = nodeMap[arg.node]
		return nodeTypes[argNode.type].getRVDims(argNode)
	}
	if (arg.ed == "var" && arg.varName)
	{
		return funcArgGetDefDimsByName(node.func, arg.varName) || nodeResources.variable[arg.varName].dims
	}
	var argDims = nodeArgGetDefDims(node, argNum)
	if (argDims === "adapt")
	{
		if (arg.ed == "num1") return 1
		if (arg.ed == "num2") return 2
		if (arg.ed == "num3") return 3
		if (arg.ed == "num4") return 4
		if (arg.ed == "colrgb" || arg.ed == "colhsv" || arg.ed == "collum") return 3
		if (arg.ed == "colrgba" || arg.ed == "colhsva" || arg.ed == "colluma") return 4
		return tgtDims || nodeCalcDimsFromArgs(node)
	}
	return argDims
}

function nodeArgGetDimsResolved(node, argNum)
{
	node = _nodeResolve(node)
	var argDims = nodeArgGetDefDims(node, argNum)
	return argDims === "adapt" ? nodeCalcDimsFromArgs(node) : argDims
}

function nodeCalcDimsFromArgs(node)
{
	var maxDims = 1
	_nodeAdjustArgs(node)
	const argNum = nodeGetArgCount(node)
	for (var i = 0; i < argNum; ++i)
	{
		var arg = node.args[i]
		var anID = arg.node
		if (anID)
		{
			var anode = nodeMap[anID]
			maxDims = Math.max(maxDims, nodeTypes[anode.type].getRVDims(anode))
		}
		else if (arg.ed == "num1")
			maxDims = Math.max(maxDims, 1)
		else if (arg.ed == "num2")
			maxDims = Math.max(maxDims, 2)
		else if (arg.ed == "num3")
			maxDims = Math.max(maxDims, 3)
		else if (arg.ed == "num4")
			maxDims = Math.max(maxDims, 4)
		else if (arg.ed == "var" && arg.varName)
			maxDims = Math.max(maxDims, funcArgGetDefDimsByName(node.func, arg.varName) || nodeResources.variable[arg.varName].dims)
	}
	return maxDims
}

function nodeArgGetInfo(node, argNum)
{
	node = _nodeResolve(node)
	const arg = node.args[argNum]
	return {
		node: arg.node,
		swizzle: arg.swizzle,
		ed: arg.ed,
		varName: arg.varName,
		value: arg.value.slice(0),
		hsva: arg.hsva.slice(0),
	}
}

function nodeArgSetInfo(node, argNum, info)
{
	node = _nodeResolve(node)
	_nodeAdjustArgs(node)
	const arg = node.args[argNum]
	if (typeof info.node !== "undefined")
		nodeArgSetLink(node, argNum, info.node)
	if (typeof info.swizzle !== "undefined")
		arg.swizzle = info.swizzle
	if (typeof info.ed !== "undefined")
		arg.ed = info.ed
	if (typeof info.varName !== "undefined")
		arg.varName = info.varName
	if (typeof info.value !== "undefined")
		arg.value = info.value.slice(0)
	if (typeof info.hsva !== "undefined")
		arg.hsva = info.hsva.slice(0)
}

function nodeGetLinkedInputCount(node)
{
	node = _nodeResolve(node)
	var count = 0
	for (var oid in node.outNodes)
	{
		const on = nodeMap[oid]
		const argCount = nodeGetArgCount(on)
		for (var i = 0; i < argCount; ++i)
			if (nodeArgGetLink(on, i) === node.id)
				count++
	}
	return count
}

function _nodeGetExpr(node, depth)
{
	node = _nodeResolve(node)
	//console.log(depth)
	if (depth > 3 || nodeGetLinkedInputCount(node) >= 2)
		return "#" + node.id
	return nodeTypes[node.type].getExpr(node, depth)
}

function _valGetExpr(val, dims, ed)
{
	//console.log(ed)
	if (dims == 1 || ed == "num1")
		return numToFloatStr(val[0], false)
	return type2glsl[dims] + "(" + val.slice(0, dims).map((n) => numToFloatStr(n, false)).join(",") + ")"
}

function nodeGetArgExpr(node, argNum, level)
{
	node = _nodeResolve(node)
	var arg = node.args[argNum]
	if (arg.node)
		return _nodeGetExpr(arg.node, level) + (arg.swizzle ? "." + arg.swizzle : "")
	if (arg.ed == "var")
		return arg.varName + (arg.swizzle ? "." + arg.swizzle : "")
	return _valGetExpr(arg.value, nodeArgGetDimsResolved(node, argNum), nodeArgGetEditor(node, argNum))
}


