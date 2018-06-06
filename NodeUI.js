


const NodePreview = component
({
	render()
	{
		eopen("div", { "class": "previewCont checkerBgr" })
			evoid("canvas", { "width": 118, "height": 118, "class": "nodePreviewCanvas" })
		eclose("div")
	}
})

const NodeAutoCompleteTextField = component
({
	mount()
	{
		this.selectCallback = this.selectCallback.bind(this)
		this.itemCallback = this.itemCallback.bind(this)
	},
	selectCallback(key)
	{
		var nodeCols = funcGetCurNodeCols()
		var colID = nodeCols.length - 1

		var rsrc = null
		var rsrcPos = key.indexOf(":")
		if (rsrcPos != -1)
		{
			rsrc = key.substring(rsrcPos + 1)
			key = key.substring(0, rsrcPos)
		}

		if (key in nodeTypes)
		{
			var node = nodeConstruct(key)
			if (rsrc !== null)
				node.rsrc = rsrc
			store.set("editor/nodeBlinkID", node.id)
			nodeInsertIntoCols(node, colID, nodeCols[colID].length)
		}
	},
	itemCallback(text)
	{
		var out = []
		for (var key in nodeTypes)
		{
			if (key == "output")
				continue
			const itemName = resolveString(nodeTypes[key].name, null)
			ACItemMatch(out, text, key, itemName, nodeTypes[key].desc)
			const rsrcType = nodeTypes[key].rsrcType
			if (rsrcType)
			{
				const resMap = nodeResources[rsrcType]
				for (var rkey in resMap)
				{
					ACItemMatch(out, text, key + ":" + rkey,
						(resMap[rkey].name || rkey) + " - " + itemName,
						nodeResourceGenerateDesc(rsrcType, rkey) || nodeTypes[key].desc)
				}
			}
		}
		return out
	},
	render()
	{
		eopen("AddNodeAC")
			cvoid(AutoCompleteTextField, { bind: "editor/nodeAC", selectCallback: this.selectCallback, itemCallback: this.itemCallback })
		eclose("AddNodeAC")
	},
})

const NodeResource = component
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
		if (this.fullRefreshOnChange)
			storeUpdateCurFuncNodes()
		else
			update(this)
	},
	itemCallback(text)
	{
		var out = [];
		var rsrcMap = nodeResources[this.type]
		for (var key in rsrcMap)
		{
			var rsrc = rsrcMap[key]
			ACItemMatch(out, text, key, rsrc.name || key, nodeResourceGenerateDesc(this.type, key))
		}
		if (this.type == "variable")
		{
			const fnData = funcGetCurData()
			for (var i = 0; i < fnData.args.length; ++i)
			{
				const a = fnData.args[i]
				ACItemMatch(out, text, a.name, a.name, `${dims2type[a.dims]} argument`)
			}
		}
		return out
	},
	render()
	{
		var rsrcName = "-"
		if (this.$value)
		{
			if (this.type == "variable" && funcArgGetDefDimsByName(this.node.func, this.$value))
				rsrcName = this.$value
			else
				rsrcName = nodeResources[this.type][this.$value].name || this.$value
		}
		else
			this.open = true
		eopen("NodeResource", { "class": "selectWrap" })
			eopen("NodeRsrcSelect", { "class": "selectCont" + (this.open ? " open" : "") })
				eopen("NodeRsrcSelectBtn", { "class": "selectBtn", onclick: this.handleSelectBtnClick })
					eopen("Name")
						text(rsrcName)
					eclose("Name")
					eopen("ToggleMarker")
						text("▼")
					eclose("ToggleMarker")
				eclose("NodeRsrcSelectBtn")
				if (this.open)
				{
					cvoid(AutoCompleteTextField,
					{
						bind: `editor/${this.type}AC`,
						placeholder: rsrcName,
						alwaysOpen: true,
						focusOnOpen: true,
						selectCallback: this.selectCallback,
						itemCallback: this.itemCallback,
					})
				}
			eclose("NodeRsrcSelect")
		eclose("NodeResource")
	},
})

const Node = component
({
	mount()
	{
		this.handleTitlePointerDown = this.handleTitlePointerDown.bind(this)
	},
	handleTitlePointerDown(e)
	{
		if (e.target != e.currentTarget || e.button != 0)
			return
		Drag_StartNodeDrag(this.$value.id)
	},
	render()
	{
		var type = nodeTypes[this.$value.type]
		var cls = "node node" + this.$value.id
		if (store.get("editor/nodeBlinkID") == this.$value.id)
			cls += " blinkOnce"
		if (type.rsrcType)
			cls += " hasRsrc"
		if (this.$value.id > window.nodeIDGen)
			cls += " new"
		if (this.$value.toBeRemoved)
			cls += " toBeRemoved"
		eopen("div", { "class": "nodeCont", "id": `node_cont_${this.$value.id}`, "data-id": this.$value.id })
			eopen("div", { "class": cls, "id": `node_${this.$value.id}`, "data-id": this.$value.id, oncontextmenu: (e) =>
				{
					if (!document.getElementById("shaderEditor").classList.contains("disableNodeControls"))
						openContextMenu(e, "editor/nodeContextID", this.$value.id)
					else
						e.preventDefault()
				}
			})
				eopen("div", { "class": "name", onpointerdown: this.handleTitlePointerDown })
					text(resolveString(type.name, this.$value))
					cvoid(OpenToggle, { bind: `${this.bind}/showPreview`, "class": "togglePreview fa " + (this.$value.showPreview ? "fa-eye" : "fa-eye-slash") })
				eclose("div")
				if (this.$value.showPreview)
				{
					cvoid(NodePreview)
				}
				if (type.rsrcType)
				{
					if (type.rsrcType === "func")
						cvoid(FunctionSelect, { bind: `${this.bind}/rsrc`, type: type.rsrcType, noMain: true, isResource: true })
					else
						cvoid(NodeResource, { bind: `${this.bind}/rsrc`, node: this.$value, type: type.rsrcType, fullRefreshOnChange: type.rsrcFullRefreshOnChange })
				}
				eopen("div", { "class": "args" })
				const argNum = nodeGetArgCount(this.$value)
				for (var i = 0; i < argNum; ++i)
				{
					cvoid(NodeInput, { argNum: i, node: this.$value, bind: `${this.bind}/args/${i}` })
				}
				eclose("div")
			eclose("div")
		eclose("div")
	},
})

function openContextMenu(event, id, data)
{
	event.preventDefault()
	store.set("contextMenuPos", { x: event.clientX, y: event.clientY })
	store.set(id, data)
}

const NodeContextMenu = component
({
	mount()
	{
		this.handleItemClick = this.handleItemClick.bind(this)
		this.handleOuterClick = this.handleOuterClick.bind(this)
	},
	handleItemClick(e)
	{
		this["action_" + e.currentTarget.dataset.action].call(this)
		store.set("editor/nodeContextID", null)
	},
	handleOuterClick(e)
	{
		if (e.button == 1)
			return
		e.preventDefault()
		store.set("editor/nodeContextID", null)
	},
	menuitem(name, action)
	{
		if (action)
			evoid("menuitem", { "data-action": action, "onclick": this.handleItemClick }).element.textContent = name
		else
			evoid("menuitem", { "class": "inactive" }).element.textContent = name
	},
	render()
	{
		if (store.get("editor/nodeContextID"))
		{
			const node = nodeMap[this.$value]
			const nt = nodeTypes[node.type]
			const name = resolveString(nt.name, node)
			var canCD = node.type != "output"
			evoid("menubgr", { "class": "bgr", onpointerdown: this.handleOuterClick })
			var el = eopen("menuwindow", { id: "nodeContextMenu" }).element
			el.style.left = store.get("contextMenuPos/x") + "px"
			el.style.top = store.get("contextMenuPos/y") + "px"
				evoid("menulabel").element.textContent = `Node #${this.$value} - ${name}`
				if (canCD)
				{
					this.menuitem("Delete", "delete")
					this.menuitem("Duplicate", "duplicate")
				}
				else
				{
					this.menuitem("Cannot delete '" + nt.name + "'")
					this.menuitem("Cannot duplicate '" + nt.name + "'")
				}
				this.menuitem("Copy shader to clipboard", "copyshader")
			eclose("menuwindow")
		}
	},

	action_delete()
	{
		nodeDelete(store.get("editor/nodeContextID"))
	},
	action_duplicate()
	{
		var node = nodeMap[store.get("editor/nodeContextID")]
		var newNode = nodeConstruct(node.type, node)
		nodeInsertIntoCols(newNode, node.x, node.y + 1)
	},
	action_copyshader()
	{
		const node = nodeMap[store.get("editor/nodeContextID")]
		const genSh = nodesGenerateShader(node)
		copyTextToClipboard(genSh.error ? genSh.error : genSh.fshader)
	},
})

const NodeCol = component
({
	render()
	{
		var col = this.$value
		eopen("div", { "class": "col", "data-col": this.colID, id: `node_col_${this.colID}` })
		for (var j = 0; j < col.length; ++j)
		{
			var id = col[j]
			cvoid(Node, { bind: `nodeMap/${id}` })
		}
		eclose("div")
	},
})

const NodeCols = component
({
	render()
	{
		for (var i = 0; i < this.$value.length; ++i)
		{
			cvoid(NodeCol, { colID: i, bind: `${this.bind}/${i}` })
		}
	},
})

function OnEditAreaLayoutChange()
{
	onNodeLayoutChange()
	queueRedrawDragCanvas()
}
window.addEventListener("resize", OnEditAreaLayoutChange)

const NodeEditArea = component
({
	render()
	{
		eopen("div", { "class": "area eaBlurred customScroll", "id": "editArea", onscroll: OnEditAreaLayoutChange, onpointermove: Drag_onPointerMove })
		cvoid(NodeCols, { bind: `functions/${funcGetCurName()}/nodeCols` })
		eclose("div")
		evoid("canvas", { "class": "overlay eaBlurred", id: "curveOverlay" })
		cvoid(NodeDragOverlay)
		cvoid(NodeContextMenu, { bind: "editor/nodeContextID" })
	},
})


