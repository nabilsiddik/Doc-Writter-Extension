import type { PlasmoCSConfig } from "plasmo"
import { useEffect } from "react"
import browser from "webextension-polyfill"

export const config: PlasmoCSConfig = {
  matches: [
    "https://www.amazon.com/*",
    "https://www.daraz.com.bd/*",
    "https://daraz.com.bd/*"
  ]
}

const Injector = () => {
  useEffect(() => {
    const injectUI = () => {
      // 1. THESE ARE THE MOST STABLE SELECTORS IN 2024
      const selectors = [
        // Amazon: Every search result item has a data-asin attribute
        'div[data-component-type="s-search-result"]',
        'div.s-result-item[data-asin]:not([data-asin=""])',

        // Daraz: Items are wrapped in grid columns with specific locators
        'div[data-qa-locator="product-item"]',
        ".ant-col-5", // Standard Daraz grid
        ".ant-col-4", // Small Daraz grid
        ".hp-mod-card" // Homepage specific
      ]

      const productCards = document.querySelectorAll(selectors.join(","))

      productCards.forEach((el) => {
        const card = el as HTMLElement

        // Safety: Ignore parent containers or already injected cards
        if (
          card.querySelector(".aicandy-select-wrapper") ||
          card.offsetHeight < 100
        )
          return

        // Create Premium Checkbox Wrapper
        const wrapper = document.createElement("div")
        wrapper.className = "aicandy-select-wrapper"
        wrapper.style.cssText = `
          position: absolute; 
          top: 10px; 
          left: 10px; 
          z-index: 999999; 
          background: white;
          border-radius: 8px;
          padding: 2px;
          display: flex;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        `

        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.style.cssText = `width: 24px; height: 24px; cursor: pointer; accent-color: #6366f1;`

        checkbox.addEventListener("change", async () => {
          // 2. TARGETED DATA EXTRACTION (Inside this specific card ONLY)
          // We look for title/price relative to the current 'card' element
          const titleEl = card.querySelector(
            "h2, .title--wNxvH, .hp-mod-card-title, span.a-text-normal"
          )
          const priceEl = card.querySelector(
            ".a-price-whole, .price--be93Q, .hp-mod-card-price, .pdp-price"
          )
          const imgEl = card.querySelector("img") as HTMLImageElement

          // Handle lazy-loaded images (Daraz/Amazon often use data-src)
          const imgSrc = imgEl?.getAttribute("data-src") || imgEl?.src || ""

          const product = {
            id:
              card.getAttribute("data-asin") ||
              card.getAttribute("data-id") ||
              titleEl?.textContent?.trim() ||
              Math.random().toString(),
            title: titleEl?.textContent?.trim() || "Unknown Product",
            price: priceEl?.textContent?.trim() || "0",
            img: imgSrc,
            url: card.querySelector("a")?.href || window.location.href,
            source: "AMAZON"
          }

          const { selectedProducts = [] } =
            await browser.storage.local.get("selectedProducts")

          let newList
          if (checkbox.checked) {
            newList = [
              ...selectedProducts.filter((p: any) => p.id !== product.id),
              product
            ]
          } else {
            newList = selectedProducts.filter((p: any) => p.id !== product.id)
          }

          await browser.storage.local.set({ selectedProducts: newList })
        })

        wrapper.appendChild(checkbox)
        card.style.position = "relative"
        card.style.border = checkbox.checked
          ? "2px solid #6366f1"
          : card.style.border
        card.prepend(wrapper)
      })
    }

    // Run immediately and then watch for scrolls
    injectUI()
    const observer = new MutationObserver(injectUI)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return null
}

export default Injector
