import { Globe, LogOut, ShoppingBag, Sparkles, User } from "lucide-react"
import { useEffect, useState } from "react"

import "./style.css"

import browser from "webextension-polyfill"

export default function IndexPopup() {
  const [token, setToken] = useState<string | null>(null)
  const [selectedCount, setSelectedCount] = useState(0)
  const [exportType, setExportType] = useState<"RAW" | "AI">("RAW")
  const [loading, setLoading] = useState(false)
  const [scrapedData, setScrapedData] = useState<any>(null)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    browser.storage.local.get("token").then((res) => {
      setToken(res?.token || null)
    })

    const handleStorageChange = (changes: any) => {
      if (changes.token) {
        setToken(changes.token.newValue || null)
      }
    }

    browser.storage.onChanged.addListener(handleStorageChange)
    return () => browser.storage.onChanged.removeListener(handleStorageChange)
  }, [])

  console.log(token, "my tokkkk")

  useEffect(() => {
    async function getCount() {
      try {
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true
        })

        // Don't run on browser settings pages
        if (
          !tab?.id ||
          tab.url?.startsWith("chrome://") ||
          tab.url?.startsWith("edge://")
        )
          return

        const results = await browser.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Look for our specific class
            const checked = document.querySelectorAll(
              ".aicandy-checkbox:checked"
            )
            return checked.length
          }
        })

        setSelectedCount(results[0].result as number)
      } catch (err) {
        console.error("Count Error:", err)
      }
    }

    // Check count every 500ms while popup is open to keep it reactive
    const interval = setInterval(getCount, 500)
    return () => clearInterval(interval)
  }, [])

  const handleManualLogout = async () => {
    await browser.storage.local.remove("token")
    setToken(null)
    alert("Logged out successfully")
  }

  const handleGenerate = async () => {
    setLoading(true)
    // IMPORTANT: Make sure your main site 'aicandy.com' actually
    // saves the token to chrome.storage.local for this to work
    const storage = await browser.storage.local.get("token")
    const token = storage.token

    if (!token) {
      alert("Please login to AICandy website first.")
      setLoading(false)
      return
    }

    const res = await browser.runtime.sendMessage({
      type: "GENERATE_PRODUCT",
      token: token,
      payload: scrapedData
    })

    if (res?.success) {
      setResult(res.data)
    } else {
      alert(res?.message || "Generation failed")
    }
    setLoading(false)
  }

  const handleExport = async (target: "SHEETS" | "WOO") => {
    // 1. Logic to scrape ALL checked products
    // 2. Call your backend: /api/v1/document/bulk-export
    // 3. Backend checks if user is PREMIUM for 'AI' export or FREE for 'RAW' export
  }

  if (!token) {
    return (
      <div className="w-[350px] p-8 text-center bg-white">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
          <User size={32} />
        </div>
        <h2 className="text-2xl font-black mb-4">Auth Required</h2>
        <p className="text-slate-500 mb-8">
          Please login to AICandy to use the browser extension agent.
        </p>
        <button
          onClick={() => window.open("http://localhost:3000/login", "_blank")}
          className="w-full py-4 bg-primary text-white rounded-xl font-bold cursor-pointer transition-all hover:bg-indigo-700">
          Go to Login
        </button>
      </div>
    )
  }

  return (
    // <div className="w-[400px] bg-white p-8 font-sans">
    //   <header className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
    //     <div className="flex items-center gap-2">
    //       <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
    //         <Sparkles size={24} />
    //       </div>
    //       <span className="text-2xl font-black tracking-tight">AICandy</span>
    //     </div>
    //   </header>

    //   {!result ? (
    //     <div className="space-y-6">
    //       <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
    //         <div className="flex items-center gap-3 mb-3 text-primary font-bold">
    //           <Globe size={20} />
    //           <span>Detected Product</span>
    //         </div>
    //         <h2 className="text-xl font-black line-clamp-2">
    //           {scrapedData?.topic || "No Product Found"}
    //         </h2>
    //         <p>Price: {scrapedData?.price}</p>
    //         <p>{scrapedData?.scrapedContent}</p>
    //         <p className="text-slate-400 mt-2 font-bold uppercase tracking-tighter">
    //           Ready for AI Analysis
    //         </p>
    //       </div>

    //       <button
    //         disabled={loading || !scrapedData?.topic}
    //         onClick={handleGenerate}
    //         className="w-full py-5 bg-primary hover:bg-indigo-700 text-white rounded-2xl text-xl font-black transition-all flex items-center justify-center gap-3 shadow-xl cursor-pointer disabled:opacity-50">
    //         {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
    //         {loading ? "ANALYSING..." : "GENERATE LISTING"}
    //       </button>
    //     </div>
    //   ) : (
    //     <div className="text-center py-6">
    //       <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
    //         <CheckCircle2 size={40} />
    //       </div>
    //       <h2 className="text-2xl font-black mb-4">Content Ready!</h2>
    //       <p className="text-slate-500 text-lg mb-8 leading-relaxed">
    //         AI has engineered a professional SEO description for this product.
    //       </p>
    //       <a
    //         href={`https://aicandy.com/generation-details/${result.id}`}
    //         target="_blank"
    //         className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xl font-black flex items-center justify-center gap-3 cursor-pointer shadow-lg">
    //         Open in Editor <ArrowRight />
    //       </a>
    //     </div>
    //   )}

    //   <p className="mt-8 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
    //     Sync with WooCommerce • Shopify Coming Soon
    //   </p>
    // </div>
    <div className="w-[400px] bg-white p-8">
      <header className="flex items-center justify-between mb-8 border-b pb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <Sparkles size={24} />
          </div>
          <span className="text-2xl font-black">AICandy</span>
        </div>

        {/* LOGOUT BUTTON (Only if logged in) */}
        {token && (
          <button
            onClick={handleManualLogout}
            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
            title="Logout">
            <LogOut size={20} />
          </button>
        )}
      </header>
      <div className="bg-primary/5 p-6 rounded-3xl mb-8 border border-primary/10">
        <p className="text-primary font-black uppercase tracking-widest text-base mb-2">
          Bulk Capture
        </p>
        <h2 className="text-3xl font-black text-black">
          {selectedCount} Products Selected
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => setExportType("RAW")}
          className={`py-4 rounded-2xl font-bold border-2 transition-all cursor-pointer ${exportType === "RAW" ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400"}`}>
          Raw Scrape (Free)
        </button>
        <button
          onClick={() => setExportType("AI")}
          className={`py-4 rounded-2xl font-bold border-2 transition-all cursor-pointer ${exportType === "AI" ? "border-secondary bg-secondary/5 text-secondary" : "border-slate-100 text-slate-400"}`}>
          AI Rewrite (Pro)
        </button>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => handleExport("SHEETS")}
          className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-4 hover:bg-black transition-all cursor-pointer">
          <Globe size={24} /> Export to Sheets
        </button>
        <button
          onClick={() => handleExport("WOO")}
          className="w-full py-5 bg-white border-2 border-slate-200 text-black rounded-2xl font-black text-xl flex items-center justify-center gap-4 hover:border-primary transition-all cursor-pointer">
          <ShoppingBag size={24} /> Sync to WooCommerce
        </button>
      </div>
    </div>
  )
}
