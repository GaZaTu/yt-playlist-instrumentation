// Modules to control application life and create native browser window
const { app, session, ipcMain, BrowserWindow } = require('electron')
const { ElectronBlocker } = require('@cliqz/adblocker-electron')
const createContextMenu = require('electron-context-menu')
const { default: fetch } = require('node-fetch')
const { TwitchIrcBot } = require('./lib/twitch')
const config = require('config')

const resolveYTVideo = async (url) => {
  if (!url) {
    return undefined
  }

  if (url.startsWith('/watch')) {
    url = `https://youtube.com${url}`
  }

  if (!url.startsWith('http')) {
    url = `https://youtube.com/watch?v=${url}`
  }

  const noembedUrl = `https://noembed.com/embed?url=${url}`
  const response = await fetch(noembedUrl)
    .then(r => r.json())

  if (response.error !== undefined) {
    return undefined
  }

  const regex = /https:\/\/www\.youtube\.com\/embed\/([^?]+)/
  const match = regex.exec(response.html)

  if (!match) {
    return undefined
  }

  return {
    ytID: match[1],
    channel: response.author_name,
    title: response.title,
  }
}

const QUEUE = [
  {
    ytID: 'ke5TOxeEL8Q',
    title: `Obama On Fireー☆`,
    channel: 'MikamiIsAJerk',
    requestedBy: 'your mom',
    sent: false,
    done: false,
  },
]

const getNextInMyYTPlaylist = () => {
  const next = QUEUE.find(e => !e.sent)
  if (next) {
    next.sent = true
  }

  return Promise.resolve(next)
}

const finishCurrentInMyYTPlaylist = () => {
  const current = QUEUE.find(e => !e.done)
  if (current) {
    current.done = true
  }

  return Promise.resolve(undefined)
}

const createWindow = async () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 850,
    height: 680,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      nodeIntegrationInSubFrames: true,
      preload: `${__dirname}/preload.js`,
    },
    autoHideMenuBar: true,
    resizable: false,
  })

  const metadata = {
    /** @type {any} */
    current: undefined,
    /** @type {any} */
    next: undefined,
  }

  ipcMain.on('log', (event, ...args) => {
    console.log(...args)
  })

  ipcMain.on('login', async (event) => {
    metadata.current = await getNextInMyYTPlaylist()
    if (!metadata.current?.ytID) {
      metadata.current = {
        ytID: 'ke5TOxeEL8Q',
        title: 'Obama On Fireー☆',
        channel: 'MikamiIsAJerk',
        requestedBy: 'your mom',
      }
    }

    metadata.next = await getNextInMyYTPlaylist()
    if (!metadata.next?.ytID) {
      metadata.next = undefined
    }

    const firstUrl = `https://www.youtube.com/watch?v=${metadata.current?.ytID}`
    await mainWindow.loadURL(firstUrl)
  })

  ipcMain.handle('getNextInQueue', async () => {
    metadata.current = metadata.next
    metadata.next = await getNextInMyYTPlaylist()

    if (!metadata.next?.ytID) {
      metadata.next = undefined
    }

    return metadata.next
  })

  ipcMain.on('getNextInQueueSync', (event) => {
    event.returnValue = metadata.next
  })

  ipcMain.handle('getCurrentInQueue', async () => {
    return metadata.current
  })

  ipcMain.on('emptied', async (event, current) => {
    await finishCurrentInMyYTPlaylist(current)
  })

  // await mainWindow.loadFile(`${__dirname}/login.html`)
  // await mainWindow.loadURL('https://gazatu.xyz/login')
  await mainWindow.loadURL(`https://www.youtube.com`)
  ipcMain.emit('login', undefined)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  const bot = new TwitchIrcBot()

  bot
    .on('connect')
    .subscribe(async () => {
      if (config.has('nick') && config.has('pass')) {
        await bot.login(config.get('nick'), config.get('pass'))
      } else {
        await bot.loginAnon()
      }

      await bot.reqCap('commands')
      await bot.reqCap('membership')
      await bot.reqCap('tags')

      await bot.join(config.get('channel'))
    })

  bot.connect()

  bot.command(/^!sr\s+(\S+)$/)
    .subscribe(async req => {
      const byUser = QUEUE
        .filter(r => r.sent === false && r.done === false && r.requestedBy === req.usr)

      if (byUser.length > 3) {
        if (config.has('nick')) {
          await req.reply(`you have too many active requests in queue`)
        }

        return
      }

      const video = await resolveYTVideo(req.match[1])

      QUEUE.push({
        ...video,
        requestedBy: req.usr,
        sent: false,
        done: false,
      })

      const tbd = QUEUE
        .filter(r => r.sent === false && r.done === false)

      if (config.has('nick')) {
        await req.reply(`you successfully requested "${video.title}", spot in queue: #${tbd.length + 1}`)
      }
    })

  bot.command(/^!(playing|song)/)
    .subscribe(async req => {
      if (config.has('nick')) {
        if (metadata.current) {
          await req.reply(`currently playing "${metadata.current.title}" https://www.youtube.com/watch?v=${metadata.current.ytID}`)
        } else {
          await req.reply(`not currently playing anything (or youtube autoplay)`)
        }
      }
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  const adBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
  adBlocker.enableBlockingInSession(session.defaultSession)

  createContextMenu()
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
