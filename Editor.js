


const FunctionSelect = component
({
	mount()
	{
		this.open = false
		this.handleSelectBtnClick = this.handleSelectBtnClick.bind(this)
		this.selectCallback = this.selectCallback.bind(this)
		this.itemCallback = this.itemCallback.bind(this)
	},
	handleSelectBtnClick(e)
	{
		this.open = !this.open
		update(this)
	},
	selectCallback(key)
	{
		if (key !== null)
			this.$value = key
		this.open = false
		update(this)
		if (key !== null)
		{
			storeUpdateCurFuncNodes()
			if (this.globalUpdate)
				storeUpdateCurFunc()
		}
	},
	itemCallback(text)
	{
		var out = [];
		var funcMap = funcGetMap()
		for (var key in funcMap)
		{
			if (key == "main" && this.noMain)
				continue
			ACItemMatch(out, text, key, key, key == "main" ? "Entry point" : "")
		}
		if (this.isResource)
		{
			var rsrcMap = nodeResources.func
			for (var key in rsrcMap)
			{
				var rsrc = rsrcMap[key]
				ACItemMatch(out, text, key, rsrc.name || key, nodeResourceGenerateDesc("func", key))
			}
		}
		return out
	},
	render()
	{
		eopen("FunctionSelectWrap", { "class": "selectWrap" })
			eopen("FunctionSelect", { "class": "selectCont" + (this.open ? " open" : "") })
				eopen("FunctionSelectBtn", { "class": "selectBtn", onclick: this.handleSelectBtnClick })
					eopen("Name")
						text(this.$value || "")
					eclose("Name")
					eopen("ToggleMarker")
						text("▼")
					eclose("ToggleMarker")
				eclose("FunctionSelectBtn")
				if (this.open)
				{
					cvoid(AutoCompleteTextField,
					{
						bind: `editor/functionAC`,
						placeholder: this.$value,
						alwaysOpen: true,
						focusOnOpen: true,
						selectCallback: this.selectCallback,
						itemCallback: this.itemCallback,
					})
				}
			eclose("FunctionSelect")
		eclose("FunctionSelectWrap")
	},
})

const SubMenuMarker = component
({
	render()
	{
		evoid("i", { "class": "submenuMarker fa fa-caret-right" })
	},
})

const FunctionArgArrayEdit = component
({
	mount()
	{
		this.handleArgAddBtn = this.handleArgAddBtn.bind(this)
	},
	handleArgAddBtn(e)
	{
		this.$value.push({ name: "", dims: 4, origNum: null })
		store.update(this.bind)
	},
	render()
	{
		eopen("div", { "class": "argsEdit" })
			eopen("div", { "class": "argsListEdit" })
			for (var i = 0; i < this.$value.length; ++i)
			{
				eopen("div", { "class": "argRowEdit", "data-num": i })
					cvoid(ArrayEdit, { bind: this.bind, i: i })
					cvoid(TypeSwitch, { bind: `${this.bind}/${i}/dims` })
					cvoid(TextInput, { bind: `${this.bind}/${i}/name` })
				eclose("div")
			}
			eclose("div")
			eopen("span", { "class": "btn addBtn", onclick: this.handleArgAddBtn })
				evoid("i", { "class": "fa fa-plus" })
				text("Add argument")
			eclose("span")
		eclose("div")
	},
})

const FunctionEditForm = component
({
	mount()
	{
		this.handleCloseClick = this.handleCloseClick.bind(this)
		this.handleApplyClick = this.handleApplyClick.bind(this)
		this.handleEditName = this.handleEditName.bind(this)
	},

	handleCloseClick(e)
	{
		this.$value = null
		document.getElementById("shaderEditor").classList.remove("editAreaBlur")
		document.getElementById("shaderEditor").classList.remove("disableTopBar")
	},
	handleApplyClick(e)
	{
		const v = this.$value
		if (!v.curName)
			funcCreate(v.newName, v.retDims, v.args)
		else
			funcMove(v.newName, v.curName, v.retDims, v.args)
		funcSetCur(v.newName)
		this.handleCloseClick(e)
	},
	handleEditName(e)
	{
		this.$value.newName = e.currentTarget.value
		update(this)
	},

	nameIsValid(name)
	{
		return funcNameValidate(name) && (this.$value.curName == name || typeof funcGetMap()[name] === "undefined")
	},

	render()
	{
		var edFnData = this.$value
		if (!edFnData)
			return
		eopen("div", { "class": "form funcEditForm customScroll" })
			eopen("span", { "class": "btn closeBtn", onclick: this.handleCloseClick })
				evoid("i", { "class": "io fa fa-times" })
			eclose("span")
			eopen("div", { "class": "title" })
				eopen("span", { "class": "lbl" })
					if (edFnData.type == "new")
						text("New function:")
					else
						text("Edit function:")// " + this.$value.curName)
				eclose("span")
				var el = evoid("input", { type: "text", placeholder: "<name>", oninput: this.handleEditName, "class": "editName" + (!this.nameIsValid(edFnData.newName) ? " invalid" : "") }).element
				if (edFnData.type == "edit")
					el.value = edFnData.newName
				if (this.nameIsValid(edFnData.newName))
				{
					eopen("span", { "class": "btn applyBtn", onclick: this.handleApplyClick })
						evoid("i", { "class": "io fa fa-check" })
					eclose("span")
				}
			eclose("div")
			eopen("div", { "class": "section" })
				eopen("div", { "class": "row" })
					eopen("span", { "class": "lbl" })
						text("Return value element count:")
					eclose("span")
					cvoid(TypeSwitch, { bind: `${this.bind}/retDims` })
				eclose("div")
				eopen("div", { "class": "row" })
					eopen("span", { "class": "lbl" })
						text("Arguments:")
					eclose("span")
					cvoid(FunctionArgArrayEdit, { bind: `${this.bind}/args` })
				eclose("div")
			eclose("div")
		eclose("div")
	},
})

const CurFunctionUI = component
({
	mount()
	{
		this.handleFuncEditClick = this.handleFuncEditClick.bind(this)
		this.handleFuncDeleteClick = this.handleFuncDeleteClick.bind(this)
		this.handleFuncAddClick = this.handleFuncAddClick.bind(this)
	},
	handleFuncEditClick(e)
	{
		var fnData = funcGetCurData()
		var args = []
		for (var i = 0; i < fnData.args.length; ++i)
		{
			var sa = fnData.args[i]
			args.push({ dims: sa.dims, name: sa.name, origNum: i })
		}
		store.set("editor/funcData",
		{
			type: "edit",
			curName: funcGetCurName(),
			newName: funcGetCurName(),
			retDims: fnData.retDims,
			args: args,
		})
		document.getElementById("shaderEditor").classList.add("editAreaBlur")
		document.getElementById("shaderEditor").classList.add("disableTopBar")
	},
	handleFuncDeleteClick(e)
	{
		var name = funcGetCurName()
		if (name != "main")
			delete funcGetMap()[name]
		funcSetCur("main")
	},
	handleFuncAddClick(e)
	{
		store.set("editor/funcData",
		{
			type: "new",
			curName: "",
			newName: "",
			retDims: 4,
			args: [],
		})
		document.getElementById("shaderEditor").classList.add("editAreaBlur")
		document.getElementById("shaderEditor").classList.add("disableTopBar")
	},
	render()
	{
		eopen("FunctionUI", { "class": "functionUI" })
			eopen("span", { "class": "lbl" })
				text("Function:")
			eclose("span")
			cvoid(FunctionSelect, { bind: "editor/curFunc", globalUpdate: true })

			if (store.get("editor/curFunc") != "main")
			{
				eopen("span", { "class": "btn", onclick: this.handleFuncEditClick })
					evoid("i", { "class": "fa fa-edit" })
					text("Edit")
				eclose("span")

				eopen("span", { "class": "btn", onclick: this.handleFuncDeleteClick })
					evoid("i", { "class": "fa fa-trash" })
					text("Delete")
				eclose("span")
			}

			eopen("span", { "class": "btn", onclick: this.handleFuncAddClick })
				evoid("i", { "class": "fa fa-plus" })
				text("Add")
			eclose("span")
		eclose("FunctionUI")
	},
})

const ShaderPropForm = component
({
	mount()
	{
		this.handleCloseClick = this.handleCloseClick.bind(this)
		this.handleApplyClick = this.handleApplyClick.bind(this)
	},

	handleCloseClick(e)
	{
		this.$value = null
		document.getElementById("shaderEditor").classList.remove("editAreaBlur")
		document.getElementById("shaderEditor").classList.remove("disableTopBar")
	},
	handleApplyClick(e)
	{
		const v = this.$value
		this.handleCloseClick(e)
	},
	handleEditName(e)
	{
		this.$value.newName = e.currentTarget.value
		update(this)
	},

	nameIsValid(name)
	{
		return true
	},

	render()
	{
		var edShData = this.$value
		if (!edShData)
			return
		eopen("div", { "class": "form shaderPropForm customScroll" })
			eopen("span", { "class": "btn closeBtn", onclick: this.handleCloseClick })
				evoid("i", { "class": "io fa fa-times" })
			eclose("span")
			eopen("div", { "class": "title" })
				eopen("span", { "class": "lbl" })
					if (edFnData.type == "new")
						text("New shader:")
					else
						text("Edit function:")
				eclose("span")
				var el = evoid("input", { type: "text", placeholder: "<name>", oninput: this.handleEditName, "class": "editName" + (!this.nameIsValid(edFnData.newName) ? " invalid" : "") }).element
				if (edFnData.type == "edit")
					el.value = edFnData.newName
				if (this.nameIsValid(edFnData.newName))
				{
					eopen("span", { "class": "btn applyBtn", onclick: this.handleApplyClick })
						evoid("i", { "class": "io fa fa-check" })
					eclose("span")
				}
			eclose("div")
			eopen("div", { "class": "section" })
				eopen("div", { "class": "row" })
					eopen("span", { "class": "lbl" })
						text("Description:")
					eclose("span")
					cvoid(TextInput, { bind: `${this.bind}/desc` })
				eclose("div")
			eclose("div")
		eclose("div")
	},
})

const ExpressionEdit = component
({
	mount()
	{
		this.handleKeyDown = this.handleKeyDown.bind(this)
		this.handleInput = this.handleInput.bind(this)
		this.handleApplyClick = this.handleApplyClick.bind(this)
		this.handleCancelClick = this.handleCancelClick.bind(this)
		this.handleCleanupToggle = this.handleCleanupToggle.bind(this)
		this.valueWasNull = true
		this.nodeIDGenAfter = null
		this.createdNodes = []
		this.nodesToRemove = {}
		this.err = null
	},
	handleKeyDown(e)
	{
		if (e.keyCode == 27) // escape
			this.cancel()
		if (e.keyCode == 13) // enter
			this.apply()
	},
	handleInput(e)
	{
		this.$value.expr = e.currentTarget.value
		store.update(this.bind)
	//	this.updateExpr(e.currentTarget.value)
	},
	handleApplyClick(e)
	{
		this.apply()
	},
	handleCancelClick(e)
	{
		this.cancel()
	},
	handleCleanupToggle()
	{
		store.update(this.bind)
	},

	apply()
	{
		if (this.err === null)
		{
			window.nodeIDGen = this.nodeIDGenAfter
			this.createdNodes.length = 0
			for (var n2r_id in this.nodesToRemove)
				nodeDelete(n2r_id)
			this.nodesToRemove = {}
			this.stop()
		}
	},
	cancel()
	{
		this.restore()
		this.stop()
	},
	restore(setArgInfo)
	{
		while (this.createdNodes.length)
			nodeDelete(this.createdNodes.pop())
		for (var n2r_id in this.nodesToRemove)
			nodeMap[n2r_id].toBeRemoved = false
		this.nodesToRemove = {}
		if (setArgInfo || true)
			nodeArgSetInfo(this.$value.node, this.$value.argNum, this.$value.argInfo)
	},
	stop()
	{
		this.$value = null
		document.getElementById("shaderEditor").classList.remove("disableNodeControls")
		document.getElementById("shaderEditor").classList.remove("disableFunctionUI")
		Drag_StopExprClick()
		storeUpdateCurFuncNodes()
	},
	updateExpr(expr)
	{
		var idbk = window.nodeIDGen
		var errType = "Parse error"
		try
		{
			const ast = parseAST(expr)

			errType = "Compile error"
			this.restore(false)
			nodeArgSetInfo(this.$value.node, this.$value.argNum, this.createNode(ast, this.$value.node))
			if (store.get("editor/nodeExprCleanup") && this.$value.argInfo.node !== null)
			{
				const n2rProc = [this.$value.argInfo.node]
				for (var i = 0; i < n2rProc.length; ++i)
				{
					const n2r_id = n2rProc[i]
					const n2r = nodeMap[n2r_id]
					var hasNonRemovedReader = false
					for (var onid in n2r.outNodes)
					{
						if (!this.nodesToRemove[onid])
						{
							hasNonRemovedReader = true
							break
						}
					}
					if (!hasNonRemovedReader)
					{
						this.nodesToRemove[n2r_id] = true
						n2r.toBeRemoved = true
						const argCount = nodeGetArgCount(n2r)
						for (var j = 0; j < argCount; ++j)
						{
							const aid = nodeArgGetLink(n2r, j)
							if (aid !== null)
								n2rProc.push(aid)
						}
					}
				}
			}

			this.err = null
		}
		catch (err)
		{
			this.restore()

			this.err = errType + ": " + err
		}
		update(this)
		this.nodeIDGenAfter = window.nodeIDGen
		window.nodeIDGen = idbk
	},
	validateValueArgs(astNode, numArgs)
	{
		if (astNode.args.length != 1 && astNode.args.length != numArgs)
			throw `incorrect argument count for '${astNode.func}', expected 1 or ${numArgs}`
		for (var i = 0; i < astNode.args.length; ++i)
			if (!(astNode.args[i] instanceof NumberNode))
				throw `incorrect argument type for '${astNode.func}', expected number`
	},
	createNode(astNode, behind)
	{
		//console.log(astNode)
		if (astNode instanceof FuncNode)
		{
			if (astNode.func == "vec2")
			{
				this.validateValueArgs(astNode, 2)
				return { ed: "numauto", value: [astNode.args[0].num, astNode.args[1].num, 0, 1] }
			}
			if (astNode.func == "vec3")
			{
				this.validateValueArgs(astNode, 3)
				return { ed: "numauto", value: [astNode.args[0].num, astNode.args[1].num, astNode.args[2].num, 1] }
			}
			if (astNode.func == "vec4")
			{
				this.validateValueArgs(astNode, 4)
				return { ed: "numauto", value: [astNode.args[0].num, astNode.args[1].num, astNode.args[2].num, astNode.args[3].num] }
			}

			var expr = nodeResources.expr2op[astNode.func]
			var nn
			var argOff = 0
			if (astNode.func == "texture")
			{
				if (astNode.args.length < 1 || astNode.args.length > 2)
					throw `incorrect argument count for 'texture', expected 1-2`
				if (!(astNode.args[0] instanceof IdentNode))
					throw `incorrect argument 1 type for 'texture', expected identifier`

				nn = nodeConstruct("tex2D")
				nn.rsrc = astNode.args[0].name in nodeResources.sampler2D ? astNode.args[0].name : null
				argOff = 1
			}
			else if (expr)
			{
				nn = nodeConstruct("math")
				nn.rsrc = expr
			}
			else
			{
				nn = nodeConstruct("func")
				nn.rsrc = funcGetDataAll(astNode.func) ? astNode.func : null
			}
			this.createdNodes.push(nn.id)
			nodeInsertBehind(nn, behind)
			this.nodeProcessArgs(nn, astNode, argOff)
			return { node: nn.id }
		}
		if (astNode instanceof IdentNode)
		{
			if (nodeResources.variable[astNode.name])
				return { ed: "var", varName: astNode.name }
		}
		if (astNode instanceof NumberNode)
		{
			return { ed: "num1", value: [astNode.num, astNode.num, astNode.num, astNode.num] }
		}
		if (astNode instanceof NodeRefNode)
		{
			return { node: astNode.id }
		}
		if (astNode instanceof PropertyNode)
		{
			if (astNode.prop.length > 4)
				throw `incorrect swizzle '${astNode.prop}', expected 1-4 [xyzw] characters`
			for (var i = 0; i < astNode.prop.length; ++i)
			{
				const c = astNode.prop[i]
				if (c != "x" && c != "y" && c != "z" && c != "w")
					throw `incorrect swizzle '${astNode.prop}', expected 1-4 [xyzw] characters`
			}

			obj = this.createNode(astNode.src, behind)
			if (typeof obj === "undefined")
				throw "cannot swizzle numbers or vectors"
			obj.swizzle = astNode.prop + "xyzw".substring(astNode.prop.length)
			return obj
		}
		throw astNode.prototype
	},
	nodeProcessArgs(nn, astNode, argOff)
	{
		var nnargc = nodeGetArgCount(nn)
		var aalen = astNode.args.length - argOff
		if (aalen < 0)
			aalen = 0
		var num = nnargc < aalen ? nnargc : aalen
		for (var i = 0; i < num; ++i)
		{
			nodeArgSetInfo(nn, i, this.createNode(astNode.args[i + argOff], nn))
		}
	},

	render()
	{
		if (this.$value !== null)
		{
			this.updateExpr(this.$value.expr)
			eopen("ExprEdit", { "class": "exprEdit" })
				eopen("span", { "class": "lbl" })
					text("Expression:")
				eclose("span")
				const el = evoid("input", { type: "text", onkeydown: this.handleKeyDown, oninput: this.handleInput, id: "exprEditInput" }).element
				var ss = el.selectionStart, se = el.selectionEnd
				el.value = this.$value.expr
				if (this.valueWasNull)
					el.select()
				else
					el.setSelectionRange(ss, se)
				eopen("span", { "class": "btn applyBtn", onclick: this.handleApplyClick })
					evoid("i", { "class": "fa fa-check" })
					text("Apply")
				eclose("span")
				eopen("span", { "class": "btn cancelBtn", onclick: this.handleCancelClick })
					evoid("i", { "class": "fa fa-times" })
					text("Cancel")
				eclose("span")
				cvoid(Checkbox, { bind: "editor/nodeExprCleanup", label: "Clean up", onedit: this.handleCleanupToggle })
				if (this.err)
				{
					eopen("span", { "class": "error abserr" })
						evoid("i", { "class": "fa fa-exclamation-triangle" })
						text(this.err)
					eclose("span")
				}
			eclose("ExprEdit")
		}
		this.valueWasNull = this.$value === null
	},
})
function ExpressionEdit_Start(node, argNum)
{
	store.set("editor/expression", { node: _nodeResolve(node), argNum: argNum, argInfo: nodeArgGetInfo(node, argNum), expr: nodeGetArgExpr(node, argNum, 0) })
	document.getElementById("shaderEditor").classList.add("disableNodeControls")
	document.getElementById("shaderEditor").classList.add("disableFunctionUI")
	Drag_StartExprClick(node.id, argNum)
}
function ExpressionEdit_InsertText(text)
{
	const input = document.getElementById("exprEditInput")
	input.focus()
//	document.execCommand("insertText", false, text)
	var v = store.get("editor/expression")
//	v.expr = input.value
	v.expr = v.expr.substring(0, input.selectionStart) + text + v.expr.substring(input.selectionEnd)
	var after = input.selectionStart + text.length
	input.setSelectionRange(after, after)
	store.update("editor/expression")
}

const NodeEditor = component
({
	mount()
	{
		this.handleFileMenuClick = this.handleFileMenuClick.bind(this)
		this.handleOuterClick = this.handleOuterClick.bind(this)
		this.handlePreviewPointerMove = this.handlePreviewPointerMove.bind(this)
		this.handlePreviewWheel = this.handlePreviewWheel.bind(this)
		this.fileMenuOpen = false
	},

	handleFileMenuClick(e)
	{
		this.fileMenuOpen = true
		document.getElementById("shaderEditor").classList.add("editAreaBlur")
		update(this)
	},
	handleOuterClick()
	{
		this.fileMenuOpen = false
		document.getElementById("shaderEditor").classList.remove("editAreaBlur")
		update(this)
	},
	handlePreviewPointerMove(e)
	{
		if (e.buttons & 1)
		{
			window.GLCameraYaw += e.movementX
			window.GLCameraPitch -= e.movementY
			if (window.GLCameraPitch < 1)
				window.GLCameraPitch = 1
			else if (window.GLCameraPitch > 179)
				window.GLCameraPitch = 179
		}
	},
	handlePreviewWheel(e)
	{
		var dy = e.deltaY
		if (e.deltaMode == 1)
			dy *= 40
		else if (e.deltaMode == 2)
			dy *= 800
		window.GLCameraDist *= Math.pow(1.2, dy / 100);
		if (window.GLCameraDist < 1)
			window.GLCameraDist = 1
		else if (window.GLCameraDist > 100)
			window.GLCameraDist = 100
	},

	render()
	{
		eopen("div", { "class": "editor", id: "shaderEditor" })
			eopen("div", { "class": "topBar menuBar" })
				//eopen("span", { "class": "btn", onclick: this.handleFileMenuClick })
				//	evoid("i", { "class": "fa fa-file" })
				//	text("File")
				//eclose("span")
				if (this.fileMenuOpen)
				{
					evoid("div", { "class": "bgr", onpointerdown: this.handleOuterClick })
					eopen("menuwindow")
						eopen("menuitem")
							evoid("i", { "class": "fa fa-file" })
							text("New")
						eclose("menuitem")
						eopen("menuitem")
							evoid("i", { "class": "fa fa-folder-open" })
							text("Open")
						eclose("menuitem")
						eopen("menuitem")
							evoid("i", { "class": "fa fa-info-circle" })
							text("Properties")
						eclose("menuitem")
					eclose("menuwindow")
				}

				/*eopen("span", { "class": "lbl" })
					text("Add node:")
				eclose("span")
				cvoid(NodeAutoCompleteTextField)*/

				cvoid(CurFunctionUI)
				cvoid(ExpressionEdit, { bind: "editor/expression" })
			eclose("div")
			eopen("div", { "class": "areaWrapper" })
				cvoid(NodeEditArea)
				cvoid(FunctionEditForm, { bind: "editor/funcData" })
				//cvoid(ShaderPropForm, { bind: "editor/shaderData" })
			eclose("div")
			eopen("div", { "class": "previewWrapper" })
				eopen("div", { "class": "previewBlock checkerBgr" })
					evoid("canvas", { "class": "preview", id: "mainPreview", onpointermove: this.handlePreviewPointerMove, onwheel: this.handlePreviewWheel })
				eclose("div")
			eclose("div")
		eclose("div")
	},
})

const NodeEditorUnboundProxy = component
({
	render()
	{
		cvoid(NodeEditor, { bind: "editor/globalUpdateTrigger" })
	},
})



function checkNodeLayout(payload)
{
	if (payload.key != "editor/globalUpdateTrigger" && payload.key.indexOf("editor/") === 0)
		return
	if (payload.key.indexOf("/value") !== -1)
		return
	if (payload.key.indexOf("/hsva") !== -1)
		return
	if (payload.key.indexOf("/swizzle") !== -1)
		return
	console.log("triggered: " + payload.key)
	onNodeLayoutChange()
}

function watcher(payload)
{
	checkNodeLayout(payload)
	store.handle(payload)
}



function editorInit()
{
	store.set("editor",
	{
		// persistent view state
		curFunc: "main",
		// settings in editing state
		nodeExprCleanup: true,
		// helper UI state
		drag: null, // OR { type: "node", nodeID: <id>, target: null OR { x, y, edge (0-based CSS order) } }
		nodeContextID: null,
		funcData: null, // OR { type: new|edit, curName, newName, retDims, args: [{ dims, name }...] }
		shaderData: null, // OR { type: new|edit, curName, newName, desc }
		expression: null, // OR string
		functionAC: { open: false, text: "" },
		nodeAC: { open: false, text: "" },
		variableAC: { open: true, text: "" },
		sampler2DAC: { open: true, text: "" },
		opAC: { open: true, text: "" },
		// misc.
		globalUpdateTrigger: null,
	})
	store.addProxy("", watcher)

	funcCreate("main", 4, [])

	route("/", NodeEditorUnboundProxy)

	document.addEventListener("pointerdown", Drag_onPointerDown)
	document.addEventListener("pointerup", Drag_onPointerUp)
	requestAnimationFrame(redrawPreviews)
	setInterval(ShaderCache_GC, 10000)
}


