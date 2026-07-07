import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import {
  Store,
  Palette,
  Shirt,
  Cpu,
  Package,
  Plus,
  X,
  Phone,
  Check,
  Megaphone,
  Loader2,
  TrendingDown,
  TrendingUp,
  ThumbsUp,
  Mail,
  LogIn,
  LogOut,
  Gavel,
  Clock,
  Shield,
  Trash2,
  Wallet,
} from "lucide-react";

const CATEGORIES = [
  { id: "handmade", label: "هاند ميد", icon: Palette, accent: "#C9A227" },
  { id: "clothes", label: "ملابس", icon: Shirt, accent: "#E0674F" },
  { id: "electronics", label: "إلكترونيات", icon: Cpu, accent: "#4FA3A0" },
  { id: "other", label: "أخرى", icon: Package, accent: "#9AA5B1" },
];

const SEED_PRODUCTS = [
  {
    id: "seed-1",
    name: "شنطة جلد يدوي",
    category: "handmade",
    price: "450",
    seller: "منى عبد الله",
    phone: "01012345678",
    desc: "شنطة جلد طبيعي، خياطة يدوية بالكامل، تصميم بسيط وعملي.",
    votes: { fair: 6, expensive: 2, cheap: 0 },
  },
  {
    id: "seed-2",
    name: "لوحة موزاييك",
    category: "handmade",
    price: "600",
    seller: "كريم فتحي",
    phone: "01098765432",
    desc: "لوحة حائط موزاييك مصنوعة يدويًا، مقاس ٤٠×٥٠ سم.",
    votes: { fair: 3, expensive: 5, cheap: 0 },
  },
  {
    id: "seed-3",
    name: "جاكيت دنيم",
    category: "clothes",
    price: "380",
    seller: "سارة يوسف",
    phone: "01234567890",
    desc: "جاكيت دنيم مقاس L، حالة ممتازة، لبس مرة واحدة.",
    votes: { fair: 4, expensive: 1, cheap: 2 },
  },
  {
    id: "seed-4",
    name: "سماعة بلوتوث",
    category: "electronics",
    price: "550",
    seller: "أحمد جمال",
    phone: "01555555555",
    desc: "سماعة بلوتوث جديدة، بطارية تدوم ١٢ ساعة، ضمان ٦ شهور.",
    votes: { fair: 7, expensive: 3, cheap: 1 },
  },
];

const STORAGE_KEY = "products";
const VOTED_KEY = "dakakeen_voted";
const USER_KEY = "dakakeen_user";
const USERS_KEY = "users";
const AD_PHONE = "01115979576";
const AD_PHONE_DISPLAY = "0111 597 9576";
const FEE_RATE = 0.01;

async function getShared(key) {
  const snap = await getDoc(doc(db, "dakakeen", key));
  return snap.exists() ? snap.data().value : null;
}

async function setShared(key, value) {
  await setDoc(doc(db, "dakakeen", key), { value });
}

function calcFee(price) {
  const n = Number(price) || 0;
  return (n * FEE_RATE).toFixed(2);
}
const DAY_MS = 24 * 60 * 60 * 1000;
const ADMIN_EMAIL = "mahmoudabougabal2009@gmail.com";
const BANNED_KEYWORDS = ["رهن", "مرهون", "مرهونات", "سيكو"];

function containsBannedContent(text) {
  const normalized = (text || "").toLowerCase();
  return BANNED_KEYWORDS.some((word) => normalized.includes(word));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatTimeLeft(ms) {
  if (ms <= 0) return "انتهى المزاد";
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s} متبقية`;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function PriceRating({ product, hasVoted, onVote }) {
  const votes = product.votes || { fair: 0, expensive: 0, cheap: 0 };
  const total = votes.fair + votes.expensive + votes.cheap;

  let verdict = null;
  if (total >= 3) {
    if (votes.expensive > votes.fair && votes.expensive > votes.cheap) {
      verdict = { text: "الناس شايفة السعر غالي", color: "#E0674F", Icon: TrendingUp };
    } else if (votes.cheap > votes.fair && votes.cheap > votes.expensive) {
      verdict = { text: "الناس شايفة السعر رخيص", color: "#4FA3A0", Icon: TrendingDown };
    } else {
      verdict = { text: "الناس شايفة السعر مناسب", color: "#C9A227", Icon: ThumbsUp };
    }
  }

  const options = [
    { type: "cheap", label: "رخيص", Icon: TrendingDown },
    { type: "fair", label: "مناسب", Icon: ThumbsUp },
    { type: "expensive", label: "غالي", Icon: TrendingUp },
  ];

  return (
    <div className="pt-3 border-t flex flex-col gap-2" style={{ borderColor: "#3A4759" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: "#9AA5B1" }}>
          السعر ده في محله؟
        </span>
        {total > 0 && (
          <span className="text-xs" style={{ color: "#6b7684" }}>
            {total} صوت
          </span>
        )}
      </div>

      {verdict && (
        <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: verdict.color }}>
          <verdict.Icon size={13} />
          {verdict.text}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5">
        {options.map((o) => (
          <button
            key={o.type}
            disabled={hasVoted}
            onClick={() => onVote(o.type)}
            className="flex items-center justify-center gap-1 text-xs py-1.5 rounded-md disabled:cursor-not-allowed"
            style={{
              background: "#1B2430",
              color: hasVoted ? "#5b6572" : "#F4EFE6",
              border: "1px solid #3A4759",
            }}
          >
            <o.Icon size={12} />
            {o.label} ({votes[o.type] || 0})
          </button>
        ))}
      </div>
    </div>
  );
}

function PaymentPanel({ price, label }) {
  const fee = calcFee(price);

  return (
    <div
      className="rounded-md p-3 flex flex-col gap-2"
      style={{ background: "#1B2430", border: "1px solid #3A4759" }}
    >
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "#9AA5B1" }}>{label || "السعر"}</span>
        <span className="font-display font-bold" style={{ color: "#F4EFE6" }}>
          {price} ج.م
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "#9AA5B1" }}>عمولة المنصة (١٪)</span>
        <span className="font-display font-bold" style={{ color: "#C9A227" }}>
          {fee} ج.م
        </span>
      </div>
    </div>
  );
}

function AuctionBlock({ product, currentUser, now, onBid, onRequireLogin }) {
  const [amount, setAmount] = useState("");
  const bids = product.bids || [];
  const highest = bids.reduce(
    (max, b) => (b.amount > max ? b.amount : max),
    Number(product.price) || 0
  );
  const topBid = bids.length
    ? bids.reduce((a, b) => (b.amount > a.amount ? b : a))
    : null;
  const timeLeft = (product.auctionEnd || 0) - now;
  const ended = timeLeft <= 0;

  function submitBid(e) {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    const val = Number(amount);
    if (!val || val <= highest) return;
    onBid(val);
    setAmount("");
  }

  return (
    <div className="pt-3 border-t flex flex-col gap-2.5" style={{ borderColor: "#3A4759" }}>
      <div className="flex items-center justify-between">
        <span
          className="flex items-center gap-1 text-xs font-bold"
          style={{ color: "#E0674F" }}
        >
          <Gavel size={13} />
          مزاد
        </span>
        <span
          className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: ended ? "#9AA5B1" : "#C9A227" }}
        >
          <Clock size={12} />
          {formatTimeLeft(timeLeft)}
        </span>
      </div>

      <PaymentPanel
        price={highest}
        label={bids.length ? "أعلى عرض" : "سعر البداية"}
      />

      {ended ? (
        <div className="text-xs font-semibold" style={{ color: "#4FA3A0" }}>
          {topBid ? `فاز بالمزاد: ${topBid.name}` : "المزاد انتهى من غير عروض"}
        </div>
      ) : (
        <form onSubmit={submitBid} className="flex gap-2">
          <input
            type="number"
            min={highest + 1}
            placeholder={`أكتر من ${highest}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 rounded-md text-sm outline-none"
            style={{ background: "#1B2430", color: "#F4EFE6", border: "1px solid #3A4759" }}
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-md text-xs font-bold whitespace-nowrap"
            style={{ background: "#E0674F", color: "#1B2430" }}
          >
            {currentUser ? "زايد" : "سجل دخول للمزايدة"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("handmade");
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [votedIds, setVotedIds] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: "", email: "" });
  const [loginError, setLoginError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [showAdmin, setShowAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [formError, setFormError] = useState("");

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const [form, setForm] = useState({
    name: "",
    category: "handmade",
    price: "",
    seller: "",
    phone: "",
    desc: "",
    isAuction: false,
    imageUrl: "",
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getShared(STORAGE_KEY);
        if (!cancelled && data) {
          setProducts(data);
        } else if (!cancelled) {
          setProducts(SEED_PRODUCTS);
          await setShared(STORAGE_KEY, SEED_PRODUCTS);
        }
      } catch (e) {
        if (!cancelled) setProducts(SEED_PRODUCTS);
      } finally {
        if (!cancelled) setLoading(false);
      }
      try {
        const voted = localStorage.getItem(VOTED_KEY);
        if (!cancelled && voted) setVotedIds(JSON.parse(voted));
      } catch (e) {
        // no votes yet, that's fine
      }
      try {
        const user = localStorage.getItem(USER_KEY);
        if (!cancelled && user) setCurrentUser(JSON.parse(user));
      } catch (e) {
        // no session yet, that's fine
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function addProduct(e) {
    e.preventDefault();
    if (!currentUser) {
      setShowForm(false);
      setShowLogin(true);
      return;
    }
    setFormError("");
    if (!form.name.trim() || !form.price.trim() || !form.seller.trim()) return;
    if (containsBannedContent(form.name) || containsBannedContent(form.desc)) {
      setFormError("المنتج ده مخالف لقواعد النشر في دكاكين.");
      return;
    }
    setSaving(true);
    const newProduct = {
      id: uid(),
      ...form,
      votes: { fair: 0, expensive: 0, cheap: 0 },
      bids: [],
      auctionEnd: form.isAuction ? Date.now() + DAY_MS : null,
      ownerEmail: currentUser.email,
    };
    const updated = [newProduct, ...products];
    setProducts(updated);
    try {
      await setShared(STORAGE_KEY, updated);
    } catch (e) {
      // keep local state even if save fails
    }
    setSaving(false);
    setShowForm(false);
    setActiveCategory(form.category);
    setForm({
      name: "",
      category: "handmade",
      price: "",
      seller: "",
      phone: "",
      desc: "",
      isAuction: false,
      imageUrl: "",
    });
  }

  async function placeBid(productId, amount) {
    const updated = products.map((p) =>
      p.id === productId
        ? {
            ...p,
            bids: [
              ...(p.bids || []),
              { name: currentUser.name || currentUser.email, email: currentUser.email, amount },
            ],
          }
        : p
    );
    setProducts(updated);
    try {
      await setShared(STORAGE_KEY, updated);
    } catch (e) {
      // bid still reflected locally even if save fails
    }
  }

  async function login(e) {
    e.preventDefault();
    setLoginError("");
    if (!loginForm.name.trim()) {
      setLoginError("اكتب اسمك");
      return;
    }
    if (!isValidEmail(loginForm.email)) {
      setLoginError("اكتب إيميل صحيح");
      return;
    }
    const user = { name: loginForm.name.trim(), email: loginForm.email.trim() };
    setCurrentUser(user);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      // session still active locally even if save fails
    }
    let userList = [];
    try {
      const data = await getShared(USERS_KEY);
      if (data) userList = data;
    } catch (e) {
      userList = [];
    }
    if (!userList.some((u) => u.email === user.email)) {
      userList = [...userList, { ...user, joinedAt: Date.now() }];
      try {
        await setShared(USERS_KEY, userList);
      } catch (e) {
        // registry update failed, session still works
      }
    }
    setShowLogin(false);
    setLoginForm({ name: "", email: "" });
  }

  async function deleteProduct(productId) {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    try {
      await setShared(STORAGE_KEY, updated);
    } catch (e) {
      // deletion still reflected locally even if save fails
    }
  }

  async function openAdminPanel() {
    setShowAdmin(true);
    try {
      const data = await getShared(USERS_KEY);
      setAllUsers(data || []);
    } catch (e) {
      setAllUsers([]);
    }
  }

  async function logout() {
    setCurrentUser(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      // ignore
    }
  }

  async function vote(productId, type) {
    if (votedIds.includes(productId)) return;
    const updated = products.map((p) =>
      p.id === productId
        ? {
            ...p,
            votes: {
              fair: p.votes?.fair || 0,
              expensive: p.votes?.expensive || 0,
              cheap: p.votes?.cheap || 0,
              [type]: (p.votes?.[type] || 0) + 1,
            },
          }
        : p
    );
    setProducts(updated);
    const newVoted = [...votedIds, productId];
    setVotedIds(newVoted);
    try {
      await setShared(STORAGE_KEY, updated);
      localStorage.setItem(VOTED_KEY, JSON.stringify(newVoted));
    } catch (e) {
      // vote still reflected locally even if save fails
    }
  }

  function copyPhone() {
    navigator.clipboard?.writeText(AD_PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const filtered = products.filter((p) => p.category === activeCategory);
  const activeCat = CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen w-full"
      style={{
        background: "#1B2430",
        color: "#F4EFE6",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;900&family=Cairo:wght@400;600;700&display=swap');
        .font-display { font-family: 'Tajawal', sans-serif; }
        .rope { width: 1px; background: #6b6355; }
        .sign-shadow { box-shadow: 0 6px 14px rgba(0,0,0,0.35); }
      `}</style>

      {/* Header */}
      <header className="border-b" style={{ borderColor: "#2E3B4E" }}>
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store size={26} style={{ color: "#C9A227" }} />
            <span className="font-display text-2xl font-bold">دكاكين</span>
          </div>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="hidden sm:flex items-center gap-1" style={{ color: isAdmin ? "#C9A227" : "#9AA5B1" }}>
                  {isAdmin && <Shield size={13} />}
                  {currentUser.name}
                </span>
                {isAdmin && (
                  <button
                    onClick={openAdminPanel}
                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-md font-semibold"
                    style={{ background: "#C9A227", color: "#1B2430" }}
                  >
                    <Shield size={14} />
                    لوحة الأدمن
                  </button>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-xs px-3 py-2 rounded-md"
                  style={{ background: "#242F3F", color: "#F4EFE6", border: "1px solid #3A4759" }}
                >
                  <LogOut size={14} />
                  خروج
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md"
                style={{ background: "#242F3F", color: "#F4EFE6", border: "1px solid #3A4759" }}
              >
                <LogIn size={14} />
                تسجيل دخول
              </button>
            )}
            <button
              onClick={() => {
                setFormError("");
                currentUser ? setShowForm(true) : setShowLogin(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md font-semibold text-sm transition-transform hover:scale-[1.03]"
              style={{ background: "#C9A227", color: "#1B2430" }}
            >
              <Plus size={16} />
              أضف منتج
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 pt-10 pb-6 text-center">
        <p
          className="text-xs tracking-wide mb-3 font-semibold"
          style={{ color: "#9AA5B1" }}
        >
          سوق مفتوح لأي حد عايز يبيع أو يشتري
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-black leading-tight mb-3">
          دكانك على السوق، من غير ما تفتح محل
        </h1>
        <p className="max-w-xl mx-auto" style={{ color: "#C8CDD4" }}>
          اعرض شغلك، دور على اللي محتاجه، وكلم البائع على طول. كل قسم في
          دكاكين له ركن مستقل.
        </p>
      </section>

      {/* Category signs (signature nav) */}
      <nav className="max-w-5xl mx-auto px-5">
        <div
          className="w-full h-0.5 mb-0"
          style={{ background: "#6b6355" }}
        />
        <div className="flex justify-center gap-8 sm:gap-14 flex-wrap">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex flex-col items-center group"
              >
                <div className="flex gap-3">
                  <div className="rope h-3" />
                  <div className="rope h-3" />
                </div>
                <div
                  className="sign-shadow px-4 py-3 rounded-sm border-2 mt-0 flex flex-col items-center gap-1 transition-transform group-hover:-translate-y-0.5"
                  style={{
                    background: isActive ? cat.accent : "#242F3F",
                    borderColor: isActive ? cat.accent : "#3A4759",
                    color: isActive ? "#1B2430" : "#F4EFE6",
                    minWidth: "104px",
                  }}
                >
                  <Icon size={20} />
                  <span className="font-display text-sm font-bold">
                    {cat.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Products */}
      <main className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex items-center gap-2 mb-6">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: activeCat.accent }}
          />
          <h2 className="font-display text-xl font-bold">
            قسم {activeCat.label}
          </h2>
          <span className="text-sm" style={{ color: "#9AA5B1" }}>
            ({filtered.length} منتج)
          </span>
        </div>

        {loading ? (
          <div
            className="flex items-center gap-2 justify-center py-16"
            style={{ color: "#9AA5B1" }}
          >
            <Loader2 className="animate-spin" size={18} />
            بنجيب المنتجات...
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-16 rounded-lg border border-dashed"
            style={{ borderColor: "#3A4759", color: "#9AA5B1" }}
          >
            لسه مفيش منتجات في القسم ده. كن أول واحد يضيف!
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="rounded-lg p-5 flex flex-col gap-3 border"
                style={{ background: "#242F3F", borderColor: "#3A4759" }}
              >
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-36 object-cover rounded-md"
                    style={{ border: "1px solid #3A4759" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-md flex items-center justify-center font-display font-black text-lg shrink-0"
                    style={{ background: activeCat.accent, color: "#1B2430" }}
                  >
                    {p.name.trim().charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold leading-tight">
                      {p.name}
                    </h3>
                    <p className="text-xs" style={{ color: "#9AA5B1" }}>
                      البائع: {p.seller}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="p-1.5 rounded-md shrink-0"
                      style={{ background: "#1B2430", color: "#E0674F" }}
                      title="امسح المنتج"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {p.desc && (
                  <p className="text-sm leading-relaxed" style={{ color: "#C8CDD4" }}>
                    {p.desc}
                  </p>
                )}

                {p.isAuction ? (
                  <AuctionBlock
                    product={p}
                    currentUser={currentUser}
                    now={now}
                    onBid={(amount) => placeBid(p.id, amount)}
                    onRequireLogin={() => setShowLogin(true)}
                  />
                ) : (
                  <>
                    <div className="mt-auto pt-3 border-t flex flex-col gap-3" style={{ borderColor: "#3A4759" }}>
                      <PaymentPanel price={p.price} />
                      {p.phone && (
                        <a
                          href={`tel:${p.phone}`}
                          className="flex items-center justify-center gap-1.5 text-xs py-2 rounded-md"
                          style={{ background: "#1B2430", color: "#F4EFE6", border: "1px solid #3A4759" }}
                        >
                          <Phone size={13} />
                          كلم البائع
                        </a>
                      )}
                    </div>

                    <PriceRating
                      product={p}
                      hasVoted={votedIds.includes(p.id)}
                      onVote={(type) => vote(p.id, type)}
                    />
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Ads section */}
      <section className="max-w-5xl mx-auto px-5 pb-14">
        <div
          className="rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between"
          style={{ background: "#242F3F", border: "1px solid #3A4759" }}
        >
          <div className="flex items-start gap-3">
            <Megaphone size={22} style={{ color: "#E0674F" }} className="shrink-0 mt-1" />
            <div>
              <h3 className="font-display font-bold mb-1">
                عايز منتجك يظهر الأول؟
              </h3>
              <p className="text-sm" style={{ color: "#C8CDD4" }}>
                حوّل قيمة الإعلان على فودافون كاش، وابعتلنا اسم المنتج
                وسكرين شوت التحويل عشان نظبطلك الظهور المميز.
              </p>
            </div>
          </div>
          <a
            href={`tel:${AD_PHONE}`}
            onClick={copyPhone}
            className="flex items-center gap-3 px-4 py-3 rounded-md whitespace-nowrap"
            style={{ background: "#1B2430", border: "1px solid #C9A227" }}
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[10px] font-semibold" style={{ color: copied ? "#4FA3A0" : "#9AA5B1" }}>
                {copied ? "اتنسخ الرقم — افتح فودافون كاش" : "فودافون كاش"}
              </span>
              <span
                className="font-display font-black text-base"
                style={{ color: "#C9A227", direction: "ltr" }}
              >
                0111 597 9576
              </span>
            </div>
            {copied ? (
              <Check size={16} style={{ color: "#4FA3A0" }} />
            ) : (
              <Wallet size={16} style={{ color: "#9AA5B1" }} />
            )}
          </a>
        </div>
      </section>

      <footer
        className="text-center text-xs py-6 border-t flex flex-col gap-1"
        style={{ borderColor: "#2E3B4E", color: "#6b7684" }}
      >
        <span>دكاكين — سوق تجريبي، المنتجات هنا يضيفها الزوار مباشرة.</span>
        <span>
          ممنوع نشر بضائع مرهونة، خدمات تمويل أو رهن، أو محتوى للبالغين —
          أي مخالفة بتتمسح.
        </span>
      </footer>

      {/* Add product modal */}
      {showForm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowForm(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={addProduct}
            className="w-full max-w-md rounded-lg p-6 flex flex-col gap-4"
            style={{ background: "#242F3F", border: "1px solid #3A4759" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">أضف منتجك</h3>
              <button type="button" onClick={() => setShowForm(false)}>
                <X size={20} style={{ color: "#9AA5B1" }} />
              </button>
            </div>

            <p className="text-xs -mt-1" style={{ color: "#6b7684" }}>
              ممنوع نشر بضائع مرهونة، خدمات تمويل أو رهن، أو أي محتوى للبالغين
              أو غير لائق. أي مخالفة بتتمسح فورًا.
            </p>

            {formError && (
              <p className="text-xs font-semibold" style={{ color: "#E0674F" }}>
                {formError}
              </p>
            )}

            <input
              required
              placeholder="اسم المنتج"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2.5 rounded-md text-sm outline-none"
              style={{ background: "#1B2430", color: "#F4EFE6", border: "1px solid #3A4759" }}
            />

            <input
              placeholder="رابط صورة المنتج (اختياري)"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="px-3 py-2.5 rounded-md text-sm outline-none"
              style={{ background: "#1B2430", color: "#F4EFE6", border: "1px solid #3A4759" }}
            />
            <p className="text-xs -mt-2" style={{ color: "#6b7684" }}>
              حط رابط صورة مباشر بيخلص بـ .jpg أو .png (زي رابط من Imgur).
              روابط مشاركة جوجل درايف أو جوجل فوتوز غالبًا مش هتشتغل هنا.
            </p>

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2.5 rounded-md text-sm outline-none"
              style={{ background: "#1B2430", color: "#F4EFE6", border: "1px solid #3A4759" }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <input
              required
              placeholder={form.isAuction ? "سعر البداية (جنيه)" : "السعر (جنيه)"}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="px-3 py-2.5 rounded-md text-sm outline-none"
              style={{ background: "#1B2430", color: "#F4EFE6", border: "1px solid #3A4759" }}
            />

            <label
              className="flex items-center gap-2 text-sm px-1 py-1 cursor-pointer select-none"
              style={{ color: "#C8CDD4" }}
            >
              <input
                type="checkbox"
                checked={form.isAuction}
                onChange={(e) => setForm({ ...form, isAuction: e.target.checked })}
              />
              <Gavel size={14} />
              اعمله مزاد لمدة يوم (٢٤ ساعة)
            </label>

            <input
              required
              placeholder="اسمك (البائع)"
              value={form.seller}
              onChange={(e) => setForm({ ...form, seller: e.target.value })}
              className="px-3 py-2.5 rounded-md text-sm outline-none"
              style={{ background: "#1B2430", color: "#F4EFE6", border: "1px solid #3A4759" }}
            />

            <input
              placeholder="رقم التواصل"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2.5 rounded-md text-sm outline-none"
              style={{ background: "#1B2430", color: "#F4EFE6", border: "1px solid #3A4759" }}
            />

            <textarea
              placeholder="وصف مختصر"
              rows={3}
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              className="px-3 py-2.5 rounded-md text-sm outline-none resize-none"
              style={{ background: "#1B2430", color: "#F4EFE6", border: "1px solid #3A4759" }}
            />

            <button
              type="submit"
              disabled={saving}
              className="py-2.5 rounded-md font-display font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: "#C9A227", color: "#1B2430" }}
            >
              {saving && <Loader2 className="animate-spin" size={16} />}
              أضف المنتج
            </button>
          </form>
        </div>
      )}

      {/* Login modal */}
      {showLogin && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowLogin(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={login}
            className="w-full max-w-sm rounded-lg p-6 flex flex-col gap-4"
            style={{ background: "#242F3F", border: "1px solid #3A4759" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Mail size={18} style={{ color: "#C9A227" }} />
                تسجيل الدخول
              </h3>
              <button type="button" onClick={() => setShowLogin(false)}>
                <X size={20} style={{ color: "#9AA5B1" }} />
              </button>
            </div>

            <p className="text-xs" style={{ color: "#9AA5B1" }}>
              اكتب اسمك وإيميلك عشان تضيف منتجات وتزايد في المزادات.
            </p>

            <input
              placeholder="اسمك"
              value={loginForm.name}
              onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
              className="px-3 py-2.5 rounded-md text-sm outline-none"
              style={{ background: "#1B2430", color: "#F4EFE6", border: "1px solid #3A4759" }}
            />

            <input
              type="email"
              placeholder="بريدك الإلكتروني"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              className="px-3 py-2.5 rounded-md text-sm outline-none"
              style={{ background: "#1B2430", color: "#F4EFE6", border: "1px solid #3A4759" }}
            />

            {loginError && (
              <p className="text-xs" style={{ color: "#E0674F" }}>
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="py-2.5 rounded-md font-display font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: "#C9A227", color: "#1B2430" }}
            >
              <LogIn size={16} />
              دخول
            </button>
          </form>
        </div>
      )}

      {/* Admin panel */}
      {showAdmin && isAdmin && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowAdmin(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-lg p-6 flex flex-col gap-5"
            style={{ background: "#242F3F", border: "1px solid #3A4759" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Shield size={18} style={{ color: "#C9A227" }} />
                لوحة الأدمن
              </h3>
              <button type="button" onClick={() => setShowAdmin(false)}>
                <X size={20} style={{ color: "#9AA5B1" }} />
              </button>
            </div>

            <div>
              <h4 className="font-display font-bold text-sm mb-2" style={{ color: "#9AA5B1" }}>
                المستخدمين المسجلين ({allUsers.length})
              </h4>
              {allUsers.length === 0 ? (
                <p className="text-xs" style={{ color: "#6b7684" }}>
                  لسه مفيش حد سجل دخول.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {allUsers.map((u) => (
                    <div
                      key={u.email}
                      className="flex items-center justify-between text-xs px-3 py-2 rounded-md"
                      style={{ background: "#1B2430", border: "1px solid #3A4759" }}
                    >
                      <span>{u.name}</span>
                      <span style={{ color: "#9AA5B1" }}>{u.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-display font-bold text-sm mb-2" style={{ color: "#9AA5B1" }}>
                كل المزادات والعروض
              </h4>
              {products.filter((p) => p.isAuction).length === 0 ? (
                <p className="text-xs" style={{ color: "#6b7684" }}>
                  مفيش مزادات لسه.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {products
                    .filter((p) => p.isAuction)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="text-xs px-3 py-2 rounded-md"
                        style={{ background: "#1B2430", border: "1px solid #3A4759" }}
                      >
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span>{p.name}</span>
                          <span style={{ color: Date.now() > (p.auctionEnd || 0) ? "#9AA5B1" : "#C9A227" }}>
                            {Date.now() > (p.auctionEnd || 0) ? "انتهى" : "شغال"}
                          </span>
                        </div>
                        {(p.bids || []).length === 0 ? (
                          <p style={{ color: "#6b7684" }}>مفيش عروض</p>
                        ) : (
                          <ul className="flex flex-col gap-0.5">
                            {p.bids.map((b, i) => (
                              <li key={i} style={{ color: "#C8CDD4" }}>
                                {b.name} ({b.email}) — {b.amount} ج.م
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
