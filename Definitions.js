


noise.seed(1)



function texGenChecker(w, h, div)
{
	const data = new Uint32Array(w * h)
	const wd = w / div
	const hd = h / div
	for (var y = 0; y < h; ++y)
	{
		for (var x = 0; x < w; ++x)
		{
			data[x + w * y] = (Math.floor(x / wd) + Math.floor(y / hd)) % 2 ? 0xff000000 : 0xffffffff
		}
	}
	return { width: w, height: h, data: data }
}

function texGenPerlinNoiseGray(w, h, div)
{
	const data = new Uint32Array(w * h)
	for (var y = 0; y < h; ++y)
	{
		for (var x = 0; x < w; ++x)
		{
			var v = Math.floor((noise.perlin2(x / div, y / div) * 0.5 + 0.5) * 255) | 0
			data[x + w * y] = 0xff000000 | (v << 16) | (v << 8) | v
		}
	}
	return { width: w, height: h, data: data }
}

function texGenFractalNoiseGray(w, h)
{
	const data = new Uint32Array(w * h)
	for (var y = 0; y < h; ++y)
	{
		for (var x = 0; x < w; ++x)
		{
			var acc = 0
			var num = 0
			for (var div = 1; div < w; div *= 2)
			{
				acc += noise.perlin2(x / div, y / div) * 0.5 + 0.5
				num++
			}
			acc /= num
			var v = Math.floor(acc * 255) | 0
			data[x + w * y] = 0xff000000 | (v << 16) | (v << 8) | v
		}
	}
	return { width: w, height: h, data: data }
}



var nodeResources =
{
	variable:
	{
		time: { type: "uniform", dims: 1 },
		uCameraPos: { type: "uniform", dims: 3 },
		vWorldPos: { type: "varying", dims: 3 },
		vWorldNormal: { type: "varying", dims: 3 },
		vWorldTangent: { type: "varying", dims: 4 },
		vTexCoord0: { type: "varying", dims: 2 },
	},
	sampler2D:
	{
		// generated
		checker2x2:
		{
			desc: "2x2 Checkerboard pattern (256x256 px)",
			genFunc: () => texGenChecker(256, 256, 2),
		},
		checker8x8:
		{
			desc: "8x8 Checkerboard pattern (256x256 px)",
			genFunc: () => texGenChecker(256, 256, 8),
		},
		perlinGrayscale4:
		{
			desc: "Grayscale Perlin noise [step=4] (256x256 px)",
			genFunc: () => texGenPerlinNoiseGray(256, 256, 4),
		},
		fractalGrayscale:
		{
			desc: "Grayscale fractal noise (256x256 px)",
			genFunc: () => texGenFractalNoiseGray(256, 256),
		},
		// images
		wall1BaseColor:
		{
			desc: "Wall 1 - base color (1024x1024 px)",
			genFunc: () => "rsrc/wall1BaseColor.jpg",
		},
		wall1Normal:
		{
			desc: "Wall 1 - normals (1024x1024 px)",
			genFunc: () => "rsrc/wall1Normal.jpg",
		},
		wall1Metallic:
		{
			desc: "Wall 1 - metalness (1024x1024 px)",
			genFunc: () => "rsrc/wall1Metallic.jpg",
		},
		wall1Roughness:
		{
			desc: "Wall 1 - roughness (1024x1024 px)",
			genFunc: () => "rsrc/wall1Roughness.jpg",
		},
	},
	op:
	{
		add: { args: 2, name: "Add" },
		sub: { args: 2, name: "Subtract" },
		mul: { args: 2, name: "Multiply" },
		div: { args: 2, name: "Divide" },
		mod: { args: 2, name: "Modulo" },

		eq: { args: 2, name: "Equal" },
		neq: { args: 2, name: "Not equal" },
		lt: { args: 2, name: "Less than" },
		gt: { args: 2, name: "Greater than" },
		lte: { args: 2, name: "Less than or equal" },
		gte: { args: 2, name: "Greater than or equal" },

		min: { args: 2, name: "Min" },
		max: { args: 2, name: "Max" },
		clamp: { args: 3, name: "Clamp" },
		mix: { args: 3, name: "Mix" },
		step: { args: 2, name: "Step" },
		smoothstep: { args: 3, name: "Smoothstep" },

		abs: { args: 1, name: "Absolute" },
		sign: { args: 1, name: "Sign" },
		round: { args: 1, name: "Round" },
		floor: { args: 1, name: "Floor" },
		ceil: { args: 1, name: "Ceiling" },
		fract: { args: 1, name: "Fractional part" },

		normalize: { args: 1, name: "Normalize vector" },
		length: { args: 1, name: "Length of vector" },
		distance: { args: 2, name: "Distance" },
		dot: { args: 2, name: "Dot product" },
		cross: { args: 2, name: "Cross product" },

		unpacknormal: { args: 1, name: "Unpack normal" },
		height2normal: { args: 1, name: "Height -> normal" },
		combine: { args: 4, name: "Combine" },
	},
	expr2op:
	{
		"b+":            "add",
		"b-":            "sub",
		"b*":            "mul",
		"b/":            "div",
		"mod":           "mod",

		"b==":           "eq",
		"b!=":           "neq",
		"b<":            "lt",
		"b>":            "gt",
		"b<=":           "lte",
		"b>=":           "gte",

		"min":           "min",
		"max":           "max",
		"clamp":         "clamp",
		"mix":           "mix",
		"step":          "step",
		"smoothstep":    "smoothstep",

		"abs":           "abs",
		"sign":          "sign",
		"round":         "round",
		"floor":         "floor",
		"ceil":          "ceil",
		"fract":         "fract",

		"normalize":     "normalize",
		"length":        "length",
		"distance":      "distance",
		"dot":           "dot",
		"cross":         "cross",

		"unpacknormal":  "unpacknormal",
		"height2normal": "height2normal",
		"combine":       "combine",
	},
	func:
	{
		PBR_Metallic:
		{
			name: "PBR (Metallic)",
			retDims: 4,
			variable: { uCameraPos: true, vWorldPos: true, vWorldNormal: true, vWorldTangent: true },
			samplerCube: { sCubemap: true },
			args:
			[
				{ dims: 3, name: "BaseColor", defval: [0.25, 0.5, 0.9] },
				{ dims: 3, name: "Normal", flags: ARG_NONUMEDIT, defval: [0, 0, 1] },
				{ dims: 1, name: "Metallic", defval: [1] },
				{ dims: 1, name: "Roughness", defval: [0.3] },
				{ dims: 1, name: "Opacity", defval: [1] },
			],
			code: `
				BaseColor = pow(BaseColor, vec3(2.2));
				vec3 T = normalize(vWorldTangent.xyz);
				vec3 N = normalize(vWorldNormal);
				vec3 V = normalize(vWorldPos - uCameraPos);
				vec3 diffuseColor = mix(BaseColor, vec3(0), Metallic);
				vec3 F0 = mix(vec3(0.05), BaseColor, Metallic);

				mat3 TBN = mat3(T, cross(T, N) * vWorldTangent.w, N);
				N = TBN * Normal;

				vec4 cmDiffSample = textureCubeLodEXT(sCubemap, N, 20.0);
				vec4 cmSpecSample = textureCubeLodEXT(sCubemap, reflect(V, N), sqrt(Roughness) * 9.0);
				vec3 diffuseLighting = pow(cmDiffSample.rgb, vec3(2.2));
				vec3 specularLighting = pow(cmSpecSample.rgb, vec3(2.2));

				vec3 fSpec = F0 + (vec3(1.0) - F0) * pow(1.0 - abs(dot(V, N)), 5.0);
				fSpec = mix(fSpec, F0, Roughness); // custom lerp trick for removing edge highlights on rough surfaces
				vec3 fDiff = (1.0 - fSpec) * (1.0 - Metallic);
				vec3 totalSpec = specularLighting * fSpec;

				//vec4 lit = vec4(diffuseColor * diffuseLighting * fDiff * Opacity + totalSpec, Opacity); -- premultiplied alpha opacity
				// refraction-based fake opacity
				diffuseLighting = mix(textureCubeLodEXT(sCubemap, refract(V, N, 1.0 / 1.05), sqrt(Roughness) * 9.0).rgb, diffuseLighting, Opacity);
				vec4 lit = vec4(diffuseColor * diffuseLighting * fDiff + totalSpec, 1);

				//lit.rgb = lit.rgb / (1.0 + lit.rgb);
				lit.rgb = pow(lit.rgb, vec3(1.0 / 2.2));
				return lit;
			`,
		},
	},
}



// I/O dimensionality of nodes:
//  to minimize code size, casts are folded into function (node) arguments and made implicit
//  there are several types of dimension configurations for shader functions
//  - fixed (data - texture/variable - reads, [cross])
//    arguments and return values have a fixed, never-changing type
//  - adaptive (most math functions)
//    return value and argument dimension count is defined by biggest argument, smaller arguments are casted before the operation
//  - complicated (matrix-related functions)
//    not used or considered so far
//  how does adaptive dimension configuration solve the embedded constant issue?
//  - let the user pick whatever is desired, with an option to match the other nodes (- max(args where explicit))
//  - if no arguments have nodes assigned or explicit dimension count picked, match makes all arguments 1-D

window.nodeIDGen = 0
var nodeTypes =
{
	output:
	{
		name: "Output",
		desc: "Return a color value from this shader",
		getArgCount: (n) => 1,
		getArgName: (n, i) => "Output",
		getArgDims: (n, i) => funcGetData(n.func).retDims,
		getArgFlags: (n, i) => 0,
		getArgDefVal: (n, i) => null,
		genInline: true,
		getRVDims: (n) => funcGetData(n.func).retDims,
		getCode: (n) => _shGenArg(n, 0),
		getExpr: () => { throw "not supposed to be called" }
	},
	func:
	{
		name: "Function",
		desc: "Call another function",
		rsrcType: "func",
		rsrcFullRefreshOnChange: true,
		getArgCount: (n) => n.rsrc !== null ? funcGetDataAll(n.rsrc).args.length : 0,
		getArgName: (n, i) => n.rsrc !== null ? funcGetDataAll(n.rsrc).args[i].name : "#" + (i + 1),
		getArgDims: (n, i) => n.rsrc !== null ? funcGetDataAll(n.rsrc).args[i].dims : 0,
		getArgFlags: (n, i) => n.rsrc !== null ? funcGetDataAll(n.rsrc).args[i].flags : 0,
		getArgDefVal: (n, i) => n.rsrc !== null ? funcGetDataAll(n.rsrc).args[i].defval : null,
		getRVDims: (n) => n.rsrc !== null ? funcGetDataAll(n.rsrc).retDims : 4,
		getCode: (n) =>
		{
			if (n.rsrc !== null)
			{
				const argCount = funcGetDataAll(n.rsrc).args.length
				const argsStrs = []
				for (var i = 0; i < argCount; ++i)
					argsStrs.push(_shGenArg(n, i))
				const argsStr = argsStrs.join(", ")
				return `${n.rsrc}_f(${argsStr})`
			}
			return shGenVal(nodeTypes[n.type].getRVDims(n))
		},
		getExpr: (n, l) =>
		{
			if (n.rsrc !== null)
			{
				const argCount = funcGetDataAll(n.rsrc).args.length
				const argsStrs = []
				for (var i = 0; i < argCount; ++i)
					argsStrs.push(nodeGetArgExpr(n, i, l+3))
				const argsStr = argsStrs.join(", ")
				return `${n.rsrc}(${argsStr})`
			}
			return shGenVal(nodeTypes[n.type].getRVDims(n))
		},
	},
	tex2D:
	{
		name: "Texture (2D)",
		desc: "Sample a 2D texture",
		rsrcType: "sampler2D",
		getArgCount: (n) => 1,
		getArgName: (n, i) => "UV",
		getArgDims: (n, i) => 2,
		getArgFlags: (n, i) => 0,
		getArgDefVal: (n, i) => null,
		getRVDims: (n) => 4,
		getCode: (n) => n.rsrc !== null ? `texture2D(${n.rsrc}, ${_shGenArg(n, 0)})` : `vec4(0,0,0,1)`,
		getExpr: (n, l) => `texture(${n.rsrc}, ${nodeGetArgExpr(n, 0, l+3)})`
	},
	math:
	{
		name: "Math",//(node) => node ? nodeResources.op[node.rsrc].name : "Math",
		desc: "Perform a math operation",
		rsrcType: "op",
		rsrcFullRefreshOnChange: true,
		defRsrc: "add",
		getArgCount: (n) => nodeResources.op[n.rsrc].args,
		getArgName: (n, i) =>
		{
			if (n.rsrc == "combine")
				return "XYZW"[i]
			return "#" + (i + 1)
		},
		getArgDims: (n, i) =>
		{
			if (n.rsrc == "cross" || n.rsrc == "unpacknormal")
				return 3
			if (n.rsrc == "height2normal" || n.rsrc == "combine")
				return 1
			return "adapt"
		},
		getArgFlags: (n, i) => 0,
		getArgDefVal: (n, i) => null,
		getRVDims: function(n)
		{
			if (n.rsrc == "length" ||
				n.rsrc == "distance" ||
				n.rsrc == "dot")
				return 1
			if (n.rsrc == "cross" ||
				n.rsrc == "unpacknormal" ||
				n.rsrc == "height2normal")
				return 3
			if (n.rsrc == "combine")
				return 4
			return nodeCalcDimsFromArgs(n)
		},
		getCode: function(n)
		{
			const args = []
			const argNum = nodeGetArgCount(n)
			for (var i = 0; i < argNum; ++i)
				args.push(`(${_shGenArg(n, i)})`)
			var a = args[0]
			var b = args[1]
			var c = args[2]
			var d = args[3]
			function glslOpOrFunc(op, fn)
			{
				const dims = nodeCalcDimsFromArgs(n)
				if (dims == 1)
					return `${a} ${op} ${b}`
				return `${type2glsl[dims]}(${fn}(${a}, ${b}))`
			}
			switch (n.rsrc)
			{
			case "add": return a + " + " + b
			case "sub": return a + " - " + b
			case "mul": return a + " * " + b
			case "div": return a + " / " + b
			case "mod": return `mod(${a}, ${b})`

			case "eq": return glslOpOrFunc("==", "equal")
			case "neq": return glslOpOrFunc("!=", "notEqual")
			case "lt": return glslOpOrFunc("<", "lessThan")
			case "gt": return glslOpOrFunc(">", "greaterThan")
			case "lte": return glslOpOrFunc("<=", "lessThanEqual")
			case "gte": return glslOpOrFunc(">=", "greaterThanEqual")

			case "min": return `min(${a}, ${b})`
			case "max": return `max(${a}, ${b})`
			case "clamp": return `clamp(${a}, ${b}, ${c})`
			case "mix": return `mix(${a}, ${b}, ${c})`
			case "step": return `step(${a}, ${b})`
			case "smoothstep": return `smoothstep(${a}, ${b}, ${c})`

			case "abs": return `abs(${a})`
			case "sign": return `sign(${a})`
			case "round": return `floor((${a})+0.5)`
			case "floor": return `floor(${a})`
			case "ceil": return `ceil(${a})`
			case "fract": return `fract(${a})`

			case "normalize": return `normalize(${a})`
			case "length": return `length(${a})`
			case "distance": return `distance(${a}, ${b})`
			case "dot": return `dot(${a}, ${b})`
			case "cross": return `cross(${a}, ${b})`

			case "unpacknormal": return `(${a}*2.0-1.0)`
			case "height2normal": return `normalize(vec3(dFdx(${a}), dFdy(${a}), 1))`
			case "combine": return `vec4(${a}, ${b}, ${c}, ${d})`

			default: throw `unknown op: ${n.rsrc}`
			}
		},
		getExpr: function(n, l)
		{
			const args = []
			const argNum = nodeGetArgCount(n)
			for (var i = 0; i < argNum; ++i)
				args.push(`(${nodeGetArgExpr(n, i, l+1)})`)
			var a = args[0]
			var b = args[1]
			var c = args[2]
			var d = args[3]
			switch (n.rsrc)
			{
			case "add": return a + " + " + b
			case "sub": return a + " - " + b
			case "mul": return a + " * " + b
			case "div": return a + " / " + b
			case "mod": return `mod(${a}, ${b})`

			case "eq":  return a + " == " + b
			case "neq": return a + " != " + b
			case "lt":  return a + " < "  + b
			case "gt":  return a + " > "  + b
			case "lte": return a + " <= " + b
			case "gte": return a + " >= " + b

			case "min": return `min(${a}, ${b})`
			case "max": return `max(${a}, ${b})`
			case "clamp": return `clamp(${a}, ${b}, ${c})`
			case "mix": return `mix(${a}, ${b}, ${c})`
			case "step": return `step(${a}, ${b})`
			case "smoothstep": return `smoothstep(${a}, ${b}, ${c})`

			case "abs": return `abs(${a})`
			case "sign": return `sign(${a})`
			case "round": return `round(${a})`
			case "floor": return `floor(${a})`
			case "ceil": return `ceil(${a})`
			case "fract": return `fract(${a})`

			case "normalize": return `normalize(${a})`
			case "length": return `length(${a})`
			case "distance": return `distance(${a}, ${b})`
			case "dot": return `dot(${a}, ${b})`
			case "cross": return `cross(${a}, ${b})`

			case "unpacknormal": return `unpacknormal(${a})`
			case "height2normal": return `height2normal(${a})`
			case "combine": return `combine(${a}, ${b}, ${c}, ${d})`

			default: throw `unknown op: ${n.rsrc}`
			}
		},
	},
}


