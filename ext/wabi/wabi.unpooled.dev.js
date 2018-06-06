"use strict";!function(scope){scope.module={exports:{}},scope.modules={},scope.modulesCached={},scope.modulesPath={wabi:"../../wabi/index.js"},scope.process?scope.process.env={NODE_ENV:"dev"}:scope.process={env:{NODE_ENV:"dev"}},scope._inherits=function(a,b){var protoA=a.prototype,proto=Object.create(b.prototype);for(var key in protoA){var param=Object.getOwnPropertyDescriptor(protoA,key);param.get||param.set?Object.defineProperty(proto,key,param):proto[key]=protoA[key]}a.prototype=proto,a.prototype.constructor=a,a.__parent=b,void 0===b.__inherit&&(b.__inherit={}),b.__inherit[a.name]=a;for(var parent=b.__parent;parent;)parent.__inherit[a.name]=a,parent=parent.__parent}}(window||global),function(){modules[2]={VNode:function(id,type,props,element){this.id=id,this.type=type,this.props=props,this.element=element,this.children=[],this.index=0,this.component=null}}}(),function(){var VNode=modules[2].VNode;const stack=new Array(64);let stackIndex=0,bodyNode=null;const elementOpen=function(type,props,srcElement){const parent=stack[stackIndex];let prevNode=parent.children[parent.index],vnode=prevNode;if(prevNode)if(vnode.type!==type){const element=srcElement||document.createElement(type);if(vnode.component)vnode.element.replaceChild(element,vnode.component.base),removeComponent(vnode.component),vnode.component=null,appendChildren(element,vnode.children);else{const prevElement=prevNode.element;appendChildren(element,vnode.children),prevElement.parentElement.replaceChild(element,prevElement)}if(vnode.element=element,vnode.type=type,props){for(let key in props)setProp(element,key,props[key]);vnode.props=props}}else{const element=prevNode.element,prevProps=prevNode.props;if(props!==prevProps)if(props){if(prevProps){for(let key in prevProps)void 0===props[key]&&unsetProp(element,key);for(let key in props){const value=props[key];value!==prevProps[key]&&setProp(element,key,value)}}else for(let key in props)setProp(element,key,props[key]);prevNode.props=props}else if(prevProps){for(let key in prevProps)unsetProp(element,key);prevNode.props=null}}else{const element=srcElement||document.createElement(type);if(vnode=new VNode(parent.index,type,null,element),props){for(let key in props)setProp(element,key,props[key]);vnode.props=props}if(parent.component)if(parent.index>0){const parentNext=stack[stackIndex-1].children[parent.id+1];parentNext&&parentNext.component?parent.element.insertBefore(element,parentNext.component.base):parent.element.appendChild(element)}else parent.element.insertBefore(element,parent.component.base.nextSibling);else parent.element.appendChild(element);parent.children.push(vnode)}return parent.index++,stack[++stackIndex]=vnode,vnode},appendChildren=(element,children)=>{for(let n=0;n<children.length;n++){const child=children[n];child.component?(element.appendChild(child.component.base),child.element=element,appendChildren(element,child.children)):element.appendChild(child.element)}},elementClose=function(type){const node=stack[stackIndex];node.type!==type&&console.error("(Element.close) Unexpected element closed: "+type+" but was expecting: "+node.type),node.index!==node.children.length&&removeUnusedNodes(node),node.index=0,stackIndex--},componentVoid=(ctor,props)=>{const parent=stack[stackIndex];let component,vnode=parent.children[parent.index];if(vnode)if(component=vnode.component)if(component.constructor===ctor)diffComponentProps(component,vnode,props);else{const newComponent=createComponent(ctor);newComponent.vnode=vnode,vnode.component=newComponent,vnode.element.replaceChild(newComponent.base,component.base),removeComponent(component),diffComponentProps(component=newComponent,vnode,props)}else{const vnodeNew=new VNode(vnode.id,null,null,parent.element);(component=createComponent(ctor)).vnode=vnodeNew,vnodeNew.component=component,vnodeNew.children.push(vnode),parent.element.insertBefore(component.base,vnode.element),parent.children[vnode.id]=vnodeNew,vnode.id=0,vnode.parent=vnodeNew,diffComponentProps(component,vnode=vnodeNew,props)}else vnode=new VNode(parent.children.length,null,null,parent.element),(component=createComponent(ctor)).vnode=vnode,vnode.component=component,parent.children.push(vnode),parent.element.appendChild(component.base),diffComponentProps(component,vnode,props);return parent.index++,stack[++stackIndex]=vnode,component.depth=stackIndex,component.render(),component.dirty=!1,vnode.index!==vnode.children.length&&removeUnusedNodes(vnode),vnode.index=0,stackIndex--,component},diffComponentProps=(component,node,props)=>{const prevProps=node.props;if(props!==prevProps)if(props){if(prevProps){for(let key in prevProps)void 0===props[key]&&("$"===key[0]?component[key]=component.state[key.slice(1)]:component[key]=null);for(let key in props){const value=props[key];component[key]!==value&&(component[key]=value)}}else for(let key in props)component[key]=props[key];node.props=props}else if(prevProps){for(let key in prevProps)"$"===key[0]?component[key]=component.state[ket.slice(1)]:component[key]=null;node.props=null}},createComponent=ctor=>{const component=new ctor;return component.mount&&component.mount(),component.dirty=!0,component},removeComponent=component=>{component.remove(),component.base.remove()},setProp=(element,name,value)=>{if("class"===name)element.className=value;else if("style"===name)if("object"==typeof value){const elementStyle=element.style;for(let key in value)elementStyle[key]=value[key]}else element.style.cssText=value;else"o"===name[0]&&"n"===name[1]?element[name]=value:element.setAttribute(name,value)},unsetProp=function(element,name){"class"===name?element.className="":"style"===name?element.style.cssText="":"o"===name[0]&&"n"===name[1]?element[name]=null:element.removeAttribute(name)},removeUnusedNodes=node=>{const children=node.children;for(let n=node.index;n<children.length;n++){const child=children[n];removeNode(child)}children.length=node.index},removeNode=node=>{node.component?removeComponent(node.component):node.element.parentElement&&node.element.parentElement.removeChild(node.element);const children=node.children;for(let n=0;n<children.length;n++){const child=children[n];removeNode(child)}node.children.length=0};modules[5]={elementOpen:elementOpen,elementClose:elementClose,elementVoid:(type,props)=>{const node=elementOpen(type,props);return elementClose(type),node},element:(element,props)=>{const node=elementOpen(element.localName,props,element);return elementClose(element.localName),node},componentVoid:componentVoid,text:text=>{const parent=stack[stackIndex];let vnode=parent.children[parent.index];if(vnode)if("#text"===vnode.type)vnode.element.nodeValue!==text&&(vnode.element.nodeValue=text);else{const element=document.createTextNode(text);vnode.component?(vnode.element.replaceChild(element,vnode.component.base),removeComponent(vnode.component),vnode.component=null):vnode.element.parentElement.replaceChild(element,vnode.element),removeUnusedNodes(vnode),vnode.type="#text",vnode.element=element}else{const element=document.createTextNode(text);vnode=new VNode(parent.children.length,"#text",null,element),parent.children.push(vnode),parent.element.appendChild(element)}return parent.index++,vnode},render:function(component,parentElement){bodyNode||(bodyNode=new VNode(0,"body",null,parentElement)),stackIndex=0,stack[0]=bodyNode,componentVoid(component),bodyNode.index!==bodyNode.children.length&&removeUnusedNodes(bodyNode),bodyNode.index=0},renderInstance:function(instance){const vnode=instance.vnode;stackIndex=instance.depth,stack[instance.depth]=vnode,instance.render(),instance.dirty=!1,vnode.index!==vnode.children.length&&removeUnusedNodes(vnode),vnode.index=0},removeAll:()=>{removeUnusedNodes(bodyNode)},getBodyNode:()=>bodyNode}}(),function(){modules[5].getBodyNode;let tabs="";const dumpNode=node=>{const tag=node.component?"component":node.type,children=node.children;if(children.length>0){dumpOpen(tag);for(let n=0;n<children.length;n++)dumpNode(children[n]);dumpClose(tag)}else dumpVoid(tag)},dumpOpen=name=>{console.log(tabs+"<"+name+">"),incTabs()},dumpClose=name=>{decTabs(),console.log(tabs+"</"+name+">")},dumpVoid=name=>{console.log(tabs+"<"+name+"></"+name+">")},incTabs=()=>{tabs+="\t"},decTabs=()=>{tabs=tabs.substring(0,tabs.length-1)};modules[6]=(node=>{console.log("---"),dumpNode(node),console.log("\n")})}(),function(){modules[2].VNode;var __module5=modules[5],render=__module5.render,renderInstance=__module5.renderInstance,removeAll=__module5.removeAll;__module5.getBodyNode,modules[6];const updateBuffer=[],routes=[];let needUpdate=!1,needUpdateRoute=!1,currRouteResult=[],currRoute=null,url=null;const renderLoop=function(){needUpdate&&updateRender(),needUpdateRoute&&updateRoute(),window.requestAnimationFrame(renderLoop)},updateRender=function(){updateBuffer.sort(sortByDepth);for(let n=0;n<updateBuffer.length;n++){const node=updateBuffer[n];node.dirty&&renderInstance(node)}updateBuffer.length=0,needUpdate=!1},sortByDepth=function(a,b){return a.depth-b.depth},updateRoute=function(){let result;(url=document.location.hash)||(url="/"),currRouteResult.length=0;for(let n=0;n<routes.length;n++){const routeItem=routes[n];if(routeItem.regexp){const regex=new RegExp(routeItem.regexp,"g");for(;result=regex.exec(url);)currRouteResult.push(result);if(0===currRouteResult.length)continue}if(currRoute===routeItem)break;currRoute&&currRoute.exitFunc&&currRoute.exitFunc(),(currRoute=routeItem).enterFunc&&currRoute.enterFunc(currRouteResult),render(currRoute.component,document.body),currRoute.readyFunc&&currRoute.readyFunc();break}currRoute||console.warn("Could not found route for: "+url),needUpdateRoute=!1};window.addEventListener("hashchange",()=>{updateRoute()}),renderLoop(),modules[4]={update:function(instance){instance.dirty||(instance.dirty=!0,updateBuffer.push(instance),needUpdate=!0)},route:function(regexp,component,enterFunc,exitFunc,readyFunc){routes.push(new function(regexp,component,enterFunc,exitFunc,readyFunc){this.regexp=regexp,this.component=component,this.enterFunc=enterFunc||null,this.exitFunc=exitFunc||null,this.readyFunc=readyFunc||null}(regexp,component,enterFunc,exitFunc,readyFunc)),needUpdateRoute=!0},clearRoutes:function(remove){routes.length=0,currRoute=null,remove&&removeAll()}}}(),function(){modules[4].update;function WatcherBuffer(){this.funcs=[],this.buffer=null}function Store(){this.data={},this.proxies=[],this.emitting=0,this.removeWatchers=[],this.watchers=new WatcherBuffer,this.watchers.buffer={}}Store.prototype={set:function(key,value){this.dispatch({action:"SET",key:key,value:value})},add:function(key,value){this.dispatch({action:"ADD",key:key,value:value})},remove:function(key,value){this.dispatch({action:"REMOVE",key:key,value:value})},update:function(key,value){this.dispatch({action:"UPDATE",key:key})},dispatch:function(data){this.globalProxy?this.globalProxy(data):this.handle(data,null)},performSet:function(payload,promise){const tuple=this.getData(payload.key);tuple&&(payload.key?(tuple.data[tuple.key]=payload.value,promise?promise.then((resolve,reject)=>{this.emit({action:"SET",key:tuple.parentKey,value:tuple.data},tuple.watchers,"SET",tuple.key,payload.value)}):this.emit({action:"SET",key:tuple.parentKey,value:tuple.data},tuple.watchers,"SET",tuple.key,payload.value)):(this.data=payload.value,promise?promise.then((resolve,reject)=>{this.emitWatchers({action:"SET",key:"",value:payload.value},this.watchers)}):this.emitWatchers({action:"SET",key:"",value:payload.value},this.watchers)))},performAdd:function(payload,promise){const tuple=this.getData(payload.key);if(!tuple)return;let array=tuple.data[tuple.key];if(array){if(!Array.isArray(array))return void console.warn("(store) Data at key '"+payload.key+"' is not an Array");array.push(payload.value)}else array=[payload.value],tuple.data[tuple.key]=array;const funcs=tuple.watchers.funcs;if(funcs){const payloadSet={action:"SET",key:tuple.key,value:tuple.data};for(let n=0;n<funcs.length;n++)funcs[n](payloadSet);const buffer=tuple.watchers.buffer;if(buffer){const watchers=buffer[tuple.key];if(watchers){const funcs=watchers.funcs;if(funcs){payloadSet.value=array;for(let n=0;n<funcs.length;n++)funcs[n](payloadSet)}}}}},performRemove:function(payload,promise){const tuple=this.getData(payload.key);if(!tuple)return;const data=payload.value?tuple.data[tuple.key]:tuple.data;if(Array.isArray(data)){let index;if(void 0!==payload.value){if(-1===(index=data.indexOf(payload.value)))return;data.splice(index,1)}else index=parseInt(tuple.key),data.splice(index,1);const payloadOut={action:"SET",key:null,value:null};if(payload.value){payloadOut.key=tuple.key,payloadOut.value=data;const funcs=tuple.watchers.buffer[tuple.key].funcs;for(let n=0;n<funcs.length;n++)funcs[n](payloadOut)}else{if(tuple.parentKey){payloadOut.key=tuple.parentKey,payloadOut.value=data;const watchers=tuple.watchers.funcs;if(watchers)for(let n=0;n<watchers.length;n++)watchers[n](payloadOut)}const buffer=tuple.watchers.buffer;for(let key in buffer){const keyIndex=parseInt(key);keyIndex>=index&&data.length>keyIndex&&(payloadOut.key=key,payloadOut.value=data[keyIndex],this.emitWatchers(payloadOut,buffer[key]))}}}else{if(void 0!==payload.value)return delete data[payload.value],void this.emitWatchers({action:"REMOVE",key:payload.value},tuple.watchers.buffer[tuple.key]);delete data[tuple.key],this.emit({action:"SET",key:tuple.parentKey,value:tuple.data},tuple.watchers,"REMOVE",tuple.key,null)}},performUpdate:function(payload){const tuple=this.getData(payload.key);if(!tuple)return;if(!tuple.watchers)return;const watchers=tuple.watchers.buffer[tuple.key];watchers&&this.emitWatchers({action:"SET",key:payload.key,value:tuple.data[tuple.key]},watchers)},handle:function(data,promise){for(let n=0;n<this.proxies.length;n++){const proxy=this.proxies[n];if(0===data.key.indexOf(proxy.key)&&proxy.func(data))return}switch(data.action){case"SET":this.performSet(data,promise);break;case"ADD":this.performAdd(data,promise);break;case"REMOVE":this.performRemove(data,promise);break;case"UPDATE":this.performUpdate(data,promise)}},watch:function(path,func){if(!path)return;let watchers=this.watchers;const keys=path.split("/");for(let n=0;n<keys.length;n++){const key=keys[n],buffer=watchers.buffer;if(!buffer){watchers=this.fillWatchers(watchers,keys,n);break}{const nextWatchers=buffer[key];if(!nextWatchers){const newWatchers=new WatcherBuffer;watchers.buffer[key]=newWatchers,watchers=this.fillWatchers(newWatchers,keys,n+1);break}watchers=nextWatchers}}watchers.funcs.push(func)},fillWatchers:function(watchers,keys,index){for(let n=index;n<keys.length;n++){const newWatcher=new WatcherBuffer;watchers.buffer={},watchers.buffer[keys[n]]=newWatcher,watchers=newWatcher}return watchers},unwatch:function(path,func){if(!path)return;if(this.emitting){const removeInfo=new function(path,func){this.path=path,this.func=func}(path,func);return void this.removeWatchers.push(removeInfo)}let watchers=this.watchers,prevWatchers=null;const keys=path.split("/");for(let n=0;n<keys.length;n++){if(!watchers.buffer)return void console.warn("(store.unwatch) Watcher can not be found for:",path);if(prevWatchers=watchers,!(watchers=watchers.buffer[keys[n]]))return}const funcs=watchers.funcs,index=funcs.indexOf(func);-1!==index?(funcs[index]=funcs[funcs.length-1],funcs.pop()):console.warn("(store.unwatch) Watcher can not be found for:",path)},emit:function(payload,watchers,action,key,value){if(!watchers)return;this.emitting++;const funcs=watchers.funcs;if(funcs)for(let n=0;n<funcs.length;n++)funcs[n](payload);if((watchers=watchers.buffer?watchers.buffer[key]:null)&&(payload.action=action,payload.key=key,payload.value=value,this.emitWatchers(payload,watchers)),this.emitting--,0===this.emitting&&this.removeWatchers.length>0){for(let n=0;n<this.removeWatchers.length;n++){const info=this.removeWatchers[n];this.unwatch(info.path,info.func)}this.removeWatchers.length=0}},emitWatchers:function(payload,watchers){this.emitting++;const funcs=watchers.funcs;if(funcs)for(let n=0;n<funcs.length;n++)funcs[n](payload);const buffer=watchers.buffer;if(buffer){const value=payload.value;if(value&&"object"==typeof value)for(let key in buffer)payload.key=key,payload.value=void 0===value[key]?null:value[key],this.emitWatchers(payload,buffer[key]);else{payload.value=null;for(let key in buffer)payload.key=key,this.emitWatchers(payload,buffer[key])}}this.emitting--},get:function(key){if(!key)return void 0===key?"":this.data;const buffer=key.split("/");let data=this.data;for(let n=0;n<buffer.length;n++){const id=buffer[n];if("@"===id)return buffer[n-1];if(void 0===(data=data[id]))return null}return data},getData:function(path){if(!path){return{data:this.data,key:null,parentKey:null,watchers:null}}const keys=path.split("/"),num=keys.length-1;if(0===num){return{data:this.data,key:keys[0],parentKey:null,watchers:this.watchers}}let data=this.data,watchers=this.watchers;for(let n=0;n<num;n++){const key=keys[n],newData=data[key];if(!newData)return console.warn("(store.getData) No data available with key: ["+keys[n]+"] with path: ["+path+"]"),null;data=newData,watchers&&(watchers=watchers.buffer?watchers.buffer[key]:null)}return{data:data,key:keys[num],parentKey:keys[num-1],watchers:watchers}},addProxy:function(key,func){if(""===key){if(this.globalProxy)return void console.warn("(wabi.proxy) There is already global proxy declared");this.globalProxy=func}else{for(let n=0;n<this.proxies.length;n++){const proxy=this.proxies[n];if(proxy.key===key&&proxy.func===func)return void console.warn("(wabi.proxy) There is already a proxy declared with key:",key)}const proxy=new function(key,func){this.key=key,this.func=func}(key,func);this.proxies.push(proxy)}},removeProxy:function(key,func){if(""===key){if(this.globalProxy!==func)return void console.warn("(wabi.proxy) Global proxy functions don`t match");this.globalProxy=null}else for(let n=0;n<this.proxies.length;n++){const proxy=this.proxies[n];if(proxy.key===key&&proxy.func===func)return this.proxies[n]=this.proxies[this.proxies.length-1],void this.proxies.pop()}},toJSON:function(){return this.data}};const store=new Store;modules[7]={store:store,lastSegment:function(str){const index=str.lastIndexOf("/");return-1===index?null:str.slice(index+1)}}}(),function(){var update=modules[4].update,store=modules[7].store;let componentIndex=0;function WabiComponentInternal(){this.bindFuncs={},this.vnode=null,this.dirty=!1,this.base=document.createTextNode("");const currState={};for(let key in this.state)currState[key]=this.state[key];this.$=currState}WabiComponentInternal.prototype={_bind:null,mount:null,unmount:null,render:null,state:{value:null},remove:function(){this.unmount&&this.unmount(),this.reset()},reset:function(){if("string"==typeof this._bind)store.unwatch(this._bind,this.bindFuncs.value);else for(let key in this._bind)store.unwatch(this._bind[key],this.bindFuncs[key]);this._bind=null,this.dirty=!1;const currState=this.$,initState=this.state;for(let key in currState)currState[key]=initState[key]},handleAction:function(state,value){this.$[state]=value,update(this)},setState:function(key,value){if(this.$[key]!==value)if(this._bind)if("string"==typeof this._bind)"value"===key?store.set(this._bind,value,!0):(this.$[key]=value,update(this));else{const binding=this._bind[key];binding?store.set(binding,value,!0):(this.$[key]=value,update(this))}else this.$[key]=value,update(this)},set bind(value){const prevBind=this._bind;if(prevBind)if(value)if("string"==typeof prevBind){if(prevBind!==value){const func=this.bindFuncs.value;store.unwatch(prevBind,func),store.watch(value,func)}this.$.value=store.get(value)}else{for(let key in prevBind)if(void 0===value[key]){const func=this.bindFuncs[key];store.unwatch(prevBind[key],func),this.bindFuncs[key]=void 0}for(let key in value){const bindPath=value[key];if(prevBind[key]!==bindPath){let func=this.bindFuncs[key];func||(func=(payload=>{this.handleAction(key,payload.value)}),this.bindFuncs[key]=func),store.unwatch(prevBind[key],func),store.watch(bindPath,func),this.$[key]=store.get(bindPath)}}}else if("string"==typeof prevBind)store.unwatch(prevBind,this.bindFuncs.value),this.$.value=this.state.value;else for(let key in prevBind)store.unwatch(prevBind[key],this.bindFuncs[key]),this.bindFuncs[key]=void 0,this.$[key]=this.state[key];else if("string"==typeof value){const func=payload=>{this.handleAction("value",payload.value)};this.bindFuncs.value=func,store.watch(value,func),this.$.value=store.get(value)}else for(let key in value){const bindValue=value[key];if(!bindValue)continue;const func=payload=>{this.handleAction(key,payload.value)};this.bindFuncs[key]=func,store.watch(bindValue,func),this.$[key]=store.get(bindValue)}this._bind=value,this.dirty=!0},get bind(){return this._bind},updateAll:function(){update(this);const children=this.vnode.children;for(let n=0;n<children.length;n++){const child=children[n];child.component&&update(child.component)}}};modules[3]={component:componentProto=>{function WabiComponent(){WabiComponentInternal.call(this)}const proto=Object.create(WabiComponentInternal.prototype);for(let key in componentProto){const param=Object.getOwnPropertyDescriptor(componentProto,key);param.get||param.set?Object.defineProperty(proto,key,param):proto[key]=componentProto[key]}proto.__componentIndex=componentIndex++;const states=proto.state;for(let key in states)Object.defineProperty(proto,"$"+key,{set:function(value){this.setState(key,value)},get:function(){return this.$[key]}});return WabiComponent.prototype=proto,WabiComponent.prototype.constructor=WabiComponent,WabiComponent}}}(),modules[8]={lastSegment:str=>{const index=str.lastIndexOf(".");return-1===index?null:str.slice(index+1)},selectElementContents:node=>{const range=document.createRange();range.selectNodeContents(node);const selection=window.getSelection();selection.removeAllRanges(),selection.addRange(range)}},function(){var VNode=modules[2].VNode,component=modules[3].component,__module5=modules[5],elementOpen=__module5.elementOpen,elementClose=__module5.elementClose,elementVoid=__module5.elementVoid,element=__module5.element,componentVoid=__module5.componentVoid,text=__module5.text,render=__module5.render,__module4=modules[4],update=__module4.update,route=__module4.route,clearRoutes=__module4.clearRoutes,__module7=modules[7],store=__module7.store,lastSegment=__module7.lastSegment,__module8=modules[8],selectElementContents=(lastSegment=__module8.lastSegment,__module8.selectElementContents);window.wabi={VNode:VNode,component:component,elementOpen:elementOpen,elementClose:elementClose,elementVoid:elementVoid,element:element,componentVoid:componentVoid,text:text,render:render,update:update,route:route,clearRoutes:clearRoutes,store:store,lastSegment:lastSegment,lastSegment:lastSegment,selectElementContents:selectElementContents}}();