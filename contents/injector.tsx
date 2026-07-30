import type { PlasmoCSConfig } from "plasmo"
import { useEffect } from "react"
import browser from "webextension-polyfill"

import { getAmount } from "~utils/cleanPriceString"

export const config: PlasmoCSConfig = {
  matches: [
    "https://www.amazon.com/*",
    "https://www.daraz.com.bd/*",
    "https://daraz.com.bd/*",
    "https://*.aliexpress.com/*",
    "https://www.walmart.com/*",
    "https://*.moveon.global/*"
  ]
}

const SCRAPER_CONFIG: Record<string, any> = {
  amazon: {
    selectors: [
      'div[data-component-type="s-search-result"]',
      'div[data-asin]:not([data-asin=""])',
      'span[data-csa-c-type="item"]'
    ],
    titles: [
      "h2 span.a-text-normal",
      "h2 a.a-link-normal",
      ".a-size-medium",
      ".a-size-base-plus"
    ],
    price: [".a-price .a-offscreen", ".a-price-whole", "span.a-price"],
    img: "img.s-image, img",
    idAttr: "data-asin"
  },
  daraz: {
    selectors: [
      ".hp-mod-card-content .card-jfy-wrapper .pc-custom-link",
      "div[data-qa-locator='product-item']",
      "a.pc-custom-link"
    ],
    titles: [
      ".card-jfy-item-desc .card-jfy-title",
      ".RfADt a",
      ".title--wNxvH"
    ],
    price: [".hp-mod-price-first-line .price", ".ooOxS", ".pdp-price"],
    img: "img",
    idAttr: "id"
  },
  aliexpress: {
    selectors: ["#more-to-love .nj_nm"],
    titles: ["span.rc-title-content", "h3.iz_ap", "h1", "[class*='titleText']"],
    price: ["#more-to-love .nj_nm a .np_iq span:nth-child(2)"],
    img: "img",
    idAttr: "data-product-id"
  },
  moveOn: {
    selectors: ["#products-list-container > div"],
    titles: [
      "#products-list-container > div h1",
      "#products-list-container > div .tw-line-clamp-2"
    ],
    price: ["#products-list-container > div p.tw-font-semibold"],
    img: "#products-list-container a figure img:nth-child(2)",
    idAttr: "data-product-id"
  }
}

const Injector = () => {
  useEffect(() => {
    const getSiteConfig = () => {
      const host = window.location.hostname
      console.log(host, "my host")
      if (host.includes("amazon"))
        return { ...SCRAPER_CONFIG.amazon, name: "AMAZON" }
      if (host.includes("daraz"))
        return { ...SCRAPER_CONFIG.daraz, name: "DARAZ" }
      if (host.includes("aliexpress"))
        return { ...SCRAPER_CONFIG.aliexpress, name: "ALIEXPRESS" }
      if (host.includes("moveon"))
        return { ...SCRAPER_CONFIG.moveOn, name: "MOVEON" }
      return null
    }

    const findFirstMatch = (
      parent: HTMLElement,
      selectors: string | string[]
    ) => {
      if (!Array.isArray(selectors)) return parent.querySelector(selectors)
      for (const sel of selectors) {
        const el = parent.querySelector(sel)
        if (el && el.textContent?.trim()) return el
      }
      return null
    }

    const injectUI = () => {
      const site = getSiteConfig()
      if (!site) return

      const productCards = document.querySelectorAll(site.selectors.join(","))

      productCards.forEach((el) => {
        const card = el as HTMLElement
        if (card.querySelector(".aicandy-select-wrapper")) return

        const wrapper = document.createElement("div")
        wrapper.className = "aicandy-select-wrapper"
        wrapper.style.cssText = `
      position: absolute; 
      top: 10px; 
      left: 10px; 
      z-index: 9999999; 
      background: white; 
      border-radius: 6px; 
      display: flex;
      padding: 2px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `

        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.style.cssText = `width: 22px; height: 22px; cursor: pointer; accent-color: #6366f1;`

        checkbox.addEventListener("click", (e) => e.stopPropagation())
        checkbox.addEventListener("change", async () => {
          try {
            const titleEl = findFirstMatch(card, site.titles)
            const priceEl = findFirstMatch(card, site.price)
            const imgEl = card.querySelector(site.img) as HTMLImageElement

            let imgSrc = imgEl?.getAttribute("data-src") || imgEl?.src || ""
            if (imgSrc.startsWith("//")) imgSrc = "https:" + imgSrc

            const anchorEl = (
              card.tagName === "A" ? card : card.querySelector("a")
            ) as HTMLAnchorElement
            let productUrl = anchorEl?.href || window.location.href
            if (productUrl.startsWith("//")) productUrl = "https:" + productUrl
            if (productUrl.includes("?")) productUrl = productUrl.split("?")[0]

            let rawPrice = priceEl?.textContent?.trim() || "0"
            if (site.name === "ALIEXPRESS") {
              rawPrice = getAmount(rawPrice)
            }

            const cleanPrice =
              rawPrice.replace(/[^\d.]/g, "").split(".")[0] || "0"

            const product = {
              id:
                card.getAttribute(site.idAttr) ||
                anchorEl?.getAttribute(site.idAttr) ||
                titleEl?.textContent?.trim() ||
                Math.random().toString(),
              title: titleEl?.textContent?.trim() || "Unknown Product",
              price: cleanPrice,
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
          } catch (err) {
            console.error("AICandy Scraper Error:", err)
          }
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
