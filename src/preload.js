const { ipcRenderer } = require('electron')
const poll = require('./lib/poll')

/**
 * @param {number} ms
 */
const timeout = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * @param {any} next
 * @param {{ ytID: string, title?: string, channel?: string, duration?: string }} [modification]
 */
const modifyYTNextData = (next, modification) => {
  if (!modification) {
    return
  }

  const {
    ytID,
    title = 'unknown',
    channel = 'unknown',
    duration = 'unknown',
  } = modification

  try {
    const autoplayVideo = next.contents.twoColumnWatchNextResults.autoplay.autoplay.sets[0].autoplayVideo
    try {
      autoplayVideo.commandMetadata.webCommandMetadata.url = `/watch?v=${ytID}`
    } catch {}
    try {
      autoplayVideo.watchEndpoint.videoId = ytID
    } catch {}
  } catch {}

  try {
    next.playerOverlays.playerOverlayRenderer.autoplay ||= {}
    next.playerOverlays.playerOverlayRenderer.autoplay.playerOverlayAutoplayRenderer ||= {}
    const autoplayRenderer = next.playerOverlays.playerOverlayRenderer.autoplay.playerOverlayAutoplayRenderer
    try {
      const autoplayVideoTitle = autoplayRenderer.videoTitle = autoplayRenderer.videoTitle || {}
      try {
        autoplayVideoTitle.simpleText = title
      } catch {}
      try {
        autoplayVideoTitle.accessibility.accessibilityData.label = title
      } catch {}
    } catch {}

    try {
      autoplayRenderer.nextButton ||= {}
      autoplayRenderer.nextButton.buttonRenderer ||= {}
      autoplayRenderer.nextButton.buttonRenderer.navigationEndpoint ||= {}
      const autoplayEndpoint = autoplayRenderer.nextButton.buttonRenderer.navigationEndpoint
      try {
        autoplayEndpoint.commandMetadata ||= {}
        autoplayEndpoint.commandMetadata.webCommandMetadata ||= {}
        autoplayEndpoint.commandMetadata.webCommandMetadata.url = `/watch?v=${ytID}`
      } catch {}
      try {
        autoplayEndpoint.watchEndpoint.videoId = ytID
      } catch {}
    } catch {}

    try {
      autoplayRenderer.byline.runs[0].text = channel
    } catch {}

    try {
      autoplayRenderer.background.thumbnails = []
    } catch {}

    try {
      autoplayRenderer.thumbnailOverlays = []
    } catch {}

    try {
      autoplayRenderer.videoId = ytID
    } catch {}

    try {
      autoplayRenderer.publishedTimeText.simpleText = ''
    } catch {}
  } catch {}
}

const nativeFetch = window.fetch
window.fetch = async (...args) => {
  const response = await nativeFetch(...args)

  if (response.url.startsWith('https://www.youtube.com/youtubei/v1/next')) {
    let getText = response.text.bind(response)
    let getJson = response.json.bind(response)

    const text = async () => {
      getJson = async () => {
        const text = await getText()
        return JSON.parse(text)
      }

      return JSON.stringify(await json())
    }

    const json = async () => {
      const json = window.ytInitialData = await getJson()
      const next = await ipcRenderer.invoke('getNextInQueue')

      modifyYTNextData(json, next)

      return json
    }

    return Object.assign(response, {
      text,
      json,
    })
  }

  return response
}

const YT_VIDEO_SELECTOR = 'video'

const YT_NEXT_BUTTON_SELECTOR = '.ytp-next-button'
const YT_SIZE_BUTTON_SELECTOR = '.ytp-size-button'

const YT_PLAYER_THEATER_CONTAINER_SELECTOR = '#player-theater-container'
const YT_PRIMARY_INNER_SELECTOR = '#primary-inner'

const YT_SECONDARY_SELECTOR = '#secondary'
const YT_MENU_SELECTOR = '#menu-container.ytd-video-primary-info-renderer'
const YT_METADATA_SELECTOR = '#meta'
const YT_COMMENTS_SELECTOR = '#comments'
const YT_RELATED_SELECTOR = '#primary-inner > #related'

const YT_GUIDE_SELECTOR = '#guide-button'
const YT_SEARCH_SELECTOR = '#center'

const removeUnusedYTElements = async () => {
  const selectors = [
    YT_SECONDARY_SELECTOR,
    YT_MENU_SELECTOR,
    YT_METADATA_SELECTOR,
    YT_COMMENTS_SELECTOR,
    YT_RELATED_SELECTOR,
    YT_GUIDE_SELECTOR,
    YT_SEARCH_SELECTOR,
  ]

  const elements = await Promise.all(
    selectors
      .map(s => (
        poll(() => document.querySelector(s), 100, 2500)
          .catch(() => undefined)
      ))
  )

  for (const element of elements) {
    element?.remove()
  }
}

/**
 * @param {boolean} enable
 */
const enableTheaterMode = (enable) => {
  document.body.style.overflowY = 'overlay'

  /** @type {HTMLDivElement} */
  const ytPlayerTheaterContainer = document.querySelector(YT_PLAYER_THEATER_CONTAINER_SELECTOR)
  /** @type {HTMLButtonElement} */
  const ytSizeButton = document.querySelector(YT_SIZE_BUTTON_SELECTOR)

  if (ytPlayerTheaterContainer.hasChildNodes() !== enable) {
    ytSizeButton.click()
  }
}

const loadAndShowMetadata = async () => {
  const YTI_METADATA_ID = 'yti-metadata'

  /** @type {HTMLParagraphElement} */
  let metadata = document.querySelector(`#${YTI_METADATA_ID}`)
  if (!metadata) {
    metadata = document.createElement('p')
    metadata.id = YTI_METADATA_ID
    metadata.style.color = 'var(--yt-spec-text-primary)'
    metadata.style.fontSize = '14px'
    metadata.style.fontStyle = 'italic'
    metadata.style.padding = '.25rem'

    /** @type {HTMLDivElement} */
    const primaryInner = document.querySelector(YT_PRIMARY_INNER_SELECTOR)
    primaryInner.append(metadata)
  }

  window.currentVideo = await ipcRenderer.invoke('getCurrentInQueue')

  if (window.currentVideo) {
    metadata.textContent = `Video requested by: ${window.currentVideo.requestedBy}`
  } else {
    metadata.textContent = ``
  }
}

window.addEventListener('DOMContentLoaded', () => {
  /** @type {HTMLVideoElement} */
  const ytVideo = document.querySelector(YT_VIDEO_SELECTOR)
  if (!ytVideo) {
    return
  }

  ytVideo.addEventListener('loadeddata', async () => {
    enableTheaterMode(true)

    loadAndShowMetadata()
  })

  ytVideo.addEventListener('emptied', () => {
    enableTheaterMode(false)

    ipcRenderer.send('emptied', window.currentVideo)

    setTimeout(() => {
      if (!ytVideo.src) {
        document.querySelector('.ytp-next-button').click()
      }
    }, 5000)
  })

  const json = window.ytInitialData
  const next = ipcRenderer.sendSync('getNextInQueueSync')

  modifyYTNextData(json, next)
})

window.addEventListener('load', async () => {
  /** @type {HTMLVideoElement} */
  const ytVideo = document.querySelector(YT_VIDEO_SELECTOR)
  if (!ytVideo) {
    return
  }

  removeUnusedYTElements()

  await timeout(1000)

  enableTheaterMode(true)

  loadAndShowMetadata()
})

window.addEventListener('DOMContentLoaded', async () => {
  /** @type {HTMLDivElement} */
  const title = document.querySelector('title')
  if (title.textContent !== 'gazatu.xyz') {
    return
  }

  document.documentElement.style.overflowY = 'overlay'

  const authStr = await poll(() => localStorage.getItem('@@AUTH/LOGIN'), 250)
  const authData = JSON.parse(authStr)

  ipcRenderer.send('login', authData.token)
})
