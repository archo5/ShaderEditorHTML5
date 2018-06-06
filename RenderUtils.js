


function v3dot(a, b)
{
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}
function v3cross(a, b)
{
	return [
		a[1] * b[2] - b[1] * a[2],
		a[2] * b[0] - b[2] * a[0],
		a[0] * b[1] - b[0] * a[1],
	]
}
function v3scale(v, s)
{
	return [v[0] * s, v[1] * s, v[2] * s]
}
function v3normalize(v)
{
	var len = v3dot(v, v)
	if (len == 0)
		return v
	return v3scale(v, 1.0 / Math.sqrt(len))
}
function v3sub(a, b)
{
	return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
function lookAtMatrix(eye, at, up)
{
	var zaxis = v3normalize(v3sub(at, eye))
	var xaxis = v3normalize(v3cross(up, zaxis))
	var yaxis = v3cross(zaxis, xaxis)
	return [
		xaxis[0], xaxis[1], xaxis[2], -v3dot(xaxis, eye),
		yaxis[0], yaxis[1], yaxis[2], -v3dot(yaxis, eye),
		zaxis[0], zaxis[1], zaxis[2], -v3dot(zaxis, eye),
		0, 0, 0, 1,
	]
}
function lookAtMatrixInv(eye, at, up)
{
	var zaxis = v3normalize(v3sub(at, eye))
	var xaxis = v3normalize(v3cross(up, zaxis))
	var yaxis = v3cross(zaxis, xaxis)
	return [
		xaxis[0], yaxis[0], -zaxis[0], eye[0],
		xaxis[1], yaxis[1], -zaxis[1], eye[1],
		xaxis[2], yaxis[2], -zaxis[2], eye[2],
		0, 0, 0, 1,
	]
}
function perspectiveMatrix(fovY, aspect, znear, zfar)
{
	fovY *= Math.PI / 180
	const yScale = 1.0 / Math.tan(fovY / 2)
	const xScale = yScale / aspect
	return [
		xScale, 0, 0, 0,
		0, yScale, 0, 0,
		0, 0, zfar / (zfar - znear), -znear * zfar / (zfar - znear),
		0, 0, 1, 0,
	]
}
function multiplyMatrices(a, b)
{
	const out = []
	for (var y = 0; y < 4; ++y)
	{
		for (var x = 0; x < 4; ++x)
		{
			var sum = 0
			for (var i = 0; i < 4; ++i)
			{
				sum += a[y * 4 + i] * b[i * 4 + x]
			}
			out.push(sum)
		}
	}
	return out
}
function transposeMatrix(m)
{
	const out = new Array(16)
	for (var y = 0; y < 4; ++y)
	{
		for (var x = 0; x < 4; ++x)
		{
			out[y * 4 + x] = m[x * 4 + y]
		}
	}
	return out
}
function invertMatrix(m)
{
	const inv = new Array(16)

	inv[0] = m[5]  * m[10] * m[15] - 
	         m[5]  * m[11] * m[14] - 
	         m[9]  * m[6]  * m[15] + 
	         m[9]  * m[7]  * m[14] +
	         m[13] * m[6]  * m[11] - 
	         m[13] * m[7]  * m[10]

	inv[4] = -m[4]  * m[10] * m[15] + 
	          m[4]  * m[11] * m[14] + 
	          m[8]  * m[6]  * m[15] - 
	          m[8]  * m[7]  * m[14] - 
	          m[12] * m[6]  * m[11] + 
	          m[12] * m[7]  * m[10]

	inv[8] = m[4]  * m[9] * m[15] - 
	         m[4]  * m[11] * m[13] - 
	         m[8]  * m[5] * m[15] + 
	         m[8]  * m[7] * m[13] + 
	         m[12] * m[5] * m[11] - 
	         m[12] * m[7] * m[9]

	inv[12] = -m[4]  * m[9] * m[14] + 
	           m[4]  * m[10] * m[13] +
	           m[8]  * m[5] * m[14] - 
	           m[8]  * m[6] * m[13] - 
	           m[12] * m[5] * m[10] + 
	           m[12] * m[6] * m[9]

	inv[1] = -m[1]  * m[10] * m[15] + 
	          m[1]  * m[11] * m[14] + 
	          m[9]  * m[2] * m[15] - 
	          m[9]  * m[3] * m[14] - 
	          m[13] * m[2] * m[11] + 
	          m[13] * m[3] * m[10]

	inv[5] = m[0]  * m[10] * m[15] - 
	         m[0]  * m[11] * m[14] - 
	         m[8]  * m[2] * m[15] + 
	         m[8]  * m[3] * m[14] + 
	         m[12] * m[2] * m[11] - 
	         m[12] * m[3] * m[10]

	inv[9] = -m[0]  * m[9] * m[15] + 
	          m[0]  * m[11] * m[13] + 
	          m[8]  * m[1] * m[15] - 
	          m[8]  * m[3] * m[13] - 
	          m[12] * m[1] * m[11] + 
	          m[12] * m[3] * m[9]

	inv[13] = m[0]  * m[9] * m[14] - 
	          m[0]  * m[10] * m[13] - 
	          m[8]  * m[1] * m[14] + 
	          m[8]  * m[2] * m[13] + 
	          m[12] * m[1] * m[10] - 
	          m[12] * m[2] * m[9]

	inv[2] = m[1]  * m[6] * m[15] - 
	         m[1]  * m[7] * m[14] - 
	         m[5]  * m[2] * m[15] + 
	         m[5]  * m[3] * m[14] + 
	         m[13] * m[2] * m[7] - 
	         m[13] * m[3] * m[6]

	inv[6] = -m[0]  * m[6] * m[15] + 
	          m[0]  * m[7] * m[14] + 
	          m[4]  * m[2] * m[15] - 
	          m[4]  * m[3] * m[14] - 
	          m[12] * m[2] * m[7] + 
	          m[12] * m[3] * m[6]

	inv[10] = m[0]  * m[5] * m[15] - 
	          m[0]  * m[7] * m[13] - 
	          m[4]  * m[1] * m[15] + 
	          m[4]  * m[3] * m[13] + 
	          m[12] * m[1] * m[7] - 
	          m[12] * m[3] * m[5]

	inv[14] = -m[0]  * m[5] * m[14] + 
	           m[0]  * m[6] * m[13] + 
	           m[4]  * m[1] * m[14] - 
	           m[4]  * m[2] * m[13] - 
	           m[12] * m[1] * m[6] + 
	           m[12] * m[2] * m[5]

	inv[3] = -m[1] * m[6] * m[11] + 
	          m[1] * m[7] * m[10] + 
	          m[5] * m[2] * m[11] - 
	          m[5] * m[3] * m[10] - 
	          m[9] * m[2] * m[7] + 
	          m[9] * m[3] * m[6]

	inv[7] = m[0] * m[6] * m[11] - 
	         m[0] * m[7] * m[10] - 
	         m[4] * m[2] * m[11] + 
	         m[4] * m[3] * m[10] + 
	         m[8] * m[2] * m[7] - 
	         m[8] * m[3] * m[6]

	inv[11] = -m[0] * m[5] * m[11] + 
	           m[0] * m[7] * m[9] + 
	           m[4] * m[1] * m[11] - 
	           m[4] * m[3] * m[9] - 
	           m[8] * m[1] * m[7] + 
	           m[8] * m[3] * m[5]

	inv[15] = m[0] * m[5] * m[10] - 
	          m[0] * m[6] * m[9] - 
	          m[4] * m[1] * m[10] + 
	          m[4] * m[2] * m[9] + 
	          m[8] * m[1] * m[6] - 
	          m[8] * m[2] * m[5]

	const det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12]

	if (det == 0)
		return null

	const invdet = 1.0 / det

	return inv.map((x) => x * invdet)
}



const VertexDecl_P2UV2 =
{
	vertexSize: 16,
	attribs:
	{
		aPosition:  [2, 0],
		aTexCoord0: [2, 8],
	},
}

const VertexDecl_P3N3T4UV2 =
{
	vertexSize: (3+3+4+2)*4,
	attribs:
	{
		aPosition:  [3,  0],
		aNormal:    [3, 12],
		aTangent:   [4, 24],
		aTexCoord0: [2, 40],
	},
}

function createTriangleMesh(verts, indices, vertexDecl)
{
	const gl = window.GLCtx

	const VB = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, VB)
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW)

	const IB = gl.createBuffer()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IB)
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

	return { VB: VB, IB: IB, indexCount: indices.length, vertexDecl: vertexDecl }
}

function applyVertexAttrib(mesh, prog, name)
{
	const gl = window.GLCtx
	const pos = gl.getAttribLocation(prog, name)
	if (pos == -1)
		return

	var vdInfo = mesh.vertexDecl.attribs[name]
	if (vdInfo)
	{
		gl.vertexAttribPointer(pos, vdInfo[0], gl.FLOAT, false, mesh.vertexDecl.vertexSize, vdInfo[1])
		gl.enableVertexAttribArray(pos)
	}
	else
		gl.disableVertexAttribArray(pos)
}

function drawTriangleMesh(mesh, prog)
{
	const gl = window.GLCtx

	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.VB)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.IB)

	applyVertexAttrib(mesh, prog, "aPosition")
	applyVertexAttrib(mesh, prog, "aNormal")
	applyVertexAttrib(mesh, prog, "aTangent")
	applyVertexAttrib(mesh, prog, "aTexCoord0")

	gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0)
}

function createQuadMesh()
{
	const posTexData =
	[
		-1.0, -1.0, 0.0, 0.0,
		 1.0, -1.0, 1.0, 0.0,
		-1.0,  1.0, 0.0, 1.0,
		 1.0,  1.0, 1.0, 1.0,
	]
	return createTriangleMesh(posTexData, [0, 1, 2, 2, 1, 3], VertexDecl_P2UV2)
}

function createSphereMesh(hparts, vparts)
{
	hparts = hparts || 32
	vparts = vparts || 32

	const verts = [] // px, py, pz, nx, ny, nz, tx, ty, tz, ts, uvx, uvy
	const indices = []

	for (var h = 0; h <= hparts; ++h)
	{
		const hq1 = h / hparts
		const hdir1x = Math.cos(hq1 * Math.PI * 2)
		const hdir1y = Math.sin(hq1 * Math.PI * 2)
		for (var v = 0; v <= vparts; ++v)
		{
			const vq1 = v / vparts
			const cv1 = Math.cos((vq1 * 2 - 1) * Math.PI * 0.5)
			const sv1 = Math.sin((vq1 * 2 - 1) * Math.PI * 0.5)
			const dir1x = hdir1x * cv1
			const dir1y = hdir1y * cv1
			const dir1z = sv1
			const tan_v3 = v3normalize(v3cross([hdir1x, hdir1y, 0], [0, 0, 1]))
			verts.push(
				dir1x, dir1y, dir1z, // position
				dir1x, dir1y, dir1z, // normal
				tan_v3[0], tan_v3[1], tan_v3[2], 1, // tangent
				hq1, 1 - vq1 // texcoord
			)
		}
	}
	for (var h = 0; h < hparts; ++h)
	{
		const h1 = h + 1
		for (var v = 0; v < vparts; ++v)
		{
			const v1 = v + 1
			const i1 = v + h * (vparts + 1)
			const i2 = v + h1 * (vparts + 1)
			const i4 = v1 + h * (vparts + 1)
			const i3 = v1 + h1 * (vparts + 1)
			indices.push(i1, i4, i3, i3, i2, i1)
		}
	}

	return createTriangleMesh(verts, indices, VertexDecl_P3N3T4UV2)
}



function loadCubemap(url)
{
	const gl = window.GLCtx
	const glCubeEnums =
	[
		gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
		gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
		gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
	]
	const glCX = [0, 1, 0, 1, 0, 1]
	const glCY = [0, 0, 1, 1, 2, 2]

	const texture = gl.createTexture()
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
	for (var i = 0; i < glCubeEnums.length; ++i)
		gl.texImage2D(glCubeEnums[i], 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([105, 120, 139, 255]))

	function cubeUpload(img)
	{
		// cubemap image is 2*N x 3*N
		// layout:
		//  +X -X
		//  +Y -Y
		//  +Z -Z
		var tmpCanvas = document.createElement("canvas")
		tmpCanvas.width = img.width
		tmpCanvas.height = img.height
		document.body.appendChild(tmpCanvas)
		var tmpCtx = tmpCanvas.getContext("2d")
		tmpCtx.drawImage(img, 0, 0)
		var xsz = (img.width / 2) | 0
		var ysz = (img.height / 3) | 0

		gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
		for (var i = 0; i < glCubeEnums.length; ++i)
			gl.texImage2D(glCubeEnums[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tmpCtx.getImageData(glCX[i] * xsz, glCY[i] * ysz, xsz, ysz))

		gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
		document.body.removeChild(tmpCanvas)
	}

//*
	const image = new Image()
	image.onload = function()
	{
		cubeUpload(image)
		image.onload = function()
		{
			cubeUpload(image)
		}
		image.src = url + ".jpg"
	}
	image.src = url + ".preload.jpg"
//*/
/*
	const xhr = new XMLHttpRequest
	xhr.responseType = "arraybuffer"
	xhr.onreadystatechange = function()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			const image = new Image()
			image.src = "data:image/jpeg;base64:" + atob(xhr.responseText)

			// cubemap image is 2*N x 3*N
			// layout:
			//  +X -X
			//  +Y -Y
			//  +Z -Z
			var tmpCanvas = document.createElement("canvas")
			tmpCanvas.width = image.width
			tmpCanvas.height = image.height
			document.body.appendChild(tmpCanvas)
			var tmpCtx = tmpCanvas.getContext("2d")
			tmpCtx.drawImage(image, 0, 0)
			var xsz = (image.width / 2) | 0
			var ysz = (image.height / 2) | 0

			gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
			for (var i = 0; i < glCubeEnums.length; ++i)
				gl.texImage2D(glCubeEnums[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tmpCtx.getImageData(glCX[i] * xsz, glCY[i] * ysz, xsz, ysz))

			gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
			document.body.removeChild(tmpCanvas)
		}
	}
	xhr.open("GET", url, true)
	xhr.send()
//*/
	return texture
}


