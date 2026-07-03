"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  ChevronLeft,
  Globe,
  Loader2,
  LogIn,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  X
} from "lucide-react"
import { useEffect, useState } from "react"
import { FcGoogle } from "react-icons/fc"
import { toast, Toaster } from "sonner"
import browser from "webextension-polyfill"

import "./style.css"

type ViewState = "MAIN" | "WOO_CONNECT" | "GOOGLE_CONNECT" | "SYNCING"

export default function IndexPopup() {
  const [view, setView] = useState<"MAIN" | "WOO_CONNECT" | "GOOGLE_CONNECT">(
    "MAIN"
  )
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [exportType, setExportType] = useState<"RAW" | "AI">("RAW")
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [wooData, setWooData] = useState({
    storeUrl: "",
    consumerKey: "",
    consumerSecret: ""
  })

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

  const handleConnectWoo = async () => {
    if (!wooData.storeUrl || !wooData.consumerKey || !wooData.consumerSecret) {
      return toast.error("Please provide all credentials")
    }

    setIsConnecting(true)
    try {
      const res = await fetch(
        `https://assignment-writer-server.onrender.com/api/v1/document/connect-woocommerce`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(wooData)
        }
      )
      const result = await res.json()

      if (result?.success) {
        toast.success("WooCommerce Store Connected!")
        setView("MAIN")
      } else {
        toast.error(result?.message || "Invalid API keys")
      }
    } catch (error) {
      toast.error("Network error during connection")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleGoogleConnect = () => {
    window.open(
      `https://assignment-writer-server.onrender.com/api/v1/auth/google`,
      "_blank"
    )
  }

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

  // const handleSyncAction = async (target: "SHEETS" | "WOO") => {
  //   setLoading(true)

  //   if (!token) {
  //       window.open(`${process.env.PLASMO_PUBLIC_SITE_URL}/login`, "_blank");
  //       return;
  //   }

  //   try{
  //     const response = await fetch(`${process.env.PLASMO_PUBLIC_SERVER_URL}/user/me`, {
  //     headers: { Authorization: `Bearer ${token}` }
  //     });
  //     const result = await response.json();
  //     if (!result.success) {
  //       setToken(null);
  //       await browser.storage.local.remove("token");
  //       return;
  //     }

  //     const { integrations } = result.data;

  //     if (target === "WOO") {
  //        if (!integrations.woocommerce) {
  //           setView("WOO_CONNECT");
  //           setLoading(false);
  //           return;
  //         }
  //     }

  //     if (target === "SHEETS") {
  //       if (!integrations.googleSheets) {
  //         setView("GOOGLE_CONNECT");
  //         setLoading(false);
  //         return;
  //       }
  //     }

  //     await executeBulkSync(target);

  //   }catch(error){
  //       toast.error("Connection error. Please try again.");
  //   }finally {
  //     setLoading(false);
  //   }

  //   // Check connection status from backend
  //   const statusRes = await fetch(
  //     `${process.env.PLASMO_PUBLIC_SERVER_URL}/dashboard/overview`,
  //     {
  //       headers: { Authorization: `Bearer ${token}` }
  //     }
  //   )
  //   const status = await statusRes.json()

  //   // Conditional Modals
  //   if (target === "WOO" && !status.data.integrations.woocommerce) {
  //     setIsWooModalOpen(true)
  //     setLoading(false)
  //     return
  //   }

  //   if (target === "SHEETS" && !status.data.integrations.google) {
  //     setIsGoogleModalOpen(true) // Your "Login with Google" Modal
  //     setLoading(false)
  //     return
  //   }

  //   // 3. Execute Bulk Process
  //   const res = await fetch(
  //     `${process.env.PLASMO_PUBLIC_SERVER_URL}/document/bulk-process`,
  //     {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`
  //       },
  //       body: JSON.stringify({
  //         items: selectedProducts,
  //         mode: exportType, // 'RAW' or 'AI'
  //         target: target // 'SHEETS' or 'WOO'
  //       })
  //     }
  //   )

  //   const result = await res.json()
  //   if (result.success) {
  //     toast.success(`Successfully processed ${selectedProducts.length} items!`)
  //     await browser.storage.local.set({ selectedProducts: [] }) // Clear tray
  //   }
  //   setLoading(false)
  // }

  const handleSyncAction = async (target: "SHEETS" | "WOO") => {
    // Initial State Control
    setLoading(true)

    if (!token) {
      window.open(`https://assignment-writer-app.vercel.app/login`, "_blank")
      setLoading(false)
      return
    }

    if (selectedProducts.length === 0) {
      toast.error(
        "No products selected. Please select items from the store first."
      )
      setLoading(false)
      return
    }

    const toastId = toast.loading(
      `Initializing ${target === "WOO" ? "WooCommerce" : "Sheets"} sync...`
    )

    try {
      const statusRes = await fetch(
        `https://assignment-writer-server.onrender.com/api/v1/user/me`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      console.log("Status Response:", statusRes)

      const userData = await statusRes.json()
      console.log("User Data:", userData)

      if (!userData.success) {
        toast.error("Session expired. Please sign in again.", { id: toastId })
        setToken(null)
        await browser.storage.local.remove("token")
        return
      }

      const { integrations } = userData?.data
      console.log(integrations)

      if (target === "WOO" && !integrations.woocommerce) {
        toast.dismiss(toastId)
        setView("WOO_CONNECT")
        setLoading(false)
        return
      }

      if (target === "SHEETS" && !integrations.googleSheets) {
        toast.dismiss(toastId)
        setView("GOOGLE_CONNECT")
        setLoading(false)
        return
      }

      // 4. EXECUTE BULK SYNC API
      // If the code reaches here, all connections are valid
      toast.loading(
        `Engine running: Processing ${selectedProducts.length} items...`,
        { id: toastId }
      )

      const response = await fetch(
        `https://assignment-writer-server.onrender.com/api/v1/document/bulk-sync`,
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

      const result = await response.json()

      console.log("Bulk Sync Result:", result)

      if (result.success) {
        // 5. SUCCESS: Clear local storage and show feedback
        await browser.storage.local.set({ selectedProducts: [] })
        setSelectedProducts([])

        toast.success(
          `Success! Synchronized ${selectedProducts.length} items.`,
          {
            id: toastId,
            description:
              target === "WOO"
                ? "Check your WooCommerce Drafts."
                : "Check your Google Sheet."
          }
        )

        // Optional: Redirect user to their dashboard to see the records
        // window.open(`${process.env.PLASMO_PUBLIC_SITE_URL}/my-generations`, "_blank");
      } else {
        // Handle Specific Failures (e.g. Plan limits)
        if (result.statusCode === 402) {
          toast.error("Plan Limit Reached", {
            id: toastId,
            description: "Upgrade to Starter for more daily AI generations."
          })
        } else {
          toast.error(result.message || "Bulk synchronization failed", {
            id: toastId
          })
        }
      }
    } catch (error) {
      console.error("Sync Error:", error)
      toast.error("Internal connection error. Please try again.", {
        id: toastId
      })
    } finally {
      setLoading(false)
    }
  }

  console.log(token, "my token")

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
          onClick={() =>
            window.open(
              `https://assignment-writer-app.vercel.app/login`,
              "_blank"
            )
          }
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

  if (view === "WOO_CONNECT") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[450px] bg-white p-8 font-sans">
        <button
          onClick={() => setView("MAIN")}
          className="mb-8 flex items-center gap-3 text-slate-400 hover:text-black font-bold text-xl cursor-pointer group">
          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />{" "}
          Back
        </button>

        <div className="flex flex-col items-center text-center mb-10">
          <div className="p-5 bg-purple-50 rounded-[30px] mb-6 border border-purple-100">
            <ShoppingBag className="text-purple-600" size={40} />
          </div>
          <h2 className="text-3xl font-black mb-2">Connect Store</h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            Enter your WooCommerce REST API details to sync products directly to
            your marketplace.
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <div className="space-y-2">
            <label className="text-base font-black uppercase text-slate-400 ml-2">
              Store URL
            </label>
            <input
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-lg focus:border-purple-500 outline-none transition-all"
              placeholder="https://yourstore.com"
              value={wooData.storeUrl}
              onChange={(e) =>
                setWooData({ ...wooData, storeUrl: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-base font-black uppercase text-slate-400 ml-2">
              Consumer Key
            </label>
            <input
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-lg focus:border-purple-500 outline-none transition-all"
              placeholder="ck_xxxxxxxx..."
              value={wooData.consumerKey}
              onChange={(e) =>
                setWooData({ ...wooData, consumerKey: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-base font-black uppercase text-slate-400 ml-2">
              Consumer Secret
            </label>
            <input
              type="password"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-lg focus:border-purple-500 outline-none transition-all"
              placeholder="cs_xxxxxxxx..."
              value={wooData.consumerSecret}
              onChange={(e) =>
                setWooData({ ...wooData, consumerSecret: e.target.value })
              }
            />
          </div>
        </div>

        <button
          onClick={handleConnectWoo}
          disabled={isConnecting}
          className="w-full py-6 bg-purple-600 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 shadow-xl hover:bg-purple-700 transition-all cursor-pointer">
          {isConnecting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ShieldCheck />
          )}
          {isConnecting ? "VERIFYING..." : "AUTHORIZE STORE"}
        </button>
      </motion.div>
    )
  }

  if (view === "GOOGLE_CONNECT") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[450px] bg-white p-10 text-center font-sans">
        <button
          onClick={() => setView("MAIN")}
          className="mb-10 flex items-center gap-2 text-slate-400 hover:text-black font-bold text-xl cursor-pointer">
          <ChevronLeft /> Back to Tray
        </button>

        <div className="p-6 bg-blue-50 rounded-[40px] mb-8 inline-block">
          <Globe className="text-blue-600" size={60} />
        </div>

        <h2 className="text-4xl font-black mb-6 tracking-tight">
          Sync Workspace
        </h2>
        <p className="text-slate-500 text-xl leading-relaxed mb-12 px-2">
          To export items to{" "}
          <span className="text-black font-bold">Google Sheets</span>, AICandy
          needs permission to manage files in your Drive.
        </p>

        <button
          onClick={handleGoogleConnect}
          className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 shadow-xl hover:bg-blue-700 transition-all cursor-pointer">
          <FcGoogle size={32} /> Grant Access
        </button>

        <p className="mt-8 text-slate-400 text-base italic">
          A new tab will open to finalize your Google connection.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="w-[450px] bg-white font-sans text-black">
      <Toaster position="top-center" expand={true} richColors />
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
          <button
            onClick={() => handleSyncAction("SHEETS")}
            className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:bg-black transition-all cursor-pointer shadow-xl active:scale-[0.98]">
            <Globe size={24} /> Export to Sheets
          </button>
          <button
            onClick={() => handleSyncAction("WOO")}
            className="w-full py-6 bg-white border-2 border-slate-200 text-black rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:border-primary transition-all cursor-pointer shadow-sm active:scale-[0.98]">
            <ShoppingBag size={24} /> Sync to WooCommerce
          </button>
        </div>
      </main>
    </div>
  )
}
