import browser from "webextension-polyfill"

browser.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    console.log(message, "message")
    if (message.type === "AUTH_TOKEN") {
      browser.storage.local.set({ token: message.token }).then(() => {
        sendResponse({ success: true, message: "Token stored in extension" })
      })
      return true
    }

    if (message.type === "LOGOUT_EVENT") {
      browser.storage.local.remove("token").then(() => {
        console.log("Extension: Token cleared via Website Logout")
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
        "http://localhost:5000/api/v1/document/generate-content",
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
