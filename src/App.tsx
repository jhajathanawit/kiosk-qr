import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode, AlertTriangle, Globe, Keyboard as KbIcon, Trash2 } from "lucide-react";
import {OnScreenKeyboard} from "./components/OnScreenKeyboard";
import logo from "./img/Logo.png";

type Lang = "th" | "en" | "zh";

/** 🔒 กันปัด/ซูม/ย้อน/ช็อตคัต หลุดจากหน้า */


const T = {
  th: {
    title: "ระบบสร้างคิวอาร์โค้ดสำหรับสั่งสินค้า",
    subtitle: "เรือนจำพิเศษกรุงเทพมหานคร",
    makeQR: "สร้างคิวอาร์โค้ด",
    guide: "กรอกข้อมูลแล้วกดสร้าง QR",
    depositor: "ชื่อผู้ทำรายการ",
    depositorPh: "เช่น นายสมชาย ใจดี",
    visitorId: "รหัสบัตร/พาสปอร์ต ผู้ทำรายการ",
    visitorIdPh: "เช่น 1103700xxxxxxx",
    prisoner: "ชื่อผู้ต้องขัง",
    prisonerPh: "เช่น นายเอ",
    prisonerId: "รหัสผู้ต้องขัง",
    prisonerIdPh: "เช่น 123456",
    createQR: "สร้าง QR",
    warnFill: "กรุณากรอกข้อมูลให้ครบถ้วน",
    language: "ภาษา",
    clearAll: "ล้างข้อมูล / Clear / 清除",
    inactivityTitle: "ไม่มีการใช้งาน",
    inactivityBody: (sec: number) => `ระบบจะล้างข้อมูลอัตโนมัติใน ${sec} วินาที`,
    inactivityAction: "ต่อการใช้งาน",
    inactivityExit: "ล้างข้อมูล",
    qrTitle: "แสดงคิวอาร์โค้ด",
    qrBody: (sec: number) => `หน้าจะปิดอัตโนมัติใน ${sec} วินาที`,
    qrDone: "เสร็จสิ้น",
    qrPathError: "ไม่สามารถสร้างลิงก์ QR ได้ (โครงสร้างพารามิเตอร์ไม่ครบ)",
  },
  en: {
    title: "QR Code Ordering System",
    subtitle: "Bangkok Remand Prison",
    makeQR: "Generate QR Code",
    guide: "Fill in the form and generate QR",
    depositor: "Depositor’s Name",
    depositorPh: "e.g. Somchai Jaidee",
    visitorId: "ID/Passport of Depositor",
    visitorIdPh: "e.g. 1103700xxxxxxx",
    prisoner: "Prisoner’s Name",
    prisonerPh: "e.g. Mr. A",
    prisonerId: "Prisoner ID",
    prisonerIdPh: "e.g. 123456",
    createQR: "Create QR",
    warnFill: "Please complete all required fields",
    language: "Language",
    clearAll: "ล้างข้อมูล / Clear / 清除",
    inactivityTitle: "Inactivity detected",
    inactivityBody: (sec: number) => `Data will be cleared in ${sec} seconds`,
    inactivityAction: "Continue",
    inactivityExit: "Exit",
    qrTitle: "Show QR Code",
    qrBody: (sec: number) => `This screen will close in ${sec} seconds`,
    qrDone: "Done",
    qrPathError: "Failed to build QR link (missing URL segments)",
  },
  zh: {
    title: "二维码下单系统",
    subtitle: "曼谷還押監獄",
    makeQR: "生成二维码",
    guide: "填写信息并生成二维码",
    depositor: "办理人姓名",
    depositorPh: "例如 Somchai Jaidee",
    visitorId: "办理人身份证/护照",
    visitorIdPh: "例如 1103700xxxxxxx",
    prisoner: "在押人员姓名",
    prisonerPh: "例如 甲先生",
    prisonerId: "在押人员编号",
    prisonerIdPh: "例如 123456",
    createQR: "生成二维码",
    warnFill: "请先填写必填信息",
    language: "语言",
    clearAll: "ล้างข้อมูล / Clear / 清除",
    inactivityTitle: "检测到无操作",
    inactivityBody: (sec: number) => `将在 ${sec} 秒后自动清除数据`,
    inactivityAction: "继续使用",
    inactivityExit: "退出",
    qrTitle: "显示二维码",
    qrBody: (sec: number) => `此画面将在 ${sec} 秒后关闭`,
    qrDone: "完成",
    qrPathError: "无法生成二维码链接（URL 片段缺失）",
  },
} as const;

const sanitize = (s: string) => s.trim().replace(/\s+/g, " ");

// ===== Auto Save =====
const FORM_KEY = "kiosk-form-v2"; // ⚠️ เปลี่ยน key ใหม่เพราะโครงสร้างฟอร์มเปลี่ยน
type FormPersist = {
  lang: Lang;
  depositor: string;
  visitorId: string;
  prisoner: string;
  prisonerId: string;
};
const loadPersist = (): FormPersist | null => {
  try {
    const raw = localStorage.getItem(FORM_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FormPersist;
  } catch {
    return null;
  }
};
const savePersist = (data: FormPersist) => {
  try {
    localStorage.setItem(FORM_KEY, JSON.stringify(data));
  } catch {}
};

function useInactivityTimers(onWarn: () => void, onReset: () => void) {
  const warnTimer = useRef<number | null>(null);
  const resetTimer = useRef<number | null>(null);
  const clearTimers = () => {
    if (warnTimer.current) window.clearTimeout(warnTimer.current);
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    warnTimer.current = null;
    resetTimer.current = null;
  };
  const arm = () => {
    clearTimers();
    warnTimer.current = window.setTimeout(onWarn, 60_000);
    resetTimer.current = window.setTimeout(onReset, 120_000);
  };
  useEffect(() => {
    arm();
    const resetOnActivity = () => arm();
    window.addEventListener("mousemove", resetOnActivity);
    window.addEventListener("keydown", resetOnActivity);
    window.addEventListener("touchstart", resetOnActivity);
    window.addEventListener("click", resetOnActivity);
    return () => {
      window.removeEventListener("mousemove", resetOnActivity);
      window.removeEventListener("keydown", resetOnActivity);
      window.removeEventListener("touchstart", resetOnActivity);
      window.removeEventListener("click", resetOnActivity);
      clearTimers();
    };
  }, []);
}

export default function App() {
  

  // ===== ภาษา =====
  const [lang, setLang] = useState<Lang>("th");

  // ===== ฟอร์ม (ไม่มีคำนำหน้า/โซนแล้ว) =====
  const [depositor, setDepositor] = useState("");
  const [visitorId, setVisitorId] = useState("");
  const [prisoner, setPrisoner] = useState("");
  const [prisonerId, setPrisonerId] = useState("");

  // ===== QR =====
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  // ===== Modal =====
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(180);

  // ===== คีย์บอร์ดบนจอ =====
  const [kbVisible, setKbVisible] = useState(false);
  const [focusedEl, setFocusedEl] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // ===== ขนาด QR (responsive) =====
  const [qrSize, setQrSize] = useState<number>(240);
  useEffect(() => {
    const recalc = () => {
      const vw = Math.min(window.innerWidth, 720);
      const vh = Math.min(window.innerHeight, 1280);
      const size = Math.min(420, Math.floor(Math.min(vw, vh) * 0.7));
      setQrSize(Math.max(180, size));
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  // ต้องกรอกครบ 4 ช่อง
  const isValid = useMemo(
    () => [depositor, visitorId, prisoner, prisonerId].every((v) => sanitize(v).length > 0),
    [depositor, visitorId, prisoner, prisonerId]
  );

  // ===== โหลดค่าที่บันทึกไว้ =====
  useEffect(() => {
    const persisted = loadPersist();
    if (persisted) {
      setLang(persisted.lang ?? "th");
      setDepositor(persisted.depositor ?? "");
      setVisitorId(persisted.visitorId ?? "");
      setPrisoner(persisted.prisoner ?? "");
      setPrisonerId(persisted.prisonerId ?? "");
    }
  }, []);

  // ===== Auto-Save Debounce =====
  const saveTimer = useRef<number | null>(null);
  const scheduleSave = () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      savePersist({ lang, depositor, visitorId, prisoner, prisonerId });
    }, 250);
  };
  useEffect(() => {
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, depositor, visitorId, prisoner, prisonerId]);

  // เผื่อปิดหน้าทันที
  useEffect(() => {
    const onBeforeUnload = () => {
      savePersist({ lang, depositor, visitorId, prisoner, prisonerId });
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [lang, depositor, visitorId, prisoner, prisonerId]);

  // ===== Inactivity =====
  useInactivityTimers(
    () => { setCountdown(60); setShowWarnModal(true); },
    () => { clearAllAndThai(); setShowWarnModal(false); }
  );
  useEffect(() => {
    if (!showWarnModal) return;
    const id = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearAllAndThai(); setShowWarnModal(false); window.clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [showWarnModal]);

  useEffect(() => {
    if (!showQRModal) return;
    setQrCountdown(180);
    const id = window.setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) { handleFinishQR(); window.clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [showQRModal]);

  // เปลี่ยนภาษาแล้ว regenerate QR (path ใช้ภาษาปัจจุบัน)
  useEffect(() => {
    if (qrUrl) setQrUrl(buildUrl(lang));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const L = T[lang];

  const buildUrl = (useLang: Lang) => {
  const base = "https://kiosk-mobile.vercel.app/#/qr";
  const nonce = Date.now();    

  // ใช้ TTL = 3 ชั่วโมง (10800 วินาที)
  const ttlSec = 3 * 60 * 60; 

  const segRaw = [
    useLang,
    sanitize(depositor) || "-",
    sanitize(visitorId) || "-",
    sanitize(prisoner) || "-",
    sanitize(prisonerId) || "-",
    String(nonce),
  ];
  const seg = segRaw.map((s) => encodeURIComponent(s));

  return `${base}/${seg.join("/")}?ttl=${ttlSec}`;
};



  const urlHasValidPath = (url: string) => {
    try {
      const u = new URL(url);
      const hash = u.hash || "";
      const parts = hash.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "qr");
      if (idx < 0) return false;
      const tail = parts.slice(idx + 1);
      return tail.length === 6 && tail.every((s) => typeof s === "string");
    } catch {
      return false;
    }
  };

  const handleCreate = () => {
    setQrError(null);
    if (!isValid) return;
    const url = buildUrl(lang);
    if (!urlHasValidPath(url)) {
      setQrError(L.qrPathError);
      setQrUrl(null);
      setShowQRModal(false);
      return;
    }
    setQrUrl(url);
    setShowQRModal(true);
  };

  const clearAllNow = () => {
    localStorage.removeItem(FORM_KEY);
    sessionStorage.removeItem(FORM_KEY);
    setDepositor("");
    setVisitorId("");
    setPrisoner("");
    setPrisonerId("");
    setQrUrl(null);
    setQrError(null);
  };
  const clearAllAndThai = () => { clearAllNow(); setLang("th"); };
  const handleFinishQR = () => { setShowQRModal(false); clearAllAndThai(); };

  return (
    <div className="min-h-screen bg-white kiosk-wrap flex flex-col">
      {/* Portrait responsive tweaks */}
     <style>{`
  /* ===== Portrait tweaks: move up & extra large ===== */
  @media (orientation: portrait) {
    /* คอนเทนเนอร์: ขยับขึ้นด้านบน */
    .kiosk-wrap .kiosk-container {
      max-width: 100vw;
      padding: 48px 32px 32px 32px;   /* ด้านบนมากขึ้น */
      justify-content: flex-start !important;
      align-items: center !important;
      gap: 24px;
    }

    /* กล่องฟอร์ม */
    .kiosk-wrap .kiosk-card {
      width: 100%;
      max-width: 100vw;
      margin: 0 auto;
      padding: 56px;                 /* จาก 44 -> 56 */
    }

    /* อินพุต: ใหญ่ขึ้นอีก */
    .kiosk-wrap .kiosk-input {
      font-size: 34px;               /* จาก 28 -> 34 */
      padding: 28px 28px;            /* จาก 24 -> 28 */
    }

    /* ป้ายกำกับ/ชื่อเรื่อง */
    .kiosk-wrap .kiosk-label { 
      font-size: 26px;               /* จาก 22 -> 26 */
      margin-bottom: 10px; 
    }
    .kiosk-wrap .kiosk-title { 
      font-size: 38px;               /* จาก 32 -> 38 */
      line-height: 1.2; 
    }
    .kiosk-wrap .kiosk-subtitle { 
      font-size: 24px;               /* จาก 20 -> 24 */
    }

    /* ปุ่ม: ใหญ่มาก */
    .kiosk-wrap .kiosk-btn {
      font-size: 34px;               /* จาก 28 -> 34 */
      padding: 28px 32px;            /* จาก 24x26 -> 28x32 */
    }

    /* เฮดเดอร์: padding หนาขึ้น */
    .kiosk-wrap header { 
      padding: 24px 32px !important; /* จาก 20x24 -> 24x32 */
    }
  }

  /* ===== จอเล็กมาก (เช่นมือถือเล็ก ๆ) ===== */
  @media (orientation: portrait) and (max-width: 400px) {
    .kiosk-wrap .kiosk-input { font-size: 36px; padding: 30px; }
    .kiosk-wrap .kiosk-btn   { font-size: 36px; padding: 30px 34px; }
    .kiosk-wrap .kiosk-card  { padding: 60px; }
    .kiosk-wrap .kiosk-title { font-size: 42px; }
  }
`}</style>



      {/* Header */}
      <header className="w-full bg-red-800 py-4 px-6 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" className="w-16 h-16" />
          </div>
          <div>
            <h1 className="text-2xl font-bold kiosk-title">{L.title}</h1>
            <p className="text-sm kiosk-subtitle">{L.subtitle}</p>
          </div>
        </div>

        {/* Language + Clear */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            <Globe className="w-5 h-5" />
            <span className="text-sm mr-1">{L.language}:</span>
            {(["th", "en", "zh"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 rounded ${lang === l ? "bg-white text-red-800" : "hover:bg-white/20"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={clearAllNow}
            className="ml-2 flex items-center gap-2 bg-white text-red-700 px-3 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
            title={L.clearAll}
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-xs">{L.clearAll}</span>
          </button>
        </div>
      </header>

      {/* Content center X/Y */}
      <div className="flex flex-col flex-1 items-center justify-center p-6 kiosk-container mx-auto">
        <div className="w-full bg-white rounded-xl shadow-md p-6 kiosk-card">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="text-blue-700" />
            <h2 className="text-2xl font-bold text-blue-800">{L.makeQR}</h2>
          </div>

          <p className="text-gray-500 text-sm mb-4">{L.guide}</p>

          {/* Form */}
          <div className="space-y-4 mb-4">
            {/* Depositor */}
            <div>
              <label htmlFor="depositor" className="block text-sm text-gray-600 mb-1 kiosk-label">
                {L.depositor}
              </label>
              <div className="relative">
                <input
                  id="depositor"
                  value={depositor}
                  onChange={(e) => setDepositor(e.target.value)}
                  onBlur={scheduleSave}
                  onFocus={(e) => { setFocusedEl(e.currentTarget); setKbVisible(true); }}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring kiosk-input"
                  placeholder={L.depositorPh}
                  autoComplete="off"
                />
                <KbIcon className="absolute right-2 top-2.5 text-gray-400" />
              </div>
            </div>

            {/* Visitor ID */}
            <div>
              <label htmlFor="visitorId" className="block text-sm text-gray-600 mb-1 kiosk-label">
                {L.visitorId}
              </label>
              <div className="relative">
                <input
                  id="visitorId"
                  value={visitorId}
                  onChange={(e) => setVisitorId(e.target.value)}
                  onBlur={scheduleSave}
                  onFocus={(e) => { setFocusedEl(e.currentTarget); setKbVisible(true); }}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring kiosk-input"
                  placeholder={L.visitorIdPh}
                  inputMode="numeric"
                  autoComplete="off"
                />
                <KbIcon className="absolute right-2 top-2.5 text-gray-400" />
              </div>
            </div>

            {/* Prisoner Name */}
            <div>
              <label htmlFor="prisoner" className="block text-sm text-gray-600 mb-1 kiosk-label">
                {L.prisoner}
              </label>
              <div className="relative">
                <input
                  id="prisoner"
                  value={prisoner}
                  onChange={(e) => setPrisoner(e.target.value)}
                  onBlur={scheduleSave}
                  onFocus={(e) => { setFocusedEl(e.currentTarget); setKbVisible(true); }}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring kiosk-input"
                  placeholder={L.prisonerPh}
                  autoComplete="off"
                />
                <KbIcon className="absolute right-2 top-2.5 text-gray-400" />
              </div>
            </div>

            {/* Prisoner ID (แทน zone เดิม) */}
            <div>
              <label htmlFor="prisonerId" className="block text-sm text-gray-600 mb-1 kiosk-label">
                {L.prisonerId}
              </label>
              <div className="relative">
                <input
                  id="prisonerId"
                  value={prisonerId}
                  onChange={(e) => setPrisonerId(e.target.value)}
                  onBlur={scheduleSave}
                  onFocus={(e) => { setFocusedEl(e.currentTarget); setKbVisible(true); }}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring kiosk-input"
                  placeholder={L.prisonerIdPh}
                  autoComplete="off"
                />
                <KbIcon className="absolute right-2 top-2.5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={!isValid}
              className={`flex-1 ${isValid ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"} text-white rounded-lg font-semibold transition kiosk-btn`}
            >
              {L.createQR}
            </button>
          </div>

          {/* Alerts */}
          {qrError && (
            <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800 flex items-start gap-2" aria-live="assertive">
              <AlertTriangle size={18} className="mt-0.5" />
              <span className="text-sm">{qrError}</span>
            </div>
          )}

          {!isValid && qrUrl === null && !qrError && (
            <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-yellow-800 flex items-start gap-2" aria-live="polite">
              <AlertTriangle size={18} className="mt-0.5" />
              <span className="text-sm">{L.warnFill}</span>
            </div>
          )}
        </div>
      </div>

      {/* Inactivity Modal */}
      {showWarnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
            <h2 className="text-lg font-bold text-red-700 mb-3">{L.inactivityTitle}</h2>
            <p className="text-sm text-gray-600 mb-4">{T[lang].inactivityBody(countdown)}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowWarnModal(false)} className="bg-emerald-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-emerald-700 transition">
                {L.inactivityAction}
              </button>
              <button onClick={() => { clearAllAndThai(); setShowWarnModal(false); }} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-400 transition">
                {L.inactivityExit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && qrUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full text-center">
            <h2 className="text-lg font-bold text-blue-800 mb-2">{L.qrTitle}</h2>
            <p className="text-sm text-gray-600 mb-4">{L.qrBody(qrCountdown)}</p>
            <div className="flex justify-center mb-4">
              <QRCodeCanvas id="qr-main" value={qrUrl} size={qrSize} includeMargin level="M" />
            </div>
            <button onClick={handleFinishQR} className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-semibold hover:bg-blue-700 transition">
              {L.qrDone}
            </button>
          </div>
        </div>
      )}

      {/* On-screen keyboard */}
      <OnScreenKeyboard
        targetEl={focusedEl}
        visible={kbVisible}
        onClose={() => setKbVisible(false)}
        initialLayout="th"
      />
    </div>
  );
}
