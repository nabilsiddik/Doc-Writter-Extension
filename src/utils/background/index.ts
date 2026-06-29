import browser from "webextension-polyfill"

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
      return await response.json()
    } catch (error) {
      return { success: false, message: "Server connection failed" }
    }
  }
})
