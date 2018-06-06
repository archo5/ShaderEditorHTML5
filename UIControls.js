


function copyTextToClipboard(text)
{
	const textarea = document.createElement("textarea")
	textarea.value = text
	document.body.appendChild(textarea)
	textarea.select()
	// TODO check return value
	if (!document.execCommand("copy"))
		throw "failed to copy"
	document.body.removeChild(textarea)
}



function resolveString(strOrFn, arg)
{
	if (typeof strOrFn === "string")
		return strOrFn;
	return strOrFn(arg);
}



const TextInput = component
({
	mount()
	{
		this.handleChange = this.handleChange.bind(this)
	},
	handleChange(e)
	{
		this.$value = e.currentTarget.value
	},
	render()
	{
		evoid("input", { type: "text", onchange: this.handleChange }).element.value = this.$value
	},
})

//window.RIID = new Map()
const RangeInput = component
({
	mount()
	{
//		if (RIID.has(this))
//			throw "Object was already created"
//		RIID.set(this, true)
		this.min = this.min || 0
		this.max = this.max || 100
		this.step = this.step || 1
		this.clicked = false
		this.handlePointerEvent = this.handlePointerEvent.bind(this)
	},
	handlePointerEvent(e)
	{
		if (e.type == "pointerdown" && e.button == 0)
		{
			e.currentTarget.setPointerCapture(e.pointerId)
			this.clicked = true
		}
		if ((e.type == "pointerdown" && e.button == 0) || (e.type == "pointermove" && e.buttons & 0x1 && this.clicked))
		{
			const r = e.currentTarget.getBoundingClientRect()
			var q = r.width > 2 ? (e.clientX - r.left - 2) / (r.width - 4) : 0
			q = Math.max(0, Math.min(1, q))
			q = this.min * (1 - q) + this.max * q
			q = Math.round(q / this.step) * this.step
			this.$value = numToFloatStr(q, false)
			if (this.onedit)
				this.onedit()
		}
		if (e.type == "click" && e.button == 0)
		{
			this.clicked = false
			e.preventDefault()
		}
	},
	render()
	{
		const el = eopen("RangeInput", { onpointerdown: this.handlePointerEvent, onpointermove: this.handlePointerEvent, onclick: this.handlePointerEvent }).element
		const r = el.getBoundingClientRect()
		const q = Math.max(0, Math.min(1, (this.$value - this.min) / (this.max - this.min)))
			evoid("RangeInputTrack", { "class": "track", style: this.trackStyle })
			eopen("RangeInputThumbLimiter")
				evoid("RangeInputThumb", { "class": "thumb", style: { left: (q * 100) + "%" } })
			eclose("RangeInputThumbLimiter")
		eclose("RangeInput")
	},
})

const NumberEdit = component
({
	mount()
	{
		this.handleChange = this.handleChange.bind(this)
		this.handleRangeEdit = this.handleRangeEdit.bind(this)
	},
	handleChange(e)
	{
		if (e.currentTarget.type == "text")
			this.$value = calculate(e.currentTarget.value)
		update(this)
		if (this.onedit)
			this.onedit()
	},
	handleRangeEdit()
	{
		update(this)
		if (this.onedit)
			this.onedit()
	},
	render()
	{
		evoid("input", { type: "text", onchange: this.handleChange }).element.value = this.$value
		cvoid(RangeInput, { bind: this.bind, onedit: this.handleRangeEdit, min: 0, max: 1, step: 0.001, trackStyle: this.trackStyle })
	},
})

const ValueEdit = component
({
	render()
	{
		eopen("div", { "class": "valueEdit" })
		for (var i = 0; i < this.dims; ++i)
		{
			eopen("div", { "class": "row" })
				eopen("label")
					eopen("span", { "class": "lbl" })
						text(labelsXYZW[i])
					eclose("span")
					cvoid(NumberEdit, { bind: `${this.bind}/${i}` })
				eclose("label")
			eclose("div")
		}
		eclose("div")
	},
})

const ColLuminanceEdit = component
({
	mount()
	{
		this.onLumEdit = this.onLumEdit.bind(this)
	},
	onLumEdit()
	{
		const v = this.$value
		this.$value = [v[0], v[0], v[0], v[3]]
	},
	render()
	{
		eopen("div", { "class": "valueEdit colEdit colLumEdit" })
			eopen("div", { "class": "row" })
				eopen("label")
					eopen("span", { "class": "lbl" })
						text("Lum")
					eclose("span")
					cvoid(NumberEdit, { bind: `${this.bind}/0`, onedit: this.onLumEdit })
				eclose("label")
			eclose("div")
			if (this.alpha)
			{
				eopen("div", { "class": "row" })
					eopen("label")
						eopen("span", { "class": "lbl" })
							text("Alpha")
						eclose("span")
						cvoid(NumberEdit, { bind: `${this.bind}/3` })
					eclose("label")
				eclose("div")
			}
		eclose("div")
	},
})

const ColRGBAEdit = component
({
	render()
	{
		const rgba = this.$value.map((x) => Math.round(x * 255))
		eopen("div", { "class": "valueEdit colEdit colRGBAEdit" })
		for (var i = 0; i < this.dims; ++i)
		{
			eopen("div", { "class": "row row" + i })
				eopen("label")
					eopen("span", { "class": "lbl" })
						text(labelsRGBA[i])
					eclose("span")
					var trackStyle

					if (i == 0)
						trackStyle = { background: `linear-gradient(to right, rgb(0, ${rgba[1]}, ${rgba[2]}), rgb(255, ${rgba[1]}, ${rgba[2]}))` }
					else if (i == 1)
						trackStyle = { background: `linear-gradient(to right, rgb(${rgba[0]}, 0, ${rgba[2]}), rgb(${rgba[0]}, 255, ${rgba[2]}))` }
					else if (i == 2)
						trackStyle = { background: `linear-gradient(to right, rgb(${rgba[0]}, ${rgba[1]}, 0), rgb(${rgba[0]}, ${rgba[1]}, 255))` }
					else
						trackStyle = void 0
					cvoid(NumberEdit, { bind: `${this.bind}/${i}`, trackStyle: trackStyle })
				eclose("label")
			eclose("div")
		}
		eclose("div")
	},
})

const ColHSVAEdit = component
({
	mount()
	{
		this.handleEdit = this.handleEdit.bind(this)
	},
	handleEdit()
	{
		const rgb = rgbFromHSV(this.$value)
		store.set(this.rgbaBind, [rgb[0], rgb[1], rgb[2], this.$value[3]])
	},
	render()
	{
		const hsva = this.$value
		eopen("div", { "class": "valueEdit colEdit colHSVAEdit" })
		for (var i = 0; i < this.dims; ++i)
		{
			eopen("div", { "class": "row row" + i })
				eopen("label")
					eopen("span", { "class": "lbl" })
						text(labelsHSVA[i])
					eclose("span")
					var trackStyle

					if (i == 0)
					{
						trackStyle = { background: `linear-gradient(to right, rgb(255,0,0), rgb(255,255,0), rgb(0,255,0),
							rgb(0,255,255), rgb(0,0,255), rgb(255,0,255), rgb(255,0,0))` }
					}
					else if (i == 1)
					{
						const rgb0 = rgbFromHSV([hsva[0], 0, hsva[2]]).map((x) => x * 255).join(",")
						const rgb1 = rgbFromHSV([hsva[0], 1, hsva[2]]).map((x) => x * 255).join(",")
						trackStyle = { background: `linear-gradient(to right, rgb(${rgb0}), rgb(${rgb1}))` }
					}
					else if (i == 2)
					{
						const rgb0 = rgbFromHSV([hsva[0], hsva[1], 0]).map((x) => x * 255).join(",")
						const rgb1 = rgbFromHSV([hsva[0], hsva[1], 1]).map((x) => x * 255).join(",")
						trackStyle = { background: `linear-gradient(to right, rgb(${rgb0}), rgb(${rgb1}))` }
					}
					else
						trackStyle = void 0
					cvoid(NumberEdit, { bind: `${this.bind}/${i}`, onedit: this.handleEdit, trackStyle: trackStyle })
				eclose("label")
			eclose("div")
		}
		eclose("div")
	},
})

const OpenToggle = component
({
	mount()
	{
		this.handleClick = this.handleClick.bind(this)
	},
	handleClick()
	{
		this.$value = !this.$value
	},
	render()
	{
		eopen("span", { "class": this["class"] || "toggle", onclick: this.handleClick })
		eclose("span")
	},
})

const Checkbox = component
({
	mount()
	{
		this.handleClick = this.handleClick.bind(this)
	},
	handleClick()
	{
		this.$value = !this.$value
		if (this.onedit)
			this.onedit()
	},
	render()
	{
		eopen("span", { "class": "checkbox " + (this["class"] || ""), onclick: this.handleClick })
			evoid("i", { "class": "fa fa-" + (this.$value ? "check-circle" : "circle") })
			text(this.label)
		eclose("span")
	},
})

const TypeSwitch = component
({
	mount()
	{
		this.handleClick = this.handleClick.bind(this)
	},
	handleClick(e)
	{
		this.$value = e.currentTarget.dataset.num
	},
	render()
	{
		eopen("TypeSwitch", { "class": "typeSwitch" })
			for (var i = 1; i <= 4; ++i)
			{
				eopen("TypeSwitchBtn", { "class": "btn" + (this.$value == i ? " used" : ""), "data-num": i, onclick: this.handleClick })
					text(i)
				eclose("TypeSwitchBtn")
			}
		eclose("TypeSwitch")
	},
})

const ArrayEdit = component
({
	mount()
	{
		this.handleUpClick = this.handleUpClick.bind(this)
		this.handleDownClick = this.handleDownClick.bind(this)
		this.handleDeleteClick = this.handleDeleteClick.bind(this)
	},
	handleUpClick(e)
	{
		var v = this.$value
		var tmp = v[this.i]
		v[this.i] = v[this.i - 1]
		v[this.i - 1] = tmp
		store.update(this.bind)
	},
	handleDownClick(e)
	{
		var v = this.$value
		var tmp = v[this.i]
		v[this.i] = v[this.i + 1]
		v[this.i + 1] = tmp
		store.update(this.bind)
	},
	handleDeleteClick(e)
	{
		this.$value.splice(this.i, 1)
		store.update(this.bind)
	},
	render()
	{
		eopen("ArrayEdit", { "class": "arrayEdit" })
			eopen("span", { "class": "btn upBtn" + (this.i <= 0 ? " disabled" : ""), onclick: this.handleUpClick })
				evoid("i", { "class": "fa fa-chevron-up io" })
			eclose("span")
			eopen("span", { "class": "btn downBtn" + (this.i >= this.$value.length - 1 ? " disabled" : ""), onclick: this.handleDownClick })
				evoid("i", { "class": "fa fa-chevron-down io" })
			eclose("span")
			eopen("span", { "class": "btn deleteBtn", onclick: this.handleDeleteClick })
				evoid("i", { "class": "fa fa-trash" })
				text("Remove")
			eclose("span")
		eclose("ArrayEdit")
	},
})



const AutoCompleteTextField = component
({
	// arguments:
	// - placeholder (string) [optional] = ...
	// - limit (int) [optional] = 10
	// - 
	// - itemCallback(string text, int limit) -> [{
	//		key:   string -- the ID returned by selection event
	//		name:  string
	//		desc:  string
	//		match: int    -- how far from typed query this match is (smaller number = better)
	// 	}...]
	//   ^^ return a list of matching options
	// - 
	mount()
	{
		this.handleInput = this.handleInput.bind(this)
		this.handleKeyDown = this.handleKeyDown.bind(this)
		this.handleOptionClick = this.handleOptionClick.bind(this)
		this.handleOuterClick = this.handleOuterClick.bind(this)
	},
	handleInput(e)
	{
		this.$value = { open: this.alwaysOpen || e.currentTarget.value.length != 0, sel: 0, text: e.currentTarget.value }
	},
	getSel()
	{
		return Math.min(this.$value.sel, this.options.length - 1)
	},
	handleKeyDown(e)
	{
		if (this.options && this.options.length)
		{
			if (e.keyCode == 13) // enter
			{
				var sel = this.getSel()
				this.selectCallback(this.options[sel].key)
				this.$value = { open: false, sel: 0, text: "" }
				e.preventDefault()
			}
			else if (e.keyCode == 38) // up arrow
			{
				this.$value.sel = Math.max(this.getSel() - 1, 0)
				update(this)
				e.preventDefault()
			}
			else if (e.keyCode == 40) // down arrow
			{
				this.$value.sel = Math.min(this.getSel() + 1, this.options.length - 1)
				update(this)
				e.preventDefault()
			}
		}
	},
	handleOptionClick(e)
	{
		this.selectCallback(e.currentTarget.dataset.key)
		this.$value = { open: false, sel: 0, text: "" }
	},
	handleOuterClick(e)
	{
		if (e.button == 1)
			return
		e.preventDefault()
		if (this.alwaysOpen)
			this.selectCallback(null)
		this.$value = { open: false, sel: 0, text: "" }
	},
	render()
	{
		var open = this.alwaysOpen || this.$value.open
		eopen("div", { "class": "autoCompleteTextField" + (open ? " open" : "") })
			const el = evoid("input",
			{
				type: "text",
				placeholder: this.placeholder || "Start typing to see available options",
				oninput: this.handleInput,
				onkeydown: this.handleKeyDown,
			}).element
			el.value = this.$value.text
			if (open)
			{
				if (this.focusOnOpen)
					el.focus()
				evoid("acbgr", { "class": "bgr", onpointerdown: this.handleOuterClick })
				var options = this.itemCallback(this.$value.text)
				this.options = options
				//if (this.$value.text)
				{
					options.sort((a, b) =>
					{
						if (a.match != b.match)
							return a.match - b.match
						return a.sortText.localeCompare(b.sortText)
					})
				}
				var length = options.length// < 10 ? options.length : 10
				if (length)
				{
					eopen("div", { "class": "options customScroll" })
					var sel = this.getSel()
					for (var i = 0; i < length; ++i)
					{
						const oel = eopen("div", { "class": "option" + (sel == i ? " sel" : ""), onclick: this.handleOptionClick, "data-key": options[i].key }).element
						if (sel == i)
							oel.scrollIntoView({ block: "nearest" })
							eopen("name")
								text(options[i].name)
							eclose("name")
							eopen("desc")
								text(options[i].desc)
							eclose("desc")
							//eopen("info");text(`match=${options[i].match} sortText=${options[i].sortText}`);eclose("info")
						eclose("div")
					}
					eclose("div")
				}
			}
		eclose("div")
	},
})

const NO_MATCH = 0xffffffff
function ACTextMatch(query, text)
{
	text = text.toLowerCase()
	var at = text.indexOf(query)
	if (at !== -1)
		return (at === 0 ? 1000 : 2000)// + text.length - query.length
	return NO_MATCH
}
function ACItemMatch(outArr, query, key, name, desc)
{
	query = query.toLowerCase()
	var match = Math.min(ACTextMatch(query, name), ACTextMatch(query, desc))
	if (match < NO_MATCH)
		outArr.push({ key: key, name: name, desc: desc, match: match, sortText: name.toLowerCase() + desc.toLowerCase() })
}



const AxisClasses = ["dot-x", "dot-y", "dot-z", "dot-w"]
const AxisMarker = component
({
	render()
	{
		eopen("AxisMarker", { "class": "dots-" + this.dims, title: this.dims + "-dimensional value" })
		for (var i = 0; i < this.dims; ++i)
		{
			evoid("Dot", { "class": AxisClasses[i] })
		}
		eclose("AxisMarker")
	},
})



var swizzles =
[
	[], [], [], [],
];
var swizzleBase = "xyzw"
for (var x = 0; x < 4; ++x)
{
	swizzles[0].push(swizzleBase[x])
	for (var y = 0; y < 4; ++y)
	{
		swizzles[1].push(swizzleBase[x] + swizzleBase[y])
		for (var z = 0; z < 4; ++z)
		{
			swizzles[2].push(swizzleBase[x] + swizzleBase[y] + swizzleBase[z])
			for (var w = 0; w < 4; ++w)
			{
				swizzles[3].push(swizzleBase[x] + swizzleBase[y] + swizzleBase[z] + swizzleBase[w])
			}
		}
	}
}

const SwizzleEdit = component
({
	mount()
	{
		this.handleOpenClick = this.handleOpenClick.bind(this)
		this.handleOuterClick = this.handleOuterClick.bind(this)
		this.handleButtonClick = this.handleButtonClick.bind(this)
		this.handleResetClick = this.handleResetClick.bind(this)
	},
	handleOpenClick(e)
	{
		this.open = true
		update(this)
		var pel = e.currentTarget.parentElement
		// TODO fix placement?
	//	setTimeout(() => { pel.querySelector("SwizzleEditPopup").scrollIntoView() }, 100)
	},
	handleOuterClick(e)
	{
		if (e.button == 1)
			return
		e.preventDefault()
		this.open = false
		update(this)
	},
	handleButtonClick(e)
	{
		var curSw = this.$value
		var nSw = ""
		for (var i = 0; i < 4; ++i)
		{
			if (i == e.currentTarget.dataset.dst)
				nSw += e.currentTarget.dataset.swz
			else if (i < curSw.length)
				nSw += curSw[i]
			else
				nSw += swizzleBase[i]
		}
		//console.log(nSw, e.currentTarget.dataset.dst, e.currentTarget.dataset.swz)
		this.$value = nSw == "xyzw" ? "" : nSw
	},
	handleResetClick(e)
	{
		this.$value = ""
	},
	render()
	{
		eopen("SwizzleEdit", { "class": this.open ? " open" : "" })
			eopen("Name")
				text("Swizzle:")
			eclose("Name")
			evoid("input", { type: "button", "class": "btn openBtn", value: this.$value ? this.$value.substring(0, this.tgtDims) : "~", onclick: this.handleOpenClick })
			if (this.open)
			{
				evoid("SwizzleEditBgr", { "class": "bgr", onpointerdown: this.handleOuterClick })
				eopen("SwizzleEditPopup")
					eopen("SwizzleEditPopupAxes")
					for (var d = 0; d < this.tgtDims; ++d)
					{
						eopen("SwizzleEditCol")
							eopen("Name")
								text(swizzleBase[d])
							eclose("Name")
							eopen("ColEls")
								for (var s = 0; s < Math.max(this.srcDims, this.tgtDims); ++s)
								{
									eopen("span",
									{
										"class": "btn" + ((this.$value[d] || swizzleBase[d]) == swizzleBase[s] ? " used" : ""),
										"data-dst": d,
										"data-src": s,
										"data-swz": swizzleBase[s],
										onclick: this.handleButtonClick
									})
										text(s < this.srcDims ? swizzleBase[s] : defArg[s])
									eclose("span")
								}
							eclose("ColEls")
						eclose("SwizzleEditCol")
					}
					eclose("SwizzleEditPopupAxes")
					evoid("input", { type: "button", "class": "btn resetBtn", value: "Reset", onclick: this.handleResetClick })
				eclose("SwizzleEditPopup")
			}
		eclose("SwizzleEdit")
	},
})


