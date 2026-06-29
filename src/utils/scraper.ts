const SELECTORS: Record<string, any> = {
  "amazon.com": {
    title: "#productTitle",
    price: ".a-price-whole",
    description: "#feature-bullets",
    specs: "#productDetails_techSpec_section_1"
  },
  "daraz.com.bd": {
    title: ".pdp-mod-product-title",
    price: ".pdp-price_type_normal",
    description: ".pdp-product-detail",
    specs: ".pdp-mod-specification"
  },
  "aliexpress.com": {
    title: ".pdp-info-right h1",
    price: ".price--current--36S_v74",
    description: "#product-description",
    specs: ".specification--prop--2Y_S9p"
  }
}

export const grabProductData = () => {
  const host = window.location.hostname.replace("www.", "")
  const siteConfig = SELECTORS[host] || SELECTORS["amazon.com"]

  const getText = (selector: string) =>
    document.querySelector(selector)?.textContent?.trim() || ""

  return {
    topic: getText(siteConfig.title),
    price: getText(siteConfig.price),
    scrapedContent: `
      Title: ${getText(siteConfig.title)}
      Description: ${getText(siteConfig.description)}
      Technical Specs: ${getText(siteConfig.specs)}
    `.trim()
  }
}
