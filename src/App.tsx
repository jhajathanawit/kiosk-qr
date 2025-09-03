import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode, AlertTriangle } from "lucide-react";
import logo from './img/Logo.png';

type Lang = "th" | "en" | "zh";

export default function App() {
  // ===== กรอกเองทั้งหมด =====
  const [depositor, setDepositor] = useState<string>("");     // ชื่อผู้ทำรายการ
  const [visitorId, setVisitorId] = useState<string>("");      // รหัสบัตร/พาสปอร์ต ผู้ทำรายการ
  const [prisoner, setPrisoner] = useState<string>("");        // ชื่อผู้ต้องขัง
  const [prisonerId, setPrisonerId] = useState<string>("");    // รหัสผู้ต้องขัง
  const [queueNo, setQueueNo] = useState<string>("");          // หมายเลขคิว

  // ===== QR =====
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [lastLang, setLastLang] = useState<Lang | null>(null);

  // ✅ ใช้ HashRouter: สร้าง URL เป็น https://.../#/qr/{...}
  const buildUrl = (lang: Lang) => {
    const base = "https://kiosk-mobile.vercel.app/#/qr"; // ← เปลี่ยนเป็น #/qr
    const nonce = String(Date.now()); // ให้ Refresh แล้วเปลี่ยน QR ได้ทุกครั้ง

    const seg = [
      lang,
      queueNo || "-",
      depositor || "-",
      visitorId || "-",
      prisoner || "-",
      prisonerId || "-",
      nonce,
    ].map((s) => encodeURIComponent(s));

    return `${base}/${seg.join("/")}`;
  };

  const validate = () => {
    return depositor && visitorId && prisoner && prisonerId && queueNo;
  };

  const generateFor = (lang: Lang) => {
    if (!validate()) {
      alert("กรอกข้อมูลให้ครบก่อนนะ");
      return;
    }
    setQrUrl(buildUrl(lang));
    setLastLang(lang);
  };

  const handleRefresh = () => {
    if (!lastLang) {
      alert("ยังไม่ได้เลือกภาษาเพื่อสร้าง QR");
      return;
    }
    if (!validate()) {
      alert("กรอกข้อมูลให้ครบก่อนนะ");
      return;
    }
    setQrUrl(buildUrl(lastLang));
  };

  const handleCopy = async () => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      alert("คัดลอกลิงก์แล้ว");
    } catch {}
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-main") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "qr.png";
    link.click();
  };

  return (
    <div>
      {/* Header เรียบ ๆ ไม่มีระบบภาษา/ปุ่มกลับ */}
      <header className="w-full bg-red-800 py-4 px-6 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="w-16 h-16" />
          <div>
            <h1 className="text-2xl font-bold">Visit Reservation System</h1>
            <p className="text-sm">Central Klongprem Prison</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center justify-start min-h-screen p-8 bg-white">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="text-blue-700" />
            <h2 className="text-2xl font-bold text-blue-800">สร้างคิวอาร์โค้ด</h2>
          </div>

          <p className="text-gray-500 text-sm mb-4">กรอกข้อมูลแล้วเลือกภาษาที่ต้องการเพื่อสร้าง QR</p>

          {/* ฟอร์มกรอก */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">ชื่อผู้ทำรายการ</label>
              <input
                value={depositor}
                onChange={(e) => setDepositor(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                placeholder="เช่น นายสมชาย ใจดี"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">รหัสบัตร/พาสปอร์ต ผู้ทำรายการ</label>
              <input
                value={visitorId}
                onChange={(e) => setVisitorId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                placeholder="เช่น 1103700xxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">ชื่อผู้ต้องขัง</label>
              <input
                value={prisoner}
                onChange={(e) => setPrisoner(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                placeholder="เช่น นายเอ"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">รหัสผู้ต้องขัง</label>
              <input
                value={prisonerId}
                onChange={(e) => setPrisonerId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                placeholder="เช่น P123456"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">หมายเลขคิว</label>
              <input
                value={queueNo}
                onChange={(e) => setQueueNo(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                placeholder="เช่น Q-001"
              />
            </div>
          </div>

          {/* ปุ่มเลือกภาษาเพื่อ "เจน QR จาก path" */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => generateFor("th")}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              TH
            </button>
            <button
              onClick={() => generateFor("en")}
              className="bg-slate-700 text-white px-4 py-3 rounded-lg font-semibold hover:bg-slate-800 transition"
            >
              EN
            </button>
            <button
              onClick={() => generateFor("zh")}
              className="bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              ZH
            </button>
          </div>

          {/* ปุ่มรีเฟรช */}
          <button
            onClick={handleRefresh}
            className="mt-3 w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            รีเฟรช QR
          </button>

          {/* หากยังไม่กรอกครบและยังไม่ได้สร้าง */}
          {!(validate()) && qrUrl === null && (
            <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-yellow-800 flex items-start gap-2">
              <AlertTriangle size={18} className="mt-0.5" />
              <span className="text-sm">กรอกข้อมูลให้ครบก่อนนะ</span>
            </div>
          )}
        </div>

        {/* แสดง QR + ปุ่ม Copy/Download */}
        {qrUrl && (
          <div className="w-full max-w-md justify-center flex flex-col bg-white rounded-xl shadow-md p-6 mt-8 text-center">
            <div className="mb-3 text-blue-800 text-xl font-semibold">สแกนเพื่อทำต่อบนมือถือ</div>
            <div className="flex justify-center mb-4">
              <QRCodeCanvas id="qr-main" value={qrUrl} size={220} includeMargin level="M" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleCopy}
                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-emerald-700 transition"
              >
                คัดลอกลิงก์
              </button>
              <button
                onClick={handleDownloadQR}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-700 transition"
              >
                ดาวน์โหลด QR
              </button>
            </div>

            {/* แสดงลิงก์ (เผื่อ debug) */}
            <p className="mt-4 break-all text-xs text-gray-500">{qrUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
}
