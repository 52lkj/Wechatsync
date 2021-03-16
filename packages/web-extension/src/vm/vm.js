// import vm from "../../vm/vm";
import Sval from 'sval'
import svalScopes from "@wechatsync/drivers/scopes";

export function getDriverProvider(code) {
  const options = {
    // ECMA Version of the code (5 | 6 | 7 | 8 | 9 | 10 | 2015 | 2016 | 2017 | 2018 | 2019)
    ecmaVer: 9,
    // Whether the code runs in a sandbox
    sandBox: true,
  }

  const interpreter = new Sval(options)
  const sanbox = {
    ...svalScopes,
    console: console,
    $: $,
    DOMParser: DOMParser,
    document: document,
    Blob: Blob,
    Promise: Promise,
    setCache: setCache,
    initliazeFrame: initliazeFrame,
    requestFrameMethod: requestFrameMethod,
    modifyRequestHeaders: modifyRequestHeaders
  }

  for (var k in sanbox) {
    interpreter.import(k, sanbox[k])
  }
  // const context = vm.createContext(sanbox);
  // const instance = vm.runInContext(code, context);
  console.log(code)
  interpreter.run(code)

  return interpreter.exports
}

window.initliazeDriver = initliazeDriver

export function initliazeDriver(conf) {
  return new Promise((resolve, reject) => {
    function createDriver(driverRemote) {
      // console.log(window.driver);
      const code = driverRemote ? driverRemote : window.driver
      const driver = getDriverProvider(code)
      resolve(driver)
    }

    chrome.storage.local.get(['driver'], function (result) {
      if(conf.beforeCreate) {
        conf.beforeCreate(result)
      }
      createDriver(result.driver)
    })
    // return driver;
  })
}

function setCache(name, value) {
  var d = {};
  d[name] = value;
  chrome.storage.local.set(d,
    function() {
      console.log('cachhe seted')
      // loadDriver()
    }
  )
}

var segIframe = null
var abb = {}
var frameStack = {}

window.onmessage = e => {
  try {
    var action = JSON.parse(e.data)
    if (action.eventId && abb[action.eventId]) {
      abb[action.eventId](action.err, action.data)
    }
  } catch (e) {}
}

function requestFrameMethod(d, name) {
  return new Promise((resolve, reject) => {
    var evtId = Date.now() + Math.random()
    d.eventId = evtId
    abb[evtId] = function(err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    }

    var callFrame = frameStack[name]
    callFrame.contentWindow.postMessage(JSON.stringify(d), '*')
  })
}

function initliazeFrame(src, type, forceOpen) {
  if (!frameStack[type]) {
     if (!forceOpen) {
       frameStack[type] = document.createElement('iframe')
       frameStack[type].src = src || 'https://segmentfault.com/write?freshman=1'
       document.body.append(frameStack[type])
     } else {
       window.open(src)
     }
  }
}

var _rules = {}
function modifyRequestHeaders(ulrPrefix, headers, inspectUrls, handler) {
  // once
  if(!_rules[ulrPrefix]) {
    _rules[ulrPrefix] = headers
  }

  chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
      try {
        var macthedUrl = details.url.indexOf(ulrPrefix) > -1
        if (macthedUrl) {
          details.requestHeaders = details.requestHeaders.map(_ => {
            if(headers[_.name]) {
              _.value = headers[_.name]
            }
            return _
          })
        }
        // call
        if (handler) {
          handler(details)
        }
      } catch (e) {
        console.log('modify headers error', e)
      }
      return { requestHeaders: details.requestHeaders }
    },
    {
      urls: inspectUrls,
    },
    ['blocking', 'requestHeaders', 'extraHeaders',]
  )
}

window.setCache = setCache
window.requestFrameMethod = requestFrameMethod
window.initliazeFrame = initliazeFrame
window.modifyRequestHeaders = modifyRequestHeaders