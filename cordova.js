(function(){
    var CORDOVA_JS_BUILD_LABEL="2.8.0-0-g6208c95";
    var require,define;
    (function(){
        var modules={},requireStack=[],inProgressModules={},SEPERATOR=".";
        function build(module){
            var factory=module.factory,localRequire=function(id){
                var resultantId=id;
                if(id.charAt(0)==="."){
                    resultantId=module.id.slice(0,module.id.lastIndexOf(SEPERATOR))+SEPERATOR+id.slice(2)
                    }
                    return require(resultantId)
                };
                
            module.exports={};
            
            delete module.factory;
            factory(localRequire,module.exports,module);
            return module.exports
            }
            require=function(id){
            if(!modules[id]){
                throw"module "+id+" not found"
                }else{
                if(id in inProgressModules){
                    var cycle=requireStack.slice(inProgressModules[id]).join("->")+"->"+id;
                    throw"Cycle in require graph: "+cycle
                    }
                }
            if(modules[id].factory){
            try{
                inProgressModules[id]=requireStack.length;
                requireStack.push(id);
                return build(modules[id])
                }finally{
                delete inProgressModules[id];
                requireStack.pop()
                }
            }
        return modules[id].exports
    };
    
    define=function(id,factory){
        if(modules[id]){
            throw"module "+id+" already defined"
            }
            modules[id]={
            id:id,
            factory:factory
        }
    };
    
define.remove=function(id){
    delete modules[id]
};

define.moduleMap=modules
})();
if(typeof module==="object"&&typeof require==="function"){
    module.exports.require=require;
    module.exports.define=define
    }
    define("cordova",function(require,exports,module){
    var channel=require("cordova/channel");
    document.addEventListener("DOMContentLoaded",function(){
        channel.onDOMContentLoaded.fire()
        },false);
    if(document.readyState=="complete"||document.readyState=="interactive"){
        channel.onDOMContentLoaded.fire()
        }
        var m_document_addEventListener=document.addEventListener;
    var m_document_removeEventListener=document.removeEventListener;
    var m_window_addEventListener=window.addEventListener;
    var m_window_removeEventListener=window.removeEventListener;
    var documentEventHandlers={},windowEventHandlers={};
    
    document.addEventListener=function(evt,handler,capture){
        var e=evt.toLowerCase();
        if(typeof documentEventHandlers[e]!="undefined"){
            documentEventHandlers[e].subscribe(handler)
            }else{
            m_document_addEventListener.call(document,evt,handler,capture)
            }
        };
    
window.addEventListener=function(evt,handler,capture){
    var e=evt.toLowerCase();
    if(typeof windowEventHandlers[e]!="undefined"){
        windowEventHandlers[e].subscribe(handler)
        }else{
        m_window_addEventListener.call(window,evt,handler,capture)
        }
    };

document.removeEventListener=function(evt,handler,capture){
    var e=evt.toLowerCase();
    if(typeof documentEventHandlers[e]!="undefined"){
        documentEventHandlers[e].unsubscribe(handler)
        }else{
        m_document_removeEventListener.call(document,evt,handler,capture)
        }
    };

window.removeEventListener=function(evt,handler,capture){
    var e=evt.toLowerCase();
    if(typeof windowEventHandlers[e]!="undefined"){
        windowEventHandlers[e].unsubscribe(handler)
        }else{
        m_window_removeEventListener.call(window,evt,handler,capture)
        }
    };

function createEvent(type,data){
    var event=document.createEvent("Events");
    event.initEvent(type,false,false);
    if(data){
        for(var i in data){
            if(data.hasOwnProperty(i)){
                event[i]=data[i]
                }
            }
        }
        return event
}
if(typeof window.console==="undefined"){
    window.console={
        log:function(){}
    }
}
var cordova={
    define:define,
    require:require,
    addWindowEventHandler:function(event){
        return(windowEventHandlers[event]=channel.create(event))
        },
    addStickyDocumentEventHandler:function(event){
        return(documentEventHandlers[event]=channel.createSticky(event))
        },
    addDocumentEventHandler:function(event){
        return(documentEventHandlers[event]=channel.create(event))
        },
    removeWindowEventHandler:function(event){
        delete windowEventHandlers[event]
    },
    removeDocumentEventHandler:function(event){
        delete documentEventHandlers[event]
    },
    getOriginalHandlers:function(){
        return{
            document:{
                addEventListener:m_document_addEventListener,
                removeEventListener:m_document_removeEventListener
            },
            window:{
                addEventListener:m_window_addEventListener,
                removeEventListener:m_window_removeEventListener
            }
        }
    },
fireDocumentEvent:function(type,data,bNoDetach){
    var evt=createEvent(type,data);
    if(typeof documentEventHandlers[type]!="undefined"){
        if(bNoDetach){
            documentEventHandlers[type].fire(evt)
            }else{
            setTimeout(function(){
                if(type=="deviceready"){
                    document.dispatchEvent(evt)
                    }
                    documentEventHandlers[type].fire(evt)
                },0)
            }
        }else{
    document.dispatchEvent(evt)
    }
},
fireWindowEvent:function(type,data){
    var evt=createEvent(type,data);
    if(typeof windowEventHandlers[type]!="undefined"){
        setTimeout(function(){
            windowEventHandlers[type].fire(evt)
            },0)
        }else{
        window.dispatchEvent(evt)
        }
    },
callbackId:Math.floor(Math.random()*2000000000),
callbacks:{},
callbackStatus:{
    NO_RESULT:0,
    OK:1,
    CLASS_NOT_FOUND_EXCEPTION:2,
    ILLEGAL_ACCESS_EXCEPTION:3,
    INSTANTIATION_EXCEPTION:4,
    MALFORMED_URL_EXCEPTION:5,
    IO_EXCEPTION:6,
    INVALID_ACTION:7,
    JSON_EXCEPTION:8,
    ERROR:9
},
callbackSuccess:function(callbackId,args){
    try{
        cordova.callbackFromNative(callbackId,true,args.status,[args.message],args.keepCallback)
        }catch(e){
        console.log("Error in error callback: "+callbackId+" = "+e)
        }
    },
callbackError:function(callbackId,args){
    try{
        cordova.callbackFromNative(callbackId,false,args.status,[args.message],args.keepCallback)
        }catch(e){
        console.log("Error in error callback: "+callbackId+" = "+e)
        }
    },
callbackFromNative:function(callbackId,success,status,args,keepCallback){
    var callback=cordova.callbacks[callbackId];
    if(callback){
        if(success&&status==cordova.callbackStatus.OK){
            callback.success&&callback.success.apply(null,args)
            }else{
            if(!success){
                callback.fail&&callback.fail.apply(null,args)
                }
            }
        if(!keepCallback){
        delete cordova.callbacks[callbackId]
    }
}
},
addConstructor:function(func){
    channel.onCordovaReady.subscribe(function(){
        try{
            func()
            }catch(e){
            console.log("Failed to run constructor: "+e)
            }
        })
}
};

channel.onPause=cordova.addDocumentEventHandler("pause");
channel.onResume=cordova.addDocumentEventHandler("resume");
channel.onDeviceReady=cordova.addStickyDocumentEventHandler("deviceready");
module.exports=cordova
});
define("cordova/argscheck",function(require,exports,module){
    var exec=require("cordova/exec");
    var utils=require("cordova/utils");
    var moduleExports=module.exports;
    var typeMap={
        A:"Array",
        D:"Date",
        N:"Number",
        S:"String",
        F:"Function",
        O:"Object"
    };
    
    function extractParamName(callee,argIndex){
        return(/.*?\((.*?)\)/).exec(callee)[1].split(", ")[argIndex]
        }
        function checkArgs(spec,functionName,args,opt_callee){
        if(!moduleExports.enableChecks){
            return
        }
        var errMsg=null;
        var typeName;
        for(var i=0;i<spec.length;++i){
            var c=spec.charAt(i),cUpper=c.toUpperCase(),arg=args[i];
            if(c=="*"){
                continue
            }
            typeName=utils.typeName(arg);
            if((arg===null||arg===undefined)&&c==cUpper){
                continue
            }
            if(typeName!=typeMap[cUpper]){
                errMsg="Expected "+typeMap[cUpper];
                break
            }
        }
        if(errMsg){
        errMsg+=", but got "+typeName+".";
        errMsg='Wrong type for parameter "'+extractParamName(opt_callee||args.callee,i)+'" of '+functionName+": "+errMsg;
        if(typeof jasmine=="undefined"){
            console.error(errMsg)
            }
            throw TypeError(errMsg)
        }
    }
function getValue(value,defaultValue){
    return value===undefined?defaultValue:value
    }
    moduleExports.checkArgs=checkArgs;
moduleExports.getValue=getValue;
moduleExports.enableChecks=true
});
define("cordova/builder",function(require,exports,module){
    var utils=require("cordova/utils");
    function each(objects,func,context){
        for(var prop in objects){
            if(objects.hasOwnProperty(prop)){
                func.apply(context,[objects[prop],prop])
                }
            }
        }
        function clobber(obj,key,value){
    exports.replaceHookForTesting(obj,key);
    obj[key]=value;
    if(obj[key]!==value){
        utils.defineGetter(obj,key,function(){
            return value
            })
        }
    }
function assignOrWrapInDeprecateGetter(obj,key,value,message){
    if(message){
        utils.defineGetter(obj,key,function(){
            console.log(message);
            delete obj[key];
            clobber(obj,key,value);
            return value
            })
        }else{
        clobber(obj,key,value)
        }
    }
function include(parent,objects,clobber,merge){
    each(objects,function(obj,key){
        try{
            var result=obj.path?require(obj.path):{};
            
            if(clobber){
                if(typeof parent[key]==="undefined"){
                    assignOrWrapInDeprecateGetter(parent,key,result,obj.deprecated)
                    }else{
                    if(typeof obj.path!=="undefined"){
                        if(merge){
                            recursiveMerge(parent[key],result)
                            }else{
                            assignOrWrapInDeprecateGetter(parent,key,result,obj.deprecated)
                            }
                        }
                }
            result=parent[key]
        }else{
        if(typeof parent[key]=="undefined"){
            assignOrWrapInDeprecateGetter(parent,key,result,obj.deprecated)
            }else{
            result=parent[key]
            }
        }
    if(obj.children){
        include(result,obj.children,clobber,merge)
        }
    }catch(e){
    utils.alert("Exception building cordova JS globals: "+e+' for key "'+key+'"')
    }
})
}
function recursiveMerge(target,src){
    for(var prop in src){
        if(src.hasOwnProperty(prop)){
            if(target.prototype&&target.prototype.constructor===target){
                clobber(target.prototype,prop,src[prop])
                }else{
                if(typeof src[prop]==="object"&&typeof target[prop]==="object"){
                    recursiveMerge(target[prop],src[prop])
                    }else{
                    clobber(target,prop,src[prop])
                    }
                }
        }
    }
}
exports.buildIntoButDoNotClobber=function(objects,target){
    include(target,objects,false,false)
    };
    
exports.buildIntoAndClobber=function(objects,target){
    include(target,objects,true,false)
    };
    
exports.buildIntoAndMerge=function(objects,target){
    include(target,objects,true,true)
    };
    
exports.recursiveMerge=recursiveMerge;
exports.assignOrWrapInDeprecateGetter=assignOrWrapInDeprecateGetter;
exports.replaceHookForTesting=function(){}
});
define("cordova/channel",function(require,exports,module){
    var utils=require("cordova/utils"),nextGuid=1;
    var Channel=function(type,sticky){
        this.type=type;
        this.handlers={};
        
        this.state=sticky?1:0;
        this.fireArgs=null;
        this.numHandlers=0;
        this.onHasSubscribersChange=null
        },channel={
        join:function(h,c){
            var len=c.length,i=len,f=function(){
                if(!(--i)){
                    h()
                    }
                };
            
        for(var j=0;j<len;j++){
            if(c[j].state===0){
                throw Error("Can only use join with sticky channels.")
                }
                c[j].subscribe(f)
            }
            if(!len){
            h()
            }
        },
create:function(type){
    return channel[type]=new Channel(type,false)
    },
createSticky:function(type){
    return channel[type]=new Channel(type,true)
    },
deviceReadyChannelsArray:[],
deviceReadyChannelsMap:{},
waitForInitialization:function(feature){
    if(feature){
        var c=channel[feature]||this.createSticky(feature);
        this.deviceReadyChannelsMap[feature]=c;
        this.deviceReadyChannelsArray.push(c)
        }
    },
initializationComplete:function(feature){
    var c=this.deviceReadyChannelsMap[feature];
    if(c){
        c.fire()
        }
    }
};

function forceFunction(f){
    if(typeof f!="function"){
        throw"Function required as first argument!"
        }
    }
Channel.prototype.subscribe=function(f,c){
    forceFunction(f);
    if(this.state==2){
        f.apply(c||this,this.fireArgs);
        return
    }
    var func=f,guid=f.observer_guid;
    if(typeof c=="object"){
        func=utils.close(c,f)
        }
        if(!guid){
        guid=""+nextGuid++
    }
    func.observer_guid=guid;
    f.observer_guid=guid;
    if(!this.handlers[guid]){
        this.handlers[guid]=func;
        this.numHandlers++;
        if(this.numHandlers==1){
            this.onHasSubscribersChange&&this.onHasSubscribersChange()
            }
        }
};

Channel.prototype.unsubscribe=function(f){
    forceFunction(f);
    var guid=f.observer_guid,handler=this.handlers[guid];
    if(handler){
        delete this.handlers[guid];
        this.numHandlers--;
        if(this.numHandlers===0){
            this.onHasSubscribersChange&&this.onHasSubscribersChange()
            }
        }
};

Channel.prototype.fire=function(e){
    var fail=false,fireArgs=Array.prototype.slice.call(arguments);
    if(this.state==1){
        this.state=2;
        this.fireArgs=fireArgs
        }
        if(this.numHandlers){
        var toCall=[];
        for(var item in this.handlers){
            toCall.push(this.handlers[item])
            }
            for(var i=0;i<toCall.length;++i){
            toCall[i].apply(this,fireArgs)
            }
            if(this.state==2&&this.numHandlers){
            this.numHandlers=0;
            this.handlers={};
            
            this.onHasSubscribersChange&&this.onHasSubscribersChange()
            }
        }
};

channel.createSticky("onDOMContentLoaded");
channel.createSticky("onNativeReady");
channel.createSticky("onCordovaReady");
channel.createSticky("onCordovaInfoReady");
channel.createSticky("onCordovaConnectionReady");
channel.createSticky("onPluginsReady");
channel.createSticky("onDeviceReady");
channel.create("onResume");
channel.create("onPause");
channel.createSticky("onDestroy");
channel.waitForInitialization("onCordovaReady");
channel.waitForInitialization("onCordovaConnectionReady");
channel.waitForInitialization("onDOMContentLoaded");
module.exports=channel
});
define("cordova/commandProxy",function(require,exports,module){
    var CommandProxyMap={};
    
    module.exports={
        add:function(id,proxyObj){
            console.log("adding proxy for "+id);
            CommandProxyMap[id]=proxyObj;
            return proxyObj
            },
        remove:function(id){
            var proxy=CommandProxyMap[id];
            delete CommandProxyMap[id];
            CommandProxyMap[id]=null;
            return proxy
            },
        get:function(service,action){
            return(CommandProxyMap[service]?CommandProxyMap[service][action]:null)
            }
        }
});
define("cordova/exec",function(require,exports,module){
    var cordova=require("cordova"),nativeApiProvider=require("cordova/plugin/android/nativeapiprovider"),utils=require("cordova/utils"),jsToNativeModes={
        PROMPT:0,
        JS_OBJECT:1,
        LOCATION_CHANGE:2
    },nativeToJsModes={
        POLLING:0,
        LOAD_URL:1,
        ONLINE_EVENT:2,
        PRIVATE_API:3
    },jsToNativeBridgeMode,nativeToJsBridgeMode=nativeToJsModes.ONLINE_EVENT,pollEnabled=false,messagesFromNative=[];
    function androidExec(success,fail,service,action,args){
        if(jsToNativeBridgeMode===undefined){
            androidExec.setJsToNativeBridgeMode(jsToNativeModes.JS_OBJECT)
            }
            for(var i=0;i<args.length;i++){
            if(utils.typeName(args[i])=="ArrayBuffer"){
                args[i]=window.btoa(String.fromCharCode.apply(null,new Uint8Array(args[i])))
                }
            }
        var callbackId=service+cordova.callbackId++,argsJson=JSON.stringify(args);
    if(success||fail){
        cordova.callbacks[callbackId]={
            success:success,
            fail:fail
        }
    }
    if(jsToNativeBridgeMode==jsToNativeModes.LOCATION_CHANGE){
    window.location="http://cdv_exec/"+service+"#"+action+"#"+callbackId+"#"+argsJson
    }else{
    var messages=nativeApiProvider.get().exec(service,action,callbackId,argsJson);
    if(jsToNativeBridgeMode==jsToNativeModes.JS_OBJECT&&messages==="@Null arguments."){
        androidExec.setJsToNativeBridgeMode(jsToNativeModes.PROMPT);
        androidExec(success,fail,service,action,args);
        androidExec.setJsToNativeBridgeMode(jsToNativeModes.JS_OBJECT);
        return
    }else{
        androidExec.processMessages(messages)
        }
    }
}
function pollOnce(){
    var msg=nativeApiProvider.get().retrieveJsMessages();
    androidExec.processMessages(msg)
    }
    function pollingTimerFunc(){
    if(pollEnabled){
        pollOnce();
        setTimeout(pollingTimerFunc,50)
        }
    }
function hookOnlineApis(){
    function proxyEvent(e){
        cordova.fireWindowEvent(e.type)
        }
        window.addEventListener("online",pollOnce,false);
    window.addEventListener("offline",pollOnce,false);
    cordova.addWindowEventHandler("online");
    cordova.addWindowEventHandler("offline");
    document.addEventListener("online",proxyEvent,false);
    document.addEventListener("offline",proxyEvent,false)
    }
    hookOnlineApis();
androidExec.jsToNativeModes=jsToNativeModes;
androidExec.nativeToJsModes=nativeToJsModes;
androidExec.setJsToNativeBridgeMode=function(mode){
    if(mode==jsToNativeModes.JS_OBJECT&&!window._cordovaNative){
        console.log("Falling back on PROMPT mode since _cordovaNative is missing. Expected for Android 3.2 and lower only.");
        mode=jsToNativeModes.PROMPT
        }
        nativeApiProvider.setPreferPrompt(mode==jsToNativeModes.PROMPT);
    jsToNativeBridgeMode=mode
    };
    
androidExec.setNativeToJsBridgeMode=function(mode){
    if(mode==nativeToJsBridgeMode){
        return
    }
    if(nativeToJsBridgeMode==nativeToJsModes.POLLING){
        pollEnabled=false
        }
        nativeToJsBridgeMode=mode;
    nativeApiProvider.get().setNativeToJsBridgeMode(mode);
    if(mode==nativeToJsModes.POLLING){
        pollEnabled=true;
        setTimeout(pollingTimerFunc,1)
        }
    };

function processMessage(message){
    try{
        var firstChar=message.charAt(0);
        if(firstChar=="J"){
            eval(message.slice(1))
            }else{
            if(firstChar=="S"||firstChar=="F"){
                var success=firstChar=="S";
                var keepCallback=message.charAt(1)=="1";
                var spaceIdx=message.indexOf(" ",2);
                var status=+message.slice(2,spaceIdx);
                var nextSpaceIdx=message.indexOf(" ",spaceIdx+1);
                var callbackId=message.slice(spaceIdx+1,nextSpaceIdx);
                var payloadKind=message.charAt(nextSpaceIdx+1);
                var payload;
                if(payloadKind=="s"){
                    payload=message.slice(nextSpaceIdx+2)
                    }else{
                    if(payloadKind=="t"){
                        payload=true
                        }else{
                        if(payloadKind=="f"){
                            payload=false
                            }else{
                            if(payloadKind=="N"){
                                payload=null
                                }else{
                                if(payloadKind=="n"){
                                    payload=+message.slice(nextSpaceIdx+2)
                                    }else{
                                    if(payloadKind=="A"){
                                        var data=message.slice(nextSpaceIdx+2);
                                        var bytes=window.atob(data);
                                        var arraybuffer=new Uint8Array(bytes.length);
                                        for(var i=0;i<bytes.length;i++){
                                            arraybuffer[i]=bytes.charCodeAt(i)
                                            }
                                            payload=arraybuffer.buffer
                                        }else{
                                        if(payloadKind=="S"){
                                            payload=window.atob(message.slice(nextSpaceIdx+2))
                                            }else{
                                            payload=JSON.parse(message.slice(nextSpaceIdx+1))
                                            }
                                        }
                                }
                        }
                }
        }
}
cordova.callbackFromNative(callbackId,success,status,[payload],keepCallback)
}else{
    console.log("processMessage failed: invalid message:"+message)
    }
}
}catch(e){
    console.log("processMessage failed: Message: "+message);
    console.log("processMessage failed: Error: "+e);
    console.log("processMessage failed: Stack: "+e.stack)
    }
}
androidExec.processMessages=function(messages){
    if(messages){
        messagesFromNative.push(messages);
        if(messagesFromNative.length>1){
            return
        }while(messagesFromNative.length){
            messages=messagesFromNative[0];
            if(messages=="*"){
                messagesFromNative.shift();
                window.setTimeout(pollOnce,0);
                return
            }
            var spaceIdx=messages.indexOf(" ");
            var msgLen=+messages.slice(0,spaceIdx);
            var message=messages.substr(spaceIdx+1,msgLen);
            messages=messages.slice(spaceIdx+msgLen+1);
            processMessage(message);
            if(messages){
                messagesFromNative[0]=messages
                }else{
                messagesFromNative.shift()
                }
            }
    }
};

module.exports=androidExec
});
define("cordova/modulemapper",function(require,exports,module){
    var builder=require("cordova/builder"),moduleMap=define.moduleMap,symbolList,deprecationMap;
    exports.reset=function(){
        symbolList=[];
        deprecationMap={}
    };
    
function addEntry(strategy,moduleName,symbolPath,opt_deprecationMessage){
    if(!(moduleName in moduleMap)){
        throw new Error("Module "+moduleName+" does not exist.")
        }
        symbolList.push(strategy,moduleName,symbolPath);
    if(opt_deprecationMessage){
        deprecationMap[symbolPath]=opt_deprecationMessage
        }
    }
exports.clobbers=function(moduleName,symbolPath,opt_deprecationMessage){
    addEntry("c",moduleName,symbolPath,opt_deprecationMessage)
    };
    
exports.merges=function(moduleName,symbolPath,opt_deprecationMessage){
    addEntry("m",moduleName,symbolPath,opt_deprecationMessage)
    };
    
exports.defaults=function(moduleName,symbolPath,opt_deprecationMessage){
    addEntry("d",moduleName,symbolPath,opt_deprecationMessage)
    };
    
function prepareNamespace(symbolPath,context){
    if(!symbolPath){
        return context
        }
        var parts=symbolPath.split(".");
    var cur=context;
    for(var i=0,part;part=parts[i];++i){
        cur=cur[part]=cur[part]||{}
    }
    return cur
}
exports.mapModules=function(context){
    var origSymbols={};
    
    context.CDV_origSymbols=origSymbols;
    for(var i=0,len=symbolList.length;i<len;i+=3){
        var strategy=symbolList[i];
        var moduleName=symbolList[i+1];
        var symbolPath=symbolList[i+2];
        var lastDot=symbolPath.lastIndexOf(".");
        var namespace=symbolPath.substr(0,lastDot);
        var lastName=symbolPath.substr(lastDot+1);
        var module=require(moduleName);
        var deprecationMsg=symbolPath in deprecationMap?"Access made to deprecated symbol: "+symbolPath+". "+deprecationMsg:null;
        var parentObj=prepareNamespace(namespace,context);
        var target=parentObj[lastName];
        if(strategy=="m"&&target){
            builder.recursiveMerge(target,module)
            }else{
            if((strategy=="d"&&!target)||(strategy!="d")){
                if(!(symbolPath in origSymbols)){
                    origSymbols[symbolPath]=target
                    }
                    builder.assignOrWrapInDeprecateGetter(parentObj,lastName,module,deprecationMsg)
                }
            }
    }
};

exports.getOriginalSymbol=function(context,symbolPath){
    var origSymbols=context.CDV_origSymbols;
    if(origSymbols&&(symbolPath in origSymbols)){
        return origSymbols[symbolPath]
        }
        var parts=symbolPath.split(".");
    var obj=context;
    for(var i=0;i<parts.length;++i){
        obj=obj&&obj[parts[i]]
        }
        return obj
    };
    
exports.loadMatchingModules=function(matchingRegExp){
    for(var k in moduleMap){
        if(matchingRegExp.exec(k)){
            require(k)
            }
        }
    };
    
exports.reset()
});
define("cordova/platform",function(require,exports,module){
    module.exports={
        id:"android",
        initialize:function(){
            var channel=require("cordova/channel"),cordova=require("cordova"),exec=require("cordova/exec"),modulemapper=require("cordova/modulemapper");
            modulemapper.loadMatchingModules(/cordova.*\/symbols$/);
            modulemapper.clobbers("cordova/plugin/android/app","navigator.app");
            modulemapper.mapModules(window);
            var backButtonChannel=cordova.addDocumentEventHandler("backbutton");
            backButtonChannel.onHasSubscribersChange=function(){
                exec(null,null,"App","overrideBackbutton",[this.numHandlers==1])
                };
                
            cordova.addDocumentEventHandler("menubutton");
            cordova.addDocumentEventHandler("searchbutton");
            channel.join(function(){
                exec(null,null,"App","show",[])
                },[channel.onCordovaReady])
            }
        }
});
define("cordova/plugin/Acceleration",function(require,exports,module){
    var Acceleration=function(x,y,z,timestamp){
        this.x=x;
        this.y=y;
        this.z=z;
        this.timestamp=timestamp||(new Date()).getTime()
        };
        
    module.exports=Acceleration
    });
define("cordova/plugin/Camera",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),exec=require("cordova/exec"),Camera=require("cordova/plugin/CameraConstants"),CameraPopoverHandle=require("cordova/plugin/CameraPopoverHandle");
    var cameraExport={};
    
    for(var key in Camera){
        cameraExport[key]=Camera[key]
        }
        cameraExport.getPicture=function(successCallback,errorCallback,options){
        argscheck.checkArgs("fFO","Camera.getPicture",arguments);
        options=options||{};
        
        var getValue=argscheck.getValue;
        var quality=getValue(options.quality,50);
        var destinationType=getValue(options.destinationType,Camera.DestinationType.FILE_URI);
        var sourceType=getValue(options.sourceType,Camera.PictureSourceType.CAMERA);
        var targetWidth=getValue(options.targetWidth,-1);
        var targetHeight=getValue(options.targetHeight,-1);
        var encodingType=getValue(options.encodingType,Camera.EncodingType.JPEG);
        var mediaType=getValue(options.mediaType,Camera.MediaType.PICTURE);
        var allowEdit=!!options.allowEdit;
        var correctOrientation=!!options.correctOrientation;
        var saveToPhotoAlbum=!!options.saveToPhotoAlbum;
        var popoverOptions=getValue(options.popoverOptions,null);
        var cameraDirection=getValue(options.cameraDirection,Camera.Direction.BACK);
        var args=[quality,destinationType,sourceType,targetWidth,targetHeight,encodingType,mediaType,allowEdit,correctOrientation,saveToPhotoAlbum,popoverOptions,cameraDirection];
        exec(successCallback,errorCallback,"Camera","takePicture",args);
        return new CameraPopoverHandle()
        };
        
    cameraExport.cleanup=function(successCallback,errorCallback){
        exec(successCallback,errorCallback,"Camera","cleanup",[])
        };
        
    module.exports=cameraExport
    });
define("cordova/plugin/CameraConstants",function(require,exports,module){
    module.exports={
        DestinationType:{
            DATA_URL:0,
            FILE_URI:1,
            NATIVE_URI:2
        },
        EncodingType:{
            JPEG:0,
            PNG:1
        },
        MediaType:{
            PICTURE:0,
            VIDEO:1,
            ALLMEDIA:2
        },
        PictureSourceType:{
            PHOTOLIBRARY:0,
            CAMERA:1,
            SAVEDPHOTOALBUM:2
        },
        PopoverArrowDirection:{
            ARROW_UP:1,
            ARROW_DOWN:2,
            ARROW_LEFT:4,
            ARROW_RIGHT:8,
            ARROW_ANY:15
        },
        Direction:{
            BACK:0,
            FRONT:1
        }
    }
});
define("cordova/plugin/CameraPopoverHandle",function(require,exports,module){
    var exec=require("cordova/exec");
    var CameraPopoverHandle=function(){
        this.setPosition=function(popoverOptions){
            console.log("CameraPopoverHandle.setPosition is only supported on iOS.")
            }
        };
    
module.exports=CameraPopoverHandle
});
define("cordova/plugin/CameraPopoverOptions",function(require,exports,module){
    var Camera=require("cordova/plugin/CameraConstants");
    var CameraPopoverOptions=function(x,y,width,height,arrowDir){
        this.x=x||0;
        this.y=y||32;
        this.width=width||320;
        this.height=height||480;
        this.arrowDir=arrowDir||Camera.PopoverArrowDirection.ARROW_ANY
        };
        
    module.exports=CameraPopoverOptions
    });
define("cordova/plugin/CaptureAudioOptions",function(require,exports,module){
    var CaptureAudioOptions=function(){
        this.limit=1;
        this.duration=0
        };
        
    module.exports=CaptureAudioOptions
    });
define("cordova/plugin/CaptureError",function(require,exports,module){
    var CaptureError=function(c){
        this.code=c||null
        };
        
    CaptureError.CAPTURE_INTERNAL_ERR=0;
    CaptureError.CAPTURE_APPLICATION_BUSY=1;
    CaptureError.CAPTURE_INVALID_ARGUMENT=2;
    CaptureError.CAPTURE_NO_MEDIA_FILES=3;
    CaptureError.CAPTURE_NOT_SUPPORTED=20;
    module.exports=CaptureError
    });
define("cordova/plugin/CaptureImageOptions",function(require,exports,module){
    var CaptureImageOptions=function(){
        this.limit=1
        };
        
    module.exports=CaptureImageOptions
    });
define("cordova/plugin/CaptureVideoOptions",function(require,exports,module){
    var CaptureVideoOptions=function(){
        this.limit=1;
        this.duration=0
        };
        
    module.exports=CaptureVideoOptions
    });
define("cordova/plugin/CompassError",function(require,exports,module){
    var CompassError=function(err){
        this.code=(err!==undefined?err:null)
        };
        
    CompassError.COMPASS_INTERNAL_ERR=0;
    CompassError.COMPASS_NOT_SUPPORTED=20;
    module.exports=CompassError
    });
define("cordova/plugin/CompassHeading",function(require,exports,module){
    var CompassHeading=function(magneticHeading,trueHeading,headingAccuracy,timestamp){
        this.magneticHeading=magneticHeading;
        this.trueHeading=trueHeading;
        this.headingAccuracy=headingAccuracy;
        this.timestamp=timestamp||new Date().getTime()
        };
        
    module.exports=CompassHeading
    });
define("cordova/plugin/ConfigurationData",function(require,exports,module){
    function ConfigurationData(){
        this.type=null;
        this.height=0;
        this.width=0
        }
        module.exports=ConfigurationData
    });
define("cordova/plugin/Connection",function(require,exports,module){
    module.exports={
        UNKNOWN:"unknown",
        ETHERNET:"ethernet",
        WIFI:"wifi",
        CELL_2G:"2g",
        CELL_3G:"3g",
        CELL_4G:"4g",
        CELL:"cellular",
        NONE:"none"
    }
});
define("cordova/plugin/Contact",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),exec=require("cordova/exec"),ContactError=require("cordova/plugin/ContactError"),utils=require("cordova/utils");
    function convertIn(contact){
        var value=contact.birthday;
        try{
            contact.birthday=new Date(parseFloat(value))
            }catch(exception){
            console.log("Cordova Contact convertIn error: exception creating date.")
            }
            return contact
        }
        function convertOut(contact){
        var value=contact.birthday;
        if(value!==null){
            if(!utils.isDate(value)){
                try{
                    value=new Date(value)
                    }catch(exception){
                    value=null
                    }
                }
            if(utils.isDate(value)){
            value=value.valueOf()
            }
            contact.birthday=value
        }
        return contact
    }
    var Contact=function(id,displayName,name,nickname,phoneNumbers,emails,addresses,ims,organizations,birthday,note,photos,categories,urls){
    this.id=id||null;
    this.rawId=null;
    this.displayName=displayName||null;
    this.name=name||null;
    this.nickname=nickname||null;
    this.phoneNumbers=phoneNumbers||null;
    this.emails=emails||null;
    this.addresses=addresses||null;
    this.ims=ims||null;
    this.organizations=organizations||null;
    this.birthday=birthday||null;
    this.note=note||null;
    this.photos=photos||null;
    this.categories=categories||null;
    this.urls=urls||null
    };
    
Contact.prototype.remove=function(successCB,errorCB){
    argscheck.checkArgs("FF","Contact.remove",arguments);
    var fail=errorCB&&function(code){
        errorCB(new ContactError(code))
        };
        
    if(this.id===null){
        fail(ContactError.UNKNOWN_ERROR)
        }else{
        exec(successCB,fail,"Contacts","remove",[this.id])
        }
    };

Contact.prototype.clone=function(){
    var clonedContact=utils.clone(this);
    clonedContact.id=null;
    clonedContact.rawId=null;
    function nullIds(arr){
        if(arr){
            for(var i=0;i<arr.length;++i){
                arr[i].id=null
                }
            }
        }
nullIds(clonedContact.phoneNumbers);
nullIds(clonedContact.emails);
nullIds(clonedContact.addresses);
nullIds(clonedContact.ims);
nullIds(clonedContact.organizations);
nullIds(clonedContact.categories);
nullIds(clonedContact.photos);
nullIds(clonedContact.urls);
return clonedContact
};

Contact.prototype.save=function(successCB,errorCB){
    argscheck.checkArgs("FFO","Contact.save",arguments);
    var fail=errorCB&&function(code){
        errorCB(new ContactError(code))
        };
        
    var success=function(result){
        if(result){
            if(successCB){
                var fullContact=require("cordova/plugin/contacts").create(result);
                successCB(convertIn(fullContact))
                }
            }else{
        fail(ContactError.UNKNOWN_ERROR)
        }
    };

var dupContact=convertOut(utils.clone(this));
exec(success,fail,"Contacts","save",[dupContact])
};

module.exports=Contact
});
define("cordova/plugin/ContactAddress",function(require,exports,module){
    var ContactAddress=function(pref,type,formatted,streetAddress,locality,region,postalCode,country){
        this.id=null;
        this.pref=(typeof pref!="undefined"?pref:false);
        this.type=type||null;
        this.formatted=formatted||null;
        this.streetAddress=streetAddress||null;
        this.locality=locality||null;
        this.region=region||null;
        this.postalCode=postalCode||null;
        this.country=country||null
        };
        
    module.exports=ContactAddress
    });
define("cordova/plugin/ContactError",function(require,exports,module){
    var ContactError=function(err){
        this.code=(typeof err!="undefined"?err:null)
        };
        
    ContactError.UNKNOWN_ERROR=0;
    ContactError.INVALID_ARGUMENT_ERROR=1;
    ContactError.TIMEOUT_ERROR=2;
    ContactError.PENDING_OPERATION_ERROR=3;
    ContactError.IO_ERROR=4;
    ContactError.NOT_SUPPORTED_ERROR=5;
    ContactError.PERMISSION_DENIED_ERROR=20;
    module.exports=ContactError
    });
define("cordova/plugin/ContactField",function(require,exports,module){
    var ContactField=function(type,value,pref){
        this.id=null;
        this.type=(type&&type.toString())||null;
        this.value=(value&&value.toString())||null;
        this.pref=(typeof pref!="undefined"?pref:false)
        };
        
    module.exports=ContactField
    });
define("cordova/plugin/ContactFindOptions",function(require,exports,module){
    var ContactFindOptions=function(filter,multiple){
        this.filter=filter||"";
        this.multiple=(typeof multiple!="undefined"?multiple:false)
        };
        
    module.exports=ContactFindOptions
    });
define("cordova/plugin/ContactName",function(require,exports,module){
    var ContactName=function(formatted,familyName,givenName,middle,prefix,suffix){
        this.formatted=formatted||null;
        this.familyName=familyName||null;
        this.givenName=givenName||null;
        this.middleName=middle||null;
        this.honorificPrefix=prefix||null;
        this.honorificSuffix=suffix||null
        };
        
    module.exports=ContactName
    });
define("cordova/plugin/ContactOrganization",function(require,exports,module){
    var ContactOrganization=function(pref,type,name,dept,title){
        this.id=null;
        this.pref=(typeof pref!="undefined"?pref:false);
        this.type=type||null;
        this.name=name||null;
        this.department=dept||null;
        this.title=title||null
        };
        
    module.exports=ContactOrganization
    });
define("cordova/plugin/Coordinates",function(require,exports,module){
    var Coordinates=function(lat,lng,alt,acc,head,vel,altacc){
        this.latitude=lat;
        this.longitude=lng;
        this.accuracy=acc;
        this.altitude=(alt!==undefined?alt:null);
        this.heading=(head!==undefined?head:null);
        this.speed=(vel!==undefined?vel:null);
        if(this.speed===0||this.speed===null){
            this.heading=NaN
            }
            this.altitudeAccuracy=(altacc!==undefined)?altacc:null
        };
        
    module.exports=Coordinates
    });
define("cordova/plugin/DirectoryEntry",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),utils=require("cordova/utils"),exec=require("cordova/exec"),Entry=require("cordova/plugin/Entry"),FileError=require("cordova/plugin/FileError"),DirectoryReader=require("cordova/plugin/DirectoryReader");
    var DirectoryEntry=function(name,fullPath){
        DirectoryEntry.__super__.constructor.call(this,false,true,name,fullPath)
        };
        
    utils.extend(DirectoryEntry,Entry);
    DirectoryEntry.prototype.createReader=function(){
        return new DirectoryReader(this.fullPath)
        };
        
    DirectoryEntry.prototype.getDirectory=function(path,options,successCallback,errorCallback){
        argscheck.checkArgs("sOFF","DirectoryEntry.getDirectory",arguments);
        var win=successCallback&&function(result){
            var entry=new DirectoryEntry(result.name,result.fullPath);
            successCallback(entry)
            };
            
        var fail=errorCallback&&function(code){
            errorCallback(new FileError(code))
            };
            
        exec(win,fail,"File","getDirectory",[this.fullPath,path,options])
        };
        
    DirectoryEntry.prototype.removeRecursively=function(successCallback,errorCallback){
        argscheck.checkArgs("FF","DirectoryEntry.removeRecursively",arguments);
        var fail=errorCallback&&function(code){
            errorCallback(new FileError(code))
            };
            
        exec(successCallback,fail,"File","removeRecursively",[this.fullPath])
        };
        
    DirectoryEntry.prototype.getFile=function(path,options,successCallback,errorCallback){
        argscheck.checkArgs("sOFF","DirectoryEntry.getFile",arguments);
        var win=successCallback&&function(result){
            var FileEntry=require("cordova/plugin/FileEntry");
            var entry=new FileEntry(result.name,result.fullPath);
            successCallback(entry)
            };
            
        var fail=errorCallback&&function(code){
            errorCallback(new FileError(code))
            };
            
        exec(win,fail,"File","getFile",[this.fullPath,path,options])
        };
        
    module.exports=DirectoryEntry
    });
define("cordova/plugin/DirectoryReader",function(require,exports,module){
    var exec=require("cordova/exec"),FileError=require("cordova/plugin/FileError");
    function DirectoryReader(path){
        this.path=path||null
        }
        DirectoryReader.prototype.readEntries=function(successCallback,errorCallback){
        var win=typeof successCallback!=="function"?null:function(result){
            var retVal=[];
            for(var i=0;i<result.length;i++){
                var entry=null;
                if(result[i].isDirectory){
                    entry=new (require("cordova/plugin/DirectoryEntry"))()
                    }else{
                    if(result[i].isFile){
                        entry=new (require("cordova/plugin/FileEntry"))()
                        }
                    }
                entry.isDirectory=result[i].isDirectory;
            entry.isFile=result[i].isFile;
            entry.name=result[i].name;
            entry.fullPath=result[i].fullPath;
            retVal.push(entry)
                }
                successCallback(retVal)
        };
        
    var fail=typeof errorCallback!=="function"?null:function(code){
        errorCallback(new FileError(code))
        };
        
    exec(win,fail,"File","readEntries",[this.path])
    };
    
module.exports=DirectoryReader
});
define("cordova/plugin/Entry",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),exec=require("cordova/exec"),FileError=require("cordova/plugin/FileError"),Metadata=require("cordova/plugin/Metadata");
    function Entry(isFile,isDirectory,name,fullPath,fileSystem){
        this.isFile=!!isFile;
        this.isDirectory=!!isDirectory;
        this.name=name||"";
        this.fullPath=fullPath||"";
        this.filesystem=fileSystem||null
        }
        Entry.prototype.getMetadata=function(successCallback,errorCallback){
        argscheck.checkArgs("FF","Entry.getMetadata",arguments);
        var success=successCallback&&function(lastModified){
            var metadata=new Metadata(lastModified);
            successCallback(metadata)
            };
            
        var fail=errorCallback&&function(code){
            errorCallback(new FileError(code))
            };
            
        exec(success,fail,"File","getMetadata",[this.fullPath])
        };
        
    Entry.prototype.setMetadata=function(successCallback,errorCallback,metadataObject){
        argscheck.checkArgs("FFO","Entry.setMetadata",arguments);
        exec(successCallback,errorCallback,"File","setMetadata",[this.fullPath,metadataObject])
        };
        
    Entry.prototype.moveTo=function(parent,newName,successCallback,errorCallback){
        argscheck.checkArgs("oSFF","Entry.moveTo",arguments);
        var fail=errorCallback&&function(code){
            errorCallback(new FileError(code))
            };
            
        var srcPath=this.fullPath,name=newName||this.name,success=function(entry){
            if(entry){
                if(successCallback){
                    var result=(entry.isDirectory)?new (require("cordova/plugin/DirectoryEntry"))(entry.name,entry.fullPath):new (require("cordova/plugin/FileEntry"))(entry.name,entry.fullPath);
                    successCallback(result)
                    }
                }else{
            fail&&fail(FileError.NOT_FOUND_ERR)
            }
        };
    
exec(success,fail,"File","moveTo",[srcPath,parent.fullPath,name])
    };
    
Entry.prototype.copyTo=function(parent,newName,successCallback,errorCallback){
    argscheck.checkArgs("oSFF","Entry.copyTo",arguments);
    var fail=errorCallback&&function(code){
        errorCallback(new FileError(code))
        };
        
    var srcPath=this.fullPath,name=newName||this.name,success=function(entry){
        if(entry){
            if(successCallback){
                var result=(entry.isDirectory)?new (require("cordova/plugin/DirectoryEntry"))(entry.name,entry.fullPath):new (require("cordova/plugin/FileEntry"))(entry.name,entry.fullPath);
                successCallback(result)
                }
            }else{
        fail&&fail(FileError.NOT_FOUND_ERR)
        }
    };

exec(success,fail,"File","copyTo",[srcPath,parent.fullPath,name])
};

Entry.prototype.toURL=function(){
    return this.fullPath
    };
    
Entry.prototype.toURI=function(mimeType){
    console.log("DEPRECATED: Update your code to use 'toURL'");
    return this.toURL()
    };
    
Entry.prototype.remove=function(successCallback,errorCallback){
    argscheck.checkArgs("FF","Entry.remove",arguments);
    var fail=errorCallback&&function(code){
        errorCallback(new FileError(code))
        };
        
    exec(successCallback,fail,"File","remove",[this.fullPath])
    };
    
Entry.prototype.getParent=function(successCallback,errorCallback){
    argscheck.checkArgs("FF","Entry.getParent",arguments);
    var win=successCallback&&function(result){
        var DirectoryEntry=require("cordova/plugin/DirectoryEntry");
        var entry=new DirectoryEntry(result.name,result.fullPath);
        successCallback(entry)
        };
        
    var fail=errorCallback&&function(code){
        errorCallback(new FileError(code))
        };
        
    exec(win,fail,"File","getParent",[this.fullPath])
    };
    
module.exports=Entry
});
define("cordova/plugin/File",function(require,exports,module){
    var File=function(name,fullPath,type,lastModifiedDate,size){
        this.name=name||"";
        this.fullPath=fullPath||null;
        this.type=type||null;
        this.lastModifiedDate=lastModifiedDate||null;
        this.size=size||0;
        this.start=0;
        this.end=this.size
        };
        
    File.prototype.slice=function(start,end){
        var size=this.end-this.start;
        var newStart=0;
        var newEnd=size;
        if(arguments.length){
            if(start<0){
                newStart=Math.max(size+start,0)
                }else{
                newStart=Math.min(size,start)
                }
            }
        if(arguments.length>=2){
        if(end<0){
            newEnd=Math.max(size+end,0)
            }else{
            newEnd=Math.min(end,size)
            }
        }
    var newFile=new File(this.name,this.fullPath,this.type,this.lastModifiedData,this.size);
    newFile.start=this.start+newStart;
    newFile.end=this.start+newEnd;
    return newFile
    };
    
module.exports=File
});
define("cordova/plugin/FileEntry",function(require,exports,module){
    var utils=require("cordova/utils"),exec=require("cordova/exec"),Entry=require("cordova/plugin/Entry"),FileWriter=require("cordova/plugin/FileWriter"),File=require("cordova/plugin/File"),FileError=require("cordova/plugin/FileError");
    var FileEntry=function(name,fullPath){
        FileEntry.__super__.constructor.apply(this,[true,false,name,fullPath])
        };
        
    utils.extend(FileEntry,Entry);
    FileEntry.prototype.createWriter=function(successCallback,errorCallback){
        this.file(function(filePointer){
            var writer=new FileWriter(filePointer);
            if(writer.fileName===null||writer.fileName===""){
                errorCallback&&errorCallback(new FileError(FileError.INVALID_STATE_ERR))
                }else{
                successCallback&&successCallback(writer)
                }
            },errorCallback)
    };
    
FileEntry.prototype.file=function(successCallback,errorCallback){
    var win=successCallback&&function(f){
        var file=new File(f.name,f.fullPath,f.type,f.lastModifiedDate,f.size);
        successCallback(file)
        };
        
    var fail=errorCallback&&function(code){
        errorCallback(new FileError(code))
        };
        
    exec(win,fail,"File","getFileMetadata",[this.fullPath])
    };
    
module.exports=FileEntry
});
define("cordova/plugin/FileError",function(require,exports,module){
    function FileError(error){
        this.code=error||null
        }
        FileError.NOT_FOUND_ERR=1;
    FileError.SECURITY_ERR=2;
    FileError.ABORT_ERR=3;
    FileError.NOT_READABLE_ERR=4;
    FileError.ENCODING_ERR=5;
    FileError.NO_MODIFICATION_ALLOWED_ERR=6;
    FileError.INVALID_STATE_ERR=7;
    FileError.SYNTAX_ERR=8;
    FileError.INVALID_MODIFICATION_ERR=9;
    FileError.QUOTA_EXCEEDED_ERR=10;
    FileError.TYPE_MISMATCH_ERR=11;
    FileError.PATH_EXISTS_ERR=12;
    module.exports=FileError
    });
define("cordova/plugin/FileReader",function(require,exports,module){
    var exec=require("cordova/exec"),modulemapper=require("cordova/modulemapper"),utils=require("cordova/utils"),File=require("cordova/plugin/File"),FileError=require("cordova/plugin/FileError"),ProgressEvent=require("cordova/plugin/ProgressEvent"),origFileReader=modulemapper.getOriginalSymbol(this,"FileReader");
    var FileReader=function(){
        this._readyState=0;
        this._error=null;
        this._result=null;
        this._fileName="";
        this._realReader=origFileReader?new origFileReader():{}
    };
    
FileReader.EMPTY=0;
FileReader.LOADING=1;
FileReader.DONE=2;
utils.defineGetter(FileReader.prototype,"readyState",function(){
    return this._fileName?this._readyState:this._realReader.readyState
    });
utils.defineGetter(FileReader.prototype,"error",function(){
    return this._fileName?this._error:this._realReader.error
    });
utils.defineGetter(FileReader.prototype,"result",function(){
    return this._fileName?this._result:this._realReader.result
    });
function defineEvent(eventName){
    utils.defineGetterSetter(FileReader.prototype,eventName,function(){
        return this._realReader[eventName]||null
        },function(value){
        this._realReader[eventName]=value
        })
    }
    defineEvent("onloadstart");
    defineEvent("onprogress");
    defineEvent("onload");
    defineEvent("onerror");
    defineEvent("onloadend");
    defineEvent("onabort");
    function initRead(reader,file){
    if(reader.readyState==FileReader.LOADING){
        throw new FileError(FileError.INVALID_STATE_ERR)
        }
        reader._result=null;
    reader._error=null;
    reader._readyState=FileReader.LOADING;
    if(typeof file.fullPath=="string"){
        reader._fileName=file.fullPath
        }else{
        reader._fileName="";
        return true
        }
        reader.onloadstart&&reader.onloadstart(new ProgressEvent("loadstart",{
        target:reader
    }))
    }
    FileReader.prototype.abort=function(){
    if(origFileReader&&!this._fileName){
        return this._realReader.abort()
        }
        this._result=null;
    if(this._readyState==FileReader.DONE||this._readyState==FileReader.EMPTY){
        return
    }
    this._readyState=FileReader.DONE;
    if(typeof this.onabort==="function"){
        this.onabort(new ProgressEvent("abort",{
            target:this
        }))
        }
        if(typeof this.onloadend==="function"){
        this.onloadend(new ProgressEvent("loadend",{
            target:this
        }))
        }
    };

FileReader.prototype.readAsText=function(file,encoding){
    if(initRead(this,file)){
        return this._realReader.readAsText(file,encoding)
        }
        var enc=encoding?encoding:"UTF-8";
    var me=this;
    var execArgs=[this._fileName,enc,file.start,file.end];
    exec(function(r){
        if(me._readyState===FileReader.DONE){
            return
        }
        me._result=r;
        if(typeof me.onload==="function"){
            me.onload(new ProgressEvent("load",{
                target:me
            }))
            }
            me._readyState=FileReader.DONE;
        if(typeof me.onloadend==="function"){
            me.onloadend(new ProgressEvent("loadend",{
                target:me
            }))
            }
        },function(e){
        if(me._readyState===FileReader.DONE){
            return
        }
        me._readyState=FileReader.DONE;
        me._result=null;
        me._error=new FileError(e);
        if(typeof me.onerror==="function"){
            me.onerror(new ProgressEvent("error",{
                target:me
            }))
            }
            if(typeof me.onloadend==="function"){
            me.onloadend(new ProgressEvent("loadend",{
                target:me
            }))
            }
        },"File","readAsText",execArgs)
};

FileReader.prototype.readAsDataURL=function(file){
    if(initRead(this,file)){
        return this._realReader.readAsDataURL(file)
        }
        var me=this;
    var execArgs=[this._fileName,file.start,file.end];
    exec(function(r){
        if(me._readyState===FileReader.DONE){
            return
        }
        me._readyState=FileReader.DONE;
        me._result=r;
        if(typeof me.onload==="function"){
            me.onload(new ProgressEvent("load",{
                target:me
            }))
            }
            if(typeof me.onloadend==="function"){
            me.onloadend(new ProgressEvent("loadend",{
                target:me
            }))
            }
        },function(e){
        if(me._readyState===FileReader.DONE){
            return
        }
        me._readyState=FileReader.DONE;
        me._result=null;
        me._error=new FileError(e);
        if(typeof me.onerror==="function"){
            me.onerror(new ProgressEvent("error",{
                target:me
            }))
            }
            if(typeof me.onloadend==="function"){
            me.onloadend(new ProgressEvent("loadend",{
                target:me
            }))
            }
        },"File","readAsDataURL",execArgs)
};

FileReader.prototype.readAsBinaryString=function(file){
    if(initRead(this,file)){
        return this._realReader.readAsBinaryString(file)
        }
        var me=this;
    var execArgs=[this._fileName,file.start,file.end];
    exec(function(r){
        if(me._readyState===FileReader.DONE){
            return
        }
        me._readyState=FileReader.DONE;
        me._result=r;
        if(typeof me.onload==="function"){
            me.onload(new ProgressEvent("load",{
                target:me
            }))
            }
            if(typeof me.onloadend==="function"){
            me.onloadend(new ProgressEvent("loadend",{
                target:me
            }))
            }
        },function(e){
        if(me._readyState===FileReader.DONE){
            return
        }
        me._readyState=FileReader.DONE;
        me._result=null;
        me._error=new FileError(e);
        if(typeof me.onerror==="function"){
            me.onerror(new ProgressEvent("error",{
                target:me
            }))
            }
            if(typeof me.onloadend==="function"){
            me.onloadend(new ProgressEvent("loadend",{
                target:me
            }))
            }
        },"File","readAsBinaryString",execArgs)
};

FileReader.prototype.readAsArrayBuffer=function(file){
    if(initRead(this,file)){
        return this._realReader.readAsArrayBuffer(file)
        }
        var me=this;
    var execArgs=[this._fileName,file.start,file.end];
    exec(function(r){
        if(me._readyState===FileReader.DONE){
            return
        }
        me._readyState=FileReader.DONE;
        me._result=r;
        if(typeof me.onload==="function"){
            me.onload(new ProgressEvent("load",{
                target:me
            }))
            }
            if(typeof me.onloadend==="function"){
            me.onloadend(new ProgressEvent("loadend",{
                target:me
            }))
            }
        },function(e){
        if(me._readyState===FileReader.DONE){
            return
        }
        me._readyState=FileReader.DONE;
        me._result=null;
        me._error=new FileError(e);
        if(typeof me.onerror==="function"){
            me.onerror(new ProgressEvent("error",{
                target:me
            }))
            }
            if(typeof me.onloadend==="function"){
            me.onloadend(new ProgressEvent("loadend",{
                target:me
            }))
            }
        },"File","readAsArrayBuffer",execArgs)
};

module.exports=FileReader
});
define("cordova/plugin/FileSystem",function(require,exports,module){
    var DirectoryEntry=require("cordova/plugin/DirectoryEntry");
    var FileSystem=function(name,root){
        this.name=name||null;
        if(root){
            this.root=new DirectoryEntry(root.name,root.fullPath)
            }
        };
    
module.exports=FileSystem
});
define("cordova/plugin/FileTransfer",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),exec=require("cordova/exec"),FileTransferError=require("cordova/plugin/FileTransferError"),ProgressEvent=require("cordova/plugin/ProgressEvent");
    function newProgressEvent(result){
        var pe=new ProgressEvent();
        pe.lengthComputable=result.lengthComputable;
        pe.loaded=result.loaded;
        pe.total=result.total;
        return pe
        }
        function getBasicAuthHeader(urlString){
        var header=null;
        if(window.btoa){
            var url=document.createElement("a");
            url.href=urlString;
            var credentials=null;
            var protocol=url.protocol+"//";
            var origin=protocol+url.host;
            if(url.href.indexOf(origin)!==0){
                var atIndex=url.href.indexOf("@");
                credentials=url.href.substring(protocol.length,atIndex)
                }
                if(credentials){
                var authHeader="Authorization";
                var authHeaderValue="Basic "+window.btoa(credentials);
                header={
                    name:authHeader,
                    value:authHeaderValue
                }
            }
        }
    return header
}
var idCounter=0;
var FileTransfer=function(){
    this._id=++idCounter;
    this.onprogress=null
    };
    
FileTransfer.prototype.upload=function(filePath,server,successCallback,errorCallback,options,trustAllHosts){
    argscheck.checkArgs("ssFFO*","FileTransfer.upload",arguments);
    var fileKey=null;
    var fileName=null;
    var mimeType=null;
    var params=null;
    var chunkedMode=true;
    var headers=null;
    var httpMethod=null;
    var basicAuthHeader=getBasicAuthHeader(server);
    if(basicAuthHeader){
        options=options||{};
        
        options.headers=options.headers||{};
        
        options.headers[basicAuthHeader.name]=basicAuthHeader.value
        }
        if(options){
        fileKey=options.fileKey;
        fileName=options.fileName;
        mimeType=options.mimeType;
        headers=options.headers;
        httpMethod=options.httpMethod||"POST";
        if(httpMethod.toUpperCase()=="PUT"){
            httpMethod="PUT"
            }else{
            httpMethod="POST"
            }
            if(options.chunkedMode!==null||typeof options.chunkedMode!="undefined"){
            chunkedMode=options.chunkedMode
            }
            if(options.params){
            params=options.params
            }else{
            params={}
        }
    }
var fail=errorCallback&&function(e){
    var error=new FileTransferError(e.code,e.source,e.target,e.http_status,e.body);
    errorCallback(error)
    };
    
var self=this;
var win=function(result){
    if(typeof result.lengthComputable!="undefined"){
        if(self.onprogress){
            self.onprogress(newProgressEvent(result))
            }
        }else{
    successCallback&&successCallback(result)
    }
};

exec(win,fail,"FileTransfer","upload",[filePath,server,fileKey,fileName,mimeType,params,trustAllHosts,chunkedMode,headers,this._id,httpMethod])
};

FileTransfer.prototype.download=function(source,target,successCallback,errorCallback,trustAllHosts,options){
    argscheck.checkArgs("ssFF*","FileTransfer.download",arguments);
    var self=this;
    var basicAuthHeader=getBasicAuthHeader(source);
    if(basicAuthHeader){
        options=options||{};
        
        options.headers=options.headers||{};
        
        options.headers[basicAuthHeader.name]=basicAuthHeader.value
        }
        var headers=null;
    if(options){
        headers=options.headers||null
        }
        var win=function(result){
        if(typeof result.lengthComputable!="undefined"){
            if(self.onprogress){
                return self.onprogress(newProgressEvent(result))
                }
            }else{
        if(successCallback){
            var entry=null;
            if(result.isDirectory){
                entry=new (require("cordova/plugin/DirectoryEntry"))()
                }else{
                if(result.isFile){
                    entry=new (require("cordova/plugin/FileEntry"))()
                    }
                }
            entry.isDirectory=result.isDirectory;
        entry.isFile=result.isFile;
        entry.name=result.name;
        entry.fullPath=result.fullPath;
        successCallback(entry)
        }
    }
};

var fail=errorCallback&&function(e){
    var error=new FileTransferError(e.code,e.source,e.target,e.http_status,e.body);
    errorCallback(error)
    };
    
exec(win,fail,"FileTransfer","download",[source,target,trustAllHosts,this._id,headers])
};

FileTransfer.prototype.abort=function(){
    exec(null,null,"FileTransfer","abort",[this._id])
    };
    
module.exports=FileTransfer
});
define("cordova/plugin/FileTransferError",function(require,exports,module){
    var FileTransferError=function(code,source,target,status,body){
        this.code=code||null;
        this.source=source||null;
        this.target=target||null;
        this.http_status=status||null;
        this.body=body||null
        };
        
    FileTransferError.FILE_NOT_FOUND_ERR=1;
    FileTransferError.INVALID_URL_ERR=2;
    FileTransferError.CONNECTION_ERR=3;
    FileTransferError.ABORT_ERR=4;
    module.exports=FileTransferError
    });
define("cordova/plugin/FileUploadOptions",function(require,exports,module){
    var FileUploadOptions=function(fileKey,fileName,mimeType,params,headers,httpMethod){
        this.fileKey=fileKey||null;
        this.fileName=fileName||null;
        this.mimeType=mimeType||null;
        this.params=params||null;
        this.headers=headers||null;
        this.httpMethod=httpMethod||null
        };
        
    module.exports=FileUploadOptions
    });
define("cordova/plugin/FileUploadResult",function(require,exports,module){
    var FileUploadResult=function(){
        this.bytesSent=0;
        this.responseCode=null;
        this.response=null
        };
        
    module.exports=FileUploadResult
    });
define("cordova/plugin/FileWriter",function(require,exports,module){
    var exec=require("cordova/exec"),FileError=require("cordova/plugin/FileError"),ProgressEvent=require("cordova/plugin/ProgressEvent");
    var FileWriter=function(file){
        this.fileName="";
        this.length=0;
        if(file){
            this.fileName=file.fullPath||file;
            this.length=file.size||0
            }
            this.position=0;
        this.readyState=0;
        this.result=null;
        this.error=null;
        this.onwritestart=null;
        this.onprogress=null;
        this.onwrite=null;
        this.onwriteend=null;
        this.onabort=null;
        this.onerror=null
        };
        
    FileWriter.INIT=0;
    FileWriter.WRITING=1;
    FileWriter.DONE=2;
    FileWriter.prototype.abort=function(){
        if(this.readyState===FileWriter.DONE||this.readyState===FileWriter.INIT){
            throw new FileError(FileError.INVALID_STATE_ERR)
            }
            this.error=new FileError(FileError.ABORT_ERR);
        this.readyState=FileWriter.DONE;
        if(typeof this.onabort==="function"){
            this.onabort(new ProgressEvent("abort",{
                target:this
            }))
            }
            if(typeof this.onwriteend==="function"){
            this.onwriteend(new ProgressEvent("writeend",{
                target:this
            }))
            }
        };
    
FileWriter.prototype.write=function(text){
    if(this.readyState===FileWriter.WRITING){
        throw new FileError(FileError.INVALID_STATE_ERR)
        }
        this.readyState=FileWriter.WRITING;
    var me=this;
    if(typeof me.onwritestart==="function"){
        me.onwritestart(new ProgressEvent("writestart",{
            target:me
        }))
        }
        exec(function(r){
        if(me.readyState===FileWriter.DONE){
            return
        }
        me.position+=r;
        me.length=me.position;
        me.readyState=FileWriter.DONE;
        if(typeof me.onwrite==="function"){
            me.onwrite(new ProgressEvent("write",{
                target:me
            }))
            }
            if(typeof me.onwriteend==="function"){
            me.onwriteend(new ProgressEvent("writeend",{
                target:me
            }))
            }
        },function(e){
        if(me.readyState===FileWriter.DONE){
            return
        }
        me.readyState=FileWriter.DONE;
        me.error=new FileError(e);
        if(typeof me.onerror==="function"){
            me.onerror(new ProgressEvent("error",{
                target:me
            }))
            }
            if(typeof me.onwriteend==="function"){
            me.onwriteend(new ProgressEvent("writeend",{
                target:me
            }))
            }
        },"File","write",[this.fileName,text,this.position])
};

FileWriter.prototype.seek=function(offset){
    if(this.readyState===FileWriter.WRITING){
        throw new FileError(FileError.INVALID_STATE_ERR)
        }
        if(!offset&&offset!==0){
        return
    }
    if(offset<0){
        this.position=Math.max(offset+this.length,0)
        }else{
        if(offset>this.length){
            this.position=this.length
            }else{
            this.position=offset
            }
        }
};

FileWriter.prototype.truncate=function(size){
    if(this.readyState===FileWriter.WRITING){
        throw new FileError(FileError.INVALID_STATE_ERR)
        }
        this.readyState=FileWriter.WRITING;
    var me=this;
    if(typeof me.onwritestart==="function"){
        me.onwritestart(new ProgressEvent("writestart",{
            target:this
        }))
        }
        exec(function(r){
        if(me.readyState===FileWriter.DONE){
            return
        }
        me.readyState=FileWriter.DONE;
        me.length=r;
        me.position=Math.min(me.position,r);
        if(typeof me.onwrite==="function"){
            me.onwrite(new ProgressEvent("write",{
                target:me
            }))
            }
            if(typeof me.onwriteend==="function"){
            me.onwriteend(new ProgressEvent("writeend",{
                target:me
            }))
            }
        },function(e){
        if(me.readyState===FileWriter.DONE){
            return
        }
        me.readyState=FileWriter.DONE;
        me.error=new FileError(e);
        if(typeof me.onerror==="function"){
            me.onerror(new ProgressEvent("error",{
                target:me
            }))
            }
            if(typeof me.onwriteend==="function"){
            me.onwriteend(new ProgressEvent("writeend",{
                target:me
            }))
            }
        },"File","truncate",[this.fileName,size])
};

module.exports=FileWriter
});
define("cordova/plugin/Flags",function(require,exports,module){
    function Flags(create,exclusive){
        this.create=create||false;
        this.exclusive=exclusive||false
        }
        module.exports=Flags
    });
define("cordova/plugin/GlobalizationError",function(require,exports,module){
    var GlobalizationError=function(code,message){
        this.code=code||null;
        this.message=message||""
        };
        
    GlobalizationError.UNKNOWN_ERROR=0;
    GlobalizationError.FORMATTING_ERROR=1;
    GlobalizationError.PARSING_ERROR=2;
    GlobalizationError.PATTERN_ERROR=3;
    module.exports=GlobalizationError
    });
define("cordova/plugin/InAppBrowser",function(require,exports,module){
    var exec=require("cordova/exec");
    var channel=require("cordova/channel");
    var modulemapper=require("cordova/modulemapper");
    function InAppBrowser(){
        this.channels={
            loadstart:channel.create("loadstart"),
            loadstop:channel.create("loadstop"),
            loaderror:channel.create("loaderror"),
            exit:channel.create("exit")
            }
        }
    InAppBrowser.prototype={
    _eventHandler:function(event){
        if(event.type in this.channels){
            this.channels[event.type].fire(event)
            }
        },
close:function(eventname){
    exec(null,null,"InAppBrowser","close",[])
    },
addEventListener:function(eventname,f){
    if(eventname in this.channels){
        this.channels[eventname].subscribe(f)
        }
    },
removeEventListener:function(eventname,f){
    if(eventname in this.channels){
        this.channels[eventname].unsubscribe(f)
        }
    },
executeScript:function(injectDetails,cb){
    if(injectDetails.code){
        exec(cb,null,"InAppBrowser","injectScriptCode",[injectDetails.code,!!cb])
        }else{
        if(injectDetails.file){
            exec(cb,null,"InAppBrowser","injectScriptFile",[injectDetails.file,!!cb])
            }else{
            throw new Error("executeScript requires exactly one of code or file to be specified")
            }
        }
},
insertCSS:function(injectDetails,cb){
    if(injectDetails.code){
        exec(cb,null,"InAppBrowser","injectStyleCode",[injectDetails.code,!!cb])
        }else{
        if(injectDetails.file){
            exec(cb,null,"InAppBrowser","injectStyleFile",[injectDetails.file,!!cb])
            }else{
            throw new Error("insertCSS requires exactly one of code or file to be specified")
            }
        }
}
};

module.exports=function(strUrl,strWindowName,strWindowFeatures){
    var iab=new InAppBrowser();
    var cb=function(eventname){
        iab._eventHandler(eventname)
        };
        
    if(window.frames&&window.frames[strWindowName]){
        var origOpenFunc=modulemapper.getOriginalSymbol(window,"open");
        return origOpenFunc.apply(window,arguments)
        }
        exec(cb,cb,"InAppBrowser","open",[strUrl,strWindowName,strWindowFeatures]);
    return iab
    }
});
define("cordova/plugin/LocalFileSystem",function(require,exports,module){
    var exec=require("cordova/exec");
    var LocalFileSystem=function(){};
    
    LocalFileSystem.TEMPORARY=0;
    LocalFileSystem.PERSISTENT=1;
    module.exports=LocalFileSystem
    });
define("cordova/plugin/Media",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),utils=require("cordova/utils"),exec=require("cordova/exec");
    var mediaObjects={};
    
    var Media=function(src,successCallback,errorCallback,statusCallback){
        argscheck.checkArgs("SFFF","Media",arguments);
        this.id=utils.createUUID();
        mediaObjects[this.id]=this;
        this.src=src;
        this.successCallback=successCallback;
        this.errorCallback=errorCallback;
        this.statusCallback=statusCallback;
        this._duration=-1;
        this._position=-1;
        exec(null,this.errorCallback,"Media","create",[this.id,this.src])
        };
        
    Media.MEDIA_STATE=1;
    Media.MEDIA_DURATION=2;
    Media.MEDIA_POSITION=3;
    Media.MEDIA_ERROR=9;
    Media.MEDIA_NONE=0;
    Media.MEDIA_STARTING=1;
    Media.MEDIA_RUNNING=2;
    Media.MEDIA_PAUSED=3;
    Media.MEDIA_STOPPED=4;
    Media.MEDIA_MSG=["None","Starting","Running","Paused","Stopped"];
    Media.get=function(id){
        return mediaObjects[id]
        };
        
    Media.prototype.play=function(options){
        exec(null,null,"Media","startPlayingAudio",[this.id,this.src,options])
        };
        
    Media.prototype.stop=function(){
        var me=this;
        exec(function(){
            me._position=0
            },this.errorCallback,"Media","stopPlayingAudio",[this.id])
        };
        
    Media.prototype.seekTo=function(milliseconds){
        var me=this;
        exec(function(p){
            me._position=p
            },this.errorCallback,"Media","seekToAudio",[this.id,milliseconds])
        };
        
    Media.prototype.pause=function(){
        exec(null,this.errorCallback,"Media","pausePlayingAudio",[this.id])
        };
        
    Media.prototype.getDuration=function(){
        return this._duration
        };
        
    Media.prototype.getCurrentPosition=function(success,fail){
        var me=this;
        exec(function(p){
            me._position=p;
            success(p)
            },fail,"Media","getCurrentPositionAudio",[this.id])
        };
        
    Media.prototype.startRecord=function(){
        exec(null,this.errorCallback,"Media","startRecordingAudio",[this.id,this.src])
        };
        
    Media.prototype.stopRecord=function(){
        exec(null,this.errorCallback,"Media","stopRecordingAudio",[this.id])
        };
        
    Media.prototype.release=function(){
        exec(null,this.errorCallback,"Media","release",[this.id])
        };
        
    Media.prototype.setVolume=function(volume){
        exec(null,null,"Media","setVolume",[this.id,volume])
        };
        
    Media.onStatus=function(id,msgType,value){
        var media=mediaObjects[id];
        if(media){
            switch(msgType){
                case Media.MEDIA_STATE:
                    media.statusCallback&&media.statusCallback(value);
                    if(value==Media.MEDIA_STOPPED){
                    media.successCallback&&media.successCallback()
                    }
                    break;
                case Media.MEDIA_DURATION:
                    media._duration=value;
                    break;
                case Media.MEDIA_ERROR:
                    media.errorCallback&&media.errorCallback(value);
                    break;
                case Media.MEDIA_POSITION:
                    media._position=Number(value);
                    break;
                default:
                    console.error&&console.error("Unhandled Media.onStatus :: "+msgType);
                    break
                    }
                }else{
        console.error&&console.error("Received Media.onStatus callback for unknown media :: "+id)
        }
    };

module.exports=Media
});
define("cordova/plugin/MediaError",function(require,exports,module){
    var _MediaError=window.MediaError;
    if(!_MediaError){
        window.MediaError=_MediaError=function(code,msg){
            this.code=(typeof code!="undefined")?code:null;
            this.message=msg||""
            }
        }
    _MediaError.MEDIA_ERR_NONE_ACTIVE=_MediaError.MEDIA_ERR_NONE_ACTIVE||0;
_MediaError.MEDIA_ERR_ABORTED=_MediaError.MEDIA_ERR_ABORTED||1;
_MediaError.MEDIA_ERR_NETWORK=_MediaError.MEDIA_ERR_NETWORK||2;
_MediaError.MEDIA_ERR_DECODE=_MediaError.MEDIA_ERR_DECODE||3;
_MediaError.MEDIA_ERR_NONE_SUPPORTED=_MediaError.MEDIA_ERR_NONE_SUPPORTED||4;
_MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED=_MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED||4;
module.exports=_MediaError
});
define("cordova/plugin/MediaFile",function(require,exports,module){
    var utils=require("cordova/utils"),exec=require("cordova/exec"),File=require("cordova/plugin/File"),CaptureError=require("cordova/plugin/CaptureError");
    var MediaFile=function(name,fullPath,type,lastModifiedDate,size){
        MediaFile.__super__.constructor.apply(this,arguments)
        };
        
    utils.extend(MediaFile,File);
    MediaFile.prototype.getFormatData=function(successCallback,errorCallback){
        if(typeof this.fullPath==="undefined"||this.fullPath===null){
            errorCallback(new CaptureError(CaptureError.CAPTURE_INVALID_ARGUMENT))
            }else{
            exec(successCallback,errorCallback,"Capture","getFormatData",[this.fullPath,this.type])
            }
        };
    
module.exports=MediaFile
});
define("cordova/plugin/MediaFileData",function(require,exports,module){
    var MediaFileData=function(codecs,bitrate,height,width,duration){
        this.codecs=codecs||null;
        this.bitrate=bitrate||0;
        this.height=height||0;
        this.width=width||0;
        this.duration=duration||0
        };
        
    module.exports=MediaFileData
    });
define("cordova/plugin/Metadata",function(require,exports,module){
    var Metadata=function(time){
        this.modificationTime=(typeof time!="undefined"?new Date(time):null)
        };
        
    module.exports=Metadata
    });
define("cordova/plugin/Position",function(require,exports,module){
    var Coordinates=require("cordova/plugin/Coordinates");
    var Position=function(coords,timestamp){
        if(coords){
            this.coords=new Coordinates(coords.latitude,coords.longitude,coords.altitude,coords.accuracy,coords.heading,coords.velocity,coords.altitudeAccuracy)
            }else{
            this.coords=new Coordinates()
            }
            this.timestamp=(timestamp!==undefined)?timestamp:new Date()
        };
        
    module.exports=Position
    });
define("cordova/plugin/PositionError",function(require,exports,module){
    var PositionError=function(code,message){
        this.code=code||null;
        this.message=message||""
        };
        
    PositionError.PERMISSION_DENIED=1;
    PositionError.POSITION_UNAVAILABLE=2;
    PositionError.TIMEOUT=3;
    module.exports=PositionError
    });
define("cordova/plugin/ProgressEvent",function(require,exports,module){
    var ProgressEvent=(function(){
        return function ProgressEvent(type,dict){
            this.type=type;
            this.bubbles=false;
            this.cancelBubble=false;
            this.cancelable=false;
            this.lengthComputable=false;
            this.loaded=dict&&dict.loaded?dict.loaded:0;
            this.total=dict&&dict.total?dict.total:0;
            this.target=dict&&dict.target?dict.target:null
            }
        })();
    module.exports=ProgressEvent
    });
define("cordova/plugin/accelerometer",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),utils=require("cordova/utils"),exec=require("cordova/exec"),Acceleration=require("cordova/plugin/Acceleration");
    var running=false;
    var timers={};
    
    var listeners=[];
    var accel=null;
    function start(){
        exec(function(a){
            var tempListeners=listeners.slice(0);
            accel=new Acceleration(a.x,a.y,a.z,a.timestamp);
            for(var i=0,l=tempListeners.length;i<l;i++){
                tempListeners[i].win(accel)
                }
            },function(e){
            var tempListeners=listeners.slice(0);
            for(var i=0,l=tempListeners.length;i<l;i++){
                tempListeners[i].fail(e)
                }
            },"Accelerometer","start",[]);
running=true
}
function stop(){
    exec(null,null,"Accelerometer","stop",[]);
    running=false
    }
    function createCallbackPair(win,fail){
    return{
        win:win,
        fail:fail
    }
}
function removeListeners(l){
    var idx=listeners.indexOf(l);
    if(idx>-1){
        listeners.splice(idx,1);
        if(listeners.length===0){
            stop()
            }
        }
}
var accelerometer={
    getCurrentAcceleration:function(successCallback,errorCallback,options){
        argscheck.checkArgs("fFO","accelerometer.getCurrentAcceleration",arguments);
        var p;
        var win=function(a){
            removeListeners(p);
            successCallback(a)
            };
            
        var fail=function(e){
            removeListeners(p);
            errorCallback&&errorCallback(e)
            };
            
        p=createCallbackPair(win,fail);
        listeners.push(p);
        if(!running){
            start()
            }
        },
watchAcceleration:function(successCallback,errorCallback,options){
    argscheck.checkArgs("fFO","accelerometer.watchAcceleration",arguments);
    var frequency=(options&&options.frequency&&typeof options.frequency=="number")?options.frequency:10000;
    var id=utils.createUUID();
    var p=createCallbackPair(function(){},function(e){
        removeListeners(p);
        errorCallback&&errorCallback(e)
        });
    listeners.push(p);
    timers[id]={
        timer:window.setInterval(function(){
            if(accel){
                successCallback(accel)
                }
            },frequency),
    listeners:p
};

if(running){
    if(accel){
        successCallback(accel)
        }
    }else{
    start()
    }
    return id
},
clearWatch:function(id){
    if(id&&timers[id]){
        window.clearInterval(timers[id].timer);
        removeListeners(timers[id].listeners);
        delete timers[id]
    }
}
};

module.exports=accelerometer
});
define("cordova/plugin/accelerometer/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.defaults("cordova/plugin/Acceleration","Acceleration");
    modulemapper.defaults("cordova/plugin/accelerometer","navigator.accelerometer")
    });
define("cordova/plugin/android/app",function(require,exports,module){
    var exec=require("cordova/exec");
    module.exports={
        clearCache:function(){
            exec(null,null,"App","clearCache",[])
            },
        loadUrl:function(url,props){
            exec(null,null,"App","loadUrl",[url,props])
            },
        cancelLoadUrl:function(){
            exec(null,null,"App","cancelLoadUrl",[])
            },
        clearHistory:function(){
            exec(null,null,"App","clearHistory",[])
            },
        backHistory:function(){
            exec(null,null,"App","backHistory",[])
            },
        overrideBackbutton:function(override){
            exec(null,null,"App","overrideBackbutton",[override])
            },
        exitApp:function(){
            return exec(null,null,"App","exitApp",[])
            }
        }
});
define("cordova/plugin/android/device",function(require,exports,module){
    var channel=require("cordova/channel"),utils=require("cordova/utils"),exec=require("cordova/exec"),app=require("cordova/plugin/android/app");
    module.exports={
        overrideBackButton:function(){
            console.log("Device.overrideBackButton() is deprecated.  Use App.overrideBackbutton(true).");
            app.overrideBackbutton(true)
            },
        resetBackButton:function(){
            console.log("Device.resetBackButton() is deprecated.  Use App.overrideBackbutton(false).");
            app.overrideBackbutton(false)
            },
        exitApp:function(){
            console.log("Device.exitApp() is deprecated.  Use App.exitApp().");
            app.exitApp()
            }
        }
});
define("cordova/plugin/android/nativeapiprovider",function(require,exports,module){
    var nativeApi=this._cordovaNative||require("cordova/plugin/android/promptbasednativeapi");
    var currentApi=nativeApi;
    module.exports={
        get:function(){
            return currentApi
            },
        setPreferPrompt:function(value){
            currentApi=value?require("cordova/plugin/android/promptbasednativeapi"):nativeApi
            },
        set:function(value){
            currentApi=value
            }
        }
});
define("cordova/plugin/android/notification",function(require,exports,module){
    var exec=require("cordova/exec");
    module.exports={
        activityStart:function(title,message){
            if(typeof title==="undefined"&&typeof message=="undefined"){
                title="Busy";
                message="Please wait..."
                }
                exec(null,null,"Notification","activityStart",[title,message])
            },
        activityStop:function(){
            exec(null,null,"Notification","activityStop",[])
            },
        progressStart:function(title,message){
            exec(null,null,"Notification","progressStart",[title,message])
            },
        progressStop:function(){
            exec(null,null,"Notification","progressStop",[])
            },
        progressValue:function(value){
            exec(null,null,"Notification","progressValue",[value])
            }
        }
});
define("cordova/plugin/android/promptbasednativeapi",function(require,exports,module){
    module.exports={
        exec:function(service,action,callbackId,argsJson){
            return prompt(argsJson,"gap:"+JSON.stringify([service,action,callbackId]))
            },
        setNativeToJsBridgeMode:function(value){
            prompt(value,"gap_bridge_mode:")
            },
        retrieveJsMessages:function(){
            return prompt("","gap_poll:")
            }
        }
});
define("cordova/plugin/android/storage",function(require,exports,module){
    var utils=require("cordova/utils"),exec=require("cordova/exec"),channel=require("cordova/channel");
    var queryQueue={};
    
    var DroidDB_Rows=function(){
        this.resultSet=[];
        this.length=0
        };
        
    DroidDB_Rows.prototype.item=function(row){
        return this.resultSet[row]
        };
        
    var DroidDB_Result=function(){
        this.rows=new DroidDB_Rows()
        };
        
    function completeQuery(id,data){
        var query=queryQueue[id];
        if(query){
            try{
                delete queryQueue[id];
                var tx=query.tx;
                if(tx&&tx.queryList[id]){
                    var r=new DroidDB_Result();
                    r.rows.resultSet=data;
                    r.rows.length=data.length;
                    try{
                        if(typeof query.successCallback==="function"){
                            query.successCallback(query.tx,r)
                            }
                        }catch(ex){
                    console.log("executeSql error calling user success callback: "+ex)
                    }
                    tx.queryComplete(id)
                }
            }catch(e){
        console.log("executeSql error: "+e)
        }
    }
}
function failQuery(reason,id){
    var query=queryQueue[id];
    if(query){
        try{
            delete queryQueue[id];
            var tx=query.tx;
            if(tx&&tx.queryList[id]){
                tx.queryList={};
                
                try{
                    if(typeof query.errorCallback==="function"){
                        query.errorCallback(query.tx,reason)
                        }
                    }catch(ex){
                console.log("executeSql error calling user error callback: "+ex)
                }
                tx.queryFailed(id,reason)
            }
        }catch(e){
    console.log("executeSql error: "+e)
    }
}
}
var DroidDB_Query=function(tx){
    this.id=utils.createUUID();
    queryQueue[this.id]=this;
    this.resultSet=[];
    this.tx=tx;
    this.tx.queryList[this.id]=this;
    this.successCallback=null;
    this.errorCallback=null
    };
    
var DroidDB_Tx=function(){
    this.id=utils.createUUID();
    this.successCallback=null;
    this.errorCallback=null;
    this.queryList={}
};

DroidDB_Tx.prototype.queryComplete=function(id){
    delete this.queryList[id];
    if(this.successCallback){
        var count=0;
        var i;
        for(i in this.queryList){
            if(this.queryList.hasOwnProperty(i)){
                count++
            }
        }
        if(count===0){
        try{
            this.successCallback()
            }catch(e){
            console.log("Transaction error calling user success callback: "+e)
            }
        }
}
};

DroidDB_Tx.prototype.queryFailed=function(id,reason){
    this.queryList={};
    
    if(this.errorCallback){
        try{
            this.errorCallback(reason)
            }catch(e){
            console.log("Transaction error calling user error callback: "+e)
            }
        }
};

DroidDB_Tx.prototype.executeSql=function(sql,params,successCallback,errorCallback){
    if(typeof params==="undefined"){
        params=[]
        }
        var query=new DroidDB_Query(this);
    queryQueue[query.id]=query;
    query.successCallback=successCallback;
    query.errorCallback=errorCallback;
    exec(null,null,"Storage","executeSql",[sql,params,query.id])
    };
    
var DatabaseShell=function(){};

DatabaseShell.prototype.transaction=function(process,errorCallback,successCallback){
    var tx=new DroidDB_Tx();
    tx.successCallback=successCallback;
    tx.errorCallback=errorCallback;
    try{
        process(tx)
        }catch(e){
        console.log("Transaction error: "+e);
        if(tx.errorCallback){
            try{
                tx.errorCallback(e)
                }catch(ex){
                console.log("Transaction error calling user error callback: "+e)
                }
            }
    }
};

var DroidDB_openDatabase=function(name,version,display_name,size){
    exec(null,null,"Storage","openDatabase",[name,version,display_name,size]);
    var db=new DatabaseShell();
    return db
    };
    
module.exports={
    openDatabase:DroidDB_openDatabase,
    failQuery:failQuery,
    completeQuery:completeQuery
}
});
define("cordova/plugin/android/storage/openDatabase",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper"),storage=require("cordova/plugin/android/storage");
    var originalOpenDatabase=modulemapper.getOriginalSymbol(window,"openDatabase");
    module.exports=function(name,version,desc,size){
        if(!originalOpenDatabase){
            return storage.openDatabase.apply(this,arguments)
            }
            try{
            return originalOpenDatabase(name,version,desc,size)
            }catch(ex){
            if(ex.code!==18){
                throw ex
                }
            }
        return storage.openDatabase(name,version,desc,size)
    }
});
define("cordova/plugin/android/storage/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.clobbers("cordova/plugin/android/storage/openDatabase","openDatabase")
    });
define("cordova/plugin/battery",function(require,exports,module){
    var cordova=require("cordova"),exec=require("cordova/exec");
    function handlers(){
        return battery.channels.batterystatus.numHandlers+battery.channels.batterylow.numHandlers+battery.channels.batterycritical.numHandlers
        }
        var Battery=function(){
        this._level=null;
        this._isPlugged=null;
        this.channels={
            batterystatus:cordova.addWindowEventHandler("batterystatus"),
            batterylow:cordova.addWindowEventHandler("batterylow"),
            batterycritical:cordova.addWindowEventHandler("batterycritical")
            };
            
        for(var key in this.channels){
            this.channels[key].onHasSubscribersChange=Battery.onHasSubscribersChange
            }
        };
        
Battery.onHasSubscribersChange=function(){
    if(this.numHandlers===1&&handlers()===1){
        exec(battery._status,battery._error,"Battery","start",[])
        }else{
        if(handlers()===0){
            exec(null,null,"Battery","stop",[])
            }
        }
};

Battery.prototype._status=function(info){
    if(info){
        var me=battery;
        var level=info.level;
        if(me._level!==level||me._isPlugged!==info.isPlugged){
            cordova.fireWindowEvent("batterystatus",info);
            if(level===20||level===5){
                if(level===20){
                    cordova.fireWindowEvent("batterylow",info)
                    }else{
                    cordova.fireWindowEvent("batterycritical",info)
                    }
                }
        }
    me._level=level;
me._isPlugged=info.isPlugged
}
};

Battery.prototype._error=function(e){
    console.log("Error initializing Battery: "+e)
    };
    
var battery=new Battery();
module.exports=battery
});
define("cordova/plugin/battery/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.defaults("cordova/plugin/battery","navigator.battery")
    });
define("cordova/plugin/camera/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.defaults("cordova/plugin/Camera","navigator.camera");
    modulemapper.defaults("cordova/plugin/CameraConstants","Camera");
    modulemapper.defaults("cordova/plugin/CameraPopoverOptions","CameraPopoverOptions")
    });
define("cordova/plugin/capture",function(require,exports,module){
    var exec=require("cordova/exec"),MediaFile=require("cordova/plugin/MediaFile");
    function _capture(type,successCallback,errorCallback,options){
        var win=function(pluginResult){
            var mediaFiles=[];
            var i;
            for(i=0;i<pluginResult.length;i++){
                var mediaFile=new MediaFile();
                mediaFile.name=pluginResult[i].name;
                mediaFile.fullPath=pluginResult[i].fullPath;
                mediaFile.type=pluginResult[i].type;
                mediaFile.lastModifiedDate=pluginResult[i].lastModifiedDate;
                mediaFile.size=pluginResult[i].size;
                mediaFiles.push(mediaFile)
                }
                successCallback(mediaFiles)
            };
            
        exec(win,errorCallback,"Capture",type,[options])
        }
        function Capture(){
        this.supportedAudioModes=[];
        this.supportedImageModes=[];
        this.supportedVideoModes=[]
        }
        Capture.prototype.captureAudio=function(successCallback,errorCallback,options){
        _capture("captureAudio",successCallback,errorCallback,options)
        };
        
    Capture.prototype.captureImage=function(successCallback,errorCallback,options){
        _capture("captureImage",successCallback,errorCallback,options)
        };
        
    Capture.prototype.captureVideo=function(successCallback,errorCallback,options){
        _capture("captureVideo",successCallback,errorCallback,options)
        };
        
    module.exports=new Capture()
    });
define("cordova/plugin/capture/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.clobbers("cordova/plugin/CaptureError","CaptureError");
    modulemapper.clobbers("cordova/plugin/CaptureAudioOptions","CaptureAudioOptions");
    modulemapper.clobbers("cordova/plugin/CaptureImageOptions","CaptureImageOptions");
    modulemapper.clobbers("cordova/plugin/CaptureVideoOptions","CaptureVideoOptions");
    modulemapper.clobbers("cordova/plugin/ConfigurationData","ConfigurationData");
    modulemapper.clobbers("cordova/plugin/MediaFile","MediaFile");
    modulemapper.clobbers("cordova/plugin/MediaFileData","MediaFileData");
    modulemapper.clobbers("cordova/plugin/capture","navigator.device.capture")
    });
define("cordova/plugin/compass",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),exec=require("cordova/exec"),utils=require("cordova/utils"),CompassHeading=require("cordova/plugin/CompassHeading"),CompassError=require("cordova/plugin/CompassError"),timers={},compass={
        getCurrentHeading:function(successCallback,errorCallback,options){
            argscheck.checkArgs("fFO","compass.getCurrentHeading",arguments);
            var win=function(result){
                var ch=new CompassHeading(result.magneticHeading,result.trueHeading,result.headingAccuracy,result.timestamp);
                successCallback(ch)
                };
                
            var fail=errorCallback&&function(code){
                var ce=new CompassError(code);
                errorCallback(ce)
                };
                
            exec(win,fail,"Compass","getHeading",[options])
            },
        watchHeading:function(successCallback,errorCallback,options){
            argscheck.checkArgs("fFO","compass.watchHeading",arguments);
            var frequency=(options!==undefined&&options.frequency!==undefined)?options.frequency:100;
            var filter=(options!==undefined&&options.filter!==undefined)?options.filter:0;
            var id=utils.createUUID();
            if(filter>0){
                timers[id]="iOS";
                compass.getCurrentHeading(successCallback,errorCallback,options)
                }else{
                timers[id]=window.setInterval(function(){
                    compass.getCurrentHeading(successCallback,errorCallback)
                    },frequency)
                }
                return id
            },
        clearWatch:function(id){
            if(id&&timers[id]){
                if(timers[id]!="iOS"){
                    clearInterval(timers[id])
                    }else{
                    exec(null,null,"Compass","stopHeading",[])
                    }
                    delete timers[id]
            }
        }
    };

module.exports=compass
});
define("cordova/plugin/compass/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.clobbers("cordova/plugin/CompassHeading","CompassHeading");
    modulemapper.clobbers("cordova/plugin/CompassError","CompassError");
    modulemapper.clobbers("cordova/plugin/compass","navigator.compass")
    });
define("cordova/plugin/console-via-logger",function(require,exports,module){
    var logger=require("cordova/plugin/logger");
    var utils=require("cordova/utils");
    var console=module.exports;
    var WinConsole=window.console;
    var UseLogger=false;
    var Timers={};
    
    function noop(){}
    console.useLogger=function(value){
        if(arguments.length){
            UseLogger=!!value
            }
            if(UseLogger){
            if(logger.useConsole()){
                throw new Error("console and logger are too intertwingly")
                }
            }
        return UseLogger
    };
    
console.log=function(){
    if(logger.useConsole()){
        return
    }
    logger.log.apply(logger,[].slice.call(arguments))
    };
    
console.error=function(){
    if(logger.useConsole()){
        return
    }
    logger.error.apply(logger,[].slice.call(arguments))
    };
    
console.warn=function(){
    if(logger.useConsole()){
        return
    }
    logger.warn.apply(logger,[].slice.call(arguments))
    };
    
console.info=function(){
    if(logger.useConsole()){
        return
    }
    logger.info.apply(logger,[].slice.call(arguments))
    };
    
console.debug=function(){
    if(logger.useConsole()){
        return
    }
    logger.debug.apply(logger,[].slice.call(arguments))
    };
    
console.assert=function(expression){
    if(expression){
        return
    }
    var message=logger.format.apply(logger.format,[].slice.call(arguments,1));
    console.log("ASSERT: "+message)
    };
    
console.clear=function(){};
    
    console.dir=function(object){
    console.log("%o",object)
    };
    
console.dirxml=function(node){
    console.log(node.innerHTML)
    };
    
console.trace=noop;
console.group=console.log;
console.groupCollapsed=console.log;
console.groupEnd=noop;
console.time=function(name){
    Timers[name]=new Date().valueOf()
    };
    
console.timeEnd=function(name){
    var timeStart=Timers[name];
    if(!timeStart){
        console.warn("unknown timer: "+name);
        return
    }
    var timeElapsed=new Date().valueOf()-timeStart;
    console.log(name+": "+timeElapsed+"ms")
    };
    
console.timeStamp=noop;
console.profile=noop;
console.profileEnd=noop;
console.count=noop;
console.exception=console.log;
console.table=function(data,columns){
    console.log("%o",data)
    };
    
function wrappedOrigCall(orgFunc,newFunc){
    return function(){
        var args=[].slice.call(arguments);
        try{
            orgFunc.apply(WinConsole,args)
            }catch(e){}
        try{
            newFunc.apply(console,args)
            }catch(e){}
    }
}
for(var key in console){
    if(typeof WinConsole[key]=="function"){
        console[key]=wrappedOrigCall(WinConsole[key],console[key])
        }
    }
});
define("cordova/plugin/contacts",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),exec=require("cordova/exec"),ContactError=require("cordova/plugin/ContactError"),utils=require("cordova/utils"),Contact=require("cordova/plugin/Contact");
    var contacts={
        find:function(fields,successCB,errorCB,options){
            argscheck.checkArgs("afFO","contacts.find",arguments);
            if(!fields.length){
                errorCB&&errorCB(new ContactError(ContactError.INVALID_ARGUMENT_ERROR))
                }else{
                var win=function(result){
                    var cs=[];
                    for(var i=0,l=result.length;i<l;i++){
                        cs.push(contacts.create(result[i]))
                        }
                        successCB(cs)
                    };
                    
                exec(win,errorCB,"Contacts","search",[fields,options])
                }
            },
    create:function(properties){
        argscheck.checkArgs("O","contacts.create",arguments);
        var contact=new Contact();
        for(var i in properties){
            if(typeof contact[i]!=="undefined"&&properties.hasOwnProperty(i)){
                contact[i]=properties[i]
                }
            }
        return contact
    }
};

module.exports=contacts
});
define("cordova/plugin/contacts/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.clobbers("cordova/plugin/contacts","navigator.contacts");
    modulemapper.clobbers("cordova/plugin/Contact","Contact");
    modulemapper.clobbers("cordova/plugin/ContactAddress","ContactAddress");
    modulemapper.clobbers("cordova/plugin/ContactError","ContactError");
    modulemapper.clobbers("cordova/plugin/ContactField","ContactField");
    modulemapper.clobbers("cordova/plugin/ContactFindOptions","ContactFindOptions");
    modulemapper.clobbers("cordova/plugin/ContactName","ContactName");
    modulemapper.clobbers("cordova/plugin/ContactOrganization","ContactOrganization")
    });
define("cordova/plugin/device",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),channel=require("cordova/channel"),utils=require("cordova/utils"),exec=require("cordova/exec");
    channel.waitForInitialization("onCordovaInfoReady");
    function Device(){
        this.available=false;
        this.platform=null;
        this.version=null;
        this.uuid=null;
        this.cordova=null;
        this.model=null;
        var me=this;
        channel.onCordovaReady.subscribe(function(){
            me.getInfo(function(info){
                var buildLabel=info.cordova;
                if(buildLabel!=CORDOVA_JS_BUILD_LABEL){
                    buildLabel+=" JS="+CORDOVA_JS_BUILD_LABEL
                    }
                    me.available=true;
                me.platform=info.platform;
                me.version=info.version;
                me.uuid=info.uuid;
                me.cordova=buildLabel;
                me.model=info.model;
                channel.onCordovaInfoReady.fire()
                },function(e){
                me.available=false;
                utils.alert("[ERROR] Error initializing Cordova: "+e)
                })
            })
        }
        Device.prototype.getInfo=function(successCallback,errorCallback){
        argscheck.checkArgs("fF","Device.getInfo",arguments);
        exec(successCallback,errorCallback,"Device","getDeviceInfo",[])
        };
        
    module.exports=new Device()
    });
define("cordova/plugin/device/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.clobbers("cordova/plugin/device","device");
    modulemapper.merges("cordova/plugin/android/device","device")
    });
define("cordova/plugin/echo",function(require,exports,module){
    var exec=require("cordova/exec"),utils=require("cordova/utils");
    module.exports=function(successCallback,errorCallback,message,forceAsync){
        var action="echo";
        var messageIsMultipart=(utils.typeName(message)=="Array");
        var args=messageIsMultipart?message:[message];
        if(utils.typeName(message)=="ArrayBuffer"){
            if(forceAsync){
                console.warn("Cannot echo ArrayBuffer with forced async, falling back to sync.")
                }
                action+="ArrayBuffer"
            }else{
            if(messageIsMultipart){
                if(forceAsync){
                    console.warn("Cannot echo MultiPart Array with forced async, falling back to sync.")
                    }
                    action+="MultiPart"
                }else{
                if(forceAsync){
                    action+="Async"
                    }
                }
        }
    exec(successCallback,errorCallback,"Echo",action,args)
    }
});
define("cordova/plugin/file/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper"),symbolshelper=require("cordova/plugin/file/symbolshelper");
    symbolshelper(modulemapper.clobbers)
    });
define("cordova/plugin/file/symbolshelper",function(require,exports,module){
    module.exports=function(exportFunc){
        exportFunc("cordova/plugin/DirectoryEntry","DirectoryEntry");
        exportFunc("cordova/plugin/DirectoryReader","DirectoryReader");
        exportFunc("cordova/plugin/Entry","Entry");
        exportFunc("cordova/plugin/File","File");
        exportFunc("cordova/plugin/FileEntry","FileEntry");
        exportFunc("cordova/plugin/FileError","FileError");
        exportFunc("cordova/plugin/FileReader","FileReader");
        exportFunc("cordova/plugin/FileSystem","FileSystem");
        exportFunc("cordova/plugin/FileUploadOptions","FileUploadOptions");
        exportFunc("cordova/plugin/FileUploadResult","FileUploadResult");
        exportFunc("cordova/plugin/FileWriter","FileWriter");
        exportFunc("cordova/plugin/Flags","Flags");
        exportFunc("cordova/plugin/LocalFileSystem","LocalFileSystem");
        exportFunc("cordova/plugin/Metadata","Metadata");
        exportFunc("cordova/plugin/ProgressEvent","ProgressEvent");
        exportFunc("cordova/plugin/requestFileSystem","requestFileSystem");
        exportFunc("cordova/plugin/resolveLocalFileSystemURI","resolveLocalFileSystemURI")
        }
    });
define("cordova/plugin/filetransfer/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.clobbers("cordova/plugin/FileTransfer","FileTransfer");
    modulemapper.clobbers("cordova/plugin/FileTransferError","FileTransferError")
    });
define("cordova/plugin/geolocation",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),utils=require("cordova/utils"),exec=require("cordova/exec"),PositionError=require("cordova/plugin/PositionError"),Position=require("cordova/plugin/Position");
    var timers={};
    
    function parseParameters(options){
        var opt={
            maximumAge:0,
            enableHighAccuracy:false,
            timeout:Infinity
        };
        
        if(options){
            if(options.maximumAge!==undefined&&!isNaN(options.maximumAge)&&options.maximumAge>0){
                opt.maximumAge=options.maximumAge
                }
                if(options.enableHighAccuracy!==undefined){
                opt.enableHighAccuracy=options.enableHighAccuracy
                }
                if(options.timeout!==undefined&&!isNaN(options.timeout)){
                if(options.timeout<0){
                    opt.timeout=0
                    }else{
                    opt.timeout=options.timeout
                    }
                }
        }
    return opt
}
function createTimeout(errorCallback,timeout){
    var t=setTimeout(function(){
        clearTimeout(t);
        t=null;
        errorCallback({
            code:PositionError.TIMEOUT,
            message:"Position retrieval timed out."
        })
        },timeout);
    return t
    }
    var geolocation={
    lastPosition:null,
    getCurrentPosition:function(successCallback,errorCallback,options){
        argscheck.checkArgs("fFO","geolocation.getCurrentPosition",arguments);
        options=parseParameters(options);
        var timeoutTimer={
            timer:null
        };
        
        var win=function(p){
            clearTimeout(timeoutTimer.timer);
            if(!(timeoutTimer.timer)){
                return
            }
            var pos=new Position({
                latitude:p.latitude,
                longitude:p.longitude,
                altitude:p.altitude,
                accuracy:p.accuracy,
                heading:p.heading,
                velocity:p.velocity,
                altitudeAccuracy:p.altitudeAccuracy
                },(p.timestamp===undefined?new Date():((p.timestamp instanceof Date)?p.timestamp:new Date(p.timestamp))));
            geolocation.lastPosition=pos;
            successCallback(pos)
            };
            
        var fail=function(e){
            clearTimeout(timeoutTimer.timer);
            timeoutTimer.timer=null;
            var err=new PositionError(e.code,e.message);
            if(errorCallback){
                errorCallback(err)
                }
            };
        
    if(geolocation.lastPosition&&options.maximumAge&&(((new Date()).getTime()-geolocation.lastPosition.timestamp.getTime())<=options.maximumAge)){
        successCallback(geolocation.lastPosition)
        }else{
        if(options.timeout===0){
            fail({
                code:PositionError.TIMEOUT,
                message:"timeout value in PositionOptions set to 0 and no cached Position object available, or cached Position object's age exceeds provided PositionOptions' maximumAge parameter."
            })
            }else{
            if(options.timeout!==Infinity){
                timeoutTimer.timer=createTimeout(fail,options.timeout)
                }else{
                timeoutTimer.timer=true
                }
                exec(win,fail,"Geolocation","getLocation",[options.enableHighAccuracy,options.maximumAge])
            }
        }
    return timeoutTimer
},
watchPosition:function(successCallback,errorCallback,options){
    argscheck.checkArgs("fFO","geolocation.getCurrentPosition",arguments);
    options=parseParameters(options);
    var id=utils.createUUID();
    timers[id]=geolocation.getCurrentPosition(successCallback,errorCallback,options);
    var fail=function(e){
        clearTimeout(timers[id].timer);
        var err=new PositionError(e.code,e.message);
        if(errorCallback){
            errorCallback(err)
            }
        };
    
var win=function(p){
    clearTimeout(timers[id].timer);
    if(options.timeout!==Infinity){
        timers[id].timer=createTimeout(fail,options.timeout)
        }
        var pos=new Position({
        latitude:p.latitude,
        longitude:p.longitude,
        altitude:p.altitude,
        accuracy:p.accuracy,
        heading:p.heading,
        velocity:p.velocity,
        altitudeAccuracy:p.altitudeAccuracy
        },(p.timestamp===undefined?new Date():((p.timestamp instanceof Date)?p.timestamp:new Date(p.timestamp))));
    geolocation.lastPosition=pos;
    successCallback(pos)
    };
    
exec(win,fail,"Geolocation","addWatch",[id,options.enableHighAccuracy]);
return id
},
clearWatch:function(id){
    if(id&&timers[id]!==undefined){
        clearTimeout(timers[id].timer);
        timers[id].timer=false;
        exec(null,null,"Geolocation","clearWatch",[id])
        }
    }
};

module.exports=geolocation
});
define("cordova/plugin/geolocation/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.defaults("cordova/plugin/geolocation","navigator.geolocation");
    modulemapper.clobbers("cordova/plugin/PositionError","PositionError");
    modulemapper.clobbers("cordova/plugin/Position","Position");
    modulemapper.clobbers("cordova/plugin/Coordinates","Coordinates")
    });
define("cordova/plugin/globalization",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),exec=require("cordova/exec"),GlobalizationError=require("cordova/plugin/GlobalizationError");
    var globalization={
        getPreferredLanguage:function(successCB,failureCB){
            argscheck.checkArgs("fF","Globalization.getPreferredLanguage",arguments);
            exec(successCB,failureCB,"Globalization","getPreferredLanguage",[])
            },
        getLocaleName:function(successCB,failureCB){
            argscheck.checkArgs("fF","Globalization.getLocaleName",arguments);
            exec(successCB,failureCB,"Globalization","getLocaleName",[])
            },
        dateToString:function(date,successCB,failureCB,options){
            argscheck.checkArgs("dfFO","Globalization.dateToString",arguments);
            var dateValue=date.valueOf();
            exec(successCB,failureCB,"Globalization","dateToString",[{
                date:dateValue,
                options:options
            }])
            },
        stringToDate:function(dateString,successCB,failureCB,options){
            argscheck.checkArgs("sfFO","Globalization.stringToDate",arguments);
            exec(successCB,failureCB,"Globalization","stringToDate",[{
                dateString:dateString,
                options:options
            }])
            },
        getDatePattern:function(successCB,failureCB,options){
            argscheck.checkArgs("fFO","Globalization.getDatePattern",arguments);
            exec(successCB,failureCB,"Globalization","getDatePattern",[{
                options:options
            }])
            },
        getDateNames:function(successCB,failureCB,options){
            argscheck.checkArgs("fFO","Globalization.getDateNames",arguments);
            exec(successCB,failureCB,"Globalization","getDateNames",[{
                options:options
            }])
            },
        isDayLightSavingsTime:function(date,successCB,failureCB){
            argscheck.checkArgs("dfF","Globalization.isDayLightSavingsTime",arguments);
            var dateValue=date.valueOf();
            exec(successCB,failureCB,"Globalization","isDayLightSavingsTime",[{
                date:dateValue
            }])
            },
        getFirstDayOfWeek:function(successCB,failureCB){
            argscheck.checkArgs("fF","Globalization.getFirstDayOfWeek",arguments);
            exec(successCB,failureCB,"Globalization","getFirstDayOfWeek",[])
            },
        numberToString:function(number,successCB,failureCB,options){
            argscheck.checkArgs("nfFO","Globalization.numberToString",arguments);
            exec(successCB,failureCB,"Globalization","numberToString",[{
                number:number,
                options:options
            }])
            },
        stringToNumber:function(numberString,successCB,failureCB,options){
            argscheck.checkArgs("sfFO","Globalization.stringToNumber",arguments);
            exec(successCB,failureCB,"Globalization","stringToNumber",[{
                numberString:numberString,
                options:options
            }])
            },
        getNumberPattern:function(successCB,failureCB,options){
            argscheck.checkArgs("fFO","Globalization.getNumberPattern",arguments);
            exec(successCB,failureCB,"Globalization","getNumberPattern",[{
                options:options
            }])
            },
        getCurrencyPattern:function(currencyCode,successCB,failureCB){
            argscheck.checkArgs("sfF","Globalization.getCurrencyPattern",arguments);
            exec(successCB,failureCB,"Globalization","getCurrencyPattern",[{
                currencyCode:currencyCode
            }])
            }
        };
    
module.exports=globalization
});
define("cordova/plugin/globalization/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.clobbers("cordova/plugin/globalization","navigator.globalization");
    modulemapper.clobbers("cordova/plugin/GlobalizationError","GlobalizationError")
    });
define("cordova/plugin/inappbrowser/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.clobbers("cordova/plugin/InAppBrowser","open")
    });
define("cordova/plugin/logger",function(require,exports,module){
    var logger=exports;
    var exec=require("cordova/exec");
    var utils=require("cordova/utils");
    var UseConsole=true;
    var UseLogger=true;
    var Queued=[];
    var DeviceReady=false;
    var CurrentLevel;
    var originalConsole=console;
    var Levels=["LOG","ERROR","WARN","INFO","DEBUG"];
    var LevelsMap={};
    
    for(var i=0;i<Levels.length;i++){
        var level=Levels[i];
        LevelsMap[level]=i;
        logger[level]=level
        }
        CurrentLevel=LevelsMap.WARN;
    logger.level=function(value){
        if(arguments.length){
            if(LevelsMap[value]===null){
                throw new Error("invalid logging level: "+value)
                }
                CurrentLevel=LevelsMap[value]
            }
            return Levels[CurrentLevel]
        };
        
    logger.useConsole=function(value){
        if(arguments.length){
            UseConsole=!!value
            }
            if(UseConsole){
            if(typeof console=="undefined"){
                throw new Error("global console object is not defined")
                }
                if(typeof console.log!="function"){
                throw new Error("global console object does not have a log function")
                }
                if(typeof console.useLogger=="function"){
                if(console.useLogger()){
                    throw new Error("console and logger are too intertwingly")
                    }
                }
        }
    return UseConsole
};

logger.useLogger=function(value){
    if(arguments.length){
        UseLogger=!!value
        }
        return UseLogger
    };
    
logger.log=function(message){
    logWithArgs("LOG",arguments)
    };
    
logger.error=function(message){
    logWithArgs("ERROR",arguments)
    };
    
logger.warn=function(message){
    logWithArgs("WARN",arguments)
    };
    
logger.info=function(message){
    logWithArgs("INFO",arguments)
    };
    
logger.debug=function(message){
    logWithArgs("DEBUG",arguments)
    };
    
function logWithArgs(level,args){
    args=[level].concat([].slice.call(args));
    logger.logLevel.apply(logger,args)
    }
    logger.logLevel=function(level){
    var formatArgs=[].slice.call(arguments,1);
    var message=logger.format.apply(logger.format,formatArgs);
    if(LevelsMap[level]===null){
        throw new Error("invalid logging level: "+level)
        }
        if(LevelsMap[level]>CurrentLevel){
        return
    }
    if(!DeviceReady&&!UseConsole){
        Queued.push([level,message]);
        return
    }
    if(UseLogger){
        exec(null,null,"Logger","logLevel",[level,message])
        }
        if(UseConsole){
        if(console.__usingCordovaLogger){
            throw new Error("console and logger are too intertwingly")
            }
            switch(level){
            case logger.LOG:
                originalConsole.log(message);
                break;
            case logger.ERROR:
                originalConsole.log("ERROR: "+message);
                break;
            case logger.WARN:
                originalConsole.log("WARN: "+message);
                break;
            case logger.INFO:
                originalConsole.log("INFO: "+message);
                break;
            case logger.DEBUG:
                originalConsole.log("DEBUG: "+message);
                break
                }
            }
};

logger.format=function(formatString,args){
    return __format(arguments[0],[].slice.call(arguments,1)).join(" ")
    };
    
function __format(formatString,args){
    if(formatString===null||formatString===undefined){
        return[""]
        }
        if(arguments.length==1){
        return[formatString.toString()]
        }
        if(typeof formatString!="string"){
        formatString=formatString.toString()
        }
        var pattern=/(.*?)%(.)(.*)/;
    var rest=formatString;
    var result=[];
    while(args.length){
        var match=pattern.exec(rest);
        if(!match){
            break
        }
        var arg=args.shift();
        rest=match[3];
        result.push(match[1]);
        if(match[2]=="%"){
            result.push("%");
            args.unshift(arg);
            continue
        }
        result.push(__formatted(arg,match[2]))
        }
        result.push(rest);
    var remainingArgs=[].slice.call(args);
    remainingArgs.unshift(result.join(""));
    return remainingArgs
    }
    function __formatted(object,formatChar){
    try{
        switch(formatChar){
            case"j":case"o":
                return JSON.stringify(object);
            case"c":
                return""
                }
            }catch(e){
    return"error JSON.stringify()ing argument: "+e
    }
    if((object===null)||(object===undefined)){
    return Object.prototype.toString.call(object)
    }
    return object.toString()
}
logger.__onDeviceReady=function(){
    if(DeviceReady){
        return
    }
    DeviceReady=true;
    for(var i=0;i<Queued.length;i++){
        var messageArgs=Queued[i];
        logger.logLevel(messageArgs[0],messageArgs[1])
        }
        Queued=null
    };
    
document.addEventListener("deviceready",logger.__onDeviceReady,false)
});
define("cordova/plugin/logger/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.clobbers("cordova/plugin/logger","cordova.logger")
    });
define("cordova/plugin/media/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.defaults("cordova/plugin/Media","Media");
    modulemapper.clobbers("cordova/plugin/MediaError","MediaError")
    });
define("cordova/plugin/network",function(require,exports,module){
    var exec=require("cordova/exec"),cordova=require("cordova"),channel=require("cordova/channel"),utils=require("cordova/utils");
    if(typeof navigator!="undefined"){
        utils.defineGetter(navigator,"onLine",function(){
            return this.connection.type!="none"
            })
        }
        function NetworkConnection(){
        this.type="unknown"
        }
        NetworkConnection.prototype.getInfo=function(successCallback,errorCallback){
        exec(successCallback,errorCallback,"NetworkStatus","getConnectionInfo",[])
        };
        
    var me=new NetworkConnection();
    var timerId=null;
    var timeout=500;
    channel.onCordovaReady.subscribe(function(){
        me.getInfo(function(info){
            me.type=info;
            if(info==="none"){
                timerId=setTimeout(function(){
                    cordova.fireDocumentEvent("offline");
                    timerId=null
                    },timeout)
                }else{
                if(timerId!==null){
                    clearTimeout(timerId);
                    timerId=null
                    }
                    cordova.fireDocumentEvent("online")
                }
                if(channel.onCordovaConnectionReady.state!==2){
                channel.onCordovaConnectionReady.fire()
                }
            },function(e){
            if(channel.onCordovaConnectionReady.state!==2){
                channel.onCordovaConnectionReady.fire()
                }
                console.log("Error initializing Network Connection: "+e)
            })
    });
module.exports=me
});
define("cordova/plugin/networkstatus/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.clobbers("cordova/plugin/network","navigator.network.connection","navigator.network.connection is deprecated. Use navigator.connection instead.");
    modulemapper.clobbers("cordova/plugin/network","navigator.connection");
    modulemapper.defaults("cordova/plugin/Connection","Connection")
    });
define("cordova/plugin/notification",function(require,exports,module){
    var exec=require("cordova/exec");
    var platform=require("cordova/platform");
    module.exports={
        alert:function(message,completeCallback,title,buttonLabel){
            var _title=(title||"Alert");
            var _buttonLabel=(buttonLabel||"OK");
            exec(completeCallback,null,"Notification","alert",[message,_title,_buttonLabel])
            },
        confirm:function(message,resultCallback,title,buttonLabels){
            var _title=(title||"Confirm");
            var _buttonLabels=(buttonLabels||["OK","Cancel"]);
            if(typeof _buttonLabels==="string"){
                console.log("Notification.confirm(string, function, string, string) is deprecated.  Use Notification.confirm(string, function, string, array).")
                }
                if(platform.id=="android"||platform.id=="ios"||platform.id=="windowsphone"||platform.id=="blackberry10"){
                if(typeof _buttonLabels==="string"){
                    var buttonLabelString=_buttonLabels;
                    _buttonLabels=_buttonLabels.split(",")
                    }
                }else{
            if(Array.isArray(_buttonLabels)){
                var buttonLabelArray=_buttonLabels;
                _buttonLabels=buttonLabelArray.toString()
                }
            }
        exec(resultCallback,null,"Notification","confirm",[message,_title,_buttonLabels])
    },
prompt:function(message,resultCallback,title,buttonLabels,defaultText){
    var _message=(message||"Prompt message");
    var _title=(title||"Prompt");
    var _buttonLabels=(buttonLabels||["OK","Cancel"]);
    var _defaultText=(defaultText||"Default text");
    exec(resultCallback,null,"Notification","prompt",[_message,_title,_buttonLabels,_defaultText])
    },
vibrate:function(mills){
    exec(null,null,"Notification","vibrate",[mills])
    },
beep:function(count){
    exec(null,null,"Notification","beep",[count])
    }
}
});
define("cordova/plugin/notification/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.clobbers("cordova/plugin/notification","navigator.notification");
    modulemapper.merges("cordova/plugin/android/notification","navigator.notification")
    });
define("cordova/plugin/requestFileSystem",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),FileError=require("cordova/plugin/FileError"),FileSystem=require("cordova/plugin/FileSystem"),exec=require("cordova/exec");
    var requestFileSystem=function(type,size,successCallback,errorCallback){
        argscheck.checkArgs("nnFF","requestFileSystem",arguments);
        var fail=function(code){
            errorCallback&&errorCallback(new FileError(code))
            };
            
        if(type<0||type>3){
            fail(FileError.SYNTAX_ERR)
            }else{
            var success=function(file_system){
                if(file_system){
                    if(successCallback){
                        var result=new FileSystem(file_system.name,file_system.root);
                        successCallback(result)
                        }
                    }else{
                fail(FileError.NOT_FOUND_ERR)
                }
            };
        
    exec(success,fail,"File","requestFileSystem",[type,size])
    }
};

module.exports=requestFileSystem
});
define("cordova/plugin/resolveLocalFileSystemURI",function(require,exports,module){
    var argscheck=require("cordova/argscheck"),DirectoryEntry=require("cordova/plugin/DirectoryEntry"),FileEntry=require("cordova/plugin/FileEntry"),FileError=require("cordova/plugin/FileError"),exec=require("cordova/exec");
    module.exports=function(uri,successCallback,errorCallback){
        argscheck.checkArgs("sFF","resolveLocalFileSystemURI",arguments);
        var fail=function(error){
            errorCallback&&errorCallback(new FileError(error))
            };
            
        if(!uri||uri.split(":").length>2){
            setTimeout(function(){
                fail(FileError.ENCODING_ERR)
                },0);
            return
        }
        var success=function(entry){
            var result;
            if(entry){
                if(successCallback){
                    result=(entry.isDirectory)?new DirectoryEntry(entry.name,entry.fullPath):new FileEntry(entry.name,entry.fullPath);
                    successCallback(result)
                    }
                }else{
            fail(FileError.NOT_FOUND_ERR)
            }
        };
    
exec(success,fail,"File","resolveLocalFileSystemURI",[uri])
    }
});
define("cordova/plugin/splashscreen",function(require,exports,module){
    var exec=require("cordova/exec");
    var splashscreen={
        show:function(){
            exec(null,null,"SplashScreen","show",[])
            },
        hide:function(){
            exec(null,null,"SplashScreen","hide",[])
            }
        };
    
module.exports=splashscreen
});
define("cordova/plugin/splashscreen/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.clobbers("cordova/plugin/splashscreen","navigator.splashscreen")
    });
define("cordova/symbols",function(require,exports,module){
    var modulemapper=require("cordova/modulemapper");
    modulemapper.merges("cordova","cordova");
    modulemapper.clobbers("cordova/exec","cordova.exec");
    modulemapper.clobbers("cordova/exec","Cordova.exec")
    });
define("cordova/utils",function(require,exports,module){
    var utils=exports;
    utils.defineGetterSetter=function(obj,key,getFunc,opt_setFunc){
        if(Object.defineProperty){
            var desc={
                get:getFunc,
                configurable:true
            };
            
            if(opt_setFunc){
                desc.set=opt_setFunc
                }
                Object.defineProperty(obj,key,desc)
            }else{
            obj.__defineGetter__(key,getFunc);
            if(opt_setFunc){
                obj.__defineSetter__(key,opt_setFunc)
                }
            }
    };

utils.defineGetter=utils.defineGetterSetter;
utils.arrayIndexOf=function(a,item){
    if(a.indexOf){
        return a.indexOf(item)
        }
        var len=a.length;
    for(var i=0;i<len;++i){
        if(a[i]==item){
            return i
            }
        }
    return -1
};

utils.arrayRemove=function(a,item){
    var index=utils.arrayIndexOf(a,item);
    if(index!=-1){
        a.splice(index,1)
        }
        return index!=-1
    };
    
utils.typeName=function(val){
    return Object.prototype.toString.call(val).slice(8,-1)
    };
    
utils.isArray=function(a){
    return utils.typeName(a)=="Array"
    };
    
utils.isDate=function(d){
    return utils.typeName(d)=="Date"
    };
    
utils.clone=function(obj){
    if(!obj||typeof obj=="function"||utils.isDate(obj)||typeof obj!="object"){
        return obj
        }
        var retVal,i;
    if(utils.isArray(obj)){
        retVal=[];
        for(i=0;i<obj.length;++i){
            retVal.push(utils.clone(obj[i]))
            }
            return retVal
        }
        retVal={};
    
    for(i in obj){
        if(!(i in retVal)||retVal[i]!=obj[i]){
            retVal[i]=utils.clone(obj[i])
            }
        }
    return retVal
};

utils.close=function(context,func,params){
    if(typeof params=="undefined"){
        return function(){
            return func.apply(context,arguments)
            }
        }else{
    return function(){
        return func.apply(context,params)
        }
    }
};

utils.createUUID=function(){
    return UUIDcreatePart(4)+"-"+UUIDcreatePart(2)+"-"+UUIDcreatePart(2)+"-"+UUIDcreatePart(2)+"-"+UUIDcreatePart(6)
    };
    
utils.extend=(function(){
    var F=function(){};
    
    return function(Child,Parent){
        F.prototype=Parent.prototype;
        Child.prototype=new F();
        Child.__super__=Parent.prototype;
        Child.prototype.constructor=Child
        }
    }());
utils.alert=function(msg){
    if(window.alert){
        window.alert(msg)
        }else{
        if(console&&console.log){
            console.log(msg)
            }
        }
};

function UUIDcreatePart(length){
    var uuidpart="";
    for(var i=0;i<length;i++){
        var uuidchar=parseInt((Math.random()*256),10).toString(16);
        if(uuidchar.length==1){
            uuidchar="0"+uuidchar
            }
            uuidpart+=uuidchar
        }
        return uuidpart
    }
});
window.cordova=require("cordova");
(function(context){
    if(context._cordovaJsLoaded){
        throw new Error("cordova.js included multiple times.")
        }
        context._cordovaJsLoaded=true;
    var channel=require("cordova/channel");
    var platformInitChannelsArray=[channel.onNativeReady,channel.onPluginsReady];
    function logUnfiredChannels(arr){
        for(var i=0;i<arr.length;++i){
            if(arr[i].state!=2){
                console.log("Channel not fired: "+arr[i].type)
                }
            }
        }
    window.setTimeout(function(){
    if(channel.onDeviceReady.state!=2){
        console.log("deviceready has not fired after 5 seconds.");
        logUnfiredChannels(platformInitChannelsArray);
        logUnfiredChannels(channel.deviceReadyChannelsArray)
        }
    },5000);
function replaceNavigator(origNavigator){
    var CordovaNavigator=function(){};
    
    CordovaNavigator.prototype=origNavigator;
    var newNavigator=new CordovaNavigator();
    if(CordovaNavigator.bind){
        for(var key in origNavigator){
            if(typeof origNavigator[key]=="function"){
                newNavigator[key]=origNavigator[key].bind(origNavigator)
                }
            }
        }
        return newNavigator
}
if(context.navigator){
    context.navigator=replaceNavigator(context.navigator)
    }
    if(window._nativeReady){
    channel.onNativeReady.fire()
    }
    channel.join(function(){
    require("cordova/platform").initialize();
    channel.onCordovaReady.fire();
    channel.join(function(){
        require("cordova").fireDocumentEvent("deviceready")
        },channel.deviceReadyChannelsArray)
    },platformInitChannelsArray)
}(window));
require("cordova/channel").onNativeReady.fire();
(function(context){
    var onScriptLoadingComplete;
    var scriptCounter=0;
    function scriptLoadedCallback(){
        scriptCounter--;
        if(scriptCounter===0){
            onScriptLoadingComplete&&onScriptLoadingComplete()
            }
        }
    function injectScript(path){
    scriptCounter++;
    var script=document.createElement("script");
    script.onload=scriptLoadedCallback;
    script.src=path;
    document.head.appendChild(script)
    }
    function finishPluginLoading(){
    context.cordova.require("cordova/channel").onPluginsReady.fire()
    }
    function handlePluginsObject(modules,path){
    var mapper=context.cordova.require("cordova/modulemapper");
    onScriptLoadingComplete=function(){
        for(var i=0;i<modules.length;i++){
            var module=modules[i];
            if(!module){
                continue
            }
            if(module.clobbers&&module.clobbers.length){
                for(var j=0;j<module.clobbers.length;j++){
                    mapper.clobbers(module.id,module.clobbers[j])
                    }
                }
                if(module.merges&&module.merges.length){
            for(var k=0;k<module.merges.length;k++){
                mapper.merges(module.id,module.merges[k])
                }
            }
            if(module.runs&&!(module.clobbers&&module.clobbers.length)&&!(module.merges&&module.merges.length)){
            context.cordova.require(module.id)
            }
        }
    finishPluginLoading()
};

for(var i=0;i<modules.length;i++){
    injectScript(path+modules[i].file)
    }
}
var path="";
var scripts=document.getElementsByTagName("script");
var term="cordova.js";
for(var n=scripts.length-1;n>-1;n--){
    var src=scripts[n].src;
    if(src.indexOf(term)==(src.length-term.length)){
        path=src.substring(0,src.length-term.length);
        break
    }
}
var xhr=new XMLHttpRequest();
xhr.onload=function(){
    var obj;
    try{
        obj=(this.status==0||this.status==200)&&this.responseText&&JSON.parse(this.responseText)
        }catch(err){}
    if(Array.isArray(obj)&&obj.length>0){
        handlePluginsObject(obj,path)
        }else{
        finishPluginLoading()
        }
    };

xhr.onerror=function(){
    finishPluginLoading()
    };
    
var plugins_json=path+"cordova_plugins.json";
try{
    xhr.open("GET",plugins_json,true);
    xhr.send()
    }catch(err){
    finishPluginLoading()
    }
}(window))
})();