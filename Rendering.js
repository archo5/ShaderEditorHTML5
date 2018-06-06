


const textureCache = {}
function TextureCache_get(name)
{
	var tex = textureCache[name]
	if (tex)
		return tex

	const info = nodeResources.sampler2D[name]
	const data = info.genFunc()

	const gl = window.GLCtx
	tex = gl.createTexture()
	gl.bindTexture(gl.TEXTURE_2D, tex)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)

	if (typeof data === "string")
	{
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([100, 100, 100, 255]))
		const image = new Image()
		image.onload = function()
		{
			gl.bindTexture(gl.TEXTURE_2D, tex)
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
			gl.generateMipmap(gl.TEXTURE_2D)
		}
		image.src = data
	}
	else
	{
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, data.width, data.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(data.data.buffer))
		gl.generateMipmap(gl.TEXTURE_2D)
	}

	textureCache[name] = tex
	return tex
}

function TextureCache_getCubemapInternal(url)
{
	var tex = textureCache[url]
	if (tex)
		return tex
	tex = loadCubemap(url)
	textureCache[url] = tex
	return tex
}

function loadShader(type, source)
{
	const gl = window.GLCtx
	const shader = gl.createShader(type)
	gl.shaderSource(shader, source)
	gl.compileShader(shader)
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		console.log("[GL] shader compilation failed: " + gl.getShaderInfoLog(shader))
		gl.deleteShader(shader)
		return null
	}
	return shader
}

function initShaderProgram(vsSource, fsSource)
{
	const gl = window.GLCtx
	const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource)
	const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource)
	const shaderProgram = gl.createProgram()
	gl.attachShader(shaderProgram, vertexShader)
	gl.attachShader(shaderProgram, fragmentShader)
	gl.linkProgram(shaderProgram)
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{
		console.log("[GL] shader program linkage failed: " + gl.getProgramInfoLog(shaderProgram))
		return null
	}
	return shaderProgram
}

const shaderCache = {}
function ShaderCache_getProgram(vsSource, fsSource)
{
	const key = vsSource + fsSource
	const pinfo = shaderCache[key]
	if (pinfo)
	{
		pinfo.time = Date.now()
		return pinfo.program
	}

	const p = initShaderProgram(vsSource, fsSource)
	shaderCache[key] = { time: Date.now(), program: p }
	return p
}

function ShaderCache_GC(expirationTimeSec)
{
	const toClean = {}
	const now = Date.now()
	for (var key in shaderCache)
	{
		var pinfo = shaderCache[key]
		if (now - pinfo.time > expirationTimeSec * 1000)
			toClean[key] = true
	}
	var num = 0
	for (var key in toClean)
	{
		num++
		delete shaderCache[key]
	}
	if (num)
		console.log(`[ShaderCache GC] dropped ${num} items`)
}

function initGL()
{
	window.PreviewStartTime = Date.now()
	const gl = window.GLCtx

	gl.getExtension("OES_standard_derivatives")
	gl.getExtension("EXT_shader_texture_lod")

	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);
	gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE)

	window.GLQuadMesh = createQuadMesh()
	window.GLSphereMesh = createSphereMesh()
}

window.GLCameraDist = 3
window.GLCameraYaw = 160
window.GLCameraPitch = 75
window.GLCameraPos = [-2.5, 1.5, 0]
window.GLCameraTarget = [0, 0, 0]

function shaderProgramLinkInputs(p, info, asp)
{
	const gl = window.GLCtx
	gl.useProgram(p)

	if (info.uniform.time)
	{
		const time = (Date.now() - window.PreviewStartTime) / 1000
		gl.uniform1f(gl.getUniformLocation(p, "time"), time)
	}
	if (info.uniform.uCameraPos)
	{
		gl.uniform3fv(gl.getUniformLocation(p, "uCameraPos"), GLCameraPos)
	}
	if (info.uniform.uViewProjMatrix)
	{
		const vm = lookAtMatrix(GLCameraPos, GLCameraTarget, [0, 0, 1])
		const pm = perspectiveMatrix(60, asp, 0.001, 1000)
		const vpm = multiplyMatrices(pm, vm)
		gl.uniformMatrix4fv(gl.getUniformLocation(p, "uViewProjMatrix"), false, vpm)
	}
	if (info.uniform.uInvViewMatrix)
	{
		const vm = lookAtMatrix(GLCameraPos, GLCameraTarget, [0, 0, 1])
		const ivm = invertMatrix(vm)
		gl.uniformMatrix4fv(gl.getUniformLocation(p, "uInvViewMatrix"), false, ivm)
	}
	if (info.uniform.uProjMatrix)
	{
		const pm = perspectiveMatrix(60, asp, 0.001, 1000)
		gl.uniformMatrix4fv(gl.getUniformLocation(p, "uProjMatrix"), false, pm)
	}

	var sid = 0
	for (var key in info.sampler2D)
	{
		gl.uniform1i(gl.getUniformLocation(p, key), sid)
		var tex = TextureCache_get(key)
		gl.activeTexture(gl.TEXTURE0 + sid)
		gl.bindTexture(gl.TEXTURE_2D, tex)
		sid++
	}

	for (var key in info.samplerCube)
	{
		var tex
		if (key == "sCubemap")
			tex = TextureCache_getCubemapInternal("cubemaps/cubemap")
		gl.uniform1i(gl.getUniformLocation(p, key), sid)
		gl.activeTexture(gl.TEXTURE0 + sid)
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex)
		sid++
	}
}

function drawOnePreview(nodeID, aspect, drawBgr)
{
	const gl = window.GLCtx

	if (drawBgr)
	{
		var shBgr =
		{
			vshader: shader_cubeBgrVS,
			fshader: shader_cubeBgrFS,
			uniform: { uInvViewMatrix: true, uProjMatrix: true },
			samplerCube: { sCubemap: true }
		}
		const progBgr = ShaderCache_getProgram(shBgr.vshader, shBgr.fshader)
		shaderProgramLinkInputs(progBgr, shBgr, aspect)
		drawTriangleMesh(GLQuadMesh, progBgr)
	}

	gl.enable(gl.BLEND)
	const genSh = nodesGenerateShader(nodeMap[nodeID])
	const prog = ShaderCache_getProgram(genSh.vshader, genSh.fshader)
	shaderProgramLinkInputs(prog, genSh, aspect)
	drawTriangleMesh(GLSphereMesh, prog)
	gl.disable(gl.BLEND)
}

function redrawPreviews()
{
	const nodePreviewCanvas = document.getElementsByClassName("nodePreviewCanvas")
	var minw = 0, minh = 0
	for (var i = 0; i < nodePreviewCanvas.length; ++i)
	{
		// all preview canvas are assumed to be equal in size
		const pnc = nodePreviewCanvas[i]
		minw = pnc.offsetWidth
		minh = pnc.offsetHeight
		break
	}

	const canvas = document.getElementById("mainPreview")
	const parent = canvas.parentElement
	var tw = parent.offsetWidth
	var th = parent.offsetHeight
	if (tw < minw)
		tw = minw
	if (th < minh)
		th = minh

	if (canvas.width != tw)
		canvas.width = tw
	if (canvas.height != th)
		canvas.height = th

	var gl = window.GLCtx
	if (typeof gl === "undefined")
	{
		gl = canvas.getContext("webgl")
		if (!gl)
			gl = false
		window.GLCtx = gl
		if (gl)
			initGL()
	}

	requestAnimationFrame(redrawPreviews)

	if (!gl)
	{
		var ctx = canvas.getContext("2d")

		ctx.fillStyle = "#EEE"
		ctx.font = "32px sans-serif"
		ctx.fillText("WebGL is unavailable", 32, 64)
		ctx.fillText("Please restart your browser or try another one", 32, 96+16)
		return
	}

	var yaw = GLCameraYaw * Math.PI / 180
	var pitch = GLCameraPitch * Math.PI / 180
	var dist = GLCameraDist
	window.GLCameraPos = [Math.cos(yaw) * Math.sin(pitch) * dist, Math.sin(yaw) * Math.sin(pitch) * dist, Math.cos(pitch) * dist]

	gl.clearColor(0, 0, 0, 0)
	if (minw && minh)
	{
		// calculate batch size
		const numX = Math.floor(tw / minw)
		const numY = Math.floor(th / minh)
		const numBatch = numX * numY

		for (var batchOff = 0; batchOff < nodePreviewCanvas.length; batchOff += numBatch)
		{
			gl.clear(gl.COLOR_BUFFER_BIT)
			for (var i = batchOff; i < Math.min(nodePreviewCanvas.length, batchOff + numBatch); ++i)
			{
				const pnc = nodePreviewCanvas[i]
				const w = pnc.offsetWidth
				const h = pnc.offsetHeight
				const inBatch = i - batchOff
				const bx = inBatch % numX
				const by = Math.floor(inBatch / numX)

				var id
				for (var el = pnc; el; el = el.parentElement)
				{
					id = el.dataset.id
					if (id)
						break
				}

				gl.viewport(bx * w, canvas.height - h * (1 + by), w, h)
				drawOnePreview(id, w / h, false)
			}

			for (var i = batchOff; i < Math.min(nodePreviewCanvas.length, batchOff + numBatch); ++i)
			{
				const pnc = nodePreviewCanvas[i]
				const w = pnc.offsetWidth
				const h = pnc.offsetHeight
				const inBatch = i - batchOff
				const bx = inBatch % numX
				const by = Math.floor(inBatch / numX)

				const tctx = pnc.getContext("2d")
				tctx.clearRect(0, 0, w, h)
				tctx.drawImage(canvas, bx * w, by * h, w, h, 0, 0, w, h)
			}
		}
	}

	gl.clear(gl.COLOR_BUFFER_BIT)
	gl.viewport(0, 0, canvas.width, canvas.height)

	drawOnePreview(funcGetCurData().outputNode, canvas.width / canvas.height, true)
}


