import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode, AlertTriangle, Globe, Keyboard as KbIcon, Trash2 } from "lucide-react";
import { OnScreenKeyboard } from "./components/OnScreenKeyboard";
import logo from "./img/Logo.png";

type Lang = "th" | "en" | "zh";

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
    zone: "แดน (ไม่บังคับ)",
    zonePh: "เช่น แดน 2",
    createQR: "สร้าง QR",
    warnFill: "กรุณากรอกข้อมูลให้ครบถ้วน",
    scanOnPhone: "สแกนเพื่อทำต่อบนมือถือ",
    copyLink: "คัดลอกลิงก์",
    downloaded: "ดาวน์โหลด QR",
    copyDone: "คัดลอกลิงก์แล้ว",
    language: "ภาษา",
    clearAll: "ล้างข้อมูล / Clear / 清除",
    inactivityWarn: "ไม่มีการใช้งาน 1 นาที—ระบบจะล้างข้อมูลอัตโนมัติในอีก 1 นาที",
    // Modal เตือน inactivity + countdown
    inactivityTitle: "ไม่มีการใช้งาน",
    inactivityBody: (sec: number) => `ระบบจะล้างข้อมูลอัตโนมัติใน ${sec} วินาที`,
    inactivityAction: "ต่อการใช้งาน",
    inactivityExit: "ออกจากระบบ",
    // QR Modal
    qrTitle: "แสดงคิวอาร์โค้ด",
    qrBody: (sec: number) => `หน้าจะปิดอัตโนมัติใน ${sec} วินาที`,
    qrDone: "เสร็จสิ้น",
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
    zone: "Zone (optional)",
    zonePh: "e.g. Zone 2",
    createQR: "Create QR",
    warnFill: "Please complete all required fields",
    scanOnPhone: "Scan to continue on mobile",
    copyLink: "Copy Link",
    downloaded: "Download QR",
    copyDone: "Link copied",
    language: "Language",
    clearAll: "ล้างข้อมูล / Clear / 清除",
    inactivityWarn: "No activity for 1 minute — data will be cleared in another 1 minute",
    inactivityTitle: "Inactivity detected",
    inactivityBody: (sec: number) => `Data will be cleared in ${sec} seconds`,
    inactivityAction: "Continue",
    inactivityExit: "Exit",
    qrTitle: "Show QR Code",
    qrBody: (sec: number) => `This screen will close in ${sec} seconds`,
    qrDone: "Done",
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
    zone: "监区（选填）",
    zonePh: "例如 第2监区",
    createQR: "生成二维码",
    warnFill: "请先填写必填信息",
    scanOnPhone: "扫码在手机继续",
    copyLink: "复制链接",
    downloaded: "下载二维码",
    copyDone: "已复制链接",
    language: "语言",
    clearAll: "ล้างข้อมูล / Clear / 清除",
    inactivityWarn: "已无操作1分钟——1分钟后将自动清除数据",
    inactivityTitle: "检测到无操作",
    inactivityBody: (sec: number) => `将在 ${sec} 秒后自动清除数据`,
    inactivityAction: "继续使用",
    inactivityExit: "退出",
    qrTitle: "显示二维码",
    qrBody: (sec: number) => `此画面将在 ${sec} 秒后关闭`,
    qrDone: "完成",
  },
} as const;

const sanitize = (s: string) => s.trim().replace(/\s+/g, " ");

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
    // 1 นาที เตือน, 2 นาที รีเซ็ต
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default function App() {
  // ===== ภาษา (เปลี่ยนทั้งหน้า) =====
  const [lang, setLang] = useState<Lang>("th");

  // ===== ฟอร์ม =====
  const [depositor, setDepositor] = useState("");
  const [visitorId, setVisitorId] = useState("");
  const [prisoner, setPrisoner] = useState("");
  const [zone, setZone] = useState("");

  // ===== QR =====
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  // ===== Modal เตือน inactivity =====
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // ===== Modal แสดง QR =====
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(180); // 3 นาที

  // ===== คีย์บอร์ดบนจอ =====
  const [kbVisible, setKbVisible] = useState(false);
  const [focusedEl, setFocusedEl] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const isValid = useMemo(
    () => [depositor, visitorId, prisoner].every((v) => sanitize(v).length > 0),
    [depositor, visitorId, prisoner]
  );

  // จับ inactivity: 1 นาที เปิด Modal, 2 นาที ล้าง+รีเซ็ตภาษาไทย
  useInactivityTimers(
    () => {
      setCountdown(60);
      setShowWarnModal(true);
    },
    () => {
      clearAllAndThai();
      setShowWarnModal(false);
    }
  );

  // นับถอยหลังขณะ Modal inactivity เปิด
  useEffect(() => {
    if (!showWarnModal) return;
    const id = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearAllAndThai();
          setShowWarnModal(false);
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWarnModal]);

  // นับถอยหลัง 3 นาทีบน QR Modal
  useEffect(() => {
    if (!showQRModal) return;
    setQrCountdown(180);
    const id = window.setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          // ครบ 3 นาที: ปิด modal + เคลียร์ + รีเซ็ตภาษาไทย
          handleFinishQR();
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQRModal]);

  // เปลี่ยนภาษาแล้ว ถ้ามี QR อยู่ ให้รีเจนตามภาษาใหม่ (ภาษาปัจจุบันต้องเป็นส่วนของ path)
  useEffect(() => {
    if (qrUrl) {
      setQrUrl(buildUrl(lang));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const buildUrl = (useLang: Lang) => {
    const base = "https://kiosk-mobile.vercel.app/#/qr";
    const nonce = String(Date.now()); // anti-cache
    const segRaw = [
      useLang,
      sanitize(depositor) || "-",
      sanitize(visitorId) || "-",
      sanitize(prisoner) || "-",
      sanitize(zone) || "-", // optional
      nonce,
    ];
    const seg = segRaw.map((s) => encodeURIComponent(s));
    return `${base}/${seg.join("/")}`;
  };

  const handleCreate = () => {
    if (!isValid) return;
    const url = buildUrl(lang);
    setQrUrl(url);
    setShowQRModal(true); // แสดง QR บน modal
  };

  const clearAllNow = () => {
    localStorage.clear();
    sessionStorage.clear();
    setDepositor("");
    setVisitorId("");
    setPrisoner("");
    setZone("");
    setQrUrl(null);
  };

  const clearAllAndThai = () => {
    clearAllNow();
    setLang("th");
  };

  const handleFinishQR = () => {
    // ปิด modal + เคลียร์ข้อมูล + รีเซ็ตภาษาไทย
    setShowQRModal(false);
    clearAllAndThai();
  };

  const L = T[lang];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full bg-red-800 py-4 px-6 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-6">

        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="w-16 h-16" />
        </div>

        <div >
          <h1 className="text-2xl font-bold">{L.title}</h1>
          <p className="text-sm">{L.subtitle}</p>
        </div>
        </div>

        {/* มุมขวาบน: สลับภาษา + ล้างข้อมูล */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            <Globe className="w-5 h-5" />
            <span className="text-sm mr-1">{L.language}:</span>
            {(["th", "en", "zh"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 rounded ${
                  lang === l ? "bg-white text-red-800" : "hover:bg-white/20"
                }`}
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

      <div className="flex flex-col items-center justify-start p-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="text-blue-700" />
            <h2 className="text-2xl font-bold text-blue-800">{L.makeQR}</h2>
          </div>

          <p className="text-gray-500 text-sm mb-4">{L.guide}</p>

          {/* ฟอร์ม */}
          <div className="space-y-3 mb-4">
            <div>
              <label htmlFor="depositor" className="block text-sm text-gray-600 mb-1">
                {L.depositor}
              </label>
              <div className="relative">
                <input
                  id="depositor"
                  value={depositor}
                  onChange={(e) => setDepositor(e.target.value)}
                  onFocus={(e) => {
                    setFocusedEl(e.currentTarget);
                    setKbVisible(true);
                  }}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                  placeholder={L.depositorPh}
                  autoComplete="off"
                />
                <KbIcon className="absolute right-2 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="visitorId" className="block text-sm text-gray-600 mb-1">
                {L.visitorId}
              </label>
              <div className="relative">
                <input
                  id="visitorId"
                  value={visitorId}
                  onChange={(e) => setVisitorId(e.target.value)}
                  onFocus={(e) => {
                    setFocusedEl(e.currentTarget);
                    setKbVisible(true);
                  }}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                  placeholder={L.visitorIdPh}
                  inputMode="numeric"
                  autoComplete="off"
                />
                <KbIcon className="absolute right-2 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="prisoner" className="block text-sm text-gray-600 mb-1">
                {L.prisoner}
              </label>
              <div className="relative">
                <input
                  id="prisoner"
                  value={prisoner}
                  onChange={(e) => setPrisoner(e.target.value)}
                  onFocus={(e) => {
                    setFocusedEl(e.currentTarget);
                    setKbVisible(true);
                  }}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                  placeholder={L.prisonerPh}
                  autoComplete="off"
                />
                <KbIcon className="absolute right-2 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="zone" className="block text-sm text-gray-600 mb-1">
                {L.zone}
              </label>
              <div className="relative">
                <input
                  id="zone"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  onFocus={(e) => {
                    setFocusedEl(e.currentTarget);
                    setKbVisible(true);
                  }}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                  placeholder={L.zonePh}
                  autoComplete="off"
                />
                <KbIcon className="absolute right-2 top-2.5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* ปุ่ม */}
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={!isValid}
              className={`flex-1 ${
                isValid ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"
              } text-white px-4 py-3 rounded-lg font-semibold transition`}
            >
              {L.createQR}
            </button>
          </div>

          {/* เตือนให้กรอกครบ */}
          {!isValid && qrUrl === null && (
            <div
              className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-yellow-800 flex items-start gap-2"
              aria-live="polite"
            >
              <AlertTriangle size={18} className="mt-0.5" />
              <span className="text-sm">{L.warnFill}</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal เตือน inactivity + Countdown 3 ภาษา */}
      {showWarnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
            <h2 className="text-lg font-bold text-red-700 mb-3">{L.inactivityTitle}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {T[lang].inactivityBody(countdown)}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowWarnModal(false)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-emerald-700 transition"
              >
                {L.inactivityAction}
              </button>
              <button
                onClick={() => {
                  clearAllAndThai();
                  setShowWarnModal(false);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-400 transition"
              >
                {L.inactivityExit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal แสดง QR + Countdown 3 นาที + ปุ่มเสร็จสิ้น 3 ภาษา */}
      {showQRModal && qrUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full text-center">
            <h2 className="text-lg font-bold text-blue-800 mb-2">{L.qrTitle}</h2>
            <p className="text-sm text-gray-600 mb-4">{L.qrBody(qrCountdown)}</p>
            <div className="flex justify-center mb-4">
              <QRCodeCanvas id="qr-main" value={qrUrl} size={240} includeMargin level="M" />
            </div>
            <button
              onClick={handleFinishQR}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-semibold hover:bg-blue-700 transition"
            >
              {L.qrDone}
            </button>
          </div>
        </div>
      )}

      {/* คีย์บอร์ดบนจอ */}
      <OnScreenKeyboard
        targetEl={focusedEl}
        visible={kbVisible}
        onClose={() => setKbVisible(false)}
        initialLayout="th"
      />
    </div>
  );
}
