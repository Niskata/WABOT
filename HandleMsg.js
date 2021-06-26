const { recache, getModuleName } = require('./utils')
const { decryptMedia } = require('@open-wa/wa-automate')
const { translate } = require('free-translate')
const appRoot = require('app-root-path')
const FileSync = require('lowdb/adapters/FileSync')
const db_group = new FileSync(appRoot + '/data/denda.json')
const canvas = require('canvacord')
const moment = require('moment-timezone')
const ffmpeg = require('fluent-ffmpeg')
const ytdl = require('ytdl-core')
const axios = require('axios')
const fetch = require('node-fetch')
const gTTS = require('gtts')
const toPdf = require("office-to-pdf")
const low = require('lowdb')
const db = low(db_group)
const _ = require('underscore')
const bent = require('bent')

moment.tz.setDefault('Asia/Jakarta').locale('id')
db.defaults({ group: [] }).write()

const {
    removeBackgroundFromImageBase64
} = require('remove.bg')

let {
    getLocationData,
    urlShortener,
    cariKasar,
    schedule,
    cekResi,
    tebakgb,
    scraper,
    menuId,
    meme,
    kbbi,
    list,
    api
} = require('./lib')

//----------- LEVEL -----------//

/**
 * Get user ID from db.
 * @param {string} userId 
 * @param {object} _dir 
 * @returns {string}
 */
 const getLevelingId = (userId, _dir) => {
    let pos = null
    let found = false
    Object.keys(_dir).forEach((i) => {
        if (_dir[i].id === userId) {
            pos = i
            found = true
        }
    })
    if (found === false && pos === null) {
        const obj = { id: userId, xp: 0, level: 1 }
        _dir.push(obj)
        fs.writeFileSync('./data/level.json', JSON.stringify(_dir))
        return userId
    } else {
        return _dir[pos].id
    }
} 

/**
 * Get user level from db.
 * @param {string} userId 
 * @param {object} _dir 
 * @returns {number}
 */
const getLevelingLevel = (userId, _dir) => {
    let pos = null
    let found = false
    Object.keys(_dir).forEach((i) => {
        if (_dir[i].id === userId) {
            pos = i
            found = true
        }
    })
    if (found === false && pos === null) {
        const obj = { id: userId, xp: 0, level: 1 }
        _dir.push(obj)
        fs.writeFileSync('./data/level.json', JSON.stringify(_dir))
        return 1
    } else {
        return _dir[pos].level
    }
}

/**
 * Get user XP from db.
 * @param {string} userId 
 * @param {object} _dir 
 * @returns {number}
 */
const getLevelingXp = (userId, _dir) => {
    let pos = null
    let found = false
    Object.keys(_dir).forEach((i) => {
        if (_dir[i].id === userId) {
            pos = i
            found = true
        }
    })
    if (found === false && pos === null) {
        const obj = { id: userId, xp: 0, level: 1 }
        _dir.push(obj)
        fs.writeFileSync('./data/level.json', JSON.stringify(_dir))
        return 0
    } else {
        return _dir[pos].xp
    }
}

/**
 * Add user level to db.
 * @param {string} userId 
 * @param {number} amount 
 * @param {object} _dir 
 */
const addLevelingLevel = (userId, amount, _dir) => {
    let position = null
    Object.keys(_dir).forEach((i) => {
        if (_dir[i].id === userId) {
            position = i
        }
    })
    if (position !== null) {
        _dir[position].level += amount
        fs.writeFileSync('./data/level.json', JSON.stringify(_dir))
    }
}

/**
 * Add user XP to db.
 * @param {string} userId 
 * @param {number} amount 
 * @param {object} _dir 
 */
const addLevelingXp = (userId, amount, _dir) => {
    let position = null
    Object.keys(_dir).forEach((i) => {
        if (_dir[i].id === userId) {
            position = i
        }
    })
    if (position !== null) {
        _dir[position].xp += amount
        fs.writeFileSync('./data/level.json', JSON.stringify(_dir))
    }
}

/**
 * Get user rank.
 * @param {string} userId 
 * @param {object} _dir 
 * @returns {number}
 */
const getUserRank = (userId, _dir) => {
    let position = null
    let found = false
    _dir.sort((a, b) => (a.xp < b.xp) ? 1 : -1)
    Object.keys(_dir).forEach((i) => {
        if (_dir[i].id === userId) {
            position = i
            found = true
        }
    })
    if (found === false && position === null) {
        const obj = { id: userId, xp: 0, level: 1 }
        _dir.push(obj)
        fs.writeFileSync('./data/level.json', JSON.stringify(_dir))
        return 99
    } else {
        return position + 1
    }
}

// Cooldown XP gains to prevent spam
const xpGain = new Set()

/**
 * Check is user exist in set.
 * @param {string} userId 
 * @returns {boolean}
 */
const isGained = (userId) => {
    return !!xpGain.has(userId)
}

/**
 * Add user in set and delete it when it's 1 minute.
 * @param {string} userId 
 */
const addCooldown = (userId) => {
    xpGain.add(userId)
    setTimeout(() => {
        return xpGain.delete(userId)
    }, 60000) // Each minute
}

//----------- END -----------//

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

const sleep = (delay) => new Promise((resolve) => {
    setTimeout(() => { resolve(true) }, delay)
})

const {
    createReadFileSync,
    processTime,
    msgFilter,
    color,
    isUrl
} = require('./utils')

const fs = require('fs-extra')
const { uploadImages } = require('./utils/fetcher')
const errorImg = 'https://i.ibb.co/jRCpLfn/user.png'
const setting = JSON.parse(createReadFileSync('./settings/setting.json'))
const kataKasar = JSON.parse(createReadFileSync('./settings/katakasar.json'))
const { apiNoBg } = JSON.parse(createReadFileSync('./settings/api.json'))
const banned = JSON.parse(createReadFileSync('./data/banned.json'))
const ngegas = JSON.parse(createReadFileSync('./data/ngegas.json'))
const welcome = JSON.parse(createReadFileSync('./data/welcome.json'))
const antiLinkGroup = JSON.parse(createReadFileSync('./data/antilinkgroup.json'))
const muted = JSON.parse(fs.readFileSync('./settings/muted.json'))
const _level = JSON.parse(fs.readFileSync('./data/level.json'))
const _leveling = JSON.parse(fs.readFileSync('./data/leveling.json'))

const readMore = '͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏' //its 2000 characters so that makes whatsapp add 'readmore' button

let {
    ownerNumber,
    memberLimit,
    groupLimit,
    prefix,
    banChats,
    mtc: mtcState 
} = setting

let state = {
    status: () => {
        if(banChats){
            return 'Nonaktif'
        }else if(mtcState){
            return 'Nonaktif'
        }else if(!mtcState){
            return 'Aktif'
        }else{
            return 'Aktif'
        }
    }
}

function banChat () {
    if(banChats == true) {
    return false
}else{
    return true
    }
}

const isMuted = (chatId) => {
    if(muted.includes(chatId)){
      return false
  }else{
      return true
      }
  }

function monospace(string) {
    return '```' + string + '```'
}

function formatin(duit) {
    let reverse = duit.toString().split('').reverse().join('')
    let ribuan = reverse.match(/\d{1,3}/g)
    ribuan = ribuan.join('.').split('').reverse().join('')
    return ribuan
}

const inArray = (needle, haystack) => {
    let length = haystack.length
    for (let i = 0; i < length; i++) {
        if (haystack[i].id == needle) return i
    }
    return -1
}

const last = (array, n) => {
    if (array == null) return void 0
    if (n == null) return array[array.length - 1]
    return array.slice(Math.max(array.length - n, 0))
}

const reCacheModule = (funcs, _data) => {
    eval(funcs)
}

const HandleMsg = async (client, message, browser) => {
    //default msg response
    const resMsg = {
        wait: _.sample([
            'Sedang diproses! Silahkan tunggu sebentar...',
            'Copy that, processing!',
            'Gotcha, please wait!',
            'Copy that bro, please wait!',
            'Okey, tunggu sebentar...',
            'Baiklah, sabar ya!'
        ]),
        error: {
            norm: 'Maaf, Ada yang error! Coba lagi beberapa menit kemudian.',
            admin: 'Perintah ini hanya untuk admin group!',
            owner: 'Perintah ini hanya untuk owner bot!',
            group: 'Maaf, perintah ini hanya dapat dipakai didalam group!',
            botAdm: 'Perintah ini hanya bisa di gunakan ketika bot menjadi admin'
        },
        success: {
            join: 'Berhasil join grup via link!',
            sticker : 'Here\'s your sticker'
        },
        badw: _.sample([
            'Astaghfirullah...',
            'Jaga ketikanmu sahabat!',
            'Yo rasah nggo misuh cuk!',
            'Istighfar dulu sodaraku',
            'Hadehh...',
            'Ada masalah apasih?'
        ])
    }

    try {
        if (message.body === '/r' && message.quotedMsg && message.quotedMsg.type === 'chat') message = message.quotedMsgObj

        let { type, id, from, t, sender, isGroupMsg, chat, chatId, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
        let { body } = message
        var { name, formattedTitle } = chat
        let { pushname, verifiedName, formattedName } = sender
        pushname = pushname || verifiedName || formattedName // verifiedName is the name of someone who uses a business account
        const botNumber = await client.getHostNumber() + '@c.us'
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        const groupAdmins = isGroupMsg ? await client.getGroupAdmins(groupId) : ''
	const isLevelingOn = isGroupMsg ? _leveling.includes(groupId) : false

        if (type === 'chat') var chats = body
        else var chats = (type === 'image' || type === 'video') ? caption : ''
	
	const blockNumber = await client.getBlockedIds()

        const pengirim = sender.id
        const isBotGroupAdmins = groupAdmins.includes(botNumber) || false
        const stickerMetadata = { pack: 'Renge ~Bot', author: 'Owner? @Niskata', keepScale: true }
        const stickerMetadataCircle = { pack: 'Renge ~Bot', author: 'Owner? @Niskata', circle: true }
        const stickerMetadataCrop = { pack: 'Renge ~Bot', author: 'Owner? @Niskata' }

        // Bot Prefix
        const regex = /(^\/|^!|^\$|^%|^&|^\+|^\.|^,|^<|^>|^-)(?=\w+)/g

        if (type === 'chat' && body.replace(regex, prefix).startsWith(prefix)) body = body.replace(regex, prefix)
        else body = ((type === 'image' && caption || type === 'video' && caption) && caption.replace(regex, prefix).startsWith(prefix)) ? caption.replace(regex, prefix) : ''

        const lowerCaseBody = message.body?.toLowerCase() ?? caption?.toLowerCase() ?? ''
        const command = body.trim().replace(prefix, '').split(/\s/).shift().toLowerCase()
        const arg = body.trim().substring(body.indexOf(' ') + 1)
        const arg1 = arg.trim().substring(arg.indexOf(' ') + 1)
        const args = body.trim().split(/\s/).slice(1)
        const url = args.length !== 0 ? args[0] : ''

        // [IDENTIFY]
        var isKasar = false
        const isCmd = body.startsWith(prefix)
	const isBlocked = blockNumber.includes(sender.id)
        const isGroupAdmins = groupAdmins.includes(sender.id) || false
        const isQuotedImage = quotedMsg && quotedMsg.type === 'image'
        const isQuotedVideo = quotedMsg && quotedMsg.type === 'video'
        const isQuotedChat = quotedMsg && quotedMsg.type === 'chat'
        const isQuotedLocation = quotedMsg && quotedMsg.type === 'location'
        const isQuotedDocs = quotedMsg && quotedMsg.type === 'document'
        const isQuotedAudio = quotedMsg && quotedMsg.type === 'audio'
        const isQuotedPtt = quotedMsg && quotedMsg.type === 'ptt'
        const isQuotedSticker = quotedMsg && quotedMsg.type === 'sticker'
        const isQuotedPng = isQuotedDocs && quotedMsg.filename.includes('.png')
        const isQuotedWebp = isQuotedDocs && quotedMsg.filename.includes('.webp')
        const isAntiLinkGroup = antiLinkGroup.includes(chatId)
        const isOwnerBot = ownerNumber.includes(pengirim)
        const isBanned = banned.includes(pengirim)
        const isNgegas = ngegas.includes(chatId)

        const sfx = fs.readdirSync('./random/sfx/').map(item => {
            return item.replace('.mp3', '')
        })
	
	// ------ Rank Level ------\\
        const levelRole = await getLevelingLevel(sender.id, _level)
        var role = 'Copper V'
        if (levelRole >= 5) {
            role = 'Copper IV'
        } else if (levelRole >= 10) {
            role = 'Copper III'
        } else if (levelRole >= 15) {
            role = 'Copper II'
        } else if (levelRole >= 20) {
            role = 'Copper I'
        } else if (levelRole >= 25) {
            role = 'Silver V'
        } else if (levelRole >= 30) {
            role = 'Silver IV'
        } else if (levelRole >= 35) {
            role = 'Silver III'
        } else if (levelRole >= 40) {
            role = 'Silver II'
        } else if (levelRole >= 45) {
            role = 'Silver I'
        } else if (levelRole >= 50) {
            role = 'Gold V'
        } else if (levelRole >= 55) {
            role = 'Gold IV'
        } else if (levelRole >= 60) {
            role = 'Gold III'
        } else if (levelRole >= 65) {
            role = 'Gold II'
        } else if (levelRole >= 70) {
            role = 'Gold I'
        } else if (levelRole >= 75) {
            role = 'Platinum V'
        } else if (levelRole >= 80) {
            role = 'Platinum IV'
        } else if (levelRole >= 85) {
            role = 'Platinum III'
        } else if (levelRole >= 90) {
            role = 'Platinum II'
        } else if (levelRole >= 95) {
            role = 'Platinum I'
        } else if (levelRole > 100) {
            role = 'Exterminator'
        }

        // Leveling [BETA] by Slavyan
        if (isGroupMsg && !isGained(sender.id) && !isBanned && isLevelingOn) {
            try {
                addCooldown(sender.id)
                const currentLevel = getLevelingLevel(sender.id, _level)
                const amountXp = Math.floor(Math.random() * (15 - 25 + 1) + 15)
                const requiredXp = 5 * Math.pow(currentLevel, 2) + 50 * currentLevel + 100
                addLevelingXp(sender.id, amountXp, _level)
                if (requiredXp <= getLevelingXp(sender.id, _level)) {
                    addLevelingLevel(sender.id, 1, _level)
                    const userLevel = getLevelingLevel(sender.id, _level)
                    const fetchXp = 5 * Math.pow(userLevel, 2) + 50 * userLevel + 100
                    await client.reply(from, `*── 「 LEVEL UP 」 ──*\n\n➸ *Name*: ${pushname}\n➸ *XP*: ${getLevelingXp(sender.id, _level)} / ${fetchXp}\n➸ *Level*: ${currentLevel} -> ${getLevelingLevel(sender.id, _level)} 🆙 \n➸ *Role*: *${role}*`, id)
                }
            } catch (err) {
                console.error(err)
            }
        }

        // Filter Banned People
        if (isBanned && !isGroupMsg && isCmd) {
            return client.sendText(from, `Maaf anda telah dibanned oleh bot karena melanggar TnC.\nSilakan chat owner untuk unban.`).then(() => {
                console.log(color('[BANd]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command}[${args.length}]`), 'from', color(pushname))
            })
        }
        else if (isBanned && isCmd) {
	    await client.sendText(from, `Maaf anda telah dibanned oleh bot karena melanggar TnC.\nSilakan chat owner untuk unban.`, id)
            return console.log(color('[BANd]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command}[${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle))
        }
        else if (isBanned) return null

        if (isNgegas) isKasar = await cariKasar(chats)

        // [BETA] Avoid Spam Message
        if (isCmd && msgFilter.isFiltered(from) && !isGroupMsg && !isOwnerBot) {
            console.log(color('[SPAM]', 'red'), color(moment(t * 10000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command}[${args.length}]`), 'from', color(pushname))
            return client.reply(from, 'Mohon untuk perintah diberi jeda 10 detik!', id)
        }

        if (isCmd && msgFilter.isFiltered(from) && isGroupMsg && !isOwnerBot) {
            console.log(color('[SPAM]', 'red'), color(moment(t * 10000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command}[${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle))
            return client.reply(from, 'Mohon untuk perintah diberi jeda 10 detik!', id)
        }

        // Avoid kasar spam and Log
        if (msgFilter.isFiltered(from) && isGroupMsg && !isOwnerBot && isKasar) {
            console.log(color('[SPAM]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command}[${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle))
            return client.reply(from, 'Mohon untuk tidak melakukan spam kata kasar!', id)
        }
        if (!isCmd && isKasar && isGroupMsg) { console.log(color('[BADW]', 'orange'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), 'from', color(pushname), 'in', color(name || formattedTitle)) }

        // Log Commands
        if (args.length === 0) var argsLog = color('with no args', 'grey')
        else var argsLog = (arg.length > 15) ? `${arg.substring(0, 15)}...` : arg

        if (isCmd && !isGroupMsg) { console.log(color('[EXEC]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command}[${args.length}]`), ':', color(argsLog, 'magenta'), 'from', color(pushname)) }
        if (isCmd && isGroupMsg) { console.log(color('[EXEC]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command}[${args.length}]`), ':', color(argsLog, 'magenta'), 'from', color(pushname), 'in', color(name || formattedTitle)) }

        //[BETA] Avoid Spam Message
        msgFilter.addFilter(from)

        //[AUTO READ] Auto read message 
        client.sendSeen(chatId)

        // respon to msg contain this case
        switch (true) {
            case /^p$/.test(lowerCaseBody): {
                return await client.reply(from, `Alangkah baiknya ucapkan salam atau menyapa!\nP P P mulu gada tata krama`, id)
            }
            case /^(menu|start|help)$/.test(lowerCaseBody): {
                return await client.sendText(from, `Untuk menampilkan menu, kirim pesan *${prefix}menu*`)
            }
            case /assalamualaikum|assalamu\'alaikum|asalamualaikum|assalamu\'alaykum/.test(lowerCaseBody): {
                return await client.reply(from, 'Wa\'alaikumussalam Wr. Wb.', id)
            }
            case /\b(hi|hy|halo|hai|hei|hello)\b/.test(lowerCaseBody): {
                return await client.reply(from, `Halo ${pushname} 👋`, id)
            }
            case /^=/.test(lowerCaseBody): {
            	if (lowerCaseBody.match(/\d[\=\+\-\*\/\^e]/g)) await client.reply(from, `${eval(lowerCaseBody.slice(1).replace('^', '**'))}`, id)
            break
            }
            case /\bping\b/.test(lowerCaseBody): {
                return await client.sendText(from, `Pong!!!\nSpeed: _${processTime(t, moment())} Seconds_`)
            }
            case new RegExp(`\\b(${sfx.join("|")})\\b`).test(lowerCaseBody): {
                const theSFX = lowerCaseBody.match(new RegExp(sfx.join("|")))
                const path = `./random/sfx/${theSFX}.mp3`
                const _id = (quotedMsg != null) ? quotedMsgObj.id : id
                await client.sendAudio(from, path, _id).catch(err => client.reply(from, resMsg.error.norm, id).then(() => console.log(err)))
                break
            }
            default:
        }
        // Jika bot dimention maka akan merespon pesan
        if (message.mentionedJidList && message.mentionedJidList.includes(botNumber)) client.reply(from, `Iya, ada apa?`, id)

        // Ini Command nya
	if (isCmd) { 
        if(body === '#mute' && isMuted(chatId) == true){
                if(isGroupMsg) {
                    if (!isGroupAdmins) return client.reply(from, 'Maaf, perintah ini hanya dapat dilakukan oleh admin!', id)
                    muted.push(chatId)
                    fs.writeFileSync('./settings/muted.json', JSON.stringify(muted, null, 2))
                    client.reply(from, 'Bot telah di mute pada chat ini! #unmute untuk unmute!', id)
                }else{
                    muted.push(chatId)
                    fs.writeFileSync('./settings/muted.json', JSON.stringify(muted, null, 2))
                    reply(from, 'Bot telah di mute pada chat ini! #unmute untuk unmute!', id)
                }
            }
            if(body === '#unmute' && isMuted(chatId) == false){
                if(isGroupMsg) {
                    if (!isGroupAdmins) return client.reply(from, 'Maaf, perintah ini hanya dapat dilakukan oleh admin!', id)
                    let index = muted.indexOf(chatId);
                    muted.splice(index,1)
                    fs.writeFileSync('./settings/muted.json', JSON.stringify(muted, null, 2))
                    client.reply(from, 'Bot telah di unmute!', id)         
                }else{
                    let index = muted.indexOf(chatId);
                    muted.splice(index,1)
                    fs.writeFileSync('./settings/muted.json', JSON.stringify(muted, null, 2))
                    client.reply(from, 'Bot telah di unmute!', id)                   
                }
            }
            if (body === '#unbanchat') {
                if (!isOwnerBot) return client.reply(from, 'Maaf, perintah ini hanya dapat dilakukan oleh Owner Renge!', id)
                if(setting.banChats === false) return
                setting.banChats = false
                banChats = false
                fs.writeFileSync('./settings/setting.json', JSON.stringify(setting, null, 2))
                client.reply('Global chat has been disable!')
            }
    if (isMuted(chatId) && banChat() && !isBlocked && !isBanned )
            client.simulateTyping(chat.id, true).then(async () => {
                switch (command) {
                    // Menu and TnC
                    case 'banchat':
                        if (setting.banChats === true) return
                        if (!isOwnerBot) return client.reply(from, 'Perintah ini hanya bisa di gunakan oleh Owner Renge!', id)
                        setting.banChats = true
                        banChats = true
                        fs.writeFileSync('./settings/setting.json', JSON.stringify(setting, null, 2))
                        client.reply('Global chat has been enable!')
                        break
                    case 'unmute':
                        console.log(`Unmuted ${name}!`)
                        await client.sendSeen(from)
                        break
                    case 'unbanchat':
                        console.log(`Banchat ${name}!`)
                        await client.sendSeen(from)
                        break
		   case 'listbanned':
                            let bened = `This is list of banned number\nTotal : ${banned.length}\n`
                            for (let i of banned) {
                                bened += `➸ ${i.replace(/@c.us/g,'')}\n`
                            }
                            await client.reply(from, bened, id)
                            break
                    case 'listblock':
                            let hih = `This is list of blocked number\nTotal : ${blockNumber.length}\n`
                            for (let i of blockNumber) {
                                hih += `➸ ${i.replace(/@c.us/g,'')}\n`
                            }
                            await client.reply(from, hih, id)
                            break
                    // Menu and TnC
                    case 'tnc':
                        await client.sendText(from, menuId.textTnC())
                        break
                    case 'notes':
                    case 'menu':
                    case 'help':
                    case 'start':
                        await client.sendText(from, menuId.textMenu(pushname, t))
                            .then(() => ((isGroupMsg) && (isGroupAdmins)) ? client.sendText(from, `Menu Admin Grup: *${prefix}menuadmin*`) : null)
                        break
                    case 'menuadmin':
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        await client.sendText(from, menuId.textAdmin())
                        break
                    case 'donate':
                    case 'donasi':
                        await client.sendText(from, menuId.textDonasi())
                        break
                    case 'owner':
                        await client.sendContact(from, ownerNumber)
                            .then(() => client.sendText(from, 'Jika ada pertanyaan tentang bot silahkan chat nomor di atas'))
                        break
                    case 'join':
                        if (!isOwnerBot) return client.reply(from, 'INGIN MEMASUKKAN BOT KEDALAM GRUP !?\n\nRULES :\n- DILARANG SPAM BOT\n- DILARANG BERMAIN² COMMAND\n- SESEKALI KALAU ADA REJEKI LEBIH DONASI\n\nAPABILA ADA MEMBER GRUP YANG MELANGGAR PERATURAN DI ATAS MENJADI TANGGUNG JAWAB ORANG YANG INGIN MENGUNDANG BOT KE GRUP TERSEBUT\n\nJIKA MENYETUJUI RULES DI ATAS SILAKAN HUBUNGI *#OWNER*\n- NISKATA', id)
                        if (args.length == 0) return client.reply(from, `Jika kalian ingin mengundang bot ke group silahkan invite atau dengan\nketik ${prefix}join <link group>\nTanpa simbol <>`, id)
                        const linkgrup = args[0]
                        let islink = linkgrup.match(/(https:\/\/chat.whatsapp.com)/gi)
                        let chekgrup = await client.inviteInfo(linkgrup)
                        if (!islink) return client.reply(from, 'Maaf link group-nya salah! silahkan kirim link yang benar', id)
                        if (isOwnerBot) {
                            await client.joinGroupViaLink(linkgrup)
                                .then(async () => {
                                    await client.sendText(from, resMsg.success.join)
                                    setTimeout(async () => {
                                        await client.sendText(chekgrup.id, `Hai guys 👋 perkenalkan saya Renge. Untuk melihat perintah/menu yang tersedia pada bot, kirim ${prefix}menu`)
                                    }, 2000)
                                })
                        } else {
                            let cgrup = await client.getAllGroups()
                            if (cgrup.length > groupLimit) return client.reply(from, `Mohon maaf, untuk mencegah overload, group pada bot dibatasi.\nTotal group: ${cgrup.length}/${groupLimit}\nChat /owner for appeal`, id)
                            if (cgrup.size < memberLimit) return client.reply(from, `Sorry, Bot wil not join if the group members do not exceed ${memberLimit} people`, id)
                            await client.joinGroupViaLink(linkgrup)
                                .then(async () => {
                                    await client.reply(from, resMsg.success.join, id)
                                    await client.sendText(chekgrup.id, `Hai guys 👋 perkenalkan saya Renge. Untuk melihat perintah/menu yang tersedia pada bot, kirim ${prefix}menu`)
                                })
                                .catch(async () => {
                                    await client.reply(from, 'Gagal! Sepertinya Bot pernah dikick dari group itu ya? Yah, Bot gabisa masuk lagi dong', id)
                                })
                        }
                        break
			case 'leveling':
                            if (!isGroupMsg) return await client.reply(from, resMsg.error.group, id)
                            if (!isGroupAdmins) return await client.reply(from, resMsg.error.admin, id)
                            if (args[0] === 'on') {
                                if (isLevelingOn) return await client.reply(from, `Fitur leveling telah diaktifkan sebelumnya.`, id)
                                _leveling.push(groupId)
                                fs.writeFileSync('./data/leveling.json', JSON.stringify(_leveling))
                                await client.reply(from, 'Fitur leveling berhasil *diaktifkan*!', id)
                            } else if (args[0] === 'off') {
                                _leveling.splice(groupId, 1)
                                fs.writeFileSync('./data/leveling.json', JSON.stringify(_leveling))
                                await client.reply(from, `Fitur leveling berhasil *dinonaktifkan*!`, id)
                            } else {
                                await client.reply(from, `Untuk mengaktifkan Fitur leveling menggunaan\n${prefix}leveling on --mengaktifkan\n${prefix}leveling off --nonaktifkan`, id)
                            }
                        break
			case 'level':
                            if (!isLevelingOn) return client.reply(from, 'Fitur leveling belum diaktifkan!', id)
                            if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                            const userLevel = getLevelingLevel(sender.id, _level)
                            const userXp = getLevelingXp(sender.id, _level)
                            const ppLink = await client.getProfilePicFromServer(sender.id)
                            if (ppLink === undefined) {
                                var pepe = errorImg
                            } else {
                                pepe = ppLink
                            }
                            const requiredXp = 5 * Math.pow(userLevel, 2) + 50 * userLevel + 100
                            const rank = new canvas.Rank()
                                .setAvatar(pepe)
                                .setLevel(userLevel)
                                .setLevelColor('#ffa200', '#ffa200')
                                .setRank(Number(getUserRank(sender.id, _level)))
                                .setCurrentXP(userXp)
                                .setOverlay('#000000', 100, false)
                                .setRequiredXP(requiredXp)
                                .setProgressBar('#ffa200', 'COLOR')
                                .setBackground('COLOR', '#000000')
                                .setUsername(pushname)
                                .setDiscriminator(sender.id.substring(6, 10))
                            rank.build()
                                .then(async (buffer) => {
                                    const imageBase64 = `data:image/png;base64,${buffer.toString('base64')}`
                                    await client.sendImage(from, imageBase64, 'rank.png', '', id)
                                })
                                .catch(async (err) => {
                                    console.error(err)
                                    await client.reply(from, 'Error!', id)
                                })
                        break
                        case 'leaderboard':
                            if (!isLevelingOn) return client.reply(from, 'Fitur leveling belum diaktifkan!', id)
                            if (!isGroupMsg) return await client.reply(from. resMsg.error.group, id)
                            const respa = _level
                            _level.sort((a, b) => (a.xp < b.xp) ? 1 : -1)
                            let leaderboard = '*── 「 LEADERBOARDS 」 ──*\n\n'
                            try {
                                for (let i = 0; i < 10; i++) {
                                    var roles = 'Copper V'
                                    if (respa[i].level >= 5) {
                                        roles = 'Copper IV'
                                    } else if (respa[i].level >= 10) {
                                        roles = 'Copper III'
                                    } else if (respa[i].level >= 15) {
                                        roles = 'Copper II'
                                    } else if (respa[i].level >= 20) {
                                        roles = 'Copper I'
                                    } else if (respa[i].level >= 25) {
                                        roles = 'Silver V'
                                    } else if (respa[i].level >= 30) {
                                        roles = 'Silver IV'
                                    } else if (respa[i].level >= 35) {
                                        roles = 'Silver III'
                                    } else if (respa[i].level >= 40) {
                                        roles = 'Silver II'
                                    } else if (respa[i].level >= 45) {
                                        roles = 'Silver I'
                                    } else if (respa[i].level >= 50) {
                                        roles = 'Gold V'
                                    } else if (respa[i].level >= 55) {
                                        roles = 'Gold IV'
                                    } else if (respa[i].level >= 60) {
                                        roles = 'Gold III'
                                    } else if (respa[i].level >= 65) {
                                        roles = 'Gold II'
                                    } else if (respa[i].level >= 70) {
                                        roles = 'Gold I'
                                    } else if (respa[i].level >= 75) {
                                        roles = 'Platinum V'
                                    } else if (respa[i].level >= 80) {
                                        roles = 'Platinum IV'
                                    } else if (respa[i].level >= 85) {
                                        roles = 'Platinum III'
                                    } else if (respa[i].level >= 90) {
                                        roles = 'Platinum II'
                                    } else if (respa[i].level >= 95) {
                                        roles = 'Platinum I'
                                    } else if (respa[i].level > 100) {
                                        roles = 'Exterminator'
                                    }
                                    leaderboard += `${i + 1}. @${_level[i].id.replace('@c.us', '')}\n➸ *XP*: ${_level[i].xp} *Level*: ${_level[i].level}\n➸ *Role*: ${roles}\n\n`
                                }
                                await client.sendTextWithMentions(from, leaderboard, id)
                            } catch (err) {
                                console.error(err)
                                await client.reply(from, `Perlu setidaknya *10* user yang memiliki level di database!`, id)
                            }
                        break

                    case 'stat':
                    case 'status':
                    case 'botstat': {
                        let loadedMsg = await client.getAmountOfLoadedMessages()
                        let chatIds = await client.getAllChatIds()
                        let groups = await client.getAllGroups()
                        let time = process.uptime()
                        let uptime = (time + "").toDHms()
                        client.sendText(from, `Status :\n- *${loadedMsg}* Loaded Messages\n- *${groups.length}* Group Chats\n- *${chatIds.length - groups.length}* Personal Chats\n- *${chatIds.length}* Total Chats\n\nSpeed: _${processTime(t, moment())} Seconds_\nUptime: _${uptime}_`)
                        break
                    }

                    //Sticker Converter to img
                    case 'getimage':
                    case 'stikertoimg':
                    case 'stickertoimg':
                    case 'stimg': {
                        if (isQuotedSticker) {
                            let mediaData = await decryptMedia(quotedMsg)
                            client.reply(from, resMsg.wait, id)
                            let imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
                            await client.sendFile(from, imageBase64, 'imgsticker.jpg', 'Berhasil convert Sticker to Image!', id)
                                .then(() => {
                                    console.log(color('[LOGS]', 'grey'), `Sticker to Image Processed for ${processTime(t, moment())} Seconds`)
                                })
                        } else if (!quotedMsg) return client.reply(from, `Silakan tag/reply sticker yang ingin dijadikan gambar dengan command!`, id)
                        break
                    }

                    // Sticker Creator
                    case 'stickergif':
                    case 'stikergif':
                    case 'sticker':
                    case 'stiker':
                    case 's': {
                        if (
                            ((isMedia && mimetype !== 'video/mp4') || isQuotedImage || isQuotedPng || isQuotedWebp)
                                &&
                            (args.length === 0 || args[0] === 'crop' || args[0] === 'circle' || args[0] !== 'nobg')
                            ) {
                            client.reply(from, resMsg.wait, id)
                            try {
                                const encryptMedia = (isQuotedImage || isQuotedDocs) ? quotedMsg : message
                                if (args[0] === 'crop') var _metadata = stickerMetadataCrop
                                    else var _metadata = (args[0] === 'circle') ? stickerMetadataCircle : stickerMetadata
                                let mediaData = await decryptMedia(encryptMedia)
                                    .catch(err => {
                                        console.log(err.name, err.message)
                                        client.sendText(from, resMsg.error.norm)
                                    })
                                if (mediaData) {
                                    if (isQuotedWebp) {
                                        await client.sendRawWebpAsSticker(from, mediaData.toString('base64'), true)
                                            .then(() => {
                                                client.sendText(from, resMsg.success.sticker)
                                                console.log(color('[LOGS]', 'grey'), `Sticker from webp Processed for ${processTime(t, moment())} Seconds`)
                                            }).catch(err => {
                                                console.log(err.name, err.message)
                                                client.sendText(from, resMsg.error.norm)
                                            })
                                    } else {
                                        await client.sendImageAsSticker(from, mediaData, _metadata)
                                            .then(() => {
                                                client.sendText(from, resMsg.success.sticker)
                                                console.log(color('[LOGS]', 'grey'), `Sticker Processed for ${processTime(t, moment())} Seconds`)
                                            }).catch(err => {
                                                console.log(err.name, err.message)
                                                client.sendText(from, resMsg.error.norm)
                                            })
                                    }
                                }
                            } catch (err) {
                                console.log(err.name, err.message)
                                client.sendText(from, resMsg.error.norm)
                            }

                        } else if (args[0] === 'nobg') {
                            if (isMedia || isQuotedImage) {
                                client.reply(from, resMsg.wait, id)
                                try {
                                    let encryptedMedia = isQuotedImage ? quotedMsg : message
                                    let _mimetype = isQuotedImage ? quotedMsg.mimetype : mimetype

                                    let mediaData = await decryptMedia(encryptedMedia)
                                        .catch(err => {
                                            console.log(err)
                                            client.sendText(from, resMsg.error.norm)
                                        })
                                    if (mediaData === undefined) return client.sendText(from, resMsg.error.norm)
                                    let base64img = `data:${_mimetype};base64,${mediaData.toString('base64')}`
                                    let outFile = './media/noBg.png'
                                    // kamu dapat mengambil api key dari website remove.bg dan ubahnya difolder settings/api.json
                                    let selectedApiNoBg = _.sample(apiNoBg)
                                    let resultNoBg = await removeBackgroundFromImageBase64({ base64img, apiKey: selectedApiNoBg, size: 'auto', type: 'auto', outFile })
                                    await fs.writeFile(outFile, resultNoBg.base64img)
                                    await client.sendImageAsSticker(from, `data:${_mimetype};base64,${resultNoBg.base64img}`, stickerMetadata)
                                        .then(() => {
                                            client.sendText(from, resMsg.success.sticker)
                                            console.log(color('[LOGS]', 'grey'), `Sticker nobg Processed for ${processTime(t, moment())} Seconds`)
                                        }).catch(err => {
                                            console.log(err)
                                            client.sendText(from, resMsg.error.norm)
                                        })

                                } catch (err) {
                                    console.log(err)
                                    if (err[0].code === 'unknown_foreground') client.reply(from, 'Maaf batas objek dan background tidak jelas!', id)
                                    else await client.reply(from, 'Maaf terjadi error atau batas penggunaan sudah tercapai!', id)
                                }
                            }
                        } else if (args.length === 1) {
                            try {
                                if (!isUrl(url)) { return client.reply(from, 'Maaf, link yang kamu kirim tidak valid.', id) }
                                client.sendStickerfromUrl(from, url).then((r) => (!r && r != undefined)
                                    ? client.sendText(from, 'Maaf, link yang kamu kirim tidak memuat gambar.')
                                    : client.reply(from, resMsg.success.sticker)).then(() => console.log(`Sticker Processed for ${processTime(t, moment())} Second`))
                            } catch (e) {
                                console.log(`Sticker url err: ${e}`)
                                client.sendText(from, resMsg.error.norm)
                            }
                        } else if ((isMedia && mimetype === 'video/mp4') || isQuotedVideo) {
                            let encryptedMedia = isQuotedVideo ? quotedMsg : message
                            let mediaData = await decryptMedia(encryptedMedia)
                            client.reply(from, resMsg.wait, id)
                            await client.sendMp4AsSticker(from, mediaData, { endTime: '00:00:09.0', log: true }, stickerMetadata)
                                .then(() => {
                                    client.sendText(from, resMsg.success.sticker)
                                    console.log(color('[LOGS]', 'grey'), `Sticker Processed for ${processTime(t, moment())} Seconds`)
                                })
                                .catch(() => {
                                    client.reply(from, 'Maaf terjadi error atau filenya terlalu besar!', id)
                                })
                        } else {
                            await client.reply(from, `Tidak ada gambar/video!\nUntuk menggunakan ${prefix}sticker, kirim gambar/reply gambar atau *file png/webp* dengan caption\n*${prefix}sticker* (biasa uncrop)\n*${prefix}sticker crop* (square crop)\n*${prefix}sticker circle* (circle crop)\n*${prefix}sticker nobg* (tanpa background)\n\natau Kirim pesan dengan\n*${prefix}sticker <link_gambar>*\n\nUntuk membuat *sticker animasi.* Kirim video/gif atau reply/quote video/gif dengan caption *${prefix}sticker* max 8 secs. Selebihnya akan dipotong otomatis`, id)
                        }
                        break
                    }

                    case 'stikergiphy':
                    case 'stickergiphy': {
                        if (args.length != 1) return client.reply(from, `Maaf, format pesan salah.\nKetik pesan dengan ${prefix}stickergiphy <link_giphy> (don't include <> symbol)`, id)
                        const isGiphy = url.match(new RegExp(/https?:\/\/(www\.)?giphy.com/, 'gi'))
                        const isMediaGiphy = url.match(new RegExp(/https?:\/\/media.giphy.com\/media/, 'gi'))
                        if (isGiphy) {
                            const getGiphyCode = url.match(new RegExp(/(\/|\-)(?:.(?!(\/|\-)))+$/, 'gi'))
                            if (!getGiphyCode) { return client.reply(from, 'Gagal mengambil kode giphy', id) }
                            const giphyCode = getGiphyCode[0].replace(/[-\/]/gi, '')
                            const smallGifUrl = 'https://media.giphy.com/media/' + giphyCode + '/giphy-downsized.gif'
                            client.sendGiphyAsSticker(from, smallGifUrl).then(() => {
                                client.reply(from, resMsg.success.sticker)
                                console.log(color('[LOGS]', 'grey'), `Sticker Processed for ${processTime(t, moment())} Seconds`)
                            }).catch((err) => console.log(err))
                        } else if (isMediaGiphy) {
                            const gifUrl = url.match(new RegExp(/(giphy|source).(gif|mp4)/, 'gi'))
                            if (!gifUrl) { return client.reply(from, 'Gagal mengambil kode giphy', id) }
                            const smallGifUrl = url.replace(gifUrl[0], 'giphy-downsized.gif')
                            client.sendGiphyAsSticker(from, smallGifUrl)
                                .then(() => {
                                    client.reply(from, resMsg.success.sticker)
                                    console.log(color('[LOGS]', 'grey'), `Sticker Processed for ${processTime(t, moment())} Seconds`)
                                })
                                .catch(() => {
                                    client.reply(from, resMsg.error.norm, id)
                                })
                        } else {
                            await client.reply(from, 'Maaf, command sticker giphy hanya bisa menggunakan link dari giphy.  [Giphy Only]', id)
                        }
                        break
                    }

                    case 'qr':
                    case 'qrcode': {
                        if (args.length == 0) return client.reply(from, `Untuk membuat kode QR, ketik ${prefix}qrcode <kata>\nContoh:  ${prefix}qrcode nama saya Renge`, id)
                        client.reply(from, resMsg.wait, id);
                        await client.sendFileFromUrl(from, `http://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(arg)}&size=500x500`, id)
                        break
                    }

                    case 'meme':
                    case 'memefy': {
                        if ((isMedia || isQuotedImage) && args.length >= 2) {
                            try {
                                let top = arg.split('|')[0]
                                let bottom = arg.split('|')[1]
                                let encryptMedia = isQuotedImage ? quotedMsg : message
                                let mediaData = await decryptMedia(encryptMedia)
                                let getUrl = await uploadImages(mediaData, false)
                                let ImageBase64 = await meme.custom(getUrl, top, bottom)
                                client.sendFile(from, ImageBase64, 'image.png', '', null, true)
                                    .then(() => {
                                        client.reply(from, 'Here you\'re!', id)
                                    })
                                    .catch(() => {
                                        client.reply(from, resMsg.error.norm)
                                    })
                            } catch (err) {
                                console.log(err)
                                await client.reply(from, `Argumen salah, Silahkan kirim gambar dengan caption ${prefix}memefy <teks_atas> | <teks_bawah>\ncontoh: ${prefix}memefy ini teks atas | ini teks bawah`, id)
                            }

                        } else {
                            await client.reply(from, `Tidak ada gambar! Silahkan kirim gambar dengan caption ${prefix}memefy <teks_atas> | <teks_bawah>\ncontoh: ${prefix}memefy ini teks atas | ini teks bawah`, id)
                        }
                        break
                    }

                    case 'nulis': {
                        if (args.length == 0) return client.reply(from, 'Kirim perintah *#nulis [teks]*', id)
                        const nuliss = encodeURIComponent(body.slice(7))
                        client.reply(from, resMsg.wait)
                        const urlnulis = `https://api.zeks.xyz/api/nulis?text=${nuliss}&apikey=nishikata`
                        await client.sendFileFromUrl(from, urlnulis, 'Nulis.jpeg', 'Nih anjim').catch(e => {
                            console.log(`Nulis err : ${e}`)
                            return client.sendText(from, 'Mungkin Sedang Dalam Perbaikan', id)
                        })
                        break 	 
                    }

                    //required to install libreoffice
                    case 'doctopdf':
                    case 'pdf': {
                        if (!isQuotedDocs) return client.reply(from, `Convert doc/docx/ppt/pptx to pdf.\n\nKirim dokumen kemudian reply dokumen/filenya dengan ${prefix}pdf`, id)
                        if (/\.docx|\.doc|\.pptx|\.ppt/g.test(quotedMsg.filename) && isQuotedDocs) {
                            client.sendText(from, resMsg.wait)
                            const encDocs = await decryptMedia(quotedMsg)
                            toPdf(encDocs).then(
                                (pdfBuffer) => {
                                    fs.writeFileSync("./media/result.pdf", pdfBuffer)

                                    client.sendFile(from, "./media/result.pdf", quotedMsg.filename.replace(/\.docx|\.doc|\.pptx|\.ppt/g, '.pdf'))
                                }, (err) => {
                                    console.log(err)
                                    client.sendText(from, resMsg.error.norm)
                                }
                            )
                        } else {
                            client.reply(from, 'Maaf format file tidak sesuai', id)
                        }
                        break
                    }

                    //Islam Command
                    case 'listsurah': {
                        try {
                axios.get('https://raw.githubusercontent.com/ArugaZ/scraper-results/main/islam/surah.json')
                .then((response) => {
                    let hehex = '*「 DAFTAR SURAH 」*\n\n___________________________\n'
                    let nmr = 1
                    for (let i = 0; i < response.data.data.length; i++) {
                        hehex += nmr + '. ' +  monospace(response.data.data[i].name.transliteration.id.toLowerCase()) + '\n'
                        nmr++
                            }
                        hehex += '___________________________'
                    client.reply(from, hehex, id)
                })
            } catch(err) {
                client.reply(from, err, id)
            }
            break
                    }

                    case 'infosurah': {
                        if (args.length == 0) return client.reply(from, `*_${prefix}infosurah <nama surah>_*\nMenampilkan informasi lengkap mengenai surah tertentu. Contoh penggunan: ${prefix}infosurah al-baqarah`, message.id)
                        var responseh = await axios.get('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/islam/surah.json')
                            .catch(err => {
                                console.log(err)
                                client.sendText(from, resMsg.error.norm)
                            })
                        var { data } = responseh.data
                        let idx = data.findIndex(function (post) {
                            if ((post.name.transliteration.id.toLowerCase() == args[0].toLowerCase()) || (post.name.transliteration.en.toLowerCase() == args[0].toLowerCase()))
                                return true
                        })
                        if (data[idx] === undefined) return client.reply(from, `Maaf format salah atau nama surah tidak sesuai`, id)
                        var pesan = ""
                        pesan = pesan + "Nama : " + data[idx].name.transliteration.id + "\n" + "Asma : " + data[idx].name.short + "\n" + "Arti : " + data[idx].name.translation.id + "\n" + "Jumlah ayat : " + data[idx].numberOfVerses + "\n" + "Nomor surah : " + data[idx].number + "\n" + "Jenis : " + data[idx].revelation.id + "\n" + "Keterangan : " + data[idx].tafsir.id
                        client.reply(from, pesan, message.id)
                        break
                    }

                    case 'surah': {
                        if (args.length == 0) return client.reply(from, `*_${prefix}surah <nama surah> <ayat>_*\nMenampilkan ayat Al-Quran tertentu beserta terjemahannya dalam bahasa Indonesia. Contoh penggunaan : ${prefix}surah al-baqarah 1\n\n*_${prefix}surah <nama/nomor surah> <ayat> en/id_*\nMenampilkan ayat Al-Quran tertentu beserta terjemahannya dalam bahasa Inggris / Indonesia. Contoh penggunaan : ${prefix}surah al-baqarah 1 id\n${prefix}surah 1 1 id`, message.id)
                        let nmr = 0
                        if (isNaN(args[0])) {
                            let res = await axios.get('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/islam/surah.json')
                                .catch(err => {
                                    console.log(err)
                                    return client.sendText(from, resMsg.error.norm)
                                })
                            var { data } = res.data
                            let idx = data.findIndex(function (post) {
                                if ((post.name.transliteration.id.toLowerCase() == args[0].toLowerCase()) || (post.name.transliteration.en.toLowerCase() == args[0].toLowerCase()))
                                    return true
                            })
                            if (data[idx] === undefined) return client.reply(from, `Maaf format salah atau nama surah tidak sesuai`, id)
                            nmr = data[idx].number
                        } else {
                            nmr = args[0]
                        }
                        var ayat = args[1] | 1

                        if (!isNaN(nmr)) {
                            var responseh2 = await axios.get('https://api.quran.sutanlab.id/surah/' + nmr + "/" + ayat)
                                .catch(err => {
                                    console.log(err)
                                    return client.sendText(from, resMsg.error.norm)
                                })
                            if (responseh2 === undefined) return client.reply(from, `Maaf error/format salah`, id)
                            var { data } = responseh2.data
                            let bhs = last(args)
                            let pesan = ""
                            pesan = pesan + data.text.arab + "\n\n"
                            if (bhs == "en") {
                                pesan = pesan + data.translation.en
                            } else {
                                pesan = pesan + data.translation.id
                            }
                            pesan = pesan + "\n\n(Q.S. " + data.surah.name.transliteration.id + ":" + ayat + ")"
                            await client.reply(from, pesan.trim(), message.id)
                        }
                        break
                    }

                    case 'tafsir': {
                        if (args.length == 0) return client.reply(from, `*_${prefix}tafsir <nama/nomor surah> <ayat>_*\nMenampilkan ayat Al-Quran tertentu beserta terjemahan dan tafsirnya dalam bahasa Indonesia. Contoh penggunaan : ${prefix}tafsir al-baqarah 1`, message.id)
                        let nmr = 0
                        if (isNaN(args[0])) {
                            let res = await axios.get('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/islam/surah.json')
                                .catch(err => {
                                    console.log(err)
                                    return client.sendText(from, resMsg.error.norm)
                                })
                            var { data } = res.data
                            let idx = data.findIndex(function (post) {
                                if ((post.name.transliteration.id.toLowerCase() == args[0].toLowerCase()) || (post.name.transliteration.en.toLowerCase() == args[0].toLowerCase()))
                                    return true
                            })
                            if (data[idx] === undefined) return client.reply(from, `Maaf format salah atau nama surah tidak sesuai`, id)
                            nmr = data[idx].number
                        } else {
                            nmr = args[0]
                        }
                        var ayat = args[1] | 1
                        console.log(nmr)
                        if (!isNaN(nmr)) {
                            var responsih = await axios.get('https://api.quran.sutanlab.id/surah/' + nmr + "/" + ayat)
                            var { data } = responsih.data
                            pesan = ""
                            pesan = pesan + "Tafsir Q.S. " + data.surah.name.transliteration.id + ":" + args[1] + "\n\n"
                            pesan = pesan + data.text.arab + "\n\n"
                            pesan = pesan + "_" + data.translation.id + "_" + "\n\n" + data.tafsir.id.long
                            client.reply(from, pesan, message.id)
                        }
                        break
                    }

                    case 'alaudio': {
                        if (args.length == 0) return client.reply(from, `*_${prefix}ALaudio <nama/nomor surah>_*\nMenampilkan tautan dari audio surah tertentu. Contoh penggunaan : ${prefix}ALaudio al-fatihah\n\n*_${prefix}ALaudio <nama/nomor surah> <ayat>_*\nMengirim audio surah dan ayat tertentu beserta terjemahannya dalam bahasa Indonesia. Contoh penggunaan : ${prefix}ALaudio al-fatihah 1\n\n*_${prefix}ALaudio <nama/nomor surah> <ayat> en_*\nMengirim audio surah dan ayat tertentu beserta terjemahannya dalam bahasa Inggris. Contoh penggunaan : ${prefix}ALaudio al-fatihah 1 en`, message.id)
                        let nmr = 0
                        if (isNaN(args[0])) {
                            let res = await axios.get('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/islam/surah.json')
                                .catch(err => {
                                    console.log(err)
                                    return client.sendText(from, resMsg.error.norm)
                                })
                            var { data } = res.data
                            let idx = data.findIndex(function (post) {
                                if ((post.name.transliteration.id.toLowerCase() == args[0].toLowerCase()) || (post.name.transliteration.en.toLowerCase() == args[0].toLowerCase()))
                                    return true
                            })
                            if (data[idx] === undefined) return client.reply(from, `Maaf format salah atau nama surah tidak sesuai`, id)
                            nmr = data[idx].number
                        } else {
                            nmr = args[0]
                        }
                        var ayat = args[1]
                        console.log(nmr)
                        if (!isNaN(nmr)) {
                            if (args.length > 2) {
                                ayat = args[1]
                            }
                            if (args.length == 2) {
                                ayat = last(args)
                            }
                            pesan = ""
                            if (isNaN(ayat)) {
                                let responsih2 = await axios.get('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/islam/surah/' + nmr + '.json')
                                    .catch(err => {
                                        console.log(err)
                                        client.sendText(from, resMsg.error.norm)
                                    })
                                var { name, name_translations, number_of_ayah, number_of_surah, recitations } = responsih2.data
                                pesan = pesan + "Audio Quran Surah ke-" + number_of_surah + " " + name + " (" + name_translations.ar + ") " + "dengan jumlah " + number_of_ayah + " ayat\n"
                                pesan = pesan + "Dilantunkan oleh " + recitations[0].name + " :\n" + recitations[0].audio_url + "\n"
                                pesan = pesan + "Dilantunkan oleh " + recitations[1].name + " :\n" + recitations[1].audio_url + "\n"
                                pesan = pesan + "Dilantunkan oleh " + recitations[2].name + " :\n" + recitations[2].audio_url + "\n"
                                client.reply(from, pesan, message.id)
                            } else {
                                let responsih2 = await axios.get('https://api.quran.sutanlab.id/surah/' + nmr + "/" + ayat)
                                    .catch(err => {
                                        console.log(err)
                                        client.sendText(from, resMsg.error.norm)
                                    })
                                var { data } = responsih2.data
                                let bhs = last(args)
                                let pesan = ""
                                pesan = pesan + data.text.arab + "\n\n"
                                if (bhs == "en") {
                                    pesan = pesan + data.translation.en
                                } else {
                                    pesan = pesan + data.translation.id
                                }
                                pesan = pesan + "\n\n(Q.S. " + data.surah.name.transliteration.id + ":" + args[1] + ")"
                                await client.sendFileFromUrl(from, data.audio.secondary[0])
                                await client.reply(from, pesan, message.id)
                            }
                        }
                        break
                    }

                    case 'jsholat':
                    case 'jsolat': {
                        if (args.length === 0) return client.reply(from, `ketik *${prefix}jsholat <nama kabupaten>* untuk melihat jadwal sholat\nContoh: *${prefix}jsholat sleman*\nUntuk melihat daftar daerah, ketik *${prefix}jsholat daerah*`, id)
                        if (args[0] == 'daerah') {
                            var datad = await axios.get('https://api.banghasan.com/sholat/format/json/kota')
                                .catch(err => {
                                    console.log(err)
                                    client.sendText(from, resMsg.error.norm)
                                })
                            var datas = datad.data.kota
                            let hasil = '╔══✪〘 Daftar Kota 〙✪\n'
                            for (let d of datas) {
                                var kota = d.nama
                                hasil += '╠➥ '
                                hasil += `${kota}\n`
                            }
                            hasil += '╚═〘 *Renge Bot* 〙'
                            await client.reply(from, hasil, id)
                        } else {
                            var datak = await axios.get('https://api.banghasan.com/sholat/format/json/kota/nama/' + args[0])
                                .catch(err => {
                                    console.log(err)
                                    client.sendText(from, resMsg.error.norm)
                                })
                            try {
                                var kodek = datak.data.kota[0].id
                            } catch (err) {
                                return client.reply(from, 'Kota tidak ditemukan', id)
                            }
                            var tgl = moment(t * 1000).format('YYYY-MM-DD')
                            var datas = await axios.get('https://api.banghasan.com/sholat/format/json/jadwal/kota/' + kodek + '/tanggal/' + tgl)
                            var jadwals = datas.data.jadwal.data
                            let jadwal = `╔══✪〘 Jadwal Sholat di ${args[0].replace(/^\w/, (c) => c.toUpperCase())} 〙✪\n`
                            jadwal += `╠> \`\`\`Imsak    : ` + jadwals.imsak + '\`\`\`\n'
                            jadwal += `╠> \`\`\`Subuh    : ` + jadwals.subuh + '\`\`\`\n'
                            jadwal += `╠> \`\`\`Dzuhur   : ` + jadwals.dzuhur + '\`\`\`\n'
                            jadwal += `╠> \`\`\`Ashar    : ` + jadwals.ashar + '\`\`\`\n'
                            jadwal += `╠> \`\`\`Maghrib  : ` + jadwals.maghrib + '\`\`\`\n'
                            jadwal += `╠> \`\`\`Isya\'    : ` + jadwals.isya + '\`\`\`\n'
                            jadwal += '╚═〘 *Renge Bot* 〙'
                            client.reply(from, jadwal, id)
                        }
                        break
                    }
                    //Group All User
                    case 'grouplink': {
                        if (!isBotGroupAdmins) return client.reply(from, resMsg.error.botAdm, id)
                        if (isGroupMsg) {
                            const inviteLink = await client.getGroupInviteLink(groupId)
                            client.sendLinkWithAutoPreview(from, inviteLink, `\nLink group *${name || formattedTitle}* Gunakan *${prefix}revoke* untuk mereset Link group`)
                        } else {
                            client.reply(from, resMsg.error.group, id)
                        }
                        break
                    }
                    case "revoke": {
                        if (!isBotGroupAdmins) return client.reply(from, resMsg.error.botAdm, id)
                        if (isBotGroupAdmins) {
                            client.revokeGroupInviteLink(from)
                                .then(() => {
                                    client.reply(from, `Berhasil Revoke Grup Link gunakan *${prefix}grouplink* untuk mendapatkan group invite link yang terbaru`, id)
                                })
                                .catch((err) => {
                                    console.log(`[ERR] ${err}`)
                                })
                        }
                        break
                    }

                    //Media
                    case 'ytmp3s':
                        if (args.length === 0) return client.reply(from, `Kirim perintah *${prefix}ytmp3s [ Link Yt ]*, untuk contoh silahkan kirim perintah *${prefix}readme*`, id)
                        if (arg.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/) === null) return client.reply(from, `Link youtube tidak valid.`, id)
                        try {
			    await client.sendText(resMsg.wait)
                            const serp2 = body.slice(7)
                            const webplays = await axios.get(`https://api.zeks.xyz/api/ytmp3/2?apikey=apivinz&url=${serp2}`)
                              if (webplays.status == false) {
                              client.reply(from, `*Maaf Terdapat kesalahan saat mengambil data, mohon pilih media lain...*`, id)
                                } else {
                        const { title, link } = await webplays.data.result
                        await client.sendFileFromUrl(from, link, `${title}.mp3`, '')
                        console.log(color(`Audio processed for ${processTime(t, moment())} seconds`, 'aqua'))
                        }} catch (err) {
                            client.sendText(ownerNumber, 'Error YTMP3S : '+ err)
                            client.reply(from, 'Jangan meminta lagu yang sama dengan sebelumnya!', id)
                        }
                        break
                    case 'ytmp3': {
                    if (args.length == 0) return client.reply(from, `Untuk mendownload audio dari youtube\nketik: ${prefix}ytmp3 <link yt> (don't include <> symbol)`, id)
                    if (arg.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/) === null) return client.reply(from, `Link youtube tidak valid.`, id)
                    let ytid = args[0].substr((args[0].indexOf('=')) != -1 ? (args[0].indexOf('=') + 1) : (args[0].indexOf('be/') + 3))
                    try {
			await client.sendText(resMsg.wait)
                        ytid = ytid.replace(/&.+/g, '')
                        let time = moment(t * 1000).format('mmss')
                        let path = `./media/temp_${time}.mp3`

                        let stream = ytdl(ytid, { quality: 'highestaudio' })

                        ffmpeg({ source: stream })
                            .setFfmpegPath('./bin/ffmpeg')
                            .on('error', (err) => {
                                console.log('An error occurred: ' + err.message)
                                client.reply(resMsg.error.norm)
                            })
                            .on('end', () => {
                                client.sendFile(from, path, `${ytid}.mp3`, '').then(console.log(color('[LOGS]', 'grey'), `Audio Processed for ${processTime(t, moment())} Second`))
                            })
                            .saveToFile(path)
                        if (existsSync(path)) unlinkSync(path)
                    } catch (err) {
                        console.log(err)
                        client.reply(resMsg.error.norm)
                    }
                    break
                    }
                    case 'ytmp4':{
                        if (args.length == 0) return client.reply(from, `Kirim perintah #ytmp4 [ Link Yt ]*, untuk contoh silahkan kirim perintah *#readme*`)
                        if (arg.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/) === null) return client.reply(from, `Link youtube tidak valid.`, id)
                        try {
                            client.reply(from, resMsg.wait, id)
                            const ytvh = await axios.get(`https://h4ck3rs404-api.herokuapp.com/api/ytmp4?url=${body.slice(7)}&apikey=404Api`)
                             if (ytvh.status == false) {
                                client.reply(from, `*Maaf Terdapat kesalahan saat mengambil data, mohon pilih media lain...*`, id)
                            } else {
                                const { title, size, url_video, thumbnail } = await ytvh.data.result
                                console.log(`Flinsky : ${size}\n${ytvh.status}`)
                                await client.sendFileFromUrl(from, thumbnail, 'thumb.jpg', `*「 YOUTUBE MP4 」*\n\n• *Judul* : ${title}\n• *Filesize* : ${size}\n\n*Link* : ${url_video} \n\nUntuk Mengurangi lag jadi silahkan download melalui link diatas `, id)
                            }
                        } catch (err) {
                            client.sendText(ownerNumber, 'Error ytmp4 : '+ err)
                            client.reply(from, 'Jangan download video yang sama dengan sebelumnya!', id)
                        }
                        break
                    }
		case 'ytsearch': {
                            try {
                                const response2 = await fetch(`http://zekais-api.herokuapp.com/yts?query=${body.slice(10)}`)
                                if (!response2.ok) throw new Error(`unexpected response ${response2.statusText}`)
                                const jsonserc = await response2.json()
                                const { result } = await jsonserc
                                let xixixi = `*「 YOUTUBE SEARCH 」*\n\n*Hasil Pencarian : ${body.slice(10)}*\n`
                                for (let i = 0; i < result.length; i++) {
                                    xixixi += `\n─────────────────\n\n• *Judul* : ${result[i].title}\n• *Ditonton* : ${result[i].views}\n• *Durasi* : ${result[i].durasi}\n• *Channel* : ${result[i].channel}\n• *URL* : ${result[i].url}\n`
                                }
                                await client.sendFileFromUrl(from, result[0].image, 'thumbserc.jpg', xixixi, id)
                            } catch (err) {
                                    console.log(err)
                                    client.reply(from, 'Terjadi Kesalahan Dalam Pengambilan Data!', id)
                                    client.sendText(ownerNumber, 'YT Search Error : ' + err)
                            }
                            break
                    }

             case 'play': {//silahkan kalian custom sendiri jika ada yang ingin diubah
                        if (args.length == 0) return client.reply(from, `Untuk mencari lagu dari youtube\n\nPenggunaan: ${prefix}play <judul lagu>\nContoh: ${prefix}play radioactive but im waking up`, id)
                        if (!isGroupMsg) return client.reply(from, `Maaf command ini hanya bisa digunakan di dalam grup!`, id)
            try {
                const serp = body.slice(6)
                const webplay = await axios.get(`http://zekais-api.herokuapp.com/ytplay?query=${serp}`)
                 if (webplay.status == false) {
                    client.reply(from, `*Maaf Terdapat kesalahan saat mengambil data, mohon pilih media lain...*`, id)
                } else {
                    const { title, thumb, channel, uploadDate, views, result } = await webplay.data
                    await client.sendFileFromUrl(from, thumb, 'THUMBNAIL.jpg', `Video ditemukan\n\nJudul: ${title}\nChannel: ${channel}\nUploaded: ${uploadDate}\nView: ${views}\n\n_Audio sedang dikirim_`, id)
                    await client.sendFileFromUrl(from, result, `${title}.mp3`, '')
                    console.log(color(`Audio processed for ${processTime(t, moment())} seconds`, 'aqua'))
                }
            } catch (err) {
                client.sendText(ownerNumber, 'Error Play : '+ err)
                client.reply(from, 'Jangan meminta lagu yang sama dengan sebelumnya!', id)
            }
            break 	            
            }
                    case 'buildgi': {
                        if (!isGroupMsg) return client.reply(from, 'Perintah ini hanya bisa digunakan dalam grup', id)
                        if (args.length === 0) return client.reply(from, 'Masukkan nama characternya contoh #genshin keqing', id)
                        if (args[0] === 'ningguang') {
                           await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/Em-fPLbXIAMeGHs.jpg`, 'ningguang.jpg', 'NINGGUANG')
                        }
                        else if (args[0] === 'eula') {
                            await client.sendFileFromUrl(from, `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRenIHog_Y7-RaY9xWmApOBXDHsnmp0GPfxBA&usqp=CAU`, 'eula.jpg', 'EULA')
                        }
                        else if (args[0] === 'qiqi') {
                            await client.sendFileFromUrl(from, `https://i.pinimg.com/originals/a6/30/72/a630722d0b892f3726a8d6f5305a8d51.jpg`, 'qiqi.jpg', 'QIQI')
                        }
                        else if (args[0] === 'bennett') {
                            await client.sendFileFromUrl(from, `https://i.pinimg.com/originals/6f/45/f0/6f45f0c3a9fb25279dc8d27d91e68e04.jpg`, 'bennett.jpg', 'BENNETT')
                        }
                        else if (args[0] === 'ganyu') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/Erj5aqWXUAQWZoK.jpg`, 'ganyu.jpg', 'GANYU')
                        }
                        else if (args[0] === 'diluc') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/EnSynS8W4AQH58E.jpg`, 'Diluc.jpg', 'DILUC')
                        }
                        else if (args[0] === 'hutao') {
                            await client.sendFileFromUrl(from, `https://upload-os-bbs.mihoyo.com/upload/2021/03/05/63355475/6c6e0880deecb8724eb5782ce2abe326_7391460892029173849.png`, 'hutao.jpg', 'HUTAO')
                        }
                        else if (args[0] === 'klee') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/EnGJHUAXMAIuzKD.jpg`, 'klee.jpg', 'KLEE')
                        }
                        else if (args[0] === 'mona') {
                            await client.sendFileFromUrl(from, `https://i.pinimg.com/originals/b1/0b/4f/b10b4f74c40df78d86ffad813bf19b11.jpg`, 'mona.jpg', 'MONA')
                        }
                        else if (args[0] === 'childe') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/Emtc2HBXYAMA58S.jpg`, 'childe.jpg', 'CHILDE')
                        }
                        else if (args[0] === 'venti') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/EnojhCpXcAAAgeW.jpg`, 'venti.jpg', 'VENTI')
                        }
                        else if (args[0] === 'xiao') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/EtUpocpWgAov3gN.jpg`, 'xiao.jpg', 'XIAO')
                        }
                        else if (args[0] === 'xingqiu') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/EveqXA5XEAgJW5Y.jpg`, 'xingqiu.jpg', 'XINGQIU')
                        }
                        else if (args[0] === 'zhongli') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/EoREoPFW4AA1xlA.jpg`, 'zhongli.jpg', 'ZHONGLI')
                        }
                        else if (args[0] === 'albedo') {
                            await client.sendFileFromUrl(from, `https://upload-os-bbs.mihoyo.com/upload/2020/12/28/63355475/47bc7b1162a21453f1220a374bf15da1_2193150447268650678.png`, 'albedo.png', 'ALBEDO')
                        }
                        else if (args[0] === 'diona') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/EnJI-SiW8AEWACM.jpg`, 'diona.jpg', 'DIONA')
                        }
                        else if (args[0] === 'fischl') {
                            await client.sendFileFromUrl(from, `https://staticg.sportskeeda.com/editor/2021/03/04b93-16153802018217-800.jpg`, 'fischl.jpg', 'FISCHL')
                        }
                        else if (args[0] === 'jean') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/EmTrchHXEAA6IZa.jpg`, 'jean.jpg', 'JEAN')
                        }
                        else if (args[0] === 'keqing') {
                            await client.sendFileFromUrl(from, `https://i.pinimg.com/originals/7d/90/b9/7d90b94f5194b74c104686287216ccee.png`, 'keqing.jpg', 'KEQING')
                        }
                        else if (args[0] === 'razor') {
                            await client.sendFileFromUrl(from, `https://upload-os-bbs.mihoyo.com/upload/2020/12/11/63355475/26034e7eb14a93af1e466cb9914afa89_5399551990996542927.png`, 'razor.jpg', 'RAZOR')
                        }
                        else if (args[0] === 'rosaria') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/EyjQ3V5WQAQ6rYk.jpg`, 'rosaria.jpg', 'ROSARIA')
                        }
                        else if (args[0] === 'sucrose') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/EoBu7oQXUAMJjWL.jpg`, 'sucrose.jpg', 'SUCROSE')
                        }
                        else if (args[0] === 'xiangling') {
                            await client.sendFileFromUrl(from, `https://upload-os-bbs.hoyolab.com/upload/2020/11/21/63355475/5dd077533466cbbdc4087e72713bf5b6_4149424357349932943.png`, 'xiangling.png', 'XIANGLING')
                        }
                        else if (args[0] === 'barbara') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/Es_G80eXMAgHFq3.jpg`, 'barbara.jpg', 'BARBARA')
                        }
                        else if (args[0] === 'beidou') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/EmZTPl_WMAEmikq.jpg`, 'beidou.jpg', 'BEIDOU')
                        }
                        else if (args[0] === 'chongyun') {
                            await client.sendFileFromUrl(from, `https://i.pinimg.com/originals/b3/b1/cc/b3b1cce69b592c9fbb590dbe8cbc6ba3.jpg`, 'chongyun.jpg', 'CHONGYUN')
                        }
                        else if (args[0] === 'kaeya') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/ErVRuSrXUAYx3It.jpg`, 'kaeya.jpg', 'KAEYA')
                        }
                        else if (args[0] === 'xinyan') {
                            await client.sendFileFromUrl(from, `https://upload-os-bbs.hoyolab.com/upload/2021/01/27/63355475/8d10c6784b158bc95e0aa60918217a34_1082325582054032291.png`, 'xinyan.png', 'XINYAN')
                        }
                        else if (args[0] === 'lisa') {
                            await client.sendFileFromUrl(from, `https://upload-os-bbs.hoyolab.com/upload/2021/02/13/63355475/6718b2955f0f126e717121ef971c382a_8520390941442621949.png`, 'lisa.png', 'LISA')
                        }
                        else if (args[0] === 'noelle') {
                            await client.sendFileFromUrl(from, `https://pbs.twimg.com/media/Es8LXamXYAMZOVk.jpg`, 'noelle.jpg', 'NOELLE')
                        }
                        else if (args[0] === 'amber') {
                            await client.sendFileFromUrl(from, `https://upload-os-bbs.hoyolab.com/upload/2021/02/21/63355475/c24676965b33c9729e55d574317f4e4b_6012764714877069971.png`, 'amber.png', 'AMBER')
                        } else {
                            client.reply(from, 'Character yang kamu cari tidak tersedia!', id)
                        }
                        break
                    }
                    case 'earrape': {
                        if (!isQuotedPtt && !isQuotedAudio) return client.reply(from, `Silakan reply audio atau voice notes dengan perintah ${prefix}earrape`, id)
                        const _inp = await decryptMedia(quotedMsg)

                        let time = moment(t * 1000).format('mmss')
                        let inpath = `./media/inearrape_${time}.mp3`
                        let outpath = `./media/outearrape_${time}.mp3`
                        fs.writeFileSync(inpath, _inp)

                        ffmpeg(inpath)
                            .setFfmpegPath('./bin/ffmpeg')
                            .complexFilter('acrusher=level_in=2:level_out=6:bits=8:mode=log:aa=1,lowpass=f=3500')
                            .on('error', (err) => {
                                console.log('An error occurred: ' + err.message)
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                                return client.reply(from, resMsg.error.norm, id)
                            })
                            .on('end', () => {
                                client.sendFile(from, outpath, 'earrape.mp3', '', id).then(console.log(color('[LOGS]', 'grey'), `Audio Processed for ${processTime(t, moment())} Second`))
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                            })
                            .saveToFile(outpath)
                        break
                    }

                    case 'robot': {
                        if (!isQuotedPtt && !isQuotedAudio) return client.reply(from, `Silakan reply audio atau voice notes dengan perintah ${prefix}robot`, id)
                        const _inp = await decryptMedia(quotedMsg)

                        let time = moment(t * 1000).format('mmss')
                        let inpath = `./media/inrobot_${time}.mp3`
                        let outpath = `./media/outrobot_${time}.mp3`
                        fs.writeFileSync(inpath, _inp)

                        ffmpeg(inpath)
                            .setFfmpegPath('./bin/ffmpeg')
                            .complexFilter(`afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75`)
                            .on('error', (err) => {
                                console.log('An error occurred: ' + err.message)
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                                return client.reply(from, resMsg.error.norm, id)
                            })
                            .on('end', () => {
                                client.sendFile(from, outpath, 'robot.mp3', '', id).then(console.log(color('[LOGS]', 'grey'), `Audio Processed for ${processTime(t, moment())} Second`))
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                            })
                            .saveToFile(outpath)
                        break
                    }

                    case 'reverse': {
                        if (!isQuotedPtt && !isQuotedAudio) return client.reply(from, `Silakan reply audio atau voice notes dengan perintah ${prefix}reverse`, id)
                        const _inp = await decryptMedia(quotedMsg)

                        let time = moment(t * 1000).format('mmss')
                        let inpath = `./media/inreverse_${time}.mp3`
                        let outpath = `./media/outreverse_${time}.mp3`
                        fs.writeFileSync(inpath, _inp)

                        ffmpeg(inpath)
                            .setFfmpegPath('./bin/ffmpeg')
                            .complexFilter(`areverse`)
                            .on('error', (err) => {
                                console.log('An error occurred: ' + err.message)
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                                return client.reply(from, resMsg.error.norm, id)
                            })
                            .on('end', () => {
                                client.sendFile(from, outpath, 'reverse.mp3', '', id).then(console.log(color('[LOGS]', 'grey'), `Audio Processed for ${processTime(t, moment())} Second`))
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                            })
                            .saveToFile(outpath)
                        break
                    }

                    case 'samarkan': {
                        if (!isQuotedPtt && !isQuotedAudio) return client.reply(from, `Samarkan suara ala investigasi. Silakan reply audio atau voice notes dengan perintah ${prefix}samarkan`, id)
                        const _inp = await decryptMedia(quotedMsg)

                        let time = moment(t * 1000).format('mmss')
                        let inpath = `./media/insamarkan_${time}.mp3`
                        let outpath = `./media/outsamarkan_${time}.mp3`
                        fs.writeFileSync(inpath, _inp)

                        ffmpeg(inpath)
                            .setFfmpegPath('./bin/ffmpeg')
                            .complexFilter(`rubberband=pitch=1.5`)
                            .on('error', (err) => {
                                console.log('An error occurred: ' + err.message)
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                                return client.reply(from, resMsg.error.norm, id)
                            })
                            .on('end', () => {
                                client.sendFile(from, outpath, 'samarkan.mp3', '', id).then(console.log(color('[LOGS]', 'grey'), `Audio Processed for ${processTime(t, moment())} Second`))
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                            })
                            .saveToFile(outpath)
                        break
                    }

                    case 'vibrato': {
                        if (!isQuotedPtt && !isQuotedAudio) return client.reply(from, `Silakan reply audio atau voice notes dengan perintah ${prefix}vibrato`, id)
                        const _inp = await decryptMedia(quotedMsg)

                        let time = moment(t * 1000).format('mmss')
                        let inpath = `./media/invibrato_${time}.mp3`
                        let outpath = `./media/outvibrato_${time}.mp3`
                        fs.writeFileSync(inpath, _inp)

                        ffmpeg(inpath)
                            .setFfmpegPath('./bin/ffmpeg')
                            .complexFilter(`vibrato=f=8`)
                            .on('error', (err) => {
                                console.log('An error occurred: ' + err.message)
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                                return client.reply(from, resMsg.error.norm, id)
                            })
                            .on('end', () => {
                                client.sendFile(from, outpath, 'vibrato.mp3', '', id).then(console.log(color('[LOGS]', 'grey'), `Audio Processed for ${processTime(t, moment())} Second`))
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                            })
                            .saveToFile(outpath)
                        break
                    }

                    case 'nightcore': {
                        if (!isQuotedPtt && !isQuotedAudio) return client.reply(from, `Silakan reply audio atau voice notes dengan perintah ${prefix}nightcore`, id)
                        const _inp = await decryptMedia(quotedMsg)

                        let time = moment(t * 1000).format('mmss')
                        let inpath = `./media/innightcore_${time}.mp3`
                        let outpath = `./media/outnightcore_${time}.mp3`
                        fs.writeFileSync(inpath, _inp)

                        ffmpeg(inpath)
                            .setFfmpegPath('./bin/ffmpeg')
                            .audioFilters('asetrate=44100*1.25,firequalizer=gain_entry=\'entry(0,3);entry(250,2);entry(1000,0);entry(4000,-2);entry(16000,-3)\'')
                            .on('error', (err) => {
                                console.log('An error occurred: ' + err.message)
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                                return client.reply(from, resMsg.error.norm, id)
                            })
                            .on('end', () => {
                                client.sendFile(from, outpath, 'nightcore.mp3', '', id).then(console.log(color('[LOGS]', 'grey'), `Audio Processed for ${processTime(t, moment())} Second`))
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                            })
                            .saveToFile(outpath)
                        break
                    }

                    case 'deepslow': {
                        if (!isQuotedPtt && !isQuotedAudio) return client.reply(from, `Silakan reply audio atau voice notes dengan perintah ${prefix}deepslow`, id)
                        const _inp = await decryptMedia(quotedMsg)

                        let time = moment(t * 1000).format('mmss')
                        let inpath = `./media/indeepslow_${time}.mp3`
                        let outpath = `./media/outdeepslow_${time}.mp3`
                        fs.writeFileSync(inpath, _inp)

                        ffmpeg(inpath)
                            .setFfmpegPath('./bin/ffmpeg')
                            .audioFilters('atempo=1.1,asetrate=44100*0.7,firequalizer=gain_entry=\'entry(0,3);entry(250,2);entry(1000,0);entry(4000,-2);entry(16000,-3)\'')
                            .on('error', (err) => {
                                console.log('An error occurred: ' + err.message)
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                                return client.reply(from, resMsg.error.norm, id)
                            })
                            .on('end', () => {
                                client.sendFile(from, outpath, 'deepslow.mp3', '', id).then(console.log(color('[LOGS]', 'grey'), `Audio Processed for ${processTime(t, moment())} Second`))
                                fs.unlinkSync(inpath)
                                fs.unlinkSync(outpath)
                            })
                            .saveToFile(outpath)
                        break
                    }

                    case 'tiktok': {
                        return client.reply(from, `Maaf fitur sedang dalam perbaikan`, id)

                        // if (args.length === 0 && !isQuotedChat) return client.reply(from, `Download Tiktok no watermark. How?\n${prefix}tiktok <url>\nTanpa simbol <>`, id)
                        // let urls = isQuotedChat ? quotedMsg.body : arg
                        // if (!isUrl(urls)) { return client.reply(from, 'Maaf, link yang kamu kirim tidak valid.', id) }
                        // await client.reply(from, resMsg.wait, id)
                        // let result = await tiktok.ssstik(urls).catch(err => client.reply(from, resMsg.error.norm, id).then(() => console.log(err)))
                        // let _id = quotedMsg != null ? quotedMsg.id : id
                        // await client.sendFileFromUrl(from, result.videonowm2, '', '', _id).catch(err => client.reply(from, resMsg.error.norm, id).then(() => console.log(err)))
                        // break
                    }

                    case 'tiktokmp3': {
                        return client.reply(from, `Maaf fitur sedang dalam perbaikan`, id)

                        // if (args.length === 0 && !isQuotedChat) return client.reply(from, `Download Tiktok music/mp3. How?\n${prefix}tiktokmp3 <url>\nTanpa simbol <>`, id)
                        // let urls = isQuotedChat ? quotedMsg.body : arg
                        // if (!isUrl(urls)) { return client.reply(from, 'Maaf, link yang kamu kirim tidak valid.', id) }
                        // await client.reply(from, resMsg.wait, id)
                        // let result = await tiktok.ssstik(urls).catch(err => client.reply(from, resMsg.error.norm, id).then(() => console.log(err)))
                        // let _id = quotedMsg != null ? quotedMsg.id : id
                        // await client.sendFileFromUrl(from, result.music, '', '', _id).catch(err => client.reply(from, resMsg.error.norm, id).then(() => console.log(err)))
                        // break
                    }

                    case 'artinama':
                        if (args.length == 0) return client.reply(from, `Untuk mengetahui arti nama seseorang\nketik ${prefix}artinama nama kamu`, id)
                        api.artinama(arg)
                            .then(res => {
                                client.reply(from, `Arti : ${res}`, id)
                            })
                            .catch(() => {
                                client.reply(from, resMsg.error.norm, id)
                            })
                        break

                    // Random Kata
                    case 'wibu':
                        axios.get('https://h4ck3rs404-api.herokuapp.com/api/randomwibu?apikey=404Api').then(({ data }) => {
                        let namanya = data.result.nama
                        let deskripsinya = data.result.deskripsi
                        let fotonya = data.result.foto
                        client.sendFileFromUrl(from,fotonya, `fotowibu.jpg`, `➥Nama : ${namanya}\n➥Deskripsi : ${deskripsinya}` , id)
                    }).catch(() => {
                        client.sendText('Wibu Error!')
                    })
                        break
                    case 'katabijak':
                        axios.get(`https://h4ck3rs404-api.herokuapp.com/api/katabijak?apikey=404Api`).then(({ data }) => {
                        let isibijak = data.result
                        client.sendText(from, isibijak, id)
                    }).catch(() => {
                        client.sendText('Kata Bijak Error!')
                    })
                        break
                    case 'pantun':
                        axios.get(`https://h4ck3rs404-api.herokuapp.com/api/randomptn?apikey=404Api`).then(({ data }) => {
                        let isipantun = data.result
                        client.sendText(from, isipantun, id)
                    }).catch(() => {
                        client.sendText('Pantun Error!')
                    })
                        break
                    case 'quotenime':
                    case 'quotesnime':
                        axios.get('https://h4ck3rs404-api.herokuapp.com/api/animequote?apikey=404Api').then(({ data }) => {
                        let animenya = data.result.anime
                        let charanya = data.result.chara
                        let quotenya = data.result.quote
                        client.sendText(from, `➥Anime : ${animenya}\n➥Chara : ${charanya}\n\n➥Quote : ${quotenya}` , id)
                    }).catch(() => {
                        client.sendText('Quote Anime Error!')
                    })
                        break

                    //Random Images
					case 'hentai':
                        if (args.length == 0) return client.reply(from, `Untuk menggunakan ${prefix}hentai\nSilahkan ketik: ${prefix}hentai [query]\nContoh: ${prefix}hentai orgy\n\nquery yang tersedia:\norgy, neko, hentai, trap, blowjob, school, maid, feet, yuri, spank, feetg, ero, lewdk, lewdkemo, tits, masturbation, cum, foxgirl, glasses, thighs, netorare, ass`, id)
                        if (args[0] === 'orgy' || args[0] === 'neko' || args[0] === 'hentai' || args[0] === 'trap' ||args[0] === 'blowjob' ||args[0] === 'school' ||args[0] === 'maid' ||args[0] === 'feet' ||args[0] === 'yuri' ||args[0] === 'spank' ||args[0] === 'feetg' ||args[0] === 'ero' ||args[0] === 'lewdk' ||args[0] === 'lewdkemo' ||args[0] === 'tits' ||args[0] === 'masturbation' ||args[0] === 'masturbation' ||args[0] === 'cum' ||args[0] === 'foxgirl' ||args[0] === 'glasses' ||args[0] === 'thighs' ||args[0] === 'netorare' ||args[0] === 'ass') {
                            client.sendFileFromUrl(from, `https://h4ck3rs404-api.herokuapp.com/api/nsfw/${args[0]}?apikey=404Api`, `hentai.jpg`, '', id).catch(e => {
                                console.log(`hentai ${args[0]} err : ${e}`)
                                return client.sendText(from, 'Mungkin Sedang Dalam Perbaikan', id)
                            })}
                            break
                    case 'anime':
                        if (args.length == 0) return client.reply(from, `Untuk menggunakan ${prefix}anime\nSilahkan ketik: ${prefix}anime [query]\nContoh: ${prefix}anime random\n\nquery yang tersedia:\nwaifus, milf, loli, mecha, ongoing`, id)
                        if (args[0] === 'waifus' || args[0] === 'loli' || args[0] === 'milf' || args[0] === 'mecha') {
                            client.sendFileFromUrl(from, `https://zenzapi.xyz/api/random/${args[0]}?apikey=60c9d613ff6c`, 'Anime.jpg', `${args[0]}`, id).catch(e => {
                                console.log(`Anime ${args[0]} err : ${e}`)
                                return client.sendText(from, 'Mungkin Sedang Dalam Perbaikan', id)
                            })}else if (args[0] === 'ongoing') {
                                try {
                                    const ongo = await fetch(`http://zekais-api.herokuapp.com/nanimenew`)
                                    if (!ongo.ok) throw new Error(`unexpected response ${ongo.statusText}`)
                                    const jsonsercs = await ongo.json()
                                    const { result } = await jsonsercs
                                    let xixixi = `*「 ONGOING 」*\n`
                                    for (let i = 0; i < result.length; i++) {
                                        xixixi += `\n─────────────────\n\n• *Judul* : ${result[i].name}\n• *Rating* : ${result[i].rating}\n• *Status* : ${result[i].status}\n• *Link* : ${result[i].url}\n`
                                    }
                                    await client.reply(from, xixixi, id)
                                } catch (err) {
                                        console.log(err)
                                        client.reply(from, 'Terjadi Kesalahan Dalam Pengambilan Data!', id)
                                        client.sendText(ownerNumber, 'Ongoing Error : ' + err)
                                }}
                            break
				
                    case 'memes':
                        const randmeme = await meme.random()
                        client.sendFileFromUrl(from, randmeme.url, '', randmeme.title, id)
                            .catch(() => {
                                client.reply(from, resMsg.error.norm, id)
                            })
                        break

                    // Search Any
                    case 'pin':
                    case 'pinterest': {
                        if (args.length == 0) return client.reply(from, `Untuk mencari gambar dari pinterest\nketik: ${prefix}pinterest [search]\ncontoh: ${prefix}pinterest naruto`, id)
                        if (!isGroupMsg) return client.reply(from, 'Perintah ini hanya bisa di gunakan dalam group!', id)
                        const ptrsqu = body.slice(11)
                        const ptrs = await axios.get('http://fdciabdul.tech/api/pinterest/?keyword='+ptrsqu)
                    const bss = JSON.parse(JSON.stringify(ptrs.data))
                    const ptrs22 =  bss[Math.floor(Math.random() * bss.length)]
                    const imagess = await bent("buffer")(ptrs22)
                    const base64s = `data:image/jpg;base64,${imagess.toString("base64")}`
                    client.sendImage(from, base64s, 'ptrs.jpg', `*Pinterest*\n\n*Hasil Pencarian : ${ptrsqu}*`)
                    break
                    }

                    case 'pinterest2':
                    case 'pin2': {
                        if (args.length == 0) return client.reply(from, `Untuk mencari gambar dari pinterest v2.\nketik: ${prefix}pin2 [search]\ncontoh: ${prefix}pin2 naruto\n\nGunakan apabila /pinterest atau /pin error`, id)
                        let img = await scraper.pinterest(browser, arg).catch(e => {
                            console.log(`pin2 err : ${e}`)
                            return client.reply(from, resMsg.error.norm, id)
                        })
                        if (img === null) return client.reply(from, resMsg.error.norm, id).then(() => console.log(`img return null`))
                        await client.sendFileFromUrl(from, img, '', '', id).catch(e => {
                            console.log(`send pin2 err : ${e}`)
                            return client.reply(from, resMsg.error.norm, id)
                        })
                        break
                    }

                    case 'image':
                    case 'images':
                    case 'gimg':
                    case 'gimage': {
                        if (args.length == 0) return client.reply(from, `Untuk mencari gambar dari google image\nketik: ${prefix}gimage [search]\ncontoh: ${prefix}gimage naruto`, id)
                        const img = await scraper.gimage(browser, arg).catch(e => {
                            console.log(`gimage err : ${e}`)
                            return client.reply(from, resMsg.error.norm, id)
                        })
                        if (img === null) return client.reply(from, resMsg.error.norm, id).then(() => console.log(`img return null`))
                        await client.sendFileFromUrl(from, img, '', '', id).catch(e => {
                            console.log(`send gimage err : ${e}`)
                            return client.reply(from, resMsg.error.norm, id)
                        })
                        break
                    }

                    case 'crjogja': {
                        const url1 = 'http://api.screenshotlayer.com/api/capture?access_key=f56691eb8b1edb4062ed146cccaef885&url=https://sipora.staklimyogyakarta.com/radar/&viewport=600x600&width=600&force=1'
                        const url2 = 'https://screenshotapi.net/api/v1/screenshot?token=FREB5SDBA2FRMO4JDMSHXAEGNYLKYCA4&url=https%3A%2F%2Fsipora.staklimyogyakarta.com%2Fradar%2F&width=600&height=600&fresh=true&output=image'
                        const isTrue1 = Boolean(Math.round(Math.random()))
                        const urL = isTrue1 ? url1 : url2

                        await client.sendText(from, 'Gotcha, please wait!')
                        await client.simulateTyping(from, true)
                        await client.sendFileFromUrl(from, urL, '', 'Captured from https://sipora.staklimyogyakarta.com/radar/')
                            .then(() => {
                                client.simulateTyping(from, false)
                            })
                            .catch(() => {
                                client.reply(from, 'Ada yang error! Coba lagi beberapa saat kemudian. Mending cek sendiri aja ke\nhttps://sipora.staklimyogyakarta.com/radar/', id)
                            })
                        break
                    }

                    case 'reddit':
                    case 'subreddit':
                    case 'sreddit': {
                        if (args.length == 0) return client.reply(from, `Untuk mencari gambar dari sub reddit\nketik: ${prefix}sreddit [search]\ncontoh: ${prefix}sreddit naruto`, id)
                        const hasilreddit = await api.sreddit(arg)
                        await client.sendFileFromUrl(from, hasilreddit.url, '', hasilreddit.title, id)
                            .catch((e) => {
                                console.log(e)
                                client.reply(from, resMsg.error.norm, id)
                            })
                        break
                    }

                    case 'nekopoi': {
                        if (isGroupMsg) {
                            client.reply(from, 'Untuk Fitur Nekopoi Silahkan Lakukan di Private Message', id)
                        } else {
                            let data = await axios.get('https://arugaz.herokuapp.com/api/anime/nekopoi/random')
                            let poi = _.sample(data.data)
                            let hasilpoi = 'Note[❗]: 18+ ONLY[❗]'
                            hasilpoi += '\nJudul: ' + poi.title
                            hasilpoi += '\nLink: ' + poi.link
                            client.reply(from, hasilpoi, id)
                        }
                        break
                    }
                    case 'cuaca':
                        if (args.length == 0) return client.reply(from, `Untuk melihat cuaca pada suatu daerah\nketik: ${prefix}cuaca [daerah]`, id)
                        const cuacaq = body.slice(7)
                        const cuacap = await api.cuaca(cuacaq)
                        await client.reply(from, cuacap, id)
                            .catch(() => {
                                client.reply(from, resMsg.error.norm, id)
                            })
                        break

                    case 'whatanime': {
                        if (isMedia && type === 'image' || quotedMsg && quotedMsg.type === 'image') {
                            let mediaData
                            if (isMedia) {
                                mediaData = await decryptMedia(message)
                            } else {
                                mediaData = await decryptMedia(quotedMsg)
                            }
                            const imgBS4 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                            client.reply(from, 'Searching....', id)
                            fetch('https://trace.moe/api/search', {
                                method: 'POST',
                                body: JSON.stringify({ image: imgBS4 }),
                                headers: { "Content-Type": "application/json" }
                            })
                                .then(respon => respon.json())
                                .then(resolt => {
                                    if (resolt.docs && resolt.docs.length <= 0) {
                                        client.reply(from, 'Maaf, saya tidak tau ini anime apa, pastikan gambar yang akan di Search tidak Buram/Kepotong', id)
                                    }
                                    const { is_adult, title, title_chinese, title_romaji, title_english, episode, similarity, filename, at, tokenthumb, anilist_id } = resolt.docs[0]
                                    teks = ''
                                    if (similarity < 0.92) {
                                        teks = '*Saya memiliki keyakinan rendah dalam hal ini* :\n\n'
                                    }
                                    teks += `➸ *Title Japanese* : ${title}\n➸ *Title chinese* : ${title_chinese}\n➸ *Title Romaji* : ${title_romaji}\n➸ *Title English* : ${title_english}\n`
                                    teks += `➸ *R-18?* : ${is_adult}\n`
                                    teks += `➸ *Eps* : ${episode.toString()}\n`
                                    teks += `➸ *Kesamaan* : ${(similarity * 100).toFixed(1)}%\n`
                                    var video = `https://media.trace.moe/video/${anilist_id}/${encodeURIComponent(filename)}?t=${at}&token=${tokenthumb}`;
                                    client.sendFileFromUrl(from, video, 'anime.mp4', teks, id).catch(() => {
                                        client.reply(from, teks, id)
                                    })
                                })
                                .catch(err => {
                                    console.log(err)
                                    client.reply(from, resMsg.error.norm, id)
                                })
                        } else {
                            client.reply(from, `Maaf format salah\n\nSilahkan kirim foto dengan caption ${prefix}whatanime\n\nAtau reply foto dengan caption ${prefix}whatanime`, id)
                        }
                        break
                    }

                    case 'lirik':
                    case 'lyric': {
                        if (args.length === 0) return client.reply(from, `Untuk mencari lirik dengan nama lagu atau potongan lirik\nketik: ${prefix}lirik <query>\nContoh: ${prefix}lirik lathi`, id)
                        let res = await api.lirik(arg).catch(err => client.reply(from, resMsg.error.norm, id).then(() => console.log(err)))
                        await client.reply(from, res.lirik, id)
                        break
                    }


                    //Hiburan
                    case 'tod':
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        client.reply(from, `Sebelum bermain berjanjilah akan melaksanakan apapun perintah yang diberikan.\n\nSilahkan Pilih:\n-> ${prefix}truth\n-> ${prefix}dare`, id)
                        break

                    case 'truth':
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        let truths = fs.readFileSync('./random/truth.txt', 'utf8')
                        let _truth = _.sample(truths.split('\n'))
                        await client.reply(from, _truth, id)
                            .catch((err) => {
                                console.log(err)
                                client.reply(from, resMsg.error.norm, id)
                            })
                        break

                    case 'dare':
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        let dares = fs.readFileSync('./random/dare.txt', 'utf8')
                        let _dare = _.sample(dares.split('\n'))
                        await client.reply(from, _dare, id)
                            .catch((err) => {
                                console.log(err)
                                client.reply(from, resMsg.error.norm, id)
                            })
                        break

                    //Tebak Gambar
                    case 'tebakgambar':
                    case 'tgb': {
                    if (!isGroupMsg) return client.reply(from, 'Perintah ini hanya bisa di gunakan dalam group!', id)
                    try {
                    const smbrtgb = await axios.get('https://nishikata-api.herokuapp.com/api/kuis/tebakgambar?apikey=MansKey')
                    if (smbrtgb.data.error) return client.reply(from, smbrtgb.data.error, id)
                    const jwban = `➸ Jawaban : ${smbrtgb.data.jawaban}`
                    client.sendFileFromUrl(from, smbrtgb.data.image, 'tebakgambar.jpg', '_Silahkan Jawab Maksud Dari Gambar Ini_', id)
                    client.sendText(from, `_Batas Waktu 40 Detik !_`, id)
                    await sleep(20000)
                    client.sendText(from, `20 Detik Lagi...`, id)
                    await sleep(10000)
                    client.sendText(from, `10 Detik Lagi...`, id)
                    await sleep(10000)
                    client.reply(from, jwban, id)
                    } catch (err) {
                    console.error(err.message)
                    await client.sendFileFromUrl(from, errorurl2, 'error.png', '💔️ Maaf, Soal Quiz tidak ditemukan')
                    client.sendText(ownerNumber, 'Tebak Gambar Error : ' + err)
                }
                     break
                    }


                    // Other Command
                    case 'resi':
                    case 'cekresi':
                        if (args.length != 2) return client.reply(from, `Maaf, format pesan salah.\nSilahkan ketik pesan dengan ${prefix}resi <kurir> <no_resi>\n\nKurir yang tersedia:\njne, pos, tiki, wahana, jnt, rpx, sap, sicepat, pcp, jet, dse, first, ninja, lion, idl, rex`, id)
                        const kurirs = ['jne', 'pos', 'tiki', 'wahana', 'jnt', 'rpx', 'sap', 'sicepat', 'pcp', 'jet', 'dse', 'first', 'ninja', 'lion', 'idl', 'rex']
                        if (!kurirs.includes(args[0])) return client.sendText(from, `Maaf, jenis ekspedisi pengiriman tidak didukung layanan ini hanya mendukung ekspedisi pengiriman ${kurirs.join(', ')} Tolong periksa kembali.`)
                        console.log(color('[LOGS]', 'grey'), 'Memeriksa No Resi', args[1], 'dengan ekspedisi', args[0])
                        cekResi(args[0], args[1]).then((result) => client.sendText(from, result))
                        break

                    case 'tts':
                    case 'say':
                        if (!isQuotedChat && args.length != 0) {
                            try {
                                if (arg1 === '') return client.reply(from, 'Apa teksnya syg..', id)
                                let gtts = new gTTS(arg1, args[0])
                                gtts.save('./media/tts.mp3', function () {
                                    client.sendPtt(from, './media/tts.mp3', id)
                                        .catch(err => {
                                            console.log(err)
                                            client.sendText(from, resMsg.error.norm)
                                        })
                                })
                            } catch (err) {
                                console.log(color('[ERR>]', 'red'), err.name, err.message)
                                client.reply(from, err.name + '! ' + err.message + '\nUntuk kode bahasa cek disini : https://anotepad.com/note/read/7fd833h4', id)
                            }
                        }
                        else if (isQuotedChat && args.length != 0) {
                            try {
                                const dataText = quotedMsgObj.content.toString()
                                let gtts = new gTTS(dataText, args[0])
                                gtts.save('./media/tts.mp3', function () {
                                    client.sendPtt(from, './media/tts.mp3', quotedMsgObj.id)
                                        .catch(err => {
                                            console.log(err)
                                            client.sendText(from, resMsg.error.norm)
                                        })
                                })
                            } catch (err) {
                                console.log(color('[ERR>]', 'red'), err.name, err.message)
                                client.reply(from, err.name + '! ' + err.message + '\nUntuk kode bahasa cek disini : https://anotepad.com/note/read/7fd833h4', id)
                            }
                        }
                        else {
                            await client.reply(from, `Mengubah teks menjadi sound (google voice)\nketik: ${prefix}tts <kode_bahasa> <teks>\ncontoh : ${prefix}tts id halo\nuntuk kode bahasa cek disini : https://anotepad.com/note/read/7fd833h4`, id)
                        }
                        break

                    case 'ceklokasi':
                        if (!isQuotedLocation) return client.reply(from, `Maaf, format pesan salah.\nKirimkan lokasi dan reply dengan caption ${prefix}ceklokasi`, id)

                        client.reply(from, 'Okey sebentar...', id)
                        console.log(`Request Status Zona Penyebaran Covid-19 (${quotedMsg.lat}, ${quotedMsg.lng}).`)
                        const zoneStatus = await getLocationData(quotedMsg.lat, quotedMsg.lng)
                        if (zoneStatus.kode != 200) client.sendText(from, 'Maaf, Terjadi error ketika memeriksa lokasi yang anda kirim.')
                        let datax = ''
                        zoneStatus.data.forEach((z, i) => {
                            const { zone, region } = z
                            const _zone = zone == 'green' ? 'Hijau* (Aman) \n' : zone == 'yellow' ? 'Kuning* (Waspada) \n' : 'Merah* (Bahaya) \n'
                            datax += `${i + 1}. Kel. *${region}* Berstatus *Zona ${_zone}`
                        })
                        const text = `*CEK LOKASI PENYEBARAN COVID-19*\nHasil pemeriksaan dari lokasi yang anda kirim adalah *${zoneStatus.status}* ${zoneStatus.optional}\n\nInformasi lokasi terdampak disekitar anda:\n${datax}`
                        client.sendText(from, text)
                        break

                    case 'shortlink':
                        if (args.length == 0) return client.reply(from, `ketik ${prefix}shortlink <url>`, id)
                        if (!isUrl(args[0])) return client.reply(from, 'Maaf, url yang kamu kirim tidak valid. Pastikan menggunakan format http/https', id)
                        const shortlink = await urlShortener(args[0])
                        await client.sendText(from, shortlink)
                            .catch((err) => {
                                console.log(err)
                                client.reply(from, resMsg.error.norm, id)
                            })
                        break

                    case 'hilih':
                        if (args.length != 0 || isQuotedChat) {
                            const _input = isQuotedChat ? quotedMsgObj.content.toString() : body.slice(7)
                            const _id = isQuotedChat ? quotedMsgObj.id : id
                            const _res = _input.replace(/[aiueo]/g, 'i')
                            client.reply(from, _res, _id)
                        }
                        else {
                            await client.reply(from, `Mengubah kalimat menjadi hilih gitu deh\n\nketik ${prefix}hilih kalimat\natau reply chat menggunakan ${prefix}hilih`, id)
                        }
                        break

                    case 'klasemen':
                    case 'klasmen':
					    if (!isGroupAdmins) return client.reply(from, 'Fitur ini hanya bisa digunakan oleh admin!', id)
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        if (!isNgegas) return client.reply(from, `Anti-Toxic tidak aktif, aktifkan menggunakan perintah ${prefix}antikasar on`, id)
                        try {
                            const klasemen = db.get('group').filter({ id: groupId }).map('members').value()[0]
                            let urut = Object.entries(klasemen).map(([key, val]) => ({ id: key, ...val })).sort((a, b) => b.denda - a.denda);
                            let textKlas = "*Klasemen Denda Sementara*\n"
                            let i = 1;
                            urut.forEach((klsmn) => {
                                textKlas += i + ". " + klsmn.id.replace('@c.us', '') + " ➤ Rp" + formatin(klsmn.denda) + "\n"
                                i++
                            })
                            await client.sendText(from, textKlas)
                        } catch (err) {
                            console.log(err)
                            client.reply(from, resMsg.error.norm, id)
                        }
                        break

                    case 'skripsi': {
                        let skripsis = fs.readFileSync('./random/skripsi.txt', 'utf8')
                        let _skrps = _.sample(skripsis.split('\n'))
                        let gtts = new gTTS(_skrps, 'id')
                        try {
                            gtts.save('./media/tts.mp3', function () {
                                client.sendPtt(from, './media/tts.mp3', id)
                                    .catch(err => {
                                        console.log(err)
                                        client.sendText(from, resMsg.error.norm)
                                    })
                            })
                        } catch (err) {
                            console.log(err)
                            client.reply(from, resMsg.error.norm, id)
                        }
                        break
                    }

                    case 'apakah': {
                        const isTrue = Boolean(Math.round(Math.random()))
                        var result = ''
                        if (args.length === 0) result = 'Apakah apa woy yang jelas dong! Misalnya, apakah aku ganteng?'
                        else {
                            result = isTrue ? 'Iya' : 'Tidak'
                        }
                        var gtts = new gTTS(result, 'id')
                        try {
                            gtts.save('./media/tts.mp3', function () {
                                client.sendPtt(from, './media/tts.mp3', id)
                                    .catch(err => {
                                        console.log(err)
                                        client.sendText(from, resMsg.error.norm)
                                    })
                            })
                        } catch (err) {
                            console.log(err)
                            client.reply(from, resMsg.error.norm, id)
                        }
                        break
                    }

                    case 'kbbi':
                        if (args.length != 1) return client.reply(from, `Mencari arti kata dalam KBBI\nPenggunaan: ${prefix}kbbi <kata>\ncontoh: ${prefix}kbbi apel`, id)
                        kbbi(args[0])
                            .then(res => {
                                if (res == '') return client.reply(from, `Maaf kata "${args[0]}" tidak tersedia di KBBI`, id)
                                client.reply(from, res + `\n\nMore: https://kbbi.web.id/${args[0]}`, id)

                            }).catch(err => {
                                client.reply(from, resMsg.error.norm, id)
                                console.log(err)
                            })
                        break

                    case 'trans':
                    case 'translate':
                        if (args.length === 0 && !isQuotedChat) return client.reply(from, `Translate text ke kode bahasa, penggunaan: \n${prefix}trans <kode bahasa> <text>\nContoh : \n -> ${prefix}trans id some english or other language text here\n -> ${prefix}translate en beberapa kata bahasa indonesia atau bahasa lain. \n\nUntuk kode bahasa cek disini : https://anotepad.com/note/read/7fd833h4`, id)
                        const lang = ['en', 'pt', 'af', 'sq', 'am', 'ar', 'hy', 'az', 'eu', 'be', 'bn', 'bs', 'bg', 'ca', 'ceb', 'ny', 'zh-CN', 'co', 'hr', 'cs', 'da', 'nl', 'eo', 'et', 'tl', 'fi', 'fr', 'fy', 'gl', 'ka', 'de', 'el', 'gu', 'ht', 'ha', 'haw', 'iw', 'hi', 'hmn', 'hu', 'is', 'ig', 'id', 'ga', 'it', 'ja', 'jw', 'kn', 'kk', 'km', 'rw', 'ko', 'ku', 'ky', 'lo', 'la', 'lv', 'lt', 'lb', 'mk', 'mg', 'ms', 'ml', 'mt', 'mi', 'mr', 'mn', 'my', 'ne', 'no', 'or', 'ps', 'fa', 'pl', 'pa', 'ro', 'ru', 'sm', 'gd', 'sr', 'st', 'sn', 'sd', 'si', 'sk', 'sl', 'so', 'es', 'su', 'sw', 'sv', 'tg', 'ta', 'tt', 'te', 'th', 'tr', 'tk', 'uk', 'ur', 'ug', 'uz', 'vi', 'cy', 'xh', 'yi', 'yo', 'zu', 'zh-TW']

                        if (lang.includes(args[0])) {
                            translate(isQuotedChat ? quotedMsgObj.content.toString() : arg.trim().substring(arg.indexOf(' ') + 1), {
                                from: 'auto', to: args[0]
                            }).then(n => {
                                client.reply(from, n, id)
                            }).catch(err => {
                                console.log(err)
                                client.reply(from, resMsg.error.norm, id)
                            })
                        } else {
                            client.reply(from, `Kode bahasa tidak valid`, id)
                        }
                        break

                    case 'reminder':
                    case 'remind': {
                        if (args.length === 0 && quotedMsg === null) return client.reply(from, `Kirim pesan pada waktu tertentu.\n*${prefix}remind <xdxhxm> <Text atau isinya>*\nIsi x dengan angka. Misal 1d1h1m = 1 hari lebih 1 jam lebih 1 menit\nContoh: ${prefix}remind 1h5m Jangan Lupa minum!\nBot akan kirim ulang pesan 'Jangan Lupa minum!' setelah 1 jam 5 menit.\n\n*${prefix}remind <DD/MM-hh:mm> <Text atau isinya>* utk tgl dan waktu spesifik\n*${prefix}remind <hh:mm> <Text atau isinya>* utk waktu pd hari ini\nContoh: ${prefix}remind 15/04-12:00 Jangan Lupa minum!\nBot akan kirim ulang pesan 'Jangan Lupa minum!' pada tanggal 15/04 jam 12:00 tahun sekarang. \n\nNote: waktu dalam GMT+7/WIB`, id)
                        const dd = args[0].match(/\d+(d|D)/g)
                        const hh = args[0].match(/\d+(h|H)/g)
                        const mm = args[0].match(/\d+(m|M)/g)
                        const hhmm = args[0].match(/\d{2}:\d{2}/g)
                        let DDMM = args[0].match(/\d\d?\/\d\d?/g) || [moment(t * 1000).format('DD/MM')]

                        let milis = 0
                        if (dd === null && hh === null && mm === null && hhmm === null) {
                            return client.reply(from, `Format salah! masukkan waktu`, id)
                        } else if (hhmm === null) {
                            let d = dd != null ? dd[0].replace(/d|D/g, '') : 0
                            let h = hh != null ? hh[0].replace(/h|H/g, '') : 0
                            let m = mm != null ? mm[0].replace(/m|M/g, '') : 0

                            milis = parseInt((d * 24 * 60 * 60 * 1000) + (h * 60 * 60 * 1000) + (m * 60 * 1000))
                        } else {
                            let DD = DDMM[0].replace(/\/\d\d?/g, '')
                            let MM = DDMM[0].replace(/\d\d?\//g, '')
                            milis = Date.parse(`${moment(t * 1000).format('YYYY')}-${MM}-${DD} ${hhmm[0]}:00 GMT+7`) - moment(t * 1000)
                        }
                        if (milis < 0) return client.reply(from, `Reminder untuk masa lalu? Hmm menarik...\n\nYa gabisa lah`, id)
                        if (milis >= 864000000) return client.reply(from, `Kelamaan cuy, maksimal 10 hari kedepan`, id)

                        let content = arg.trim().substring(arg.indexOf(' ') + 1)
                        if (content === '') return client.reply(from, `Format salah! Isi pesannya apa?`, id)
                        if (milis === null) return client.reply(from, `Maaf ada yang error!`, id)
                        await schedule.futureMilis(client, message, content, milis, (quotedMsg != null)).catch(e => console.log(e))
                        await client.reply(from, `Reminder for ${moment((t * 1000) + milis).format('DD/MM/YY HH:mm:ss')} sets!`, id)
                        break
                    }

                    case 'sfx': {
                        let listMsg = ''
                        sfx.forEach(n => {
                            listMsg = listMsg + '\n -> ' + n
                        })
                        if (args.length === 0) return client.reply(from, `Mengirim SFX yg tersedia: caranya langung ketik nama sfx ${listMsg}`, id)
                        if (sfx.includes(arg)) {
                            path = `./random/sfx/${arg}.mp3`
                            _id = (quotedMsg != null) ? quotedMsgObj.id : id
                            await client.sendAudio(from, path, _id).catch(err => client.reply(from, resMsg.error.norm, id).then(() => console.log(err)))
                        } else {
                            await client.reply(from, `SFX tidak tersedia`, id).catch(err => client.reply(from, resMsg.error.norm, id).then(() => console.log(err)))
                        }
                        break
                    }

                    case 'urltoimg':
                    case 'ssweb': {
                        if (args.length === 0) return client.reply(from, `Screenshot website. ${prefix}ssweb <url>`, id)
                        if (!isUrl(args[0])) return client.reply(from, `Url tidak valid`, id)
                        const path = './media/ssweb.png'
                        scraper.ssweb(browser, path, args[0]).then(async res => {
                            if (res === true) await client.sendImage(from, path, 'ssweb.png', `Captured from ${args[0]}`).catch(err => client.reply(from, resMsg.error.norm, id).then(() => console.log(err)))
                        })
                        break
                    }

                    // List creator commands
                    case 'list': {
                        if (args.length === 0) {
                            let thelist = await list.getListName(from)
                            let _what = isGroupMsg ? `Group` : `Chat`
                            let _msg
                            if (thelist === false || thelist === '') {
                                _msg = `${_what} ini belum memiliki list.`
                            } else {
                                _msg = `List yang ada di ${_what}: ${thelist.join(', ')}`
                            }
                            client.reply(from, `${_msg}\n\nMenampilkan list/daftar yang tersimpan di database bot untuk group ini.\nPenggunaan:\n-> *${prefix}list <nama list>*
                                \nUntuk membuat list gunakan perintah:\n-> *${prefix}createlist <nama list> | <Keterangan>* contoh: ${prefix}createlist tugas | Tugas PTI 17
                                \nUntuk menghapus list beserta isinya gunakan perintah:\n *${prefix}deletelist <nama list>* contoh: ${prefix}deletelist tugas
                                \nUntuk mengisi list gunakan perintah:\n-> *${prefix}addtolist <nama list> <isi>* bisa lebih dari 1 menggunakan pemisah | \ncontoh: ${prefix}addtolist tugas Matematika Bab 1 deadline 2021 | Pengantar Akuntansi Bab 2
                                \nUntuk mengedit list gunakan perintah:\n-> *${prefix}editlist <nama list> <nomor> <isi>* \ncontoh: ${prefix}editlist tugas 1 Matematika Bab 2 deadline 2021
                                \nUntuk menghapus *isi* list gunakan perintah:\n-> *${prefix}delist <nama list> <nomor isi list>*\nBisa lebih dari 1 menggunakan pemisah comma (,) contoh: ${prefix}delist tugas 1, 2, 3
                                `, id)
                        } else if (args.length > 0) {
                            let res = await list.getListData(from, args[0])
                            if (res === false) return client.reply(from, `List tidak ada, silakan buat dulu. \nGunakan perintah: *${prefix}createlist ${args[0]}* (mohon hanya gunakan 1 kata untuk nama list)`, id)
                            let desc = ''
                            if (res.desc !== 'Tidak ada') {
                                desc = `║ _${res.desc}_\n`
                            }
                            let respon = `╔══✪〘 List ${args[0].replace(/^\w/, (c) => c.toUpperCase())} 〙✪\n${desc}║\n`
                            res.listData.forEach((data, i) => {
                                respon += `║ ${i + 1}. ${data}\n`
                            })
                            respon += '║\n╚═〘 *Renge Bot* 〙'
                            await client.reply(from, respon, id)
                        }
                        break
                    }

                    case 'createlist': {
                        if (args.length === 0) return client.reply(from, `Untuk membuat list gunakan perintah: *${prefix}createlist <nama list> | <Keterangan>* contoh: ${prefix}createlist tugas | Tugas PTI 17\n(mohon hanya gunakan 1 kata untuk nama list)`, id)
                        const desc = arg.split('|')[1]?.trim() ?? 'Tidak ada'
                        const respon = await list.createList(from, args[0], desc)
                        await client.reply(from, (respon === false) ? `List ${args[0]} sudah ada, gunakan nama lain.` : `List ${args[0]} berhasil dibuat.`, id)
                        break
                    }

                    case 'deletelist': {
                        if (args.length === 0) return client.reply(from, `Untuk menghapus list beserta isinya gunakan perintah: *${prefix}deletelist <nama list>* contoh: ${prefix}deletelist tugas`, id)
                        const thelist = await list.getListName(from)
                        if (thelist.includes(args[0])) {
                            client.reply(from, `[❗] List ${args[0]} akan dihapus.\nKirim *${prefix}confirmdeletelist ${args[0]}* untuk mengonfirmasi, abaikan jika tidak jadi.`, id)
                        } else {
                            client.reply(from, `List ${args[0]} tidak ada.`, id)
                        }
                        break
                    }

                    case 'confirmdeletelist': {
                        if (args.length === 0) return null
                        const respon1 = await list.deleteList(from, args[0])
                        await client.reply(from, (respon1 === false) ? `List ${args[0]} tidak ada.` : `List ${args[0]} berhasil dihapus.`, id)
                        break
                    }

                    case 'addtolist': {
                        if (args.length === 0) return client.reply(from, `Untuk mengisi list gunakan perintah:\n *${prefix}addtolist <nama list> <isi>* Bisa lebih dari 1 menggunakan pemisah | \ncontoh: ${prefix}addtolist tugas Matematika Bab 1 deadline 2021 | Pengantar Akuntansi Bab 2`, id)
                        if (args.length === 1) return client.reply(from, `Format salah, nama dan isinya apa woy`, id)
                        const thelist1 = await list.getListName(from)
                        if (!thelist1.includes(args[0])) {
                            return client.reply(from, `List ${args[0]} tidak ditemukan.`, id)
                        } else {
                            let newlist = arg.substr(arg.indexOf(' ') + 1).split('|').map((item) => {
                                return item.trim()
                            })
                            let res = await list.addListData(from, args[0], newlist)
                            let desc = ''
                            if (res.desc !== 'Tidak ada') {
                                desc = `║ _${res.desc}_\n`
                            }
                            let respon = `╔══✪〘 List ${args[0].replace(/^\w/, (c) => c.toUpperCase())} 〙✪\n${desc}║\n`
                            res.listData.forEach((data, i) => {
                                respon += `║ ${i + 1}. ${data}\n`
                            })
                            respon += '║\n╚═〘 *Renge Bot* 〙'
                            await client.reply(from, respon, id)
                        }
                        break
                    }

                    case 'editlist': {
                        if (args.length === 0) return client.reply(from, `Untuk mengedit list gunakan perintah:\n *${prefix}editlist <nama list> <nomor> <isi>* \ncontoh: ${prefix}editlist tugas 1 Matematika Bab 2 deadline 2021`, id)
                        if (args.length < 3) return client.reply(from, `Format salah. pastikan ada namalist, index, sama isinya`, id)
                        const thelist1 = await list.getListName(from)
                        if (!thelist1.includes(args[0])) {
                            return client.reply(from, `List ${args[0]} tidak ditemukan.`, id)
                        } else {
                            let n = arg.substr(arg.indexOf(' ') + 1)
                            let newlist = n.substr(n.indexOf(' ') + 1)
                            let res = await list.editListData(from, args[0], newlist, args[1] - 1)
                            let desc = ''
                            if (res.desc !== 'Tidak ada') {
                                desc = `║ _${res.desc}_\n`
                            }
                            let respon = `╔══✪〘 List ${args[0].replace(/^\w/, (c) => c.toUpperCase())} 〙✪\n${desc}║\n`
                            res.listData.forEach((data, i) => {
                                respon += `║ ${i + 1}. ${data}\n`
                            })
                            respon += '║\n╚═〘 *Renge Bot* 〙'
                            await client.reply(from, respon, id)
                        }
                        break
                    }

                    case 'delist': {
                        if (args.length === 0) return client.reply(from, `Untuk menghapus *isi* list gunakan perintah: *${prefix}delist <nama list> <nomor isi list>*\nBisa lebih dari 1 menggunakan pemisah comma (,) contoh: ${prefix}delist tugas 1, 2, 3`, id)
                        if (args.length === 1) return client.reply(from, `Format salah, nama list dan nomor berapa woy`, id)
                        const thelist2 = await list.getListName(from)
                        if (!thelist2.includes(args[0])) {
                            return client.reply(from, `List ${args[0]} tidak ditemukan.`, id)
                        } else {
                            let number = arg.substr(arg.indexOf(' ') + 1).split(',').map((item) => {
                                return item.trim() - 1
                            })
                            await number.reverse().forEach(async (num) => {
                                await list.removeListData(from, args[0], num)
                            })
                            let res = await list.getListData(from, args[0])
                            let desc = ''
                            if (res.desc !== 'Tidak ada') {
                                desc = `║ _${res.desc}_\n`
                            }
                            let respon = `╔══✪〘 List ${args[0].replace(/^\w/, (c) => c.toUpperCase())} 〙✪\n${desc}║\n`
                            res.listData.forEach((data, i) => {
                                respon += `║ ${i + 1}. ${data}\n`
                            })
                            respon += '║\n╚═〘 *Renge Bot* 〙'
                            await client.reply(from, respon, id)
                        }
                        break
                    }

                    // Group Commands (group admin only)
                    case 'add':
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        if (!isBotGroupAdmins) return client.reply(from, resMsg.error.botAdm, id)
                        if (args.length != 1) return client.reply(from, `Untuk menggunakan ${prefix}add\nPenggunaan: ${prefix}add <nomor>\ncontoh: ${prefix}add 628xxx`, id)
                        try {
                            await client.addParticipant(from, `${args[0].replace(/\+/g, '').replace(/\s/g, '').replace(/-/g, '')}@c.us`)
                        } catch {
                            client.reply(from, 'Tidak dapat menambahkan target', id)
                        }
                        break

                    case 'kick':
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        if (!isGroupAdmins) return client.reply(from, resMsg.error.admin, id)
                        if (!isBotGroupAdmins) return client.reply(from, resMsg.error.botAdm, id)
                        if (mentionedJidList.length === 0) return client.reply(from, 'Maaf, format pesan salah.\nSilahkan tag satu atau lebih orang yang akan dikeluarkan', id)
                        if (mentionedJidList[0] === botNumber) return await client.reply(from, 'Maaf, format pesan salah.\nTidak dapat mengeluarkan akun bot sendiri', id)
                        await client.sendTextWithMentions(from, `Request diterima, mengeluarkan:\n${mentionedJidList.map(x => `@${x.replace('@c.us', '')}`).join('\n')}`)
                        for (let ment of mentionedJidList) {
                            if (groupAdmins.includes(ment)) return await client.sendText(from, 'Gagal, kamu tidak bisa mengeluarkan admin grup.')
                            await client.removeParticipant(groupId, ment)
                        }
                        break

                    case 'promote':
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        if (!isGroupAdmins) return client.reply(from, resMsg.error.admin, id)
                        if (!isBotGroupAdmins) return client.reply(from, resMsg.error.botAdm, id)
                        if (mentionedJidList.length != 1) return client.reply(from, 'Maaf, hanya bisa mempromote 1 user', id)
                        if (groupAdmins.includes(mentionedJidList[0])) return await client.reply(from, 'Maaf, user tersebut sudah menjadi admin.', id)
                        if (mentionedJidList[0] === botNumber) return await client.reply(from, 'Maaf, format pesan salah.\nTidak dapat mempromote akun bot sendiri', id)
                        await client.promoteParticipant(groupId, mentionedJidList[0])
                        await client.sendTextWithMentions(from, `Request diterima, menambahkan @${mentionedJidList[0].replace('@c.us', '')} sebagai admin.`)
                        break

                    case 'demote':
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        if (!isGroupAdmins) return client.reply(from, resMsg.error.admin, id)
                        if (!isBotGroupAdmins) return client.reply(from, resMsg.error.botAdm, id)
                        if (mentionedJidList.length != 1) return client.reply(from, 'Maaf, hanya bisa mendemote 1 user', id)
                        if (!groupAdmins.includes(mentionedJidList[0])) return await client.reply(from, 'Maaf, user tersebut belum menjadi admin.', id)
                        if (mentionedJidList[0] === botNumber) return await client.reply(from, 'Maaf, format pesan salah.\nTidak dapat mendemote akun bot sendiri', id)
                        if (mentionedJidList[0] === ownerNumber) return await client.reply(from, 'Maaf, tidak bisa mendemote owner, hahahaha', id)
                        await client.demoteParticipant(groupId, mentionedJidList[0])
                        await client.sendTextWithMentions(from, `Request diterima, menghapus jabatan @${mentionedJidList[0].replace('@c.us', '')}.`)
                        break

                    case 'yesbye': {
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        if (!isGroupAdmins) return client.reply(from, resMsg.error.admin, id)
                        await client.sendText(from, 'oh beneran ya. Gapapa aku paham...')

                        let pos = ngegas.indexOf(chatId)
                        ngegas.splice(pos, 1)
                        fs.writeFileSync('./data/ngegas.json', JSON.stringify(ngegas))

                        let posi = welcome.indexOf(chatId)
                        welcome.splice(posi, 1)
                        fs.writeFileSync('./data/welcome.json', JSON.stringify(welcome))
                        
                        setTimeout(async () => {
                            await client.leaveGroup(groupId)
                        }, 2000)
                        setTimeout(async () => {
                            await client.deleteChat(groupId)
                        }, 4000)
                    }
                        break
                    case 'bye': {
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        if (!isGroupAdmins) return client.reply(from, resMsg.error.admin, id)
                        await client.sendText(from, 'Udah gak butuh aku lagi? yaudah. kirim /yesbye untuk konfirmasi')
                        break
                    }

                    case 'del':
                        if (!quotedMsg) return client.reply(from, `Maaf, format pesan salah silahkan.\nReply pesan bot dengan caption ${prefix}del`, id)
                        if (!quotedMsgObj.fromMe) return client.reply(from, `Maaf, format pesan salah silahkan.\nReply pesan bot dengan caption ${prefix}del`, id)
                        client.simulateTyping(from, false)
                        await client.deleteMessage(from, quotedMsg.id, false).catch(err => client.reply(from, resMsg.error.norm, id).then(() => console.log(err)))
                        break

                    case 'tagall':
                    case 'alle': {
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
						if (!isGroupAdmins) return client.reply(from, 'FITUR INI HANYA BISA DIGUNAKAN OLEH ADMIN!', id)
                        const groupMem = await client.getGroupMembers(groupId)
                        if (args.length != 0) {
                            let res = `${arg}\n${readMore}`
                            for (let m of groupMem) {
                                res += `@${m.id.replace(/@c\.us/g, '')} `
                            }
                            await client.sendTextWithMentions(from, res)
                        } else {
                            let res = `╔══✪〘 Mention All 〙✪\n${readMore}`
                            for (let m of groupMem) {
                                res += `╠➥ @${m.id.replace(/@c\.us/g, '')}\n`
                            }
                            res += '╚═〘 *Renge Bot* 〙'
                            await client.sendTextWithMentions(from, res)
                        }
                        break
                    }

                    case 'tag': {
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        client.reply(from, `Feature coming soon`, id)
                        break
                    }

                    case 'antikasar': {
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        if (!isGroupAdmins) return client.reply(from, resMsg.error.admin, id)
                        if (args[0] === 'on') {
                            let pos = ngegas.indexOf(chatId)
                            if (pos != -1) return client.reply(from, 'Fitur anti kata kasar sudah aktif!', id)
                            ngegas.push(chatId)
                            fs.writeFileSync('./data/ngegas.json', JSON.stringify(ngegas))
                            client.reply(from, 'Fitur Anti Kasar sudah di Aktifkan', id)
                        } else if (args[0] === 'off') {
                            let pos = ngegas.indexOf(chatId)
                            if (pos === -1) return client.reply(from, 'Fitur anti kata memang belum aktif!', id)
                            ngegas.splice(pos, 1)
                            fs.writeFileSync('./data/ngegas.json', JSON.stringify(ngegas))
                            client.reply(from, 'Fitur Anti Kasar sudah di non-Aktifkan', id)
                        } else {
                            client.reply(from, `Untuk mengaktifkan Fitur Kata Kasar pada Group Chat\n\nApasih kegunaan Fitur Ini? Apabila seseorang mengucapkan kata kasar akan mendapatkan denda\n\nPenggunaan\n${prefix}antikasar on --mengaktifkan\n${prefix}antikasar off --nonaktifkan\n\n${prefix}reset --reset jumlah denda`, id)
                        }
                        break
                    }


                    case 'addkasar': {
                        if (!isOwnerBot) return client.reply(from, resMsg.error.owner, id)
                        if (args.length != 1) { return client.reply(from, `Masukkan hanya satu kata untuk ditambahkan kedalam daftar kata kasar.\ncontoh ${prefix}addkasar jancuk`, id) }
                        else {
                            if (kataKasar.indexOf(args[0]) != -1) return client.reply(from, `Kata ${args[0]} sudah ada.`, id)
                            kataKasar.push(args[0])
                            fs.writeFileSync('./settings/katakasar.json', JSON.stringify(kataKasar))
                            cariKasar = requireUncached('./lib/kataKotor.js')
                            client.reply(from, `Kata ${args[0]} berhasil ditambahkan.`, id)
                        }
                        break
                    }

                    case 'reset': {
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        if (!isGroupAdmins) return client.reply(from, resMsg.error.admin, id)
                        const reset = db.get('group').find({ id: groupId }).assign({ members: [] }).write()
                        if (reset) {
                            await client.sendText(from, "Klasemen telah direset.")
                        }
                        break
                    }

                    case 'antilinkgroup': {
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        if (!isGroupAdmins) return client.reply(from, resMsg.error.admin, id)
                        if (!isBotGroupAdmins) return client.reply(from, resMsg.error.botAdm, id)
                        if (args[0] === 'on') {
                            let pos = antiLinkGroup.indexOf(chatId)
                            if (pos != -1) return client.reply(from, 'Fitur anti link group sudah aktif!', id)
                            antiLinkGroup.push(chatId)
                            fs.writeFileSync('./data/antilinkgroup.json', JSON.stringify(antiLinkGroup))
                            client.reply(from, 'Fitur anti link group sudah di Aktifkan', id)
                        } else if (args[0] === 'off') {
                            let pos = antiLinkGroup.indexOf(chatId)
                            if (pos === -1) return client.reply(from, 'Fitur anti link group memang belum aktif!', id)
                            antiLinkGroup.splice(pos, 1)
                            fs.writeFileSync('./data/antilinkgroup.json', JSON.stringify(antiLinkGroup))
                            client.reply(from, 'Fitur anti link group sudah di non-Aktifkan', id)
                        } else {
                            client.reply(from, `Untuk mengaktifkan Fitur anti link group pada Group Chat\n\nApasih kegunaan Fitur Ini? Apabila seseorang mengirimkan link group lain maka akan terkick otomatis\n\nPenggunaan\n${prefix}antilinkgroup on --mengaktifkan\n${prefix}antilinkgroup off --nonaktifkan`, id)
                        }
                        break
                    }

                    case 'mutegrup': {
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        if (!isGroupAdmins) return client.reply(from, resMsg.error.admin, id)
                        if (!isBotGroupAdmins) return client.reply(from, resMsg.error.botAdm, id)
                        if (args.length != 1) return client.reply(from, `Untuk mengubah settingan group chat agar hanya admin saja yang bisa chat\n\nPenggunaan:\n${prefix}mutegrup on --aktifkan\n${prefix}mutegrup off --nonaktifkan`, id)
                        if (args[0] == 'on') {
                            client.setGroupToAdminsOnly(groupId, true).then(() => client.sendText(from, 'Berhasil mengubah agar hanya admin yang dapat chat!'))
                        } else if (args[0] == 'off') {
                            client.setGroupToAdminsOnly(groupId, false).then(() => client.sendText(from, 'Berhasil mengubah agar semua anggota dapat chat!'))
                        } else {
                            client.reply(from, `Untuk mengubah settingan group chat agar hanya admin saja yang bisa chat\n\nPenggunaan:\n${prefix}mutegrup on --aktifkan\n${prefix}mutegrup off --nonaktifkan`, id)
                        }
                        break
                    }

                    case 'setprofile': {
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        if (!isGroupAdmins) return client.reply(from, resMsg.error.admin, id)
                        if (!isBotGroupAdmins) return client.reply(from, resMsg.error.botAdm, id)
                        if (isMedia && type == 'image' || isQuotedImage) {
                            let dataMedia = isQuotedImage ? quotedMsg : message
                            let _mimetype = dataMedia.mimetype
                            let mediaData = await decryptMedia(dataMedia)
                            let imageBase64 = `data:${_mimetype};base64,${mediaData.toString('base64')}`
                            await client.setGroupIcon(groupId, imageBase64)
                        } else if (args.length === 1) {
                            if (!isUrl(url)) { await client.reply(from, 'Maaf, link yang kamu kirim tidak valid.', id) }
                            client.setGroupIconByUrl(groupId, url).then((r) => (!r && r != undefined)
                                ? client.reply(from, 'Maaf, link yang kamu kirim tidak memuat gambar.', id)
                                : client.reply(from, 'Berhasil mengubah profile group', id))
                        } else {
                            client.reply(from, `Commands ini digunakan untuk mengganti icon/profile group chat\n\n\nPenggunaan:\n1. Silahkan kirim/reply sebuah gambar dengan caption ${prefix}setprofile\n\n2. Silahkan ketik ${prefix}setprofile linkImage`)
                        }
                        break
                    }

                    case 'welcome':
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        //if (!isGroupAdmins) return client.reply(from, resMsg.error.admin, id)
                        if (!isBotGroupAdmins) return client.reply(from, resMsg.error.botAdm, id)
                        if (args.length != 1) return client.reply(from, `Membuat BOT menyapa member yang baru join kedalam group chat!\n\nPenggunaan:\n${prefix}welcome on --aktifkan\n${prefix}welcome off --nonaktifkan`, id)
                        if (args[0] == 'on') {
                            welcome.push(chatId)
                            fs.writeFileSync('./data/welcome.json', JSON.stringify(welcome))
                            client.reply(from, 'Welcome Message sekarang diaktifkan!', id)
                        } else if (args[0] == 'off') {
                            let posi = welcome.indexOf(chatId)
                            welcome.splice(posi, 1)
                            fs.writeFileSync('./data/welcome.json', JSON.stringify(welcome))
                            client.reply(from, 'Welcome Message sekarang dinonaktifkan', id)
                        } else {
                            client.reply(from, `Membuat BOT menyapa member yang baru join kedalam group chat!\n\nPenggunaan:\n${prefix}welcome on --aktifkan\n${prefix}welcome off --nonaktifkan`, id)
                        }
                        break

                    //Owner Group
                    case 'kickall': //mengeluarkan semua member
                        if (!isGroupMsg) return client.reply(from, resMsg.error.group, id)
                        let isOwner = chat.groupMetadata.owner == pengirim
                        if (!isOwner) return client.reply(from, 'Maaf, perintah ini hanya dapat dipakai oleh owner grup!', id)
                        if (!isBotGroupAdmins) return client.reply(from, resMsg.error.botAdm, id)
                        const allMem = await client.getGroupMembers(groupId)
                        for (let m of allMem) {
                            if (groupAdmins.includes(m.id)) {
                            } else {
                                await client.removeParticipant(groupId, m.id)
                            }
                        }
                        client.reply(from, 'Success kick all member', id)
                        break

                    //Owner Bot
                    case 'ban': {
                        if (!isOwnerBot) return client.reply(from, 'Perintah ini hanya bisa di gunakan oleh Owner Renge!', id)
					    for (let i = 0; i < mentionedJidList.length; i++) {
			            banned.push(mentionedJidList[i])
			            fs.writeFileSync('./lib/banned.json', JSON.stringify(banned))
					    client.reply(from, 'Succes ban target!',id)
						}
						 break
                    }

                    case 'unban': {
                        if (!isOwnerBot) return client.reply(from, 'Perintah ini hanya bisa di gunakan oleh admin Renge!', id)
						let inz = banned.indexOf(mentionedJidList[0])
						banned.splice(inz, 1)
						fs.writeFileSync('./lib/banned.json', JSON.stringify(banned))
						client.reply(from, 'Unbanned User!', id)
                        break
					}
					
                    case 'bc': //untuk broadcast atau promosi
                        if (!isOwnerBot) return client.reply(from, resMsg.error.owner, id)
                        bctxt = body.slice(4)
                        txtbc = `${bctxt}\n\n【RENGE BROADCAST】`
                        const semuagrup = await client.getAllChatIds();
                        if(quotedMsg && quotedMsg.type == 'image'){
                        const mediaData = await decryptMedia(quotedMsg)
                        const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
                        for(let grupnya of semuagrup){
                        var cekgrup = await client.getChatById(grupnya)
                        if(!cekgrup.isReadOnly) client.sendImage(grupnya, imageBase64, 'gambar.jpeg', txtbc)
                        }
                        client.reply(from, `Broadcast sukses total ${semuagrup.length}!`,  id)
                      }else{
                        for(let grupnya of semuagrup){
                        var cekgrup = await client.getChatById(grupnya)
                        if(!cekgrup.isReadOnly) client.sendText(grupnya, txtbc)
                          }
                         client.reply(from, `Broadcast sukses total ${semuagrup.length}!`,  id)
                        }
                         break
                    case 'leaveall': //mengeluarkan bot dari semua group serta menghapus chatnya
                        if (!isOwnerBot) return client.reply(from, resMsg.error.owner, id)
                        const allGroupz = await client.getAllGroups()
                        for (let gclist of allGroupz) {
                            setTimeout(() => {
                                client.sendText(gclist.contact.id, `Maaf bot sedang pembersihan, total chat aktif : ${allGroupz.length}. Invite dalam *beberapa menit* kemudian!`)
                                client.leaveGroup(gclist.contact.id)
                                client.deleteChat(gclist.contact.id)
                            }, 1000)
                        }
                        client.reply(from, `Processed to leave all group! Total: ${allGroupz.length}`, id)
                        break

                    case 'clearexitedgroup': //menghapus group yang sudah keluar
                        if (!isOwnerBot) return client.reply(from, resMsg.error.owner, id)
                        const allGroupzs = await client.getAllGroups()
                        for (let gc of allGroupzs) {
                            setTimeout(() => {
                                if (gc.isReadOnly || !gc.canSend) {
                                    client.deleteChat(gc.id)
                                }
                            }, 1000)
                        }
                        client.reply(from, 'Processed to clear all exited group!', id)
                        break

                    case 'deleteall': //menghapus seluruh pesan diakun bot
                        if (!isOwnerBot) return client.reply(from, resMsg.error.owner, id)
                        const allChatx = await client.getAllChats()
                        for (let dchat of allChatx) {
                            setTimeout(() => {
                                client.deleteChat(dchat.id)
                            }, 1000)
                        }
                        client.reply(from, 'Processed to delete all chat!', id)
                        break

                    case 'clearall': //menghapus seluruh pesan tanpa menghapus chat diakun bot
                        if (!isOwnerBot) return client.reply(from, resMsg.error.owner, id)
                        const allChatxy = await client.getAllChats()
                        for (let dchat of allChatxy) {
                            setTimeout(() => {
                                client.clearChat(dchat.id)
                            }, 1000)
                        }
                        client.reply(from, 'Processed to clear all chat!', id)
                        break

                    case 'clearpm': //menghapus seluruh pesan diakun bot selain group
                        if (!isOwnerBot) return client.reply(from, resMsg.error.owner, id)
                        const allChat1 = await client.getAllChats()
                        for (let dchat of allChat1) {
                            setTimeout(() => {
                                if (!dchat.isGroup) client.deleteChat(dchat.id)
                            }, 1000)
                        }
                        client.reply(from, 'Processed to clear all private chat!', id)
                        break

                    case 'refresh':
                        if (!isOwnerBot) return client.reply(from, resMsg.error.owner, id)
                        await client.reply(from, `Refreshing web whatsapp page!`, id)
                        setTimeout(() => {
                            try {
                                client.refresh().then(async () => {
                                    console.log(`Bot refreshed!`)
                                    client.reply(from, `Bot refreshed!`, id)
                                })
                            } catch (err) {
                                console.log(color('[ERROR]', 'red'), err)
                            }
                        }, 2000)
                        break

                    case 'restart': {
                        if (!isOwnerBot) return client.reply(from, resMsg.error.owner, id)
                        client.reply(from, `Server bot akan direstart!`, id)
                        const { spawn } = require('child_process')
                        spawn('restart.cmd')
                        break
                    }
                    
                    case 'u':
                    case 'unblock': {
                        if (!isOwnerBot) return client.reply(from, resMsg.error.owner, id)
                        if (args.length === 0) return client.reply(from, `Untuk unblock kontak, ${prefix}unblock 628xxx`, id)
                        await client.contactUnblock(`${arg.replace(/\+/g, '').replace(/\s/g, '').replace(/-/g, '')}@c.us`).then((n) => {
                            if (n) return client.reply(from, `Berhasil unblock ${arg}.`, id)
                            else client.reply(from, `Nomor ${arg} tidak terdaftar.`, id)
                        }).catch(e => {
                            console.log(e)
                            client.reply(from, resMsg.error.norm, id)
                        })
                        break
                    }

                    case '>':
                        if (!isOwnerBot) return client.reply(from, resMsg.error.owner, id)
                        try {
                            eval(`(async() => {
                                ${arg}    
                            })()`)
                        } catch (e) {
                            console.log(e)
                            await client.sendText(from, `${e.name}: ${e.message}`)
                        }
                        client.simulateTyping(from, false)
                        break

                    case 'shell':
                    case '=': {
                        if (!isOwnerBot) return client.reply(from, resMsg.error.owner, id)
                        const { exec } = require('child_process')
                        exec(arg, (err, stdout, stderr) => {
                            if (err) {
                                //some err occurred
                                console.error(err)
                            } else {
                                // the *entire* stdout and stderr (buffered)
                                client.sendText(from, stdout + stderr)
                                console.log(`stdout: ${stdout}`)
                                console.log(`stderr: ${stderr}`)
                            }
                        })
                        client.simulateTyping(from, false)
                        break
                    }

                    default:
                        await client.reply(from, `Perintah tidak ditemukan.\n${prefix}menu untuk melihat daftar perintah!`, id)
                        break

                }

            })//typing
        }
        
        // Anti link group function
        if (isAntiLinkGroup && isGroupMsg && type !== 'sticker'){
            if (message.body?.match(/chat\.whatsapp\.com/gi) !== null) {
                if (!isBotGroupAdmins) return client.sendText(from, 'Gagal melakukan kick, bot bukan admin')
                console.log(color('[LOGS]', 'grey'), `Group link detected, kicking sender...`)
                client.reply(from, `Link group whatsapp terdeteksi! Auto kick...`, id)
                setTimeout(async () => {
                    await client.removeParticipant(groupId, pengirim)
                }, 2000)
            }
        }

        // Kata kasar function
        if (!isCmd && isGroupMsg && isNgegas && chat.type !== "image" && isKasar) {
            const _denda = _.sample([1000, 2000, 3000, 5000, 10000])
            const find = db.get('group').find({ id: groupId }).value()
            if (find && find.id === groupId) {
                const cekuser = db.get('group').filter({ id: groupId }).map('members').value()[0]
                const isIn = inArray(pengirim, cekuser)
                if (cekuser && isIn !== -1) {
                    const denda = db.get('group').filter({ id: groupId }).map('members[' + isIn + ']').find({ id: pengirim }).update('denda', n => n + _denda).write()
                    if (denda) {
                        await client.reply(from, `${resMsg.badw}\n\nDenda +${_denda}\nTotal : Rp` + formatin(denda.denda), id)
                        if (denda.denda >= 2000000) {
                            banned.push(pengirim)
                            fs.writeFileSync('./data/banned.json', JSON.stringify(banned))
                            client.reply(from, `╔══✪〘 SELAMAT 〙✪\n║\n║ Anda telah dibanned oleh bot.\n║ Karena denda anda melebihi 2 Juta.\n║ Mampos~\n║\n║ Denda -2.000.000\n║\n╚═〘 Renge Bot 〙`, id)
                            db.get('group').filter({ id: groupId }).map('members[' + isIn + ']').find({ id: pengirim }).update('denda', n => n - 2000000).write()
                        }
                    }
                } else {
                    const cekMember = db.get('group').filter({ id: groupId }).map('members').value()[0]
                    if (cekMember.length === 0) {
                        db.get('group').find({ id: groupId }).set('members', [{ id: pengirim, denda: _denda }]).write()
                    } else {
                        const cekuser = db.get('group').filter({ id: groupId }).map('members').value()[0]
                        cekuser.push({ id: pengirim, denda: _denda })
                        await client.reply(from, `${resMsg.badw}\n\nDenda +${_denda}`, id)
                        db.get('group').find({ id: groupId }).set('members', cekuser).write()
                    }
                }
            } else {
                db.get('group').push({ id: groupId, members: [{ id: pengirim, denda: _denda }] }).write()
                await client.reply(from, `${resMsg.badw}\n\nDenda +${_denda}\nTotal : Rp${_denda}`, id)
            }
        }
    } catch (err) {
        console.log(color('[ERR>]', 'red'), err)
    }
}

module.exports = { HandleMsg, reCacheModule }
