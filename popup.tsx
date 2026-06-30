// import { Globe, LogOut, ShoppingBag, Sparkles, User } from "lucide-react"
// import { useEffect, useState } from "react"

// import "./style.css"

// import browser from "webextension-polyfill"

// export default function IndexPopup() {
//   const [token, setToken] = useState<string | null>(null)
//   const [selectedCount, setSelectedCount] = useState(0)
//   const [exportType, setExportType] = useState<"RAW" | "AI">("RAW")
//   const [loading, setLoading] = useState(false)
//   const [scrapedData, setScrapedData] = useState<any>(null)
//   const [result, setResult] = useState<any>(null)

//   useEffect(() => {
//     browser.storage.local.get("token").then((res) => {
//       setToken(res?.token || null)
//     })

//     const handleStorageChange = (changes: any) => {
//       if (changes.token) {
//         setToken(changes.token.newValue || null)
//       }
//     }

//     browser.storage.onChanged.addListener(handleStorageChange)
//     return () => browser.storage.onChanged.removeListener(handleStorageChange)
//   }, [])

//   console.log(token, "my tokkkk")

//   useEffect(() => {
//     async function getCount() {
//       try {
//         const [tab] = await browser.tabs.query({
//           active: true,
//           currentWindow: true
//         })

//         // Don't run on browser settings pages
//         if (
//           !tab?.id ||
//           tab.url?.startsWith("chrome://") ||
//           tab.url?.startsWith("edge://")
//         )
//           return

//         const results = await browser.scripting.executeScript({
//           target: { tabId: tab.id },
//           func: () => {
//             // Look for our specific class
//             const checked = document.querySelectorAll(
//               ".aicandy-checkbox:checked"
//             )
//             return checked.length
//           }
//         })

//         setSelectedCount(results[0].result as number)
//       } catch (err) {
//         console.error("Count Error:", err)
//       }
//     }

//     // Check count every 500ms while popup is open to keep it reactive
//     const interval = setInterval(getCount, 500)
//     return () => clearInterval(interval)
//   }, [])

//   const handleManualLogout = async () => {
//     await browser.storage.local.remove("token")
//     setToken(null)
//     alert("Logged out successfully")
//   }

//   const handleGenerate = async () => {
//     setLoading(true)
//     // IMPORTANT: Make sure your main site 'aicandy.com' actually
//     // saves the token to chrome.storage.local for this to work
//     const storage = await browser.storage.local.get("token")
//     const token = storage.token

//     if (!token) {
//       alert("Please login to AICandy website first.")
//       setLoading(false)
//       return
//     }

//     const res = await browser.runtime.sendMessage({
//       type: "GENERATE_PRODUCT",
//       token: token,
//       payload: scrapedData
//     })

//     if (res?.success) {
//       setResult(res.data)
//     } else {
//       alert(res?.message || "Generation failed")
//     }
//     setLoading(false)
//   }

//   const handleExport = async (target: "SHEETS" | "WOO") => {
//     // 1. Logic to scrape ALL checked products
//     // 2. Call your backend: /api/v1/document/bulk-export
//     // 3. Backend checks if user is PREMIUM for 'AI' export or FREE for 'RAW' export
//   }

//   if (!token) {
//     return (
//       <div className="w-[350px] p-8 text-center bg-white">
//         <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
//           <User size={32} />
//         </div>
//         <h2 className="text-2xl font-black mb-4">Auth Required</h2>
//         <p className="text-slate-500 mb-8">
//           Please login to AICandy to use the browser extension agent.
//         </p>
//         <button
//           onClick={() => window.open("http://localhost:3000/login", "_blank")}
//           className="w-full py-4 bg-primary text-white rounded-xl font-bold cursor-pointer transition-all hover:bg-indigo-700">
//           Go to Login
//         </button>
//       </div>
//     )
//   }

//   return (
//     // <div className="w-[400px] bg-white p-8 font-sans">
//     //   <header className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
//     //     <div className="flex items-center gap-2">
//     //       <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
//     //         <Sparkles size={24} />
//     //       </div>
//     //       <span className="text-2xl font-black tracking-tight">AICandy</span>
//     //     </div>
//     //   </header>

//     //   {!result ? (
//     //     <div className="space-y-6">
//     //       <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
//     //         <div className="flex items-center gap-3 mb-3 text-primary font-bold">
//     //           <Globe size={20} />
//     //           <span>Detected Product</span>
//     //         </div>
//     //         <h2 className="text-xl font-black line-clamp-2">
//     //           {scrapedData?.topic || "No Product Found"}
//     //         </h2>
//     //         <p>Price: {scrapedData?.price}</p>
//     //         <p>{scrapedData?.scrapedContent}</p>
//     //         <p className="text-slate-400 mt-2 font-bold uppercase tracking-tighter">
//     //           Ready for AI Analysis
//     //         </p>
//     //       </div>

//     //       <button
//     //         disabled={loading || !scrapedData?.topic}
//     //         onClick={handleGenerate}
//     //         className="w-full py-5 bg-primary hover:bg-indigo-700 text-white rounded-2xl text-xl font-black transition-all flex items-center justify-center gap-3 shadow-xl cursor-pointer disabled:opacity-50">
//     //         {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
//     //         {loading ? "ANALYSING..." : "GENERATE LISTING"}
//     //       </button>
//     //     </div>
//     //   ) : (
//     //     <div className="text-center py-6">
//     //       <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
//     //         <CheckCircle2 size={40} />
//     //       </div>
//     //       <h2 className="text-2xl font-black mb-4">Content Ready!</h2>
//     //       <p className="text-slate-500 text-lg mb-8 leading-relaxed">
//     //         AI has engineered a professional SEO description for this product.
//     //       </p>
//     //       <a
//     //         href={`https://aicandy.com/generation-details/${result.id}`}
//     //         target="_blank"
//     //         className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xl font-black flex items-center justify-center gap-3 cursor-pointer shadow-lg">
//     //         Open in Editor <ArrowRight />
//     //       </a>
//     //     </div>
//     //   )}

//     //   <p className="mt-8 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
//     //     Sync with WooCommerce • Shopify Coming Soon
//     //   </p>
//     // </div>
//     <div className="w-[400px] bg-white p-8">
//       <header className="flex items-center justify-between mb-8 border-b pb-6">
//         <div className="flex items-center gap-2">
//           <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
//             <Sparkles size={24} />
//           </div>
//           <span className="text-2xl font-black">AICandy</span>
//         </div>

//         {/* LOGOUT BUTTON (Only if logged in) */}
//         {token && (
//           <button
//             onClick={handleManualLogout}
//             className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
//             title="Logout">
//             <LogOut size={20} />
//           </button>
//         )}
//       </header>
//       <div className="bg-primary/5 p-6 rounded-3xl mb-8 border border-primary/10">
//         <p className="text-primary font-black uppercase tracking-widest text-base mb-2">
//           Bulk Capture
//         </p>
//         <h2 className="text-3xl font-black text-black">
//           {selectedCount} Products Selected
//         </h2>
//       </div>

//       <div className="grid grid-cols-2 gap-4 mb-8">
//         <button
//           onClick={() => setExportType("RAW")}
//           className={`py-4 rounded-2xl font-bold border-2 transition-all cursor-pointer ${exportType === "RAW" ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400"}`}>
//           Raw Scrape (Free)
//         </button>
//         <button
//           onClick={() => setExportType("AI")}
//           className={`py-4 rounded-2xl font-bold border-2 transition-all cursor-pointer ${exportType === "AI" ? "border-secondary bg-secondary/5 text-secondary" : "border-slate-100 text-slate-400"}`}>
//           AI Rewrite (Pro)
//         </button>
//       </div>

//       <div className="space-y-4">
//         <button
//           onClick={() => handleExport("SHEETS")}
//           className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-4 hover:bg-black transition-all cursor-pointer">
//           <Globe size={24} /> Export to Sheets
//         </button>
//         <button
//           onClick={() => handleExport("WOO")}
//           className="w-full py-5 bg-white border-2 border-slate-200 text-black rounded-2xl font-black text-xl flex items-center justify-center gap-4 hover:border-primary transition-all cursor-pointer">
//           <ShoppingBag size={24} /> Sync to WooCommerce
//         </button>
//       </div>
//     </div>
//   )
// }

// "use client"

// import { AnimatePresence, motion } from "framer-motion"
// import {
//   ArrowRight,
//   Globe,
//   Package,
//   ShoppingBag,
//   Sparkles,
//   Trash2,
//   X
// } from "lucide-react"
// import { useEffect, useState } from "react"
// import browser from "webextension-polyfill"

// import "./style.css"

// export default function IndexPopup() {
//   const [selectedProducts, setSelectedProducts] = useState<any[]>([])
//   const [exportType, setExportType] = useState<"RAW" | "AI">("RAW")
//   const [token, setToken] = useState<string | null>(null)

//   useEffect(() => {
//     // 1. Initial Data Fetch
//     browser.storage.local.get(["selectedProducts", "token"]).then((res) => {
//       setSelectedProducts(res.selectedProducts || [])
//       setToken(res.token || null)
//     })

//     // 2. Listen for real-time selection changes from the webpage
//     const handleUpdate = (changes: any) => {
//       if (changes.selectedProducts) {
//         setSelectedProducts(changes.selectedProducts.newValue || [])
//       }
//     }
//     browser.storage.onChanged.addListener(handleUpdate)
//     return () => browser.storage.onChanged.removeListener(handleUpdate)
//   }, [])

//   const handleClear = async () => {
//     await browser.storage.local.set({ selectedProducts: [] })
//   }

//   const removeItem = async (id: string) => {
//     const updated = selectedProducts.filter((p) => p.id !== id)
//     await browser.storage.local.set({ selectedProducts: updated })
//   }

//   return (
//     <div className="w-[450px] bg-white font-sans text-black">
//       {/* Header */}
//       <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
//             <Sparkles size={20} />
//           </div>
//           <span className="text-xl font-black">
//             AICandy <span className="text-slate-300">Studio</span>
//           </span>
//         </div>
//         <button
//           onClick={handleClear}
//           className="text-slate-400 hover:text-red-500 transition-colors font-bold text-base cursor-pointer">
//           Clear All
//         </button>
//       </header>

//       <main className="p-6">
//         {/* Selection Stats */}
//         <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 mb-8 text-center">
//           <p className="text-primary font-black uppercase tracking-widest text-base mb-2">
//             Bulk Capture Engine
//           </p>
//           <h2 className="text-4xl font-black">
//             {selectedProducts.length}{" "}
//             <span className="text-slate-400">Selected</span>
//           </h2>
//         </div>

//         {/* Selected Product Tray */}
//         <div className="mb-10">
//           <h3 className="text-base font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">
//             Selected Items
//           </h3>
//           <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
//             <AnimatePresence>
//               {selectedProducts.length > 0 ? (
//                 selectedProducts.map((p) => (
//                   <motion.div
//                     key={p.id}
//                     initial={{ opacity: 0, x: -10 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     exit={{ opacity: 0, scale: 0.95 }}
//                     className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl hover:border-primary/30 transition-all group">
//                     <img
//                       src={p.img}
//                       className="w-14 h-14 rounded-xl object-cover bg-slate-100"
//                     />
//                     <div className="flex-1 min-w-0">
//                       <p className="font-bold text-black truncate">{p.title}</p>
//                       <p className="text-primary font-black">{p.price}</p>
//                     </div>
//                     <button
//                       onClick={() => removeItem(p.id)}
//                       className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
//                       <X size={18} />
//                     </button>
//                   </motion.div>
//                 ))
//               ) : (
//                 <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
//                   <Package className="mx-auto text-slate-200 mb-2" size={40} />
//                   <p className="text-slate-400 font-bold">
//                     No products selected yet.
//                   </p>
//                 </div>
//               )}
//             </AnimatePresence>
//           </div>
//         </div>

//         {/* Action Strategy Toggles */}
//         <div className="grid grid-cols-2 gap-4 mb-10">
//           <button
//             onClick={() => setExportType("RAW")}
//             className={`py-4 rounded-2xl font-black border-2 transition-all cursor-pointer ${exportType === "RAW" ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400"}`}>
//             Raw Data (Free)
//           </button>
//           <button
//             onClick={() => setExportType("AI")}
//             className={`py-4 rounded-2xl font-black border-2 transition-all cursor-pointer ${exportType === "AI" ? "border-secondary bg-secondary/5 text-secondary" : "border-slate-100 text-slate-400"}`}>
//             AI Rewrite (Pro)
//           </button>
//         </div>

//         {/* Final Execution */}
//         <div className="space-y-4">
//           <button className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:bg-black transition-all cursor-pointer shadow-xl">
//             <Globe size={24} /> Export to Sheets
//           </button>
//           <button className="w-full py-6 bg-white border-2 border-slate-200 text-black rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:border-primary transition-all cursor-pointer shadow-sm">
//             <ShoppingBag size={24} /> Sync to WooCommerce
//           </button>
//         </div>
//       </main>
//     </div>
//   )
// }

"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  Globe,
  LogIn,
  LogOut,
  Package,
  ShoppingBag,
  Sparkles,
  User,
  X
} from "lucide-react"
import { useEffect, useState } from "react"
import browser from "webextension-polyfill"

import "./style.css"

export default function IndexPopup() {
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [exportType, setExportType] = useState<"RAW" | "AI">("RAW")
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    browser.storage.local.get(["selectedProducts", "token"]).then((res) => {
      setSelectedProducts(res.selectedProducts || [])
      setToken(res.token || null)
    })

    const handleUpdate = (changes: any) => {
      if (changes.selectedProducts) {
        setSelectedProducts(changes.selectedProducts.newValue || [])
      }
      if (changes.token) {
        setToken(changes.token.newValue || null)
      }
    }
    browser.storage.onChanged.addListener(handleUpdate)
    return () => browser.storage.onChanged.removeListener(handleUpdate)
  }, [])

  const handleClear = async () => {
    await browser.storage.local.set({ selectedProducts: [] })
  }

  const handleLogout = async () => {
    await browser.storage.local.remove("token")
    setToken(null)
  }

  const removeItem = async (id: string) => {
    const updated = selectedProducts.filter((p) => p.id !== id)
    await browser.storage.local.set({ selectedProducts: updated })
  }

  const handleSyncAction = async (target: "SHEETS" | "WOO") => {
    setLoading(true)

    // Check connection status from backend
    const statusRes = await fetch(
      `${process.env.PLASMO_PUBLIC_SERVER_URL}/dashboard/overview`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    const status = await statusRes.json()

    // Conditional Modals
    if (target === "WOO" && !status.data.integrations.woocommerce) {
      setIsWooModalOpen(true)
      setLoading(false)
      return
    }

    if (target === "SHEETS" && !status.data.integrations.google) {
      setIsGoogleModalOpen(true) // Your "Login with Google" Modal
      setLoading(false)
      return
    }

    // 3. Execute Bulk Process
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/document/bulk-process`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: selectedProducts,
          mode: exportType, // 'RAW' or 'AI'
          target: target // 'SHEETS' or 'WOO'
        })
      }
    )

    const result = await res.json()
    if (result.success) {
      toast.success(`Successfully processed ${selectedProducts.length} items!`)
      await browser.storage.local.set({ selectedProducts: [] }) // Clear tray
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <div className="w-[450px] bg-white font-sans text-black p-10 text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-primary shadow-xl shadow-primary/10">
          <User size={48} />
        </div>
        <h1 className="text-3xl font-black mb-4 tracking-tight">
          Authentication Required
        </h1>
        <p className="text-slate-500 text-xl leading-relaxed mb-12 px-4">
          Please sign in to your AICandy account to access the AI Studio and
          sync data to your store.
        </p>
        <button
          onClick={() => window.open("http://localhost:3000/login", "_blank")}
          className="w-full py-6 bg-primary text-white rounded-[25px] font-black text-xl flex items-center justify-center gap-4 shadow-2xl hover:bg-indigo-700 transition-all cursor-pointer">
          <LogIn size={24} />
          Go to Sign In
        </button>
        <p className="mt-8 text-slate-400 font-bold uppercase tracking-widest text-base italic">
          Powering the next gen of dropshipping
        </p>
      </div>
    )
  }

  return (
    <div className="w-[450px] bg-white font-sans text-black">
      <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
            <Sparkles size={20} />
          </div>
          <span className="text-xl font-black">
            AICandy <span className="text-slate-300">Studio</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleClear}
            className="text-slate-400 hover:text-red-500 transition-colors font-bold text-base cursor-pointer">
            Clear
          </button>
          <button
            onClick={handleLogout}
            className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-slate-100">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 mb-8 text-center">
          <p className="text-primary font-black uppercase tracking-widest text-base mb-2">
            Selection Manager
          </p>
          <h2 className="text-4xl font-black">
            {selectedProducts.length}{" "}
            <span className="text-slate-400">Products</span>
          </h2>
        </div>

        <div className="mb-10">
          <h3 className="text-base font-black text-slate-400 uppercase tracking-widest mb-5 ml-2 flex items-center gap-2">
            <Package size={18} /> Tray Overview
          </h3>
          <div className="max-h-[320px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {selectedProducts.length > 0 ? (
                selectedProducts.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-5 p-4 bg-white border border-slate-200 rounded-3xl hover:border-primary/40 hover:shadow-lg transition-all group">
                    <div className="relative">
                      <img
                        src={p.img}
                        className="w-16 h-16 rounded-2xl object-cover bg-slate-50 border border-slate-100"
                        alt=""
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-black text-black truncate leading-tight mb-1">
                        {p.title}
                      </p>
                      <p className="text-primary font-black text-base italic">
                        {p.price}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(p.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-all cursor-pointer">
                      <X size={20} />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30">
                  <Package className="mx-auto text-slate-200 mb-4" size={56} />
                  <p className="text-slate-400 font-bold text-lg leading-relaxed">
                    Browser a store and <br /> select items to start
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <button
            onClick={() => setExportType("RAW")}
            className={`py-5 rounded-2xl font-black border-2 transition-all cursor-pointer text-lg ${exportType === "RAW" ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400"}`}>
            Raw Sync
          </button>
          <button
            onClick={() => setExportType("AI")}
            className={`py-5 rounded-2xl font-black border-2 transition-all cursor-pointer text-lg ${exportType === "AI" ? "border-secondary bg-secondary/5 text-secondary" : "border-slate-100 text-slate-400"}`}>
            AI Agent
          </button>
        </div>

        <div className="space-y-4">
          <button className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:bg-black transition-all cursor-pointer shadow-xl active:scale-[0.98]">
            <Globe size={24} /> Export to Sheets
          </button>
          <button className="w-full py-6 bg-white border-2 border-slate-200 text-black rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:border-primary transition-all cursor-pointer shadow-sm active:scale-[0.98]">
            <ShoppingBag size={24} /> Sync to WooCommerce
          </button>
        </div>
      </main>
    </div>
  )
}
