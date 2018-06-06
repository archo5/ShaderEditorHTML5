


function dist2d(x1, y1, x2, y2)
{
	const xd = x2 - x1
	const yd = y2 - y1
	return Math.sqrt(xd * xd + yd * yd)
}

var cursorClientPos = { x: 0, y: 0 }

var queuedRedrawDragCanvas = false
function redrawDragCanvas()
{
	var nodeCols = funcGetCurNodeCols()
//	console.log("dragredraw")
	queuedRedrawDragCanvas = false
	var editArea = document.getElementById("editArea")
	var canvas = document.getElementById("dragOverlay")
	var parent = canvas.parentElement
	canvas.width = parent.offsetWidth
	canvas.height = parent.offsetHeight
	var ctx = canvas.getContext("2d")
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	ctx.strokeStyle = "rgba(250,240,230,0.5)"
	ctx.lineWidth = 2
	ctx.lineCap = "square"

	var eaCR = editArea.getBoundingClientRect()

	var drag = store.get("editor/drag")
	if (!drag)
		return

	if (drag.nodeID !== null)
	{
		if (typeof drag.argNum === "number")
		{
			ctx.strokeStyle = "rgba(200,100,0,0.8)"
			var inEl = document.getElementById(`node_${drag.nodeID}_input_${drag.argNum}`)
			var pinEl = inEl.querySelector(".pin")
			var pinCR = pinEl.getBoundingClientRect()
			ctx.beginPath()
			var clientCenterX = pinCR.left + pinCR.width / 2
			var clientCenterY = pinCR.top + pinCR.height / 2
			ctx.arc(clientCenterX - eaCR.left, clientCenterY - eaCR.top, pinCR.width, 0, Math.PI * 2)
			var endPos = cursorClientPos
			if (drag.target)
			{
				var dtID = nodeCols[drag.target.x][drag.target.y]
				var nodeContEl = document.getElementById(`node_${dtID}`)
				var nodeContCR = nodeContEl.getBoundingClientRect()
				if (dtID != drag.nodeID && !nodeReadsFrom(dtID, drag.nodeID))
				{
					//ctx.strokeStyle = "rgba(200,200,200,0.2)"
					ctx.rect(nodeContCR.left - eaCR.left, nodeContCR.top - eaCR.top, nodeContCR.width, nodeContCR.height)
					endPos = { x: nodeContCR.right, y: nodeContCR.top }
				}
			}
			if (endPos !== null && drag.type == "link" && dist2d(endPos.x, endPos.y, clientCenterX, clientCenterY) > pinCR.width)
			{
				ctx.strokeStyle = "rgba(200,100,0,0.8)"
				ctx.moveTo(pinCR.left - eaCR.left - pinCR.width / 2, pinCR.top - eaCR.top + pinCR.height / 2)
				ctx.bezierCurveTo(
					pinCR.left - eaCR.left - pinCR.width / 2 - 32, pinCR.top - eaCR.top + pinCR.height / 2,
					endPos.x - eaCR.left + 32, endPos.y - eaCR.top,
					endPos.x - eaCR.left, endPos.y - eaCR.top)
			}
			ctx.stroke()
		}
		else
		{
			var nodeEl = document.getElementById(`node_${drag.nodeID}`)
			var nodeCR = nodeEl.getBoundingClientRect()
			ctx.beginPath()
			ctx.rect(nodeCR.left - eaCR.left, nodeCR.top - eaCR.top, nodeCR.width, nodeCR.height)
			ctx.stroke()
		}
	}

	if (drag.type == "node" && drag.target)
	{
		ctx.strokeStyle = "rgba(250,240,230,0.4)"
		ctx.lineWidth = 8
		if (drag.target.x !== null)
		{
			if (drag.target.y !== null)
			{
				var dtID = nodeCols[drag.target.x][drag.target.y]
				var nodeContEl = document.getElementById(`node_cont_${dtID}`)
				var nodeContCR = nodeContEl.getBoundingClientRect()
				ctx.beginPath()
				switch (drag.target.edge)
				{
				case 0:
					ctx.moveTo(nodeContCR.left - eaCR.left, nodeContCR.top - eaCR.top)
					ctx.lineTo(nodeContCR.right - eaCR.left, nodeContCR.top - eaCR.top)
					break
				case 1:
					ctx.moveTo(nodeContCR.right - eaCR.left, nodeContCR.top - eaCR.top)
					ctx.lineTo(nodeContCR.right - eaCR.left, nodeContCR.bottom - eaCR.top)
					break
				case 2:
					ctx.moveTo(nodeContCR.left - eaCR.left, nodeContCR.bottom - eaCR.top)
					ctx.lineTo(nodeContCR.right - eaCR.left, nodeContCR.bottom - eaCR.top)
					break
				case 3:
					ctx.moveTo(nodeContCR.left - eaCR.left, nodeContCR.top - eaCR.top)
					ctx.lineTo(nodeContCR.left - eaCR.left, nodeContCR.bottom - eaCR.top)
					break
				}
				ctx.stroke()
			}
			else
			{
				var colEl = document.getElementById(`node_col_${drag.target.x}`)
				var colCR = colEl.getBoundingClientRect()
				ctx.beginPath()
				switch (drag.target.edge)
				{
				case 0:
					ctx.moveTo(colCR.left - eaCR.left, colCR.top - eaCR.top)
					ctx.lineTo(colCR.right - eaCR.left, colCR.top - eaCR.top)
					break
				case 1:
					ctx.moveTo(colCR.right - eaCR.left, colCR.top - eaCR.top)
					ctx.lineTo(colCR.right - eaCR.left, colCR.bottom - eaCR.top)
					break
				case 2:
					ctx.moveTo(colCR.left - eaCR.left, colCR.bottom - eaCR.top)
					ctx.lineTo(colCR.right - eaCR.left, colCR.bottom - eaCR.top)
					break
				case 3:
					ctx.moveTo(colCR.left - eaCR.left, colCR.top - eaCR.top)
					ctx.lineTo(colCR.left - eaCR.left, colCR.bottom - eaCR.top)
					break
				}
				ctx.stroke()
			}
		}
	}
}

function queueRedrawDragCanvas()
{
	if (!queuedRedrawDragCanvas)
	{
		requestAnimationFrame(redrawDragCanvas)
		queuedRedrawDragCanvas = true
	}
}

function dist(a, b)
{
	return Math.abs(a - b)
}

function Drag_onPointerMove(e)
{
	var drag = store.get("editor/drag")
	if (!drag)
		return
	var nodeCols = funcGetCurNodeCols()
	cursorClientPos.x = e.clientX
	cursorClientPos.y = e.clientY
	if (drag.type == "node")
	{
		for (var el = e.target; el; el = el.parentElement)
		{
			if (el.classList)
			{
				if (el.classList.contains("nodeCont"))
				{
					// pointer on node container, set as target and calculate closest edge
					var cr = el.getBoundingClientRect()
					var node = nodeMap[el.dataset.id]
					var closestEdge = 0
					var dist2Edge = dist(e.clientY, cr.top)

					var dist2Right = dist(e.clientX, cr.right)
					if (dist2Edge > dist2Right)
					{
						dist2Edge = dist2Right
						closestEdge = 1
					}
					var dist2Bottom = dist(e.clientY, cr.bottom)
					if (dist2Edge > dist2Bottom)
					{
						dist2Edge = dist2Bottom
						closestEdge = 2
					}
					var dist2Left = dist(e.clientX, cr.left)
					if (dist2Edge > dist2Left)
					{
						dist2Edge = dist2Left
						closestEdge = 3
					}

					store.set("editor/drag/target", { x: node.x, y: closestEdge == 1 || closestEdge == 3 ? null : node.y, edge: closestEdge })
					break
				}
				if (el.classList.contains("col"))
				{
					// pointer on node column, set as target and calculate closest edge (top excluded)
					var cr = el.getBoundingClientRect()
					var x = el.dataset.col
					var closestEdge = 2
					var dist2Edge = 8

					var dist2Right = dist(e.clientX, cr.right)
					if (dist2Edge > dist2Right)
					{
						dist2Edge = dist2Right
						closestEdge = 1
					}
					var dist2Left = dist(e.clientX, cr.left)
					if (dist2Edge > dist2Left)
					{
						dist2Edge = dist2Left
						closestEdge = 3
					}

					store.set("editor/drag/target", { x: x, y: closestEdge == 2 ? nodeCols[x].length - 1 : null, edge: closestEdge })
					break
				}
				if (el.classList.contains("area"))
				{
					store.set("editor/drag/target", { x: nodeCols.length - 1, y: null, edge: 3 })
					break
				}
			}
			if (el == document.body)
			{
				// nothing was found
				store.set("editor/drag/target", null)
				break
			}
		}

		queueRedrawDragCanvas()
	}
	else if (drag.type == "link" || drag.type == "expr")
	{
		for (var el = e.target; el; el = el.parentElement)
		{
			if (el.classList)
			{
				if (el.classList.contains("node"))
				{
					var node = nodeMap[el.dataset.id]
					if (el.dataset.id <= window.nodeIDGen)
					{
						store.set("editor/drag/target", { x: node.x, y: node.y, id: node.id })
						break
					}
				}
			}
			if (el == document.body)
			{
				// nothing was found
				store.set("editor/drag/target", null)
				break
			}
		}
		queueRedrawDragCanvas()
	}
}

function Drag_onPointerDown(e)
{
	var drag = store.get("editor/drag")
	if (!drag)
		return
	if (drag.type == "expr")
	{
		if (drag.target !== null && e.button == 0)
		{
			ExpressionEdit_InsertText("#" + drag.target.id)
			e.preventDefault()
		}
	}
}

function Drag_onPointerUp(e)
{
	var drag = store.get("editor/drag")
	if (drag)
	{
		var nodeCols = funcGetCurNodeCols()
		if (drag.type == "node")
		{
			var dt = drag && drag.type == "node" ? drag.target : null
			mainChk: if (dt !== null)
			{
				var node = nodeMap[drag.nodeID]
				if (dt.edge == 1 || dt.edge == 3)
				{
					// insert new column
					if (dt.edge == 3)
						dt.x++ // left edge - next position
					if (dt.x > node.x && nodeCols[node.x].length == 1)
						dt.x-- // previous node's column will be removed by removing node
					nodeRemoveFromCols(node)
					nodeColsInsertCol(dt.x, [node])
				}
				else
				{
					// insert into existing column [x]
					if (dt.edge == 2)
						dt.y++ // bottom edge - next position
					if (dt.x == node.x && dt.y > node.y)
						dt.y-- // node is in the same column, behind target position, its removal will shift target position
					if (dt.x == node.x && nodeCols[node.x].length == 1)
						break mainChk
					if (dt.x >= node.x && nodeCols[node.x].length == 1)
						dt.x-- // previous node's column will be removed by removing node
					nodeRemoveFromCols(node)
					nodeInsertIntoCols(node, dt.x, dt.y)
				}
				store.set("editor/nodeBlinkID", drag.nodeID)
			}
		}
		else if (drag.type == "link")
		{
			if (drag.target)
			{
				var dtID = nodeCols[drag.target.x][drag.target.y]
				if (dtID != drag.nodeID && !nodeReadsFrom(dtID, drag.nodeID))
				{
					nodeArgSetLink(drag.nodeID, drag.argNum, dtID)
				}
			}
		}
		else if (drag.type == "expr")
		{
			// do not disable this state here
			return
		}

		store.set("editor/drag", null)
		document.getElementById("shaderEditor").classList.remove("disableNodeControls")
		queueRedrawDragCanvas()
	}
}

function Drag_StartNodeDrag(id)
{
	store.set("editor/drag", { type: "node", nodeID: id, target: null })
	document.getElementById("shaderEditor").classList.add("disableNodeControls")
	queueRedrawDragCanvas()
}

function Drag_StartLinkDrag(nodeID, argNum, e)
{
	cursorClientPos.x = e.clientX
	cursorClientPos.y = e.clientY
	store.set("editor/drag", { type: "link", nodeID: nodeID, argNum: argNum, target: null })
	if (e.type != "pointerdown")
		document.getElementById("shaderEditor").classList.add("disableNodeControls")
	queueRedrawDragCanvas()
}

function Drag_StartExprClick(nodeID, argNum)
{
	store.set("editor/drag", { type: "expr", nodeID: nodeID, argNum: argNum, target: null })
	queueRedrawDragCanvas()
}

function Drag_StopExprClick()
{
	store.set("editor/drag", null)
	queueRedrawDragCanvas()
}

const NodeDragOverlay = component
({
	render()
	{
		evoid("canvas", { "class": "overlay eaBlurred", id: "dragOverlay" })
	},
})


