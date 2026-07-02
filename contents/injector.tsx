// import type { PlasmoCSConfig } from "plasmo"
// import { useEffect } from "react"
// import browser from "webextension-polyfill"

// export const config: PlasmoCSConfig = {
//   matches: [
//     "https://www.amazon.com/*",
//     "https://www.daraz.com.bd/*",
//     "https://daraz.com.bd/*"
//   ]
// }

// const Injector = () => {
//   useEffect(() => {
//     const injectUI = () => {
//       const selectors = [
//         // Amazon Selectors
//         'div[data-component-type="s-search-result"]',
//         'div.s-result-item[data-asin]:not([data-asin=""])',

//         // Daraz selectors
//         'div[data-qa-locator="product-item"]',
//         ".card-jfy-wrapper .pc-custom-link",

//         // Aliexpress selectors
//         "div[data-product-id]"
//       ]

//       const productCards = document.querySelectorAll(selectors.join(","))

//       productCards.forEach((el) => {
//         const card = el as HTMLElement

//         // Safety: Ignore parent containers or already injected cards
//         if (
//           card.querySelector(".aicandy-select-wrapper") ||
//           card.offsetHeight < 100
//         )
//           return

//         // Create Premium Checkbox Wrapper
//         const wrapper = document.createElement("div")
//         wrapper.className = "aicandy-select-wrapper"
//         wrapper.style.cssText = `
//           position: absolute;
//           top: 10px;
//           left: 10px;
//           z-index: 999999;
//           background: white;
//           border-radius: 8px;
//           padding: 2px;
//           display: flex;
//           box-shadow: 0 4px 15px rgba(0,0,0,0.4);
//         `

//         const checkbox = document.createElement("input")
//         checkbox.type = "checkbox"
//         checkbox.style.cssText = `width: 24px; height: 24px; cursor: pointer; accent-color: #6366f1;`

//         checkbox.addEventListener("change", async () => {
//           // 2. TARGETED DATA EXTRACTION (Inside this specific card ONLY)
//           // We look for title/price relative to the current 'card' element
//           const titleEl = card.querySelector(
//             "h2, .title--wNxvH, .hp-mod-card-title, span.a-text-normal"
//           )
//           const priceEl = card.querySelector(
//             ".a-price-whole, .price--be93Q, .hp-mod-card-price, .pdp-price"
//           )
//           const imgEl = card.querySelector("img") as HTMLImageElement

//           // Handle lazy-loaded images (Daraz/Amazon often use data-src)
//           const imgSrc = imgEl?.getAttribute("data-src") || imgEl?.src || ""

//           const product = {
//             id:
//               card.getAttribute("data-asin") ||
//               card.getAttribute("data-id") ||
//               titleEl?.textContent?.trim() ||
//               Math.random().toString(),
//             title: titleEl?.textContent?.trim() || "Unknown Product",
//             price: priceEl?.textContent?.trim() || "0",
//             img: imgSrc,
//             url: card.querySelector("a")?.href || window.location.href,
//             source: "AMAZON"
//           }

//           const { selectedProducts = [] } =
//             await browser.storage.local.get("selectedProducts")

//           let newList
//           if (checkbox.checked) {
//             newList = [
//               ...selectedProducts.filter((p: any) => p.id !== product.id),
//               product
//             ]
//           } else {
//             newList = selectedProducts.filter((p: any) => p.id !== product.id)
//           }

//           await browser.storage.local.set({ selectedProducts: newList })
//         })

//         wrapper.appendChild(checkbox)
//         card.style.position = "relative"
//         card.style.border = checkbox.checked
//           ? "2px solid #6366f1"
//           : card.style.border
//         card.prepend(wrapper)
//       })
//     }

//     // Run immediately and then watch for scrolls
//     injectUI()
//     const observer = new MutationObserver(injectUI)
//     observer.observe(document.body, { childList: true, subtree: true })

//     return () => observer.disconnect()
//   }, [])

//   return null
// }

// export default Injector

import type { PlasmoCSConfig } from "plasmo"
import { useEffect } from "react"
import browser from "webextension-polyfill"

export const config: PlasmoCSConfig = {
  matches: [
    "https://www.amazon.com/*",
    "https://www.daraz.com.bd/*",
    "https://daraz.com.bd/*",
    "https://*.aliexpress.com/*", // Added AliExpress
    "https://www.walmart.com/*" // Placeholder for future
  ]
}

// 1. Scalable Configuration Registry
const SCRAPER_CONFIG: Record<string, any> = {
  amazon: {
    selectors: [
      'div[data-component-type="s-search-result"]',
      'span[data-csa-c-type="item"]',
      'li[aria-roledescription="slide"]'
    ],
    titles: [
      "h2, span.a-text-normal a.a-link-normal span div",
      "a.a-link-normal span div"
    ],
    price: ".a-price-whole",
    img: "img",
    idAttr: "data-asin"
  },
  daraz: {
    selectors: [
      ".hp-mod-card-content .card-jfy-wrapper .pc-custom-link",
      "div[data-qa-locator='product-item']"
    ],
    titles: [".pc-custom-link .card-jfy-item-desc .card-jfy-title", ".RfADt a"],
    price: [
      ".pc-custom-link .card-jfy-item-desc .hp-mod-price .hp-mod-price-first-line .price",
      ".Ms6aG .aBrP0 span.ooOxS"
    ],
    img: "img",
    idAttr: "data-id"
  },
  aliexpress: {
    selectors: ["div[data-product-id]", ".list--galleryItem--pXew_"],
    titles: ["h1", "[class*='titleText']", "[class*='product-title']"],
    price: "[class*='price-current'], .multi--price-sale--955",
    img: "img",
    idAttr: "data-spm-anchor-id"
  }
}

const Injector = () => {
  useEffect(() => {
    // Identify current site configuration
    const getSiteConfig = () => {
      const host = window.location.hostname
      if (host.includes("amazon"))
        return { ...SCRAPER_CONFIG.amazon, name: "AMAZON" }
      if (host.includes("daraz"))
        return { ...SCRAPER_CONFIG.daraz, name: "DARAZ" }
      if (host.includes("aliexpress"))
        return { ...SCRAPER_CONFIG.aliexpress, name: "ALIEXPRESS" }
      return null
    }

    const injectUI = () => {
      const site = getSiteConfig()
      if (!site) return

      const productCards = document.querySelectorAll(site.selectors.join(","))

      productCards.forEach((el) => {
        const card = el as HTMLElement
        if (
          card.querySelector(".aicandy-select-wrapper") ||
          card.offsetHeight < 100
        )
          return

        // --- Premium Checkbox Injection ---
        const wrapper = document.createElement("div")
        wrapper.className = "aicandy-select-wrapper"
        wrapper.style.cssText = `
          position: absolute; top: 10px; left: 10px; z-index: 999999;
          background: white; border-radius: 8px; padding: 2px; display: flex;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        `

        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.style.cssText = `width: 24px; height: 24px; cursor: pointer; accent-color: #6366f1;`

        // 3. Dynamic Extraction Logic
        checkbox.addEventListener("change", async () => {
          const titleEl = site.titles
            .map((sel) => card.querySelector(sel))
            .find(Boolean)
          const priceEl = site.price
            .map((sel) => card.querySelector(sel))
            .find(Boolean)
          const imgEl = card.querySelector(site.img) as HTMLImageElement

          // Handle Image protocols and lazy loading
          let imgSrc = imgEl?.getAttribute("data-src") || imgEl?.src || ""
          if (imgSrc.startsWith("//")) imgSrc = "https:" + imgSrc

          const anchorEl = card.querySelector("a") as HTMLAnchorElement
          let productUrl = anchorEl?.href || ""

          if (productUrl.startsWith("//")) {
            productUrl = "https:" + productUrl
          }
          if (!productUrl || productUrl === window.location.href) {
            const titleLink = titleEl?.closest("a")?.href
            productUrl = titleLink || window.location.href
          }

          const product = {
            id:
              card.getAttribute(site.idAttr) ||
              titleEl?.textContent?.trim() ||
              Math.random().toString(),
            title: titleEl?.textContent?.trim() || "Unknown Product",
            price: priceEl?.textContent?.trim() || "0",
            img: imgSrc,
            url: productUrl,
            source: site.name
          }

          const { selectedProducts = [] } =
            await browser.storage.local.get("selectedProducts")

          let newList
          if (checkbox.checked) {
            newList = [
              ...selectedProducts.filter((p: any) => p.id !== product.id),
              product
            ]
            card.style.outline = "3px solid #6366f1"
            card.style.outlineOffset = "-3px"
          } else {
            newList = selectedProducts.filter((p: any) => p.id !== product.id)
            card.style.outline = "none"
          }

          await browser.storage.local.set({ selectedProducts: newList })
        })

        wrapper.appendChild(checkbox)
        card.style.position = "relative"
        card.prepend(wrapper)
      })
    }

    injectUI()
    const observer = new MutationObserver(injectUI)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return null
}

export default Injector
