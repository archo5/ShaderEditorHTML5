"use strict";

(function(scope) {
	scope.module = { exports: {} };
	scope.modules = {};
	scope.modulesCached = {};
	scope.modulesPath = { "wabi":"../../wabi/index.js", };

	if(scope.process) {
		scope.process.env = { NODE_ENV: "dev" }
	}
	else
	{
		scope.process = {
			env: {
				NODE_ENV: "dev"
			}
		}
	}

	scope._inherits = function(a, b)
	{
		var protoA = a.prototype;
		var proto = Object.create(b.prototype);

		for(var key in protoA)
		{
			var param = Object.getOwnPropertyDescriptor(protoA, key);
			if(param.get || param.set) {
				Object.defineProperty(proto, key, param);
			}
			else {
				proto[key] = protoA[key];
			}
		}

		a.prototype = proto;
		a.prototype.constructor = a;
		a.__parent = b;

		if(b.__inherit === undefined) {
			b.__inherit = {};
		}

		b.__inherit[a.name] = a;

		var parent = b.__parent;
		while(parent)
		{
			parent.__inherit[a.name] = a;
			parent = parent.__parent;
		}
	}
})(window || global);

"use strict";

(function() {
	function VNode(id, type, props, element) {
		this.id = id;
		this.type = type;
		this.props = props;
		this.element = element;
		this.children = [];
		this.index = 0;
		this.component = null;
	}
	modules[2] = { VNode: VNode };
})();

//# sourceURL=../../wabi/src/vnode.js

"use strict";

(function() {
	var VNode = modules[2].VNode;
	const stack = new Array(64);
	const components = {};
	let stackIndex = 0;
	let bodyNode = null;
	const elementOpen = function(type, props, srcElement) {
		const parent = stack[stackIndex];
		let prevNode = parent.children[parent.index];
		let vnode = prevNode;
		if(!prevNode) {
			const element = srcElement || document.createElement(type);
			vnode = new VNode(parent.index, type, null, element);
			if(props) {
				for(let key in props) {
					setProp(element, key, props[key]);
				}
				vnode.props = props;
			}
			if(parent.component) {
				if(parent.index > 0) {
					const parentParent = stack[stackIndex - 1];
					const parentNext = parentParent.children[parent.id + 1];
					if(parentNext && parentNext.component) {
						parent.element.insertBefore(element, parentNext.component.base);
					}
					else {
						parent.element.appendChild(element);
					}					
				}
				else {
					parent.element.insertBefore(element, parent.component.base.nextSibling);
				}				
			}
			else {
				parent.element.appendChild(element);
			}			
			parent.children.push(vnode);
		}
		else {
			if(vnode.type !== type) {
				const element = srcElement || document.createElement(type);
				if(vnode.component) {
					vnode.element.replaceChild(element, vnode.component.base);
					removeComponent(vnode.component);
					vnode.component = null;
					appendChildren(element, vnode.children);
				}
				else {
					const prevElement = prevNode.element;
					appendChildren(element, vnode.children);
					prevElement.parentElement.replaceChild(element, prevElement);
				}				
				vnode.element = element;
				vnode.type = type;
				if(props) {
					for(let key in props) {
						setProp(element, key, props[key]);
					}
					vnode.props = props;
				}
			}
			else {
				const element = prevNode.element;
				const prevProps = prevNode.props;
				if(props !== prevProps) {
					if(props) {
						if(prevProps) {
							for(let key in prevProps) {
								if(props[key] === undefined) {
									unsetProp(element, key);
								}
							}
							for(let key in props) {
								const value = props[key];
								if(value !== prevProps[key]) {
									setProp(element, key, value);
								}
							}
						}
						else {
							for(let key in props) {
								setProp(element, key, props[key]);
							}
						}						
						prevNode.props = props;
					}
					else {
						if(prevProps) {
							for(let key in prevProps) {
								unsetProp(element, key);
							}
							prevNode.props = null;
						}
					}					
				}
			}			
		}		
		parent.index++;
		stackIndex++;
		stack[stackIndex] = vnode;
		return vnode;
	};
	const appendChildren = (element, children) => {
		for(let n = 0; n < children.length; n++) {
			const child = children[n];
			if(child.component) {
				element.appendChild(child.component.base);
				child.element = element;
				appendChildren(element, child.children);
			}
			else {
				element.appendChild(child.element);
			}			
		}
	};
	const elementClose = function(type) {
		const node = stack[stackIndex];
		if(node.type !== type) {
			console.error("(Element.close) Unexpected element closed: " + type + " but was expecting: " + node.type + "");
		}
		if(node.index !== node.children.length) {
			removeUnusedNodes(node);
		}
		node.index = 0;
		stackIndex--;
	};
	const elementVoid = (type, props) => {
		const node = elementOpen(type, props);
		elementClose(type);
		return node;
	};
	const element = (element, props) => {
		const node = elementOpen(element.localName, props, element);
		elementClose(element.localName);
		return node;
	};
	const componentVoid = (ctor, props) => {
		const parent = stack[stackIndex];
		let vnode = parent.children[parent.index];
		let component;
		if(vnode) {
			component = vnode.component;
			if(component) {
				if(component.constructor === ctor) {
					diffComponentProps(component, vnode, props);
				}
				else {
					const newComponent = createComponent(ctor);
					newComponent.vnode = vnode;
					vnode.component = newComponent;
					vnode.element.replaceChild(newComponent.base, component.base);
					removeComponent(component);
					component = newComponent;
					diffComponentProps(component, vnode, props);
				}				
			}
			else {
				const vnodeNew = new VNode(vnode.id, null, null, parent.element);
				component = createComponent(ctor);
				component.vnode = vnodeNew;
				vnodeNew.component = component;
				vnodeNew.children.push(vnode);
				parent.element.insertBefore(component.base, vnode.element);
				parent.children[vnode.id] = vnodeNew;
				vnode.id = 0;
				vnode.parent = vnodeNew;
				vnode = vnodeNew;
				diffComponentProps(component, vnode, props);
			}			
		}
		else {
			vnode = new VNode(parent.children.length, null, null, parent.element);
			component = createComponent(ctor);
			component.vnode = vnode;
			vnode.component = component;
			parent.children.push(vnode);
			parent.element.appendChild(component.base);
			diffComponentProps(component, vnode, props);
		}		
		parent.index++;
		stackIndex++;
		stack[stackIndex] = vnode;
		component.depth = stackIndex;
		component.render();
		component.dirty = false;
		if(vnode.index !== vnode.children.length) {
			removeUnusedNodes(vnode);
		}
		vnode.index = 0;
		stackIndex--;
		return component;
	};
	const diffComponentProps = (component, node, props) => {
		const prevProps = node.props;
		if(props !== prevProps) {
			if(props) {
				if(prevProps) {
					for(let key in prevProps) {
						if(props[key] === undefined) {
							if(key[0] === "$") {
								component[key] = component.state[key.slice(1)];
							}
							else {
								component[key] = null;
							}							
						}
					}
					for(let key in props) {
						const value = props[key];
						if(component[key] !== value) {
							component[key] = value;
						}
					}
				}
				else {
					for(let key in props) {
						component[key] = props[key];
					}
				}				
				node.props = props;
			}
			else if(prevProps) {
				for(let key in prevProps) {
					if(key[0] === "$") {
						component[key] = component.state[ket.slice(1)];
					}
					else {
						component[key] = null;
					}					
				}
				node.props = null;
			}
		}
	};
	const createComponent = (ctor) => {
		const component = new ctor();
		if(component.mount) {
			component.mount();
		}
		component.dirty = true;
		return component;
	};
	const removeComponent = (component) => {
		component.remove();
		component.base.remove();
	};
	const text = (text) => {
		const parent = stack[stackIndex];
		let vnode = parent.children[parent.index];
		if(vnode) {
			if(vnode.type === "#text") {
				if(vnode.element.nodeValue !== text) {
					vnode.element.nodeValue = text;
				}
			}
			else {
				const element = document.createTextNode(text);
				if(vnode.component) {
					vnode.element.replaceChild(element, vnode.component.base);
					removeComponent(vnode.component);
					vnode.component = null;
				}
				else {
					vnode.element.parentElement.replaceChild(element, vnode.element);
				}				
				removeUnusedNodes(vnode);
				vnode.type = "#text";
				vnode.element = element;
			}			
		}
		else {
			const element = document.createTextNode(text);
			vnode = new VNode(parent.children.length, "#text", null, element);
			parent.children.push(vnode);
			parent.element.appendChild(element);
		}		
		parent.index++;
		return vnode;
	};
	const setProp = (element, name, value) => {
		if(name === "class") {
			element.className = value;
		}
		else if(name === "style") {
			if(typeof value === "object") {
				const elementStyle = element.style;
				for(let key in value) {
					elementStyle[key] = value[key];
				}
			}
			else {
				element.style.cssText = value;
			}			
		}
		else if((name[0] === "o") && (name[1] === "n")) {
			element[name] = value;
		}
		else {
			element.setAttribute(name, value);
		}		
	};
	const unsetProp = function(element, name) {
		if(name === "class") {
			element.className = "";
		}
		else if(name === "style") {
			element.style.cssText = "";
		}
		else if((name[0] === "o") && (name[1] === "n")) {
			element[name] = null;
		}
		else {
			element.removeAttribute(name);
		}		
	};
	const render = function(component, parentElement) {
		if(!bodyNode) {
			bodyNode = new VNode(0, "body", null, parentElement);
		}
		stackIndex = 0;
		stack[0] = bodyNode;
		componentVoid(component);
		if(bodyNode.index !== bodyNode.children.length) {
			removeUnusedNodes(bodyNode);
		}
		bodyNode.index = 0;
	};
	const renderInstance = function(instance) {
		const vnode = instance.vnode;
		stackIndex = instance.depth;
		stack[instance.depth] = vnode;
		instance.render();
		instance.dirty = false;
		if(vnode.index !== vnode.children.length) {
			removeUnusedNodes(vnode);
		}
		vnode.index = 0;
	};
	const removeUnusedNodes = (node) => {
		const children = node.children;
		for(let n = node.index; n < children.length; n++) {
			const child = children[n];
			removeNode(child);
		}
		children.length = node.index;
	};
	const removeNode = (node) => {
		if(node.component) {
			removeComponent(node.component);
		}
		else {
			if(node.element.parentElement) {
				node.element.parentElement.removeChild(node.element);
			}
		}		
		const children = node.children;
		for(let n = 0; n < children.length; n++) {
			const child = children[n];
			removeNode(child);
		}
		node.children.length = 0;
	};
	const removeAll = () => {
		removeUnusedNodes(bodyNode);
	};
	const getBodyNode = () => {
		return bodyNode;
	};
	modules[5] = { elementOpen: elementOpen, elementClose: elementClose, elementVoid: elementVoid, element: element, componentVoid: componentVoid, text: text, render: render, renderInstance: renderInstance, removeAll: removeAll, getBodyNode: getBodyNode };
})();

//# sourceURL=../../wabi/src/dom.js

"use strict";

(function() {
	var getBodyNode = modules[5].getBodyNode;
	let tabs = "";
	const dump = (node) => {
		console.log("---");
		dumpNode(node);
		console.log("\n");
	};
	const dumpNode = (node) => {
		const tag = node.component ? "component" : node.type;
		const children = node.children;
		if(children.length > 0) {
			dumpOpen(tag);
			for(let n = 0; n < children.length; n++) {
				dumpNode(children[n]);
			}
			dumpClose(tag);
		}
		else {
			dumpVoid(tag);
		}		
	};
	const dumpOpen = (name) => {
		console.log("" + tabs + "<" + name + ">");
		incTabs();
	};
	const dumpClose = (name) => {
		decTabs();
		console.log("" + tabs + "</" + name + ">");
	};
	const dumpVoid = (name) => {
		console.log("" + tabs + "<" + name + "></" + name + ">");
	};
	const incTabs = () => {
		tabs += "\t";
	};
	const decTabs = () => {
		tabs = tabs.substring(0, tabs.length - 1);
	};
	modules[6] = dump;
})();

//# sourceURL=../../wabi/src/dump.js

"use strict";

(function() {
	var VNode = modules[2].VNode;
	var __module5 = modules[5];
	var render = __module5.render;
	var renderInstance = __module5.renderInstance;
	var removeAll = __module5.removeAll;
	var getBodyNode = __module5.getBodyNode;
	var dump = modules[6];
	const updateBuffer = [];
	const routes = [];
	let needUpdate = false;
	let needUpdateRoute = false;
	let currRouteResult = [];
	let currRoute = null;
	let url = null;
	function Route(regexp, component, enterFunc, exitFunc, readyFunc) {
		this.regexp = regexp;
		this.component = component;
		this.enterFunc = enterFunc || null;
		this.exitFunc = exitFunc || null;
		this.readyFunc = readyFunc || null;
	}
	const update = function(instance) {
		if(instance.dirty) {
			return ;
		}
		instance.dirty = true;
		updateBuffer.push(instance);
		needUpdate = true;
	};
	const renderLoop = function() {
		if(needUpdate) {
			updateRender();
		}
		if(needUpdateRoute) {
			updateRoute();
		}
		window.requestAnimationFrame(renderLoop);
	};
	const updateRender = function() {
		updateBuffer.sort(sortByDepth);
		for(let n = 0; n < updateBuffer.length; n++) {
			const node = updateBuffer[n];
			if(!node.dirty) {
				continue;
			}
			renderInstance(node);
		}
		updateBuffer.length = 0;
		needUpdate = false;
	};
	const sortByDepth = function(a, b) {
		return a.depth - b.depth;
	};
	const route = function(regexp, component, enterFunc, exitFunc, readyFunc) {
		routes.push(new Route(regexp, component, enterFunc, exitFunc, readyFunc));
		needUpdateRoute = true;
	};
	const updateRoute = function() {
		url = document.location.hash;
		if(!url) {
			url = "/";
		}
		currRouteResult.length = 0;
		let result;
		for(let n = 0; n < routes.length; n++) {
			const routeItem = routes[n];
			if(routeItem.regexp) {
				const regex = new RegExp(routeItem.regexp, "g");
				while(result = regex.exec(url)) {
					currRouteResult.push(result);
				}
				if(currRouteResult.length === 0) {
					continue;
				}
			}
			if(currRoute === routeItem) {
				break;
			}
			if(currRoute && currRoute.exitFunc) {
				currRoute.exitFunc();
			}
			currRoute = routeItem;
			if(currRoute.enterFunc) {
				currRoute.enterFunc(currRouteResult);
			}
			render(currRoute.component, document.body);
			if(currRoute.readyFunc) {
				currRoute.readyFunc();
			}
			break;
		}
		if(!currRoute) {
			console.warn("Could not found route for: " + url);
		}
		needUpdateRoute = false;
	};
	const clearRoutes = function(remove) {
		routes.length = 0;
		currRoute = null;
		if(remove) {
			removeAll();
		}
	};
	window.addEventListener("hashchange", () => {
		updateRoute();
	});
	renderLoop();
	modules[4] = { update: update, route: route, clearRoutes: clearRoutes };
})();

//# sourceURL=../../wabi/src/renderer.js

"use strict";

(function() {
	var update = modules[4].update;
	function Proxy(key, func) {
		this.key = key;
		this.func = func;
	}

	function WatcherBuffer() {
		this.funcs = [];
		this.buffer = null;
	}

	function RemoveInfo(path, func) {
		this.path = path;
		this.func = func;
	}

	function Store() {
		this.data = {};
		this.proxies = [];
		this.emitting = 0;
		this.removeWatchers = [];
		this.watchers = new WatcherBuffer();
		this.watchers.buffer = {};
	}
	Store.prototype = {
		set: function(key, value) {
			this.dispatch({
				action: "SET",
				key: key,
				value: value
			});
		},
		add: function(key, value) {
			this.dispatch({
				action: "ADD",
				key: key,
				value: value
			});
		},
		remove: function(key, value) {
			this.dispatch({
				action: "REMOVE",
				key: key,
				value: value
			});
		},
		update: function(key, value) {
			this.dispatch({
				action: "UPDATE",
				key: key
			});
		},
		dispatch: function(data) {
			if(this.globalProxy) {
				this.globalProxy(data);
			}
			else {
				this.handle(data, null);
			}			
		},
		performSet: function(payload, promise) {
			const tuple = this.getData(payload.key);
			if(!tuple) {
				return ;
			}
			if(payload.key) {
				tuple.data[tuple.key] = payload.value;
				if(promise) {
					promise.then((resolve, reject) => {
						this.emit({
							action: "SET",
							key: tuple.parentKey,
							value: tuple.data
						}, tuple.watchers, "SET", tuple.key, payload.value);
					});
				}
				else {
					this.emit({
						action: "SET",
						key: tuple.parentKey,
						value: tuple.data
					}, tuple.watchers, "SET", tuple.key, payload.value);
				}				
			}
			else {
				this.data = payload.value;
				if(promise) {
					promise.then((resolve, reject) => {
						this.emitWatchers({
							action: "SET",
							key: "",
							value: payload.value
						}, this.watchers);
					});
				}
				else {
					this.emitWatchers({
						action: "SET",
						key: "",
						value: payload.value
					}, this.watchers);
				}				
			}			
		},
		performAdd: function(payload, promise) {
			const tuple = this.getData(payload.key);
			if(!tuple) {
				return ;
			}
			let array = tuple.data[tuple.key];
			if(!array) {
				array = [ payload.value ];
				tuple.data[tuple.key] = array;
			}
			else if(!Array.isArray(array)) {
				console.warn("(store) Data at key '" + payload.key + "' is not an Array");
				return ;
			}
			else {
				array.push(payload.value);
			}			
			const funcs = tuple.watchers.funcs;
			if(funcs) {
				const payloadSet = {
					action: "SET",
					key: tuple.key,
					value: tuple.data
				};
				for(let n = 0; n < funcs.length; n++) {
					funcs[n](payloadSet);
				}
				const buffer = tuple.watchers.buffer;
				if(buffer) {
					const watchers = buffer[tuple.key];
					if(watchers) {
						const funcs = watchers.funcs;
						if(funcs) {
							payloadSet.value = array;
							for(let n = 0; n < funcs.length; n++) {
								funcs[n](payloadSet);
							}
						}
					}
				}
			}
		},
		performRemove: function(payload, promise) {
			const tuple = this.getData(payload.key);
			if(!tuple) {
				return ;
			}
			const data = payload.value ? tuple.data[tuple.key] : tuple.data;
			if(Array.isArray(data)) {
				let index;
				if(payload.value !== undefined) {
					index = data.indexOf(payload.value);
					if(index === -1) {
						return ;
					}
					data.splice(index, 1);
				}
				else {
					index = parseInt(tuple.key);
					data.splice(index, 1);
				}				
				const payloadOut = {
					action: "SET",
					key: null,
					value: null
				};
				if(payload.value) {
					payloadOut.key = tuple.key;
					payloadOut.value = data;
					const buffer = tuple.watchers.buffer[tuple.key];
					const funcs = buffer.funcs;
					for(let n = 0; n < funcs.length; n++) {
						funcs[n](payloadOut);
					}
				}
				else {
					if(tuple.parentKey) {
						payloadOut.key = tuple.parentKey;
						payloadOut.value = data;
						const watchers = tuple.watchers.funcs;
						if(watchers) {
							for(let n = 0; n < watchers.length; n++) {
								watchers[n](payloadOut);
							}
						}
					}
					const buffer = tuple.watchers.buffer;
					for(let key in buffer) {
						const keyIndex = parseInt(key);
						if((keyIndex >= index) && (data.length > keyIndex)) {
							payloadOut.key = key;
							payloadOut.value = data[keyIndex];
							this.emitWatchers(payloadOut, buffer[key]);
						}
					}
				}				
			}
			else {
				if(payload.value !== undefined) {
					delete data[payload.value];
					this.emitWatchers({
						action: "REMOVE",
						key: payload.value
					}, tuple.watchers.buffer[tuple.key]);
					return ;
				}
				else {
					delete data[tuple.key];
				}				
				this.emit({
					action: "SET",
					key: tuple.parentKey,
					value: tuple.data
				}, tuple.watchers, "REMOVE", tuple.key, null);
			}			
		},
		performUpdate: function(payload) {
			const tuple = this.getData(payload.key);
			if(!tuple) {
				return ;
			}
			if(!tuple.watchers) {
				return ;
			}
			const watchers = tuple.watchers.buffer[tuple.key];
			if(!watchers) {
				return ;
			}
			this.emitWatchers({
				action: "SET",
				key: payload.key,
				value: tuple.data[tuple.key]
			}, watchers);
		},
		handle: function(data, promise) {
			for(let n = 0; n < this.proxies.length; n++) {
				const proxy = this.proxies[n];
				if(data.key.indexOf(proxy.key) === 0) {
					if(proxy.func(data)) {
						return ;
					}
				}
			}
			switch(data.action) {
				case "SET":
					this.performSet(data, promise);
					break;
				case "ADD":
					this.performAdd(data, promise);
					break;
				case "REMOVE":
					this.performRemove(data, promise);
					break;
				case "UPDATE":
					this.performUpdate(data, promise);
					break;
			}
		},
		watch: function(path, func) {
			if(!path) {
				return ;
			}
			let watchers = this.watchers;
			const keys = path.split("/");
			for(let n = 0; n < keys.length; n++) {
				const key = keys[n];
				const buffer = watchers.buffer;
				if(buffer) {
					const nextWatchers = buffer[key];
					if(!nextWatchers) {
						const newWatchers = new WatcherBuffer();
						watchers.buffer[key] = newWatchers;
						watchers = this.fillWatchers(newWatchers, keys, n + 1);
						break;
					}
					else {
						watchers = nextWatchers;
					}					
				}
				else {
					watchers = this.fillWatchers(watchers, keys, n);
					break;
				}				
			}
			watchers.funcs.push(func);
		},
		fillWatchers: function(watchers, keys, index) {
			for(let n = index; n < keys.length; n++) {
				const newWatcher = new WatcherBuffer();
				watchers.buffer = {};
				watchers.buffer[keys[n]] = newWatcher;
				watchers = newWatcher;
			}
			return watchers;
		},
		unwatch: function(path, func) {
			if(!path) {
				return ;
			}
			if(this.emitting) {
				const removeInfo = new RemoveInfo(path, func);
				this.removeWatchers.push(removeInfo);
				return ;
			}
			let watchers = this.watchers;
			let prevWatchers = null;
			const keys = path.split("/");
			for(let n = 0; n < keys.length; n++) {
				if(!watchers.buffer) {
					console.warn("(store.unwatch) Watcher can not be found for:", path);
					return ;
				}
				prevWatchers = watchers;
				watchers = watchers.buffer[keys[n]];
				if(!watchers) {
					return ;
				}
			}
			const funcs = watchers.funcs;
			const index = funcs.indexOf(func);
			if(index === -1) {
				console.warn("(store.unwatch) Watcher can not be found for:", path);
				return ;
			}
			funcs[index] = funcs[funcs.length - 1];
			funcs.pop();
		},
		emit: function(payload, watchers, action, key, value) {
			if(!watchers) {
				return ;
			}
			this.emitting++;
			const funcs = watchers.funcs;
			if(funcs) {
				for(let n = 0; n < funcs.length; n++) {
					funcs[n](payload);
				}
			}
			watchers = (watchers.buffer ? watchers.buffer[key] : null);
			if(watchers) {
				payload.action = action;
				payload.key = key;
				payload.value = value;
				this.emitWatchers(payload, watchers);
			}
			this.emitting--;
			if(this.emitting === 0) {
				if(this.removeWatchers.length > 0) {
					for(let n = 0; n < this.removeWatchers.length; n++) {
						const info = this.removeWatchers[n];
						this.unwatch(info.path, info.func);
					}
					this.removeWatchers.length = 0;
				}
			}
		},
		emitWatchers: function(payload, watchers) {
			this.emitting++;
			const funcs = watchers.funcs;
			if(funcs) {
				for(let n = 0; n < funcs.length; n++) {
					funcs[n](payload);
				}
			}
			const buffer = watchers.buffer;
			if(buffer) {
				const value = payload.value;
				if(value && (typeof value === "object")) {
					for(let key in buffer) {
						payload.key = key;
						payload.value = (value[key] === undefined ? null : value[key]);
						this.emitWatchers(payload, buffer[key]);
					}
				}
				else {
					payload.value = null;
					for(let key in buffer) {
						payload.key = key;
						this.emitWatchers(payload, buffer[key]);
					}
				}				
			}
			this.emitting--;
		},
		get: function(key) {
			if(!key) {
				if(key === undefined) {
					return "";
				}
				return this.data;
			}
			const buffer = key.split("/");
			let data = this.data;
			for(let n = 0; n < buffer.length; n++) {
				const id = buffer[n];
				if(id === "@") {
					return buffer[n - 1];
				}
				else {
					data = data[id];
				}				
				if(data === undefined) {
					return null;
				}
			}
			return data;
		},
		getData: function(path) {
			if(!path) {
				const tuple = {
					data: this.data,
					key: null,
					parentKey: null,
					watchers: null
				};
				return tuple;
			}
			const keys = path.split("/");
			const num = keys.length - 1;
			if(num === 0) {
				const tuple = {
					data: this.data,
					key: keys[0],
					parentKey: null,
					watchers: this.watchers
				};
				return tuple;
			}
			let data = this.data;
			let watchers = this.watchers;
			for(let n = 0; n < num; n++) {
				const key = keys[n];
				const newData = data[key];
				if(!newData) {
					console.warn("(store.getData) No data available with key: [" + keys[n] + "] with path: [" + path + "]");
					return null;
				}
				data = newData;
				if(watchers) {
					watchers = (watchers.buffer ? watchers.buffer[key] : null);
				}
			}
			const tuple = {
				data: data,
				key: keys[num],
				parentKey: keys[num - 1],
				watchers: watchers
			};
			return tuple;
		},
		addProxy: function(key, func) {
			if(key === "") {
				if(this.globalProxy) {
					console.warn("(wabi.proxy) There is already global proxy declared");
					return ;
				}
				this.globalProxy = func;
			}
			else {
				for(let n = 0; n < this.proxies.length; n++) {
					const proxy = this.proxies[n];
					if((proxy.key === key) && (proxy.func === func)) {
						console.warn("(wabi.proxy) There is already a proxy declared with key:", key);
						return ;
					}
				}
				const proxy = new Proxy(key, func);
				this.proxies.push(proxy);
			}			
		},
		removeProxy: function(key, func) {
			if(key === "") {
				if(this.globalProxy !== func) {
					console.warn("(wabi.proxy) Global proxy functions don`t match");
					return ;
				}
				this.globalProxy = null;
			}
			else {
				for(let n = 0; n < this.proxies.length; n++) {
					const proxy = this.proxies[n];
					if((proxy.key === key) && (proxy.func === func)) {
						this.proxies[n] = this.proxies[this.proxies.length - 1];
						this.proxies.pop();
						return ;
					}
				}
			}			
		},
		toJSON: function() {
			return this.data;
		}
	};

	const store = new Store();
	const lastSegment = function(str) {
		const index = str.lastIndexOf("/");
		if(index === -1) {
			return null;
		}
		return str.slice(index + 1);
	};
	modules[7] = { store: store, lastSegment: lastSegment };
})();

//# sourceURL=../../wabi/src/store.js

"use strict";

(function() {
	var update = modules[4].update;
	var store = modules[7].store;
	let componentIndex = 0;
	function WabiComponentInternal() {
		this.bindFuncs = {};
		this.vnode = null;
		this.dirty = false;
		this.base = document.createTextNode("");
		const currState = {};
		for(let key in this.state) {
			currState[key] = this.state[key];
		}
		this.$ = currState;
	}
	WabiComponentInternal.prototype = {
		_bind: null,
		mount: null,
		unmount: null,
		render: null,
		state: {
			value: null
		},
		remove: function() {
			if(this.unmount) {
				this.unmount();
			}
			this.reset();
		},
		reset: function() {
			if(typeof this._bind === "string") {
				store.unwatch(this._bind, this.bindFuncs.value);
			}
			else {
				for(let key in this._bind) {
					store.unwatch(this._bind[key], this.bindFuncs[key]);
				}
			}			
			this._bind = null;
			this.dirty = false;
			const currState = this.$;
			const initState = this.state;
			for(let key in currState) {
				currState[key] = initState[key];
			}
		},
		handleAction: function(state, value) {
			this.$[state] = value;
			update(this);
		},
		setState: function(key, value) {
			if(this.$[key] === value) {
				return ;
			}
			if(this._bind) {
				if(typeof this._bind === "string") {
					if(key === "value") {
						store.set(this._bind, value, true);
					}
					else {
						this.$[key] = value;
						update(this);
					}					
				}
				else {
					const binding = this._bind[key];
					if(binding) {
						store.set(binding, value, true);
					}
					else {
						this.$[key] = value;
						update(this);
					}					
				}				
			}
			else {
				this.$[key] = value;
				update(this);
			}			
		},
		set bind(value) {
			const prevBind = this._bind;
			if(prevBind) {
				if(value) {
					if(typeof prevBind === "string") {
						if(prevBind !== value) {
							const func = this.bindFuncs.value;
							store.unwatch(prevBind, func);
							store.watch(value, func);
						}
						this.$.value = store.get(value);
					}
					else {
						for(let key in prevBind) {
							if(value[key] === undefined) {
								const func = this.bindFuncs[key];
								store.unwatch(prevBind[key], func);
								this.bindFuncs[key] = undefined;
							}
						}
						for(let key in value) {
							const bindPath = value[key];
							if(prevBind[key] !== bindPath) {
								let func = this.bindFuncs[key];
								if(!func) {
									func = (payload) => {
										this.handleAction(key, payload.value);
									};
									this.bindFuncs[key] = func;
								}
								store.unwatch(prevBind[key], func);
								store.watch(bindPath, func);
								this.$[key] = store.get(bindPath);
							}
						}
					}					
				}
				else {
					if(typeof prevBind === "string") {
						store.unwatch(prevBind, this.bindFuncs.value);
						this.$.value = this.state.value;
					}
					else {
						for(let key in prevBind) {
							store.unwatch(prevBind[key], this.bindFuncs[key]);
							this.bindFuncs[key] = undefined;
							this.$[key] = this.state[key];
						}
					}					
				}				
			}
			else {
				if(typeof value === "string") {
					const func = (payload) => {
						this.handleAction("value", payload.value);
					};
					this.bindFuncs.value = func;
					store.watch(value, func);
					this.$.value = store.get(value);
				}
				else {
					for(let key in value) {
						const bindValue = value[key];
						if(!bindValue) {
							continue;
						}
						const func = (payload) => {
							this.handleAction(key, payload.value);
						};
						this.bindFuncs[key] = func;
						store.watch(bindValue, func);
						this.$[key] = store.get(bindValue);
					}
				}				
			}			
			this._bind = value;
			this.dirty = true;
		},
		get bind() {
			return this._bind;
		},
		updateAll: function() {
			update(this);
			const children = this.vnode.children;
			for(let n = 0; n < children.length; n++) {
				const child = children[n];
				if(child.component) {
					update(child.component);
				}
			}
		}
	};
	const component = (componentProto) => {
		function WabiComponent() {
			WabiComponentInternal.call(this);
		}
		const proto = Object.create(WabiComponentInternal.prototype);
		for(let key in componentProto) {
			const param = Object.getOwnPropertyDescriptor(componentProto, key);
			if(param.get || param.set) {
				Object.defineProperty(proto, key, param);
			}
			else {
				proto[key] = componentProto[key];
			}			
		}
		proto.__componentIndex = componentIndex++;
		const states = proto.state;
		for(let key in states) {
			Object.defineProperty(proto, "$" + key, {
				set: function(value) {
					this.setState(key, value);
				},
				get: function() {
					return this.$[key];
				}
			});
		}
		WabiComponent.prototype = proto;
		WabiComponent.prototype.constructor = WabiComponent;
		return WabiComponent;
	};
	modules[3] = { component: component };
})();

//# sourceURL=../../wabi/src/component.js

"use strict";

(function() {
	const lastSegment = (str) => {
		const index = str.lastIndexOf(".");
		if(index === -1) {
			return null;
		}
		return str.slice(index + 1);
	};
	const selectElementContents = (node) => {
		const range = document.createRange();
		range.selectNodeContents(node);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	};
	modules[8] = { lastSegment: lastSegment, selectElementContents: selectElementContents };
})();

//# sourceURL=../../wabi/src/utils.js

"use strict";

(function() {
	var VNode = modules[2].VNode;
	var component = modules[3].component;
	var __module5 = modules[5];
	var elementOpen = __module5.elementOpen;
	var elementClose = __module5.elementClose;
	var elementVoid = __module5.elementVoid;
	var element = __module5.element;
	var componentVoid = __module5.componentVoid;
	var text = __module5.text;
	var render = __module5.render;
	var __module4 = modules[4];
	var update = __module4.update;
	var route = __module4.route;
	var clearRoutes = __module4.clearRoutes;
	var __module7 = modules[7];
	var store = __module7.store;
	var lastSegment = __module7.lastSegment;
	var __module8 = modules[8];
	var lastSegment = __module8.lastSegment;
	var selectElementContents = __module8.selectElementContents;
	window.wabi = { VNode: VNode, component: component, elementOpen: elementOpen, elementClose: elementClose, elementVoid: elementVoid, element: element, componentVoid: componentVoid, text: text, render: render, update: update, route: route, clearRoutes: clearRoutes, store: store, lastSegment: lastSegment, lastSegment: lastSegment, selectElementContents: selectElementContents };
})();

//# sourceURL=../../wabi/index.js

(function() {})();

//# sourceURL=src/main.js