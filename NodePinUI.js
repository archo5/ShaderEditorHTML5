


var queuedRedrawCurveCanvas = false;
function redrawCurveCanvas()
{
	console.log("redraw")
	queuedRedrawCurveCanvas = false;

	var editArea = document.getElementById("editArea")
	var canvas = document.getElementById("curveOverlay")
	var parent = canvas.parentElement
	if (canvas.width != parent.offsetWidth)
		canvas.width = parent.offsetWidth
	if (canvas.height != parent.offsetHeight)
		canvas.height = parent.offsetHeight

	var ctx = canvas.getContext("2d")
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	ctx.strokeStyle = "rgba(200,150,0,0.5)"
	ctx.lineWidth = 2
	ctx.lineCap = "round"

	var cr_ea = editArea.getBoundingClientRect()

	var nodeCols = funcGetCurNodeCols()
	for (var i = 0; i < nodeCols.length; ++i)
	{
		for (var j = 0; j < nodeCols[i].length; ++j)
		{
			var id_to = nodeCols[i][j]
			var node_to = nodeMap[id_to]
			const argNum = nodeGetArgCount(node_to)
			for (var k = 0; k < argNum; ++k)
			{
				var arg = node_to.args[k]
				if (arg.node)
				{
					var id_from = arg.node

					var el_from = document.getElementById(`node_${id_from}`)
					var el_to = document.querySelector(`#node_${id_to}_input_${k} .pin`)

					var cr_from = el_from.getBoundingClientRect()
					var cr_to = el_to.getBoundingClientRect()

					var fx = cr_from.right - cr_ea.left
					var fy = cr_from.top - cr_ea.top
					var tx = cr_to.left - cr_ea.left
					var ty = cr_to.top + cr_to.height / 2 - cr_ea.top

					ctx.beginPath()
					ctx.moveTo(fx, fy + 16)
					ctx.bezierCurveTo(
						fx + 32, fy + 16,
						tx - 32, ty,
						tx, ty
					)
					ctx.stroke()
				}
			}
		}
	}
}

function onNodeLayoutChange()
{
	if (!queuedRedrawCurveCanvas)
	{
		requestAnimationFrame(redrawCurveCanvas)
		queuedRedrawCurveCanvas = true
	}
}



const NodePinEdit = component
({
	mount()
	{
		this.handleOuterClick = this.handleOuterClick.bind(this)

		this.handleAddClick = this.handleAddClick.bind(this)
		this.handleNumberClick = this.handleNumberClick.bind(this)
		this.handlePickClick = this.handlePickClick.bind(this)
		this.handleColorClick = this.handleColorClick.bind(this)
		this.handleVariableClick = this.handleVariableClick.bind(this)
		this.handleExprClick = this.handleExprClick.bind(this)

		this.handleBackClick = this.handleBackClick.bind(this)
		this.handleAddMathNodeClick = this.handleAddMathNodeClick.bind(this)
		this.handleAddTextureNodeClick = this.handleAddTextureNodeClick.bind(this)
		this.handleAddFunctionNodeClick = this.handleAddFunctionNodeClick.bind(this)

		this.view = "select"
	},

	handleOuterClick(e)
	{
		if (e.button == 1)
			return
		e.preventDefault()
		this.onCloseClick(e)
	},

	handleAddClick(e)
	{
		this.view = "addNode"
		update(this)
	},
	handleNumberClick(e)
	{
		nodeArgSetLink(this.node, this.argNum, null)
		arg = this.node.args[this.argNum]
		if (arg.ed != "numauto" && arg.ed != "num1" && arg.ed != "num2" && arg.ed != "num3" && arg.ed != "num4" && arg.ed != "defval")
			nodeArgSetEditor(this.node, this.argNum, nodeArgGetFlags(this.node, this.argNum) & ARG_NONUMEDIT ? "defval" : "numauto")
		this.onCloseClick(e)
	},
	handlePickClick(e)
	{
		Drag_StartLinkDrag(this.node.id, this.argNum, e)
		this.onCloseClick(e)
	},
	handleColorClick(e)
	{
		nodeArgSetLink(this.node, this.argNum, null)
		arg = this.node.args[this.argNum]
		if (arg.ed != "colrgba" && arg.ed != "colrgb" &&
			arg.ed != "colhsva" && arg.ed != "colhsv" &&
			arg.ed != "colluma" && arg.ed != "collum" &&
			arg.ed != "defval")
		{
			const dims = nodeArgGetDefDims(this.node, this.argNum)
			nodeArgSetEditor(this.node, this.argNum, dims === 1 ? "collum" : dims == 3 ? "colhsv" : "colhsva")
		}
		this.onCloseClick(e)
	},
	handleVariableClick(e)
	{
		nodeArgSetLink(this.node, this.argNum, null)
		arg = this.node.args[this.argNum]
		nodeArgSetEditor(this.node, this.argNum, "var")
		this.onCloseClick(e)
	},
	handleExprClick(e)
	{
		//this.view = "expr"
		ExpressionEdit_Start(this.node, this.argNum)
		this.onCloseClick(e)
	},

	handleBackClick(e)
	{
		this.view = "select"
		update(this)
	},
	handleAddMathNodeClick(e)
	{
		const nn = nodeConstruct("math")
		nodeInsertBehind(nn, this.node)
		nodeArgSetLink(this.node, this.argNum, nn)
		this.onCloseClick(e)
	},
	handleAddTextureNodeClick(e)
	{
		const nn = nodeConstruct("tex2D")
		nodeInsertBehind(nn, this.node)
		nodeArgSetLink(this.node, this.argNum, nn)
		this.onCloseClick(e)
	},
	handleAddFunctionNodeClick(e)
	{
		const nn = nodeConstruct("func")
		nodeInsertBehind(nn, this.node)
		nodeArgSetLink(this.node, this.argNum, nn)
		this.onCloseClick(e)
	},

	render()
	{
		const node = nodeArgGetLink(this.node, this.argNum)
		const ed = nodeArgGetEditor(this.node, this.argNum)
		const isVarEdit = !node && (ed == "var")
		const isNumEdit = !node && (ed == "num1" || ed == "num2" || ed == "num3" || ed == "num4" || ed == "numauto" || ed == "defval")
		const isColorEdit = !node && (ed == "colrgb" || ed == "colrgba" || ed == "colhsv" || ed == "colhsva" || ed == "collum" || ed == "colluma")
		evoid("div", { "class": "bgr", onpointerdown: this.handleOuterClick })
		eopen("NodePinEdit")
			switch (this.view)
			{
			case "select":
				eopen("div", { "class": "selectView" })
					eopen("span", { "class": "newNodeBtn btn", onclick: this.handleAddClick })
						evoid("i", { "class": "fa fa-plus" })
						eopen("name")
							text("Add node")
						eclose("name")
					eclose("span")
					eopen("span", { "class": "numberBtn btn" + (isNumEdit ? " active disabled" : ""), onclick: this.handleNumberClick })
						if (nodeArgGetFlags(this.node, this.argNum) & ARG_NONUMEDIT)
						{
							evoid("i", { "class": "fa fa-undo-alt" })
							eopen("name")
								text("Default")
							eclose("name")
						}
						else
						{
							evoid("i", { "class": "ico ico-num" })
							eopen("name")
								text("Number")
							eclose("name")
						}
					eclose("span")

					eopen("span", { "class": "pickNodeBtn btn", onclick: this.handlePickClick })
						evoid("i", { "class": "fa fa-hand-point-left" })
						eopen("name")
							text("Pick node")
						eclose("name")
					eclose("span")

					eopen("span", { "class": "closeBtn btn", onclick: this.onCloseClick })
						evoid("i", { "class": "fa fa-times io" })
					eclose("span")

					var canShowColor = EditorOpts[2].test(nodeArgGetDefDims(this.node, this.argNum), nodeArgGetFlags(this.node, this.argNum))
					eopen("span", { "class": "colorBtn btn" + (canShowColor && !isColorEdit ? "" : " disabled") + (isColorEdit ? " active" : ""), onclick: this.handleColorClick })
						evoid("i", { "class": "fa fa-palette" })
						eopen("name")
							text("Color")
						eclose("name")
					eclose("span")

					eopen("span", { "class": "variableBtn btn" + (isVarEdit ? " active disabled" : ""), onclick: this.handleVariableClick })
						evoid("i", { "class": "ico ico-var" })
						eopen("name")
							text("Variable")
						eclose("name")
					eclose("span")
					eopen("span", { "class": "expressionBtn btn", onclick: this.handleExprClick })
						evoid("i", { "class": "fa fa-superscript" })
						eopen("name")
							text("Expression")
						eclose("name")
					eclose("span")
				eclose("div")
				break
			case "addNode":
				eopen("div", { "class": "addNodeView" })
					eopen("span", { "class": "backBtn btn", onclick: this.handleBackClick })
						evoid("i", { "class": "fa fa-chevron-left" })
						eopen("name")
							text("Back")
						eclose("name")
					eclose("span")
					eopen("span", { "class": "addMathNodeBtn btn", onclick: this.handleAddMathNodeClick })
						evoid("i", { "class": "fa fa-superscript" })
						eopen("name")
							text("Math")
						eclose("name")
					eclose("span")
					eopen("span", { "class": "addTextureNodeBtn btn", onclick: this.handleAddTextureNodeClick })
						evoid("i", { "class": "fa fa-image" })
						eopen("name")
							text("Texture")
						eclose("name")
					eclose("span")
					eopen("span", { "class": "addFunctionNodeBtn btn", onclick: this.handleAddFunctionNodeClick })
						evoid("i", { "class": "ico ico-function" })
						eopen("name")
							text("Function")
						eclose("name")
					eclose("span")
				eclose("div")
				break
			case "expr":
				eopen("div", { "class": "exprView" })
					eopen("span", { "class": "backBtn btn", onclick: this.handleBackClick })
						evoid("i", { "class": "fa fa-chevron-left" })
						eopen("name")
							text("Back")
						eclose("name")
					eclose("span")
					cvoid(Checkbox, { bind: "editor/nodeExprCleanup", label: "Clean up" })
					var el = evoid("textarea", { "class": "expr" }).element
					el.value = this.calcExpr
					el.focus()
				eclose("div")
				break
			}
		eclose("NodePinEdit")
	},
})

const EditorOpts =
[
	{
		test: (d, f) => (f & ARG_NONUMEDIT) != 0,
		name: "Values",
		opts:
		[
			["defval", "Default value", () => true],
		],
	},
	{
		test: (d, f) => (f & ARG_NONUMEDIT) == 0,
		name: "Number editor",
		opts:
		[
			["numauto", "Auto", () => true],
			["num1", "1", () => true],
			["num2", "2", (d) => d == "adapt" || d == 2],
			["num3", "3", (d) => d == "adapt" || d == 3],
			["num4", "4", (d) => d == "adapt" || d == 4],
		],
	},
	{
		test: (d, f) => (d == "adapt" || d == 1 || d == 3 || d == 4) && (f & ARG_NONUMEDIT) == 0,
		name: "Color editor",
		opts:
		[
			["colrgb",  "RGB",  (d) => d == "adapt" || d == 3],
			["colrgba", "RGBA", (d) => d == "adapt" || d == 4],
			["colhsv",  "HSV",  (d) => d == "adapt" || d == 3],
			["colhsva", "HSVA", (d) => d == "adapt" || d == 4],
			["collum",  "Lum",  (d) => d == "adapt" || d == 1 || d == 3],
			["colluma", "LumA", (d) => d == "adapt" || d == 4],
		],
	},
	{
		test: () => true,
		name: "Variable",
		opts:
		[
			["var", "Uniform / Varying", () => true],
		],
	},
]
const NodeInput = component
({
	mount()
	{
		this.handlePinPointerDown = this.handlePinPointerDown.bind(this)
		this.handlePinClick = this.handlePinClick.bind(this)
		this.handleValueTypeEditClick = this.handleValueTypeEditClick.bind(this)
		this.handleVTEOuterClick = this.handleVTEOuterClick.bind(this)
		this.handleVTEPickClick = this.handleVTEPickClick.bind(this)
	},
	handlePinPointerDown(e)
	{
		Drag_StartLinkDrag(this.node.id, this.argNum, e)
	},
	handlePinClick(e)
	{
		this.pinEditOpen = !this.pinEditOpen
		update(this)
	},
	handleValueTypeEditClick(e)
	{
		this.valueTypeEditOpen = !this.valueTypeEditOpen
		update(this)
	},
	handleVTEOuterClick(e)
	{
		this.valueTypeEditOpen = false
		update(this)
	},
	handleVTEPickClick(e)
	{
		this.valueTypeEditOpen = false
		nodeArgSetEditor(this.node, this.argNum, e.currentTarget.dataset.ed)
		//update(this)
	},
	render()
	{
		var argNum = this.argNum
		var node = this.node
		_nodeAdjustArgs(node)
		var arg = node.args[argNum]
		var tgtArgDims = nodeArgGetDimsResolved(node, argNum)
		var srcArgDims = nodeArgGetSrcDims(node, argNum, tgtArgDims)

		eopen("NodeInput", { "class": "input", id: `node_${node.id}_input_${argNum}` })
			eopen("span", { "class": arg.node ? "pin linked" : "pin", onpointerdown: this.handlePinPointerDown, onclick: this.handlePinClick })
				evoid("i", { "class": "fa fa-" + (arg.node ? "pencil-alt" : "plus") })
			eclose("span")
			if (this.pinEditOpen)
				cvoid(NodePinEdit, { node: this.node, argNum: this.argNum, onCloseClick: this.handlePinClick })
			eopen("span", { "class": "name" })
				text(nodeArgGetName(node, argNum))
			eclose("span")
			eopen("span", { "class": "type" })
				if (tgtArgDims != srcArgDims)
				{
					cvoid(AxisMarker, { dims: srcArgDims })
					evoid("i", { "class": "fa fa-caret-right" })
				}
				cvoid(AxisMarker, { dims: tgtArgDims })
			eclose("span")
			if (arg.node === null)
			{
				eopen("span", { "class": "editorBtn", onclick: this.handleValueTypeEditClick })
					evoid("i", { "class": "fa fa-sliders-h" })
				eclose("span")
				if (this.valueTypeEditOpen)
				{
					evoid("div", { "class": "bgr", onpointerdown: this.handleVTEOuterClick })
					eopen("ValueTypeEdit")
						eopen("span", { "class": "editorBtn", onclick: this.handleValueTypeEditClick })
							evoid("i", { "class": "fa fa-sliders-h" })
						eclose("span")
						eopen("Name")
							text("Select editor type")
						eclose("Name")
						for (var i = 0; i < EditorOpts.length; ++i)
						{
							const argDims = nodeArgGetDefDims(node, argNum)
							const argFlags = nodeArgGetFlags(node, argNum)
							if (!EditorOpts[i].test(argDims, argFlags))
								continue
							eopen("GroupName")
								text(EditorOpts[i].name)
							eclose("GroupName")
							eopen("GroupOpts")
								for (var j = 0; j < EditorOpts[i].opts.length; ++j)
								{
									if (!EditorOpts[i].opts[j][2](argDims, argFlags))
										continue
									var cls = "btn" + (EditorOpts[i].opts[j][0] == arg.ed ? " used" : "")
									evoid("input", { type: "button", "class": cls, value: EditorOpts[i].opts[j][1], "data-ed": EditorOpts[i].opts[j][0], onclick: this.handleVTEPickClick })
								}
							eclose("GroupOpts")
						}
					eclose("ValueTypeEdit")
				}
				if (arg.ed == "numauto")
					cvoid(ValueEdit, { bind: `${this.bind}/value`, dims: tgtArgDims })
				else if (arg.ed == "num1")
					cvoid(ValueEdit, { bind: `${this.bind}/value`, dims: 1 })
				else if (arg.ed == "num2")
					cvoid(ValueEdit, { bind: `${this.bind}/value`, dims: 2 })
				else if (arg.ed == "num3")
					cvoid(ValueEdit, { bind: `${this.bind}/value`, dims: 3 })
				else if (arg.ed == "num4")
					cvoid(ValueEdit, { bind: `${this.bind}/value`, dims: 4 })
				else if (arg.ed == "colhsv" || arg.ed == "colhsva")
					cvoid(ColHSVAEdit, { bind: `${this.bind}/hsva`, rgbaBind: `${this.bind}/value`, dims: tgtArgDims })
				else if (arg.ed == "colrgb" || arg.ed == "colrgba")
					cvoid(ColRGBAEdit, { bind: `${this.bind}/value`, dims: tgtArgDims })
				else if (arg.ed == "collum" || arg.ed == "colluma")
					cvoid(ColLuminanceEdit, { bind: `${this.bind}/value`, dims: tgtArgDims, alpha: arg.ed == "colluma" })
				else if (arg.ed == "var")
					cvoid(NodeResource, { bind: `${this.bind}/varName`, node: this.node, type: "variable", fullRefreshOnChange: true })
			}
			if (arg.node !== null || arg.ed == "var")
				cvoid(SwizzleEdit, { bind: `${this.bind}/swizzle`, srcDims: srcArgDims, tgtDims: tgtArgDims })
		eclose("NodeInput")
	},
})


