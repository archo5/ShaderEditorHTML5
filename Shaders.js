


function shGenVal(dims, value)
{
	return type2glsl[dims] + "(" + (value ? value : defArg).slice(0, dims).join(",") + ")"
}

function _shAdjustDims(code, srcDims, tgtDims, swizzle)
{
	if (tgtDims > srcDims)
	{
		if (srcDims == 1)
		{
			var out = type2glsl[tgtDims] + "("
			for (var i = 0; i < tgtDims; ++i)
			{
				if (i)
					out += ","
				out += code
			}
			code = out + ")"
		}
		else
		{
			code = type2glsl[tgtDims] + "(" + code
			while (srcDims < tgtDims)
				code += "," + defArg[srcDims++]
			code += ")"
			if (swizzle)
				code += "." + swizzle.substring(0, tgtDims)
		}
	}
	else if (tgtDims < srcDims)
	{
		code = "(" + code + ")." + (swizzle || "xyzw").substring(0, tgtDims)
	}
	else
	{
		if (swizzle)
			code += "." + swizzle.substring(0, tgtDims)
	}
	return code
}

function _shGenArg(node, argNum)
{
	const arg = node.args[argNum]
	const tgtArgDims = nodeArgGetDimsResolved(node, argNum)
	if (arg.node)
	{
		var argNode = nodeMap[arg.node]
		var ant = nodeTypes[argNode.type]
		var srcArgDims = ant.getRVDims(argNode)

		var outCode = ant.genInline ? ant.getCode(argNode) : `t_${arg.node}`
		outCode = _shAdjustDims(outCode, srcArgDims, tgtArgDims, arg.swizzle)
		return outCode
	}
	else if (arg.ed == "var")
	{
		var funcArgDims = funcArgGetDefDimsByName(node.func, arg.varName)
		var outCode = (funcArgDims && arg.varName + "_a") || arg.varName || "0.0"
		var srcArgDims = arg.varName ? funcArgDims || nodeResources.variable[arg.varName].dims : 1
		outCode = _shAdjustDims(outCode, srcArgDims, tgtArgDims, arg.swizzle)
		return outCode
	}
	else
	{
		if (arg.ed == "num1" || tgtArgDims == 1)
		{
			var out = type2glsl[tgtArgDims] + "("
			for (var i = 0; i < tgtArgDims; ++i)
			{
				if (i)
					out += ","
				out += arg.value[0]
			}
			return out + ")"
		}
		return shGenVal(tgtArgDims, arg.value)
	}
}

function NodeShaderGen(startingFunc)
{
	this.funcs = {}
	this.variable = {}
	this.uniform = {}
	this.sampler2D = {}
	this.samplerCube = {}
	this.funcsToProcess = [startingFunc]
	this.startingFunc = startingFunc
}

NodeShaderGen.prototype.gatherNodes = function(firstNode)
{
	const fnData = funcGetData(firstNode.func)
	var funcNodes = [firstNode]
	this.funcs[firstNode.func] = { nodes: funcNodes }
	for (var i = 0; i < funcNodes.length; ++i)
	{
		const node = funcNodes[i]
		const argCount = nodeGetArgCount(node)
		for (var argNum = argCount; argNum > 0; )
		{
			--argNum
			var arg = node.args[argNum]
			var anID = arg.node
			if (anID)
				funcNodes.push(nodeMap[anID])
			else if (arg.ed == "var" && arg.varName && !funcArgGetDefDimsByName(firstNode.func, arg.varName))
			{
				this.variable[arg.varName] = true
			}
		}

		if (node.type == "tex2D" && node.rsrc !== null)
			this.sampler2D[node.rsrc] = true
		if (node.type == "func" && node.rsrc !== null)
		{
			if (node.rsrc == this.startingFunc)
				throw "recursion is not allowed"
			this.funcsToProcess.push(node.rsrc)
		}
	}
}

NodeShaderGen.prototype.gatherFuncs = function()
{
	const visited = {}
	for (var i = 1; i < this.funcsToProcess.length; ++i)
	{
		const func = this.funcsToProcess[i]
		if (visited[func])
			continue
		visited[func] = true
		var fnData = funcGetData(func)
		if (fnData)
			this.gatherNodes(nodeMap[fnData.outputNode])
		else
		{
			fnData = nodeResources.func[func]
			for (var key in fnData.variable)
				this.variable[key] = true
			for (var key in fnData.sampler2D)
				this.sampler2D[key] = true
			for (var key in fnData.samplerCube)
				this.samplerCube[key] = true
		}
	}
}

NodeShaderGen.prototype.generateGlobals = function(lines)
{
	for (var key in this.variable)
	{
		const vi = nodeResources.variable[key]
		if (vi.type == "uniform")
			this.uniform[key] = true
		lines.push(`${vi.type} ${type2glsl[vi.dims]} ${key};`)
	}
	for (var key in this.sampler2D)
		lines.push(`uniform sampler2D ${key};`)
	for (var key in this.samplerCube)
		lines.push(`uniform samplerCube ${key};`)
}

NodeShaderGen.prototype.generateFunction = function(lines, name, nodes, retDims, args)
{
	const argsStr = args.map((x) => `${type2glsl[x.dims]} ${x.name}_a`).join(", ")
	lines.push(`${type2glsl[retDims]} ${name}_f(${argsStr}) {`)

	const visited = {}
	for (var i = nodes.length; i > 0; )
	{
		--i
		const node = nodes[i]

		if (visited[node.id])
			continue
		visited[node.id] = true

		const nt = nodeTypes[node.type]

		if (!nt.genInline)
		{
			const dims = nt.getRVDims(node)
			const ty = type2glsl[dims]
			const src = nt.getCode(node)
			lines.push(`${ty} t_${node.id} = ${src};`)
		}

		if (i == 0)
		{
			const srcDims = nt.getRVDims(node)
			var retCode = nt.genInline ? nt.getCode(node) : `t_${node.id}`
			retCode = _shAdjustDims(retCode, srcDims, retDims, null)
			lines.push(`return ${retCode};`)
		}
	}

	lines.push("}")
}

NodeShaderGen.prototype.generateBuiltinFunction = function(lines, name)
{
	const fnData = nodeResources.func[name]
	const argsStr = fnData.args.map((x) => `${type2glsl[x.dims]} ${x.name}`).join(", ")
	lines.push(`${type2glsl[fnData.retDims]} ${name}_f(${argsStr}) {`)
	lines.push(fnData.code)
	lines.push("}")
}

NodeShaderGen.prototype.generateAllFunctions = function(lines)
{
	const visited = {}
	for (var i = this.funcsToProcess.length; i > 0; )
	{
		i--
		const func = this.funcsToProcess[i]
		if (visited[func])
			continue
		visited[func] = true
		const fnData = funcGetData(func)
		if (fnData)
		{
			this.generateFunction(
				lines,
				func,
				this.funcs[func].nodes,
				fnData.retDims,
				fnData.args)
		}
		else
		{
			this.generateBuiltinFunction(lines, func)
		}
		if (i == 0)
		{
			var argsStr = fnData.args.map((x) => shGenVal(x.dims)).join(", ")
			var funcCall = `${this.startingFunc}_f(${argsStr})`
			funcCall = _shAdjustDims(funcCall, fnData.retDims, 4, null)
			lines.push(`void main() { gl_FragColor = ${funcCall}; }`)
		}
	}
}

function getVertexShader()
{
	return `
uniform mat4 uViewProjMatrix;
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec4 aTangent;
attribute vec2 aTexCoord0;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec4 vWorldTangent;
varying vec2 vTexCoord0;
void main()
{
	gl_Position = vec4(aPosition, 1.0) * uViewProjMatrix;
	vWorldPos = aPosition;
	vWorldNormal = aNormal;
	vWorldTangent = aTangent;
	vTexCoord0 = aTexCoord0;
}
	`
}

function nodesGenerateShader(outNode)
{
	try
	{
		if (!outNode)
			throw "No output node"

		lines =
		[
			"#extension GL_OES_standard_derivatives : enable",
			"#extension GL_EXT_shader_texture_lod : enable",
			"precision highp float;",
		]

		var shaderGen = new NodeShaderGen(outNode.func)
		shaderGen.gatherNodes(outNode)
		shaderGen.gatherFuncs()
		shaderGen.generateGlobals(lines)
		shaderGen.generateAllFunctions(lines)

		//console.log(lines.join("\n"))
		return {
			vshader: getVertexShader(),
			fshader: lines.join("\n"),
			uniform: Object.assign(shaderGen.uniform, { uViewProjMatrix: true }),
			sampler2D: shaderGen.sampler2D,
			samplerCube: shaderGen.samplerCube,
		}
	}
	catch (err)
	{
		return {
			vshader: getVertexShader(),
			fshader: "precision highp float; void main() { gl_FragColor = vec4(0,0,0,1); }",
			uniform: {},
			sampler2D: {},
			samplerCube: {},
			error: err,
		}
	}
}



const shader_cubeBgrVS = `
attribute vec2 aPosition;
varying vec2 vProjPos;
void main()
{
	gl_Position = vec4(aPosition, 0.0, 1.0);
	vProjPos = aPosition;
}`

const shader_cubeBgrFS = `
precision highp float;
varying vec2 vProjPos;
uniform mat4 uInvViewMatrix;
uniform mat4 uProjMatrix;
uniform samplerCube sCubemap;
void main()
{
	vec4 wp = (vProjPos.xyxy * vec4(1.0 / uProjMatrix[0][0], 1.0 / uProjMatrix[1][1], 0.0, 0.0) + vec4(0.0, 0.0, 1.0, 0.0)) * uInvViewMatrix;
	vec4 cmSample = textureCube(sCubemap, wp.xyz);
	vec3 outColor = cmSample.rgb;
	gl_FragColor = vec4(outColor, 1.0);
}
`

const shader_objTestVS = `
uniform mat4 uViewProjMatrix;
attribute vec3 aPosition;
attribute vec3 aNormal;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
void main()
{
	gl_Position = vec4(aPosition, 1.0) * uViewProjMatrix;
	vWorldPos = aPosition;
	vWorldNormal = aNormal;
}`

const shader_objTestFS = `
precision highp float;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
uniform vec3 uCameraPos;
uniform samplerCube sCubemap;
void main()
{
	gl_FragColor = textureCube(sCubemap, reflect(vWorldPos - uCameraPos, vWorldNormal));
}
`


