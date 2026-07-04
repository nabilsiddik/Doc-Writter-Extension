// import type { PlasmoCSConfig } from "plasmo"

// export const config: PlasmoCSConfig = {
//   matches: [
//     "http://localhost:3000/*",
//     "https://assignment-writer-app.vercel.app/*"
//   ]
// }

// const myExtensionId = chrome.runtime.id

// const broadcastId = () => {
//   const event = new CustomEvent("AICANDY_SEND_ID", {
//     detail: { id: myExtensionId }
//   })
//   document.dispatchEvent(event)
// }

// document.addEventListener("AICANDY_PING_EXT", () => {
//   broadcastId()
// })

// document.addEventListener("AICANDY_PING_EXT", () => {
//   broadcastId()
// })

import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "http://localhost:3000/*",
    "https://assignment-writer-app.vercel.app/*"
  ]
}

const myExtensionId = chrome.runtime.id

const injectIdToDOM = () => {
  // 1. Write to an attribute on the <html> tag (Persistent)
  document.documentElement.setAttribute(
    "data-aicandy-extension-id",
    myExtensionId
  )

  // 2. Also shout the event for immediate detection
  const event = new CustomEvent("AICANDY_SEND_ID", {
    detail: { id: myExtensionId }
  })
  document.dispatchEvent(event)
}

// Run immediately
injectIdToDOM()

// Also listen for pings from the website
document.addEventListener("AICANDY_PING_EXT", injectIdToDOM)
