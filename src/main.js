// Modules to control application life and create native browser window
const { app, session, ipcMain, BrowserWindow } = require('electron')
const { ElectronBlocker } = require('@cliqz/adblocker-electron')
const createContextMenu = require('electron-context-menu')
const { default: fetch } = require('node-fetch')
const ProxyAgent = require('proxy-agent')
const { TwitchIrcBot } = require('./lib/twitch')
const config = require('config')

const HTTP_PROXY = process.env.HTTP_PROXY
const httpProxyAgent = HTTP_PROXY && new ProxyAgent(HTTP_PROXY)

/** @type {typeof fetch} */
const fetchWithSystemProxy = (url, init) =>
  fetch(url, {
    agent: httpProxyAgent,
    ...init,
  })

// if (process.platform === 'linux') {
//   app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder')
//   app.commandLine.appendSwitch('enable-gpu-rasterization')
// }

/**
 * @param {RequestInit} [init]
 * @returns
 */
const createFetchGraphQL = (init) => {
  /**
   * @param {string} query
   * @param {object} [variables]
   * @returns {Promise<object>}
   */
  return (query, variables) => {
    const url = `https://api.gazatu.xyz/graphql`
    const config = {
      ...init,
      mode: 'cors',
      method: 'POST',
      headers: {
        ...init?.headers,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    }

    return fetchWithSystemProxy(url, config)
      .then(r => r.json())
  }
}

let fetchGraphQL = createFetchGraphQL()

const getNextInMyYTPlaylistQuery = `
query {
  getNextInMyYTPlaylist {
    ytID
    title
    channel
    requestedBy
  }
}
`
const getNextInMyYTPlaylist = () => {
  return fetchGraphQL(getNextInMyYTPlaylistQuery)
    .then(r => r.getNextInMyYTPlaylist)
}

const finishCurrentInMyYTPlaylistMutation = `
mutation {
  finishCurrentInMyYTPlaylist { }
}
`
const finishCurrentInMyYTPlaylist = (find) => {
  if (!find) {
    return
  }

  return fetchGraphQL(finishCurrentInMyYTPlaylistMutation)
    .then(r => r.finishCurrentInMyYTPlaylist)
}

const createWindow = async () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    // title: 'YT-Playlist-Instrumentor',
    // icon: '',
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

  ipcMain.on('login', async (event, authToken) => {
    fetchGraphQL = createFetchGraphQL({
      headers: {
        'authorization': `Bearer ${authToken}`,
      },
    })

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
  await mainWindow.loadURL('https://gazatu.xyz/login')

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

  bot.command(/^!sr$/)
    .subscribe(req => req.send('FML'))
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await session.defaultSession.setProxy({
    proxyRules: HTTP_PROXY,
  })

  const adBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetchWithSystemProxy)
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
