// import type { PlasmoCSConfig } from "plasmo"
// import { useEffect } from "react"

// export const config: PlasmoCSConfig = {
//   matches: ["https://www.amazon.com/*", "https://www.daraz.com.bd/*"]
// }

// const Injector = () => {
//   useEffect(() => {
//     // Logic to find all product cards on the page
//     const products = document.querySelectorAll(
//       'div[data-component-type="s-search-result"], .grid-item'
//     )

//     products.forEach((el) => {
//       const element = el as HTMLElement

//       if (element.querySelector(".aicandy-checkbox")) return

//       const checkbox = document.createElement("input")
//       checkbox.type = "checkbox"
//       checkbox.className = "aicandy-checkbox"

//       checkbox.style.cssText =
//         "position:absolute; top:10px; left:10px; z-index:999; width:25px; height:25px; cursor:pointer;"

//       const title = element.querySelector("h2, .title")?.textContent

//       checkbox.setAttribute("data-title", title || "")

//       element.style.position = "relative"
//       element.prepend(checkbox)
//     })
//   }, [])

//   return null
// }

// export default Injector

import type { PlasmoCSConfig } from "plasmo"
import { useEffect } from "react"

export const config: PlasmoCSConfig = {
  // Added more Daraz variations to ensure it matches
  matches: [
    "https://www.amazon.com/*",
    "https://www.daraz.com.bd/*",
    "https://daraz.com.bd/*"
  ]
}

const Injector = () => {
  useEffect(() => {
    const injectCheckboxes = () => {
      // 1. Precise selectors for Amazon and Daraz result cards
      const selectors = [
        'div[data-component-type="s-search-result"]', // Amazon Search
        ".grid-item", // Daraz standard
        ".box--Z76er", // Daraz new search grid
        ".hp-mod-card" // Daraz homepage cards
      ]

      const products = document.querySelectorAll(selectors.join(","))

      products.forEach((el) => {
        const element = el as HTMLElement

        // Prevent duplicate injection
        if (element.querySelector(".aicandy-checkbox")) return

        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.className = "aicandy-checkbox"

        // High-visibility premium styling
        checkbox.style.cssText = `
          position: absolute; 
          top: 10px; 
          left: 10px; 
          z-index: 10000; 
          width: 22px; 
          height: 22px; 
          cursor: pointer;
          accent-color: #6366f1;
          border: 2px solid white;
          border-radius: 6px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        `

        // Capture data into the checkbox for bulk processing later
        const title =
          element.querySelector("h2, .title, .title--wNxvH")?.textContent || ""
        const price =
          element.querySelector(".a-price-whole, .pdp-price, .currency--qpk9p")
            ?.textContent || ""

        checkbox.setAttribute("data-title", title.trim())
        checkbox.setAttribute("data-price", price.trim())

        // Ensure parent can hold absolute children
        element.style.position = "relative"
        element.prepend(checkbox)
      })
    }

    // Initial injection
    injectCheckboxes()

    // 2. MONITOR FOR DYNAMIC LOADING (The "Magic" part)
    // This watches for when the user scrolls and new products are added to the DOM
    const observer = new MutationObserver(() => {
      injectCheckboxes()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => observer.disconnect()
  }, [])

  return null
}

export default Injector
