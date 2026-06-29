import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Loader2,
  ShoppingBag,
  Sparkles
} from "lucide-react"
import { useEffect, useState } from "react"

import "./style.css"

import browser from "webextension-polyfill"

import { grabProductData } from "./utils/scraper"

export default function IndexPopup() {
  const [loading, setLoading] = useState(false)
  const [scrapedData, setScrapedData] = useState<any>(null)
  const [result, setResult] = useState<any>(null)

  // 1. Detect and Scrape on Open
  useEffect(() => {
    async function initScrape() {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true
      })
      if (!tab.id) return

      const results = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: grabProductData
      })

      setScrapedData(results[0].result)
    }
    initScrape()
  }, [])

  const handleGenerate = async () => {
    setLoading(true)
    // In production, grab token from storage where your main site saved it
    const { token } = await browser.storage.local.get("token")

    const res = await browser.runtime.sendMessage({
      type: "GENERATE_PRODUCT",
      token,
      payload: scrapedData
    })

    if (res?.success) {
      setResult(res.data)
    }
    setLoading(false)
  }

  return (
    <div className="w-[400px] bg-white p-8 font-sans">
      <header className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Sparkles size={24} />
          </div>
          <span className="text-2xl font-black tracking-tight">AICandy</span>
        </div>
      </header>

      {!result ? (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3 text-primary font-bold">
              <Globe size={20} />
              <span>Detected Product</span>
            </div>
            <h2 className="text-xl font-black line-clamp-2">
              {scrapedData?.topic || "No Product Found"}
            </h2>
            <p className="text-slate-400 mt-2 font-bold uppercase tracking-tighter">
              Ready for AI Analysis
            </p>
          </div>

          <button
            disabled={loading || !scrapedData?.topic}
            onClick={handleGenerate}
            className="w-full py-5 bg-primary hover:bg-indigo-700 text-white rounded-2xl text-xl font-black transition-all flex items-center justify-center gap-3 shadow-xl cursor-pointer disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "ANALYSING..." : "GENERATE LISTING"}
          </button>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black mb-4">Content Ready!</h2>
          <p className="text-slate-500 text-lg mb-8 leading-relaxed">
            AI has engineered a professional SEO description for this product.
          </p>
          <a
            href={`https://aicandy.com/generation-details/${result.id}`}
            target="_blank"
            className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xl font-black flex items-center justify-center gap-3 cursor-pointer shadow-lg">
            Open in Editor <ArrowRight />
          </a>
        </div>
      )}

      <p className="mt-8 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
        Sync with WooCommerce • Shopify Coming Soon
      </p>
    </div>
  )
}
