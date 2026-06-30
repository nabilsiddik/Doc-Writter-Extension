export const grabProductData = () => {
  // SELECTORS must be inside the function to be accessible during injection
  const SELECTORS: Record<string, any> = {
    "amazon.com": {
      title: "#productTitle",
      price: ".a-price-whole",
      description: "#feature-bullets"
    },
    "daraz.com.bd": {
      title: ".pdp-mod-product-badge-title",
      price: ".pdp-price",
      description: ".pdp-product-detail"
    },
    "aliexpress.com": {
      title: ".pdp-info-right h1",
      price: ".price--current--36S_v74",
      description: "#product-description"
    }
  }

  const host = window.location.hostname.replace("www.", "")
  const siteConfig = SELECTORS[host] || SELECTORS["amazon.com"]

  const getText = (selector: string) =>
    document.querySelector(selector)?.textContent?.trim() || ""

  // Fallback: If specific selector fails, try standard Meta Tags (Very important for production)
  const metaTitle = document
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content")
  const metaDesc = document
    .querySelector('meta[name="description"]')
    ?.getAttribute("content")

  const title = getText(siteConfig.title) || metaTitle || document.title
  const description = getText(siteConfig.description) || metaDesc || ""

  return {
    topic: title,
    price: getText(siteConfig.price),
    scrapedContent: `
      Title: ${title}
      Description: ${description}
    `.trim()
  }
}
