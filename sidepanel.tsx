"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  Box,
  ChevronLeft,
  Globe,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  User,
  UserPlus,
  X
} from "lucide-react"
import { useEffect, useState } from "react"
import { FcGoogle } from "react-icons/fc"
import { toast, Toaster } from "sonner"
import browser from "webextension-polyfill"

import "./style.css"

import { organizeCategories } from "~utils/organizeCategories"

// Scalable View States
type ViewState =
  | "MAIN"
  | "LOGIN"
  | "REGISTER"
  | "WOO_CONNECT"
  | "GOOGLE_CONNECT"

export default function IndexPopup() {
  const [view, setView] = useState<ViewState>("MAIN")
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [exportType, setExportType] = useState<"RAW" | "AI">("AI")
  const [isConnecting, setIsConnecting] = useState(false)

  const [formattedCategories, setFormattedCategories] = useState<any[]>([])
  const [globalCat, setGlobalCat] = useState<string>("")

  console.log(globalCat, "cat id")

  // Auth Form States
  const [authData, setAuthData] = useState({
    email: "",
    password: "",
    fullName: ""
  })
  const [wooData, setWooData] = useState({
    storeUrl: "",
    consumerKey: "",
    consumerSecret: ""
  })

  useEffect(() => {
    browser.storage.local.get(["selectedProducts", "token"]).then((res) => {
      setSelectedProducts(res.selectedProducts || [])
      setToken(res.token || null)
      // If no token, force login view
      if (!res.token) setView("LOGIN")
    })

    const handleUpdate = (changes: any) => {
      if (changes.token) {
        const newToken = changes.token.newValue
        setToken(newToken || null)
        setView(newToken ? "MAIN" : "LOGIN")
      }

      if (changes.selectedProducts) {
        console.log("Storage Updated: New products detected")
        setSelectedProducts(changes.selectedProducts.newValue || [])
      }
    }
    browser.storage.onChanged.addListener(handleUpdate)
    return () => browser.storage.onChanged.removeListener(handleUpdate)
  }, [])

  useEffect(() => {
    if (token) {
      fetch(`http://localhost:5000/api/v1/document/woo/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            const tree = organizeCategories(res.data)
            setFormattedCategories(tree)
          }
        })
        .catch((err) => console.error("Category Fetch Error:", err))
    }
  }, [token])

  console.log(formattedCategories, "for")

  // --- API Handlers ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const tid = toast.loading("Authenticating...")

    try {
      const res = await fetch(`http://localhost:5000/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authData.email,
          password: authData.password
        })
      })
      const result = await res.json()

      if (result.success) {
        await browser.storage.local.set({ token: result.data.accessToken })
        toast.success("Welcome back!", { id: tid })
        setView("MAIN")
      } else {
        toast.error(result.message || "Login failed", { id: tid })
      }
    } catch (err) {
      toast.error("Network error", { id: tid })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const tid = toast.loading("Creating account...")

    try {
      const res = await fetch(`http://localhost:5000/api/v1/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authData)
      })
      const result = await res.json()

      if (result.success) {
        toast.success("Account ready! Please login.", { id: tid })
        setView("LOGIN")
      } else {
        toast.error(result.message || "Registration failed", { id: tid })
      }
    } catch (err) {
      toast.error("Network error", { id: tid })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await browser.storage.local.remove("token")
    setToken(null)
    setView("LOGIN")
  }

  // Connect woocommerce account
  const handleConnectWoo = async () => {
    if (!wooData.storeUrl || !wooData.consumerKey || !wooData.consumerSecret) {
      return toast.error("Please provide all credentials")
    }

    setIsConnecting(true)
    try {
      const res = await fetch(
        `http://localhost:5000/api/v1/document/connect-woocommerce`,
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

  const removeItem = async (id: string) => {
    const updated = selectedProducts.filter((p) => p.id !== id)
    await browser.storage.local.set({ selectedProducts: updated })
    setSelectedProducts(updated)
  }

  const handleSyncAction = async (target: "SHEETS" | "WOO") => {
    console.log(selectedProducts, "sel")
    // Initial State Control
    setLoading(true)

    if (!token) {
      window.open(`http://localhost:3000/login`, "_blank")
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

    if (selectedProducts?.length > 3) {
      toast.error("Currently you can export up to 3 products at a time.")
      setLoading(false)
      return
    }

    const toastId = toast.loading(
      `Initializing ${target === "WOO" ? "WooCommerce" : "Sheets"} sync...`
    )

    try {
      const statusRes = await fetch(`http://localhost:5000/api/v1/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const userData = await statusRes.json()

      if (!userData.success) {
        toast.error("Session expired. Please sign in again.", { id: toastId })
        setToken(null)
        await browser.storage.local.remove("token")
        return
      }

      const { integrations } = userData?.data

      if (target === "WOO" && !integrations.woocommerce) {
        console.log("int not available")
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

      // EXECUTE BULK SYNC API
      toast.loading(
        `Processing ${selectedProducts.length} items. Dont close the popup.`,
        { id: toastId }
      )

      const response = await fetch(
        `http://localhost:5000/api/v1/document/bulk-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            items: selectedProducts,
            mode: exportType,
            target: target,
            globalCategoryId: globalCat
          })
        }
      )

      const result = await response.json()

      if (result.success) {
        // SUCCESS: Clear local storage and show feedback
        await browser.storage.local.set({ selectedProducts: [] })
        setSelectedProducts([])

        toast.success(`Success! Uploaded ${selectedProducts.length} items.`, {
          id: toastId,
          description:
            target === "WOO"
              ? "Check your WooCommerce Drafts."
              : "Check your Google Sheet."
        })
      } else {
        if (result.statusCode === 402) {
          toast.error("Plan Limit Reached", {
            id: toastId,
            description: "Upgrade your plan for more daily AI generations."
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

  // --- Styled Sub-Components ---

  const inputStyles =
    "w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-lg text-black placeholder:text-slate-300 focus:outline-none focus:border-primary transition-all"
  const labelStyles =
    "text-base font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1"

  // --- View Renders ---

  if (view === "LOGIN" || view === "REGISTER") {
    return (
      <div className="w-[450px] bg-white p-10 font-sans text-black">
        <Toaster position="top-center" richColors />
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            {view === "LOGIN" ? "Studio Sign In" : "Create Account"}
          </h1>
          <p className="text-slate-500 text-lg mt-2">
            Professional Dropshipping Automation
          </p>
        </div>

        <form
          onSubmit={view === "LOGIN" ? handleLogin : handleRegister}
          className="space-y-5">
          {view === "REGISTER" && (
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                size={20}
              />
              <input
                className={inputStyles}
                placeholder="Full Name"
                value={authData.fullName}
                onChange={(e) =>
                  setAuthData({ ...authData, fullName: e.target.value })
                }
                required
              />
            </div>
          )}
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={20}
            />
            <input
              type="email"
              className={inputStyles}
              placeholder="Email Address"
              value={authData.email}
              onChange={(e) =>
                setAuthData({ ...authData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={20}
            />
            <input
              type="password"
              className={inputStyles}
              placeholder="Password"
              value={authData.password}
              onChange={(e) =>
                setAuthData({ ...authData, password: e.target.value })
              }
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 cursor-pointer">
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : view === "LOGIN" ? (
              <LogIn />
            ) : (
              <UserPlus />
            )}
            {view === "LOGIN" ? "CONTINUE" : "REGISTER"}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-lg text-slate-500 font-medium">
            {view === "LOGIN"
              ? "New to DroppEcommerce?"
              : "Already have an account?"}
            <button
              onClick={() => setView(view === "LOGIN" ? "REGISTER" : "LOGIN")}
              className="text-primary font-bold ml-2 underline underline-offset-4 cursor-pointer">
              {view === "LOGIN" ? "Create one" : "Login instead"}
            </button>
          </p>

          <button
            // onClick={handleGoogleConnect}
            className="mt-6 w-full py-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-3 font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
            <FcGoogle size={24} /> Sign in with Google
          </button>
        </div>
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

  return (
    <div className="w-[450px] bg-white font-sans text-black">
      <Toaster position="top-center" richColors />
      {/* Your existing MAIN view JSX with Tray Overview and Sync buttons */}
      <header className="p-6 border-b border-slate-100 flex items-center justify-between">
        {/* Logo and Logout as previously implemented */}
        {/* <div className="flex items-center gap-3">
          <Sparkles className="text-primary" />
          <span className="font-black text-xl">DroppEcommerce</span>
        </div> */}
        <a href="/" className="flex items-center gap-1 group">
          <div className="">
            {/* <Sparkles size={20} className="text-white" /> */}
            {/* <img
              src={"/assets/icon128.png"}
              width="40"
              height="40"
              className="-rotate-15"
              alt="shopping-bag-icon"
            /> */}
          </div>
          <span className="text-3xl font-bold tracking-tighter">
            <span>Drop</span>
            <span className="text-primary">ecommerce</span>
          </span>
        </a>
        <button
          onClick={handleLogout}
          className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 cursor-pointer">
          <LogOut size={18} />
        </button>
      </header>

      {/* ... Rest of Main Content ... */}

      <main className="p-6">
        {/* --- 1. SELECTION STATS --- */}
        <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 mb-8 text-center shadow-sm">
          <p className="text-primary font-black uppercase tracking-widest text-base mb-2">
            Bulk Capture Engine
          </p>
          <h2 className="text-4xl font-black text-black">
            {selectedProducts?.length || 0}{" "}
            <span className="text-slate-400">Products</span>
          </h2>
        </div>

        {/* --- 2. PRODUCT TRAY --- */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5 px-2">
            <h3 className="text-base font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Package size={18} /> Selected Tray
            </h3>
            <span className="text-base font-bold text-slate-300 italic">
              {selectedProducts?.length > 0 ? "Ready to process" : "Empty"}
            </span>
          </div>

          {selectedProducts?.length > 0 && (
            <div className="mb-5">
              {/* <select
                className="w-full bg-white border-2 border-slate-200 p-4 rounded-2xl font-black text-lg text-black focus:border-primary outline-none cursor-pointer appearance-none shadow-sm"
                // style={{
                //   backgroundImage:
                //     "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
                //   backgroundRepeat: "no-repeat",
                //   backgroundPosition: "right 1rem center",
                //   backgroundSize: "1.5em"
                // }}
              >
                <option
                  onChange={(e) => setGlobalCat(e.target.value)}
                  value="">
                  Default (Uncategorized)
                </option>
                {formattedCategories.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    className="font-bold py-2">
                    {cat.displayName}
                  </option>
                ))}
              </select> */}
              <select
                value={globalCat}
                onChange={(e) => setGlobalCat(e.target.value)} // When user clicks, update state with ID
                className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-lg font-bold text-black outline-none focus:border-primary cursor-pointer transition-all">
                <option value="">Uncategorized (Default)</option>

                {/* Map through the categories you fetched from the backend */}
                {formattedCategories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="max-h-[320px] overflow-y-auto pr-2 space-y-4 custom-scrollbar min-h-[120px]">
            <AnimatePresence mode="popLayout">
              {selectedProducts?.length > 0 ? (
                selectedProducts.map((p, idx) => (
                  <motion.div
                    key={p?.id || idx}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-5 p-4 bg-white border border-slate-200 rounded-3xl hover:border-primary/40 hover:shadow-lg transition-all group relative overflow-hidden">
                    <div className="relative shrink-0">
                      <img
                        src={p?.img}
                        className="w-16 h-16 rounded-2xl object-cover bg-slate-50 border border-slate-100 shadow-sm"
                        alt=""
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/150?text=No+Image"
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-black text-black truncate leading-tight mb-1">
                        {p?.title}
                      </p>
                      <p className="text-primary font-black text-base italic flex items-center gap-1">
                        <Tag size={14} className="opacity-40" />
                        {p?.price}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(p?.id)}
                      className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer group-hover:opacity-100"
                      title="Remove Item">
                      <X size={20} />
                    </button>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30">
                  <Package className="mx-auto text-slate-200 mb-4" size={56} />
                  <p className="text-slate-400 font-bold text-lg leading-relaxed px-10">
                    Browse Amazon or Daraz and select products to fill your tray
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- 3. PROCESSING MODE TOGGLES --- */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <button
            onClick={() => setExportType("AI")}
            className={`py-5 rounded-2xl font-black border-2 transition-all cursor-pointer text-lg flex items-center justify-center gap-2 ${
              exportType === "AI"
                ? "border-primary bg-secondary/5 text-primary shadow-inner"
                : "border-slate-100 text-slate-400 bg-white hover:bg-slate-50"
            }`}>
            <Sparkles size={18} />
            AI Agent
          </button>
          <button
            // onClick={() => setExportType("RAW")}
            className={`py-5 rounded-2xl font-black border-2 transition-all cursor-pointer text-lg flex items-center justify-center gap-2 ${
              exportType === "RAW"
                ? "border-primary bg-primary/5 text-primary shadow-inner"
                : "border-slate-100 text-slate-400 bg-white hover:bg-slate-50"
            }`}>
            <Box size={18} />
            Raw Sync
          </button>
        </div>

        {/* --- 4. EXECUTION ACTIONS --- */}
        <div className="space-y-4">
          {/* <button
            onClick={() => handleSyncAction("SHEETS")}
            disabled={loading || selectedProducts?.length === 0}
            className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:bg-black transition-all cursor-pointer shadow-xl active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Globe size={24} />}
            Export to Sheets
          </button> */}

          <button
            onClick={() => handleSyncAction("WOO")}
            disabled={loading || selectedProducts?.length === 0}
            className="w-full py-6 bg-white border-2 border-slate-200 text-black rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:border-primary transition-all cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed">
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ShoppingBag size={24} />
            )}
            Upload to WooCommerce
          </button>
        </div>

        {/* Footer Credit */}
        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-center gap-2 text-slate-300 font-bold text-base uppercase tracking-tighter">
          <ShieldCheck size={16} />
          <span>End-to-End Encrypted Data Pipeline</span>
        </div>
      </main>
    </div>
  )
}
