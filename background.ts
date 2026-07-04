import browser from "webextension-polyfill"

browser.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    if (message.type === "AUTH_TOKEN") {
      browser.storage.local.set({ token: message.token }).then(() => {
        sendResponse({ success: true, message: "Token stored in extension" })
      })
      return true
    }

    if (message.type === "LOGOUT_EVENT") {
      browser.storage.local.remove("token").then(() => {
        sendResponse({ success: true })
      })
    }
    return true
  }
)

browser.runtime.onMessage.addListener(async (request) => {
  if (request.type === "GENERATE_PRODUCT") {
    const { token, payload } = request
    try {
      const response = await fetch(
        `${process.env.PLASMO_PUBLIC_SERVER_URL}/document/generate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            docType: "PRODUCT_DESC",
            topic: payload.topic,
            prompt: payload.scrapedContent,
            metadata: { regularPrice: payload.price }
          })
        }
      )
      const data = await response.json()
      return data
    } catch (error) {
      return { success: false, message: "Server connection failed" }
    }
  }
})
