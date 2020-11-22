import JianShuDriver from './jianshu'
import ZhiHuDriver from './zhihu'
import WordpressDriver from './wordpress'
import ToutiaoDriver from './toutiao'
import Weibo from './weibo'
import Segmentfault from './segmentfault'
import Juejin from './juejin'
import CSDN from './csdn'
import Cnblog from './cnblog'
import Weixin from './weixin'
import YiDian from './yidian'
import Douban from './douban'
import Bilibili from './bilibili'
import B51Cto from './51cto'

var _cacheState = {}

export function getDriver(account) {
  if (account.type == 'wordpress') {
    return new WordpressDriver(
      account.params.wpUrl,
      account.params.wpUser,
      account.params.wpPwd
    )
  }

  if (account.type == 'zhihu') {
    return new ZhiHuDriver()
  }

  if (account.type == 'jianshu') {
    return new JianShuDriver()
  }

  if (account.type == 'typecho') {
    return new WordpressDriver(
      account.params.wpUrl,
      account.params.wpUser,
      account.params.wpPwd,
      true
    )
  }

  if (account.type == 'toutiao') {
    return new ToutiaoDriver()
  }

  if (account.type == 'bilibili') {
    return new Bilibili({
      globalState: _cacheState,
      state: _cacheState[account.type],
    })
  }

  if (account.type == 'weibo') {
    return new Weibo()
  }
  
  if (account.type == '51cto') {
    return new B51Cto()
  }

  if (account.type == 'segmentfault') {
    return new Segmentfault(account)
  }

  if (account.type == 'juejin') {
    return new Juejin(account)
  }

  if (account.type == 'csdn') {
    return new CSDN(account)
  }

  if (account.type == 'cnblog') {
    return new Cnblog(account)
  }
  if (account.type == 'weixin') {
    return new Weixin(account)
  }

  if (account.type == 'yidian') {
    return new YiDian(account)
  }

  if(account.type == 'douban') {
    return new Douban(account)
  }

  throw Error('not supprt account type')
}

export async function getPublicAccounts() {
  console.log('getPublicAccounts')
  var drivers = [
    new Segmentfault(),
    new CSDN(),
    new Juejin(),
    new Cnblog(),
    new Weibo(),
    new ZhiHuDriver(),
    new JianShuDriver(),
    new ToutiaoDriver(),
    new Weixin(),
    new YiDian(),
    new Douban(),
    new Bilibili(),
    new B51Cto()
  ]
  var users = []
  for (let index = 0; index < drivers.length; index++) {
    const driver = drivers[index]
    try {
      var user = await driver.getMetaData()
      users.push(user)
    } catch (e) {
      console.log(e)
    }
  }
  return users
}

function getCookie(name, cookieStr) {
  let arr,
    reg = new RegExp('(^| )' + name + '=([^;]*)(;|$)')
  if ((arr = cookieStr.match(reg))) {
    return unescape(arr[2])
  } else {
    return ''
  }
}

function urlHandler(details) {
  if (
    details.url.indexOf('api.bilibili.com') >
    -1
  ) {
    var cookieHeader = details.requestHeaders.filter(h => {
      return h.name.toLowerCase() == 'cookie'
    })

    if (cookieHeader.length) {
      var cookieStr = cookieHeader[0].value
      var bili_jct = getCookie('bili_jct', cookieStr)
      if (bili_jct) {
        _cacheState['bilibili'] = _cacheState['bilibili'] || {};
        Object.assign(_cacheState['bilibili'], {
          csrf: bili_jct,
        })
        console.log('bili_jct', bili_jct, details)
      }
    }
    // console.log('details.requestHeaders', details)
  }
  
}

export function getMeta() {
  return {
    version: '0.0.10',
    versionNumber: 11,
    log: '',
    urlHandler: urlHandler,
    inspectUrls: ['*://api.bilibili.com/*'],
    
  }
}
