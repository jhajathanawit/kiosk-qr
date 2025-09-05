import { useMemo, useRef, useState, useEffect } from "react";
import { Keyboard as KbIcon, X } from "lucide-react";

type Layout = "en" | "th";

type KeyDef =
  | { type: "char"; normal: string; shift?: string; width?: number }
  | { type: "backspace"; label?: string; width?: number }
  | { type: "tab"; label?: string; width?: number }
  | { type: "caps"; label?: string; width?: number }
  | { type: "enter"; label?: string; width?: number }
  | { type: "shift"; side: "left" | "right"; label?: string; width?: number }
  | { type: "space"; label?: string; width?: number }
  | { type: "clear"; label?: string; width?: number }
  | { type: "lang"; label?: string; width?: number };

function useKeyboardLayouts() {
  const enRows: KeyDef[][] = [
    [
      { type: "char", normal: "`", shift: "~" },
      { type: "char", normal: "1", shift: "!" },
      { type: "char", normal: "2", shift: "@" },
      { type: "char", normal: "3", shift: "#" },
      { type: "char", normal: "4", shift: "$" },
      { type: "char", normal: "5", shift: "%" },
      { type: "char", normal: "6", shift: "^" },
      { type: "char", normal: "7", shift: "&" },
      { type: "char", normal: "8", shift: "*" },
      { type: "char", normal: "9", shift: "(" },
      { type: "char", normal: "0", shift: ")" },
      { type: "char", normal: "-", shift: "_" },
      { type: "char", normal: "=", shift: "+" },
      { type: "backspace", label: "Backspace", width: 2.2 },
    ],
    [
      { type: "tab", label: "Tab", width: 1.8 },
      { type: "char", normal: "q" },
      { type: "char", normal: "w" },
      { type: "char", normal: "e" },
      { type: "char", normal: "r" },
      { type: "char", normal: "t" },
      { type: "char", normal: "y" },
      { type: "char", normal: "u" },
      { type: "char", normal: "i" },
      { type: "char", normal: "o" },
      { type: "char", normal: "p" },
      { type: "char", normal: "[", shift: "{" },
      { type: "char", normal: "]", shift: "}" },
      { type: "char", normal: "\\", shift: "|" },
    ],
    [
      { type: "caps", label: "Caps", width: 2.2 },
      { type: "char", normal: "a" },
      { type: "char", normal: "s" },
      { type: "char", normal: "d" },
      { type: "char", normal: "f" },
      { type: "char", normal: "g" },
      { type: "char", normal: "h" },
      { type: "char", normal: "j" },
      { type: "char", normal: "k" },
      { type: "char", normal: "l" },
      { type: "char", normal: ";", shift: ":" },
      { type: "char", normal: "'", shift: '"' },
      { type: "enter", label: "Enter", width: 2.4 },
    ],
    [
      { type: "shift", side: "left", label: "Shift", width: 2.8 },
      { type: "char", normal: "z" },
      { type: "char", normal: "x" },
      { type: "char", normal: "c" },
      { type: "char", normal: "v" },
      { type: "char", normal: "b" },
      { type: "char", normal: "n" },
      { type: "char", normal: "m" },
      { type: "char", normal: ",", shift: "<" },
      { type: "char", normal: ".", shift: ">" },
      { type: "char", normal: "/", shift: "?" },
      { type: "shift", side: "right", label: "Shift", width: 2.8 },
    ],
    [
      { type: "lang", label: "TH/EN", width: 1.8 },
      { type: "clear", label: "Clear", width: 1.8 },
      { type: "space", label: "Space", width: 8.5 },
    ],
  ];

  const thRows: KeyDef[][] = [
    [
      { type: "char", normal: "_", shift: "%" },
      { type: "char", normal: "1", shift: "+" },
      { type: "char", normal: "2", shift: "๒" },
      { type: "char", normal: "3", shift: "๓" },
      { type: "char", normal: "4", shift: "๔" },
      { type: "char", normal: "5", shift: "ู" },
      { type: "char", normal: "6", shift: "฿" },
      { type: "char", normal: "7", shift: "๗" },
      { type: "char", normal: "8", shift: "๘" },
      { type: "char", normal: "9", shift: "๙" },
      { type: "char", normal: "0", shift: "๐" },
      { type: "char", normal: "-", shift: "ฦ" },
      { type: "char", normal: "=", shift: "฿" },
      { type: "backspace", label: "Backspace", width: 2.2 },
    ],
    [
      { type: "tab", label: "Tab", width: 1.8 },
      { type: "char", normal: "ๆ", shift: "๐" },
      { type: "char", normal: "ไ", shift: "๑" },
      { type: "char", normal: "ำ", shift: "๒" },
      { type: "char", normal: "พ", shift: "๓" },
      { type: "char", normal: "ะ", shift: "๔" },
      { type: "char", normal: "ั", shift: "๕" },
      { type: "char", normal: "ี", shift: "๖" },
      { type: "char", normal: "ร", shift: "๗" },
      { type: "char", normal: "น", shift: "๘" },
      { type: "char", normal: "ย", shift: "๙" },
      { type: "char", normal: "บ", shift: "?" },
      { type: "char", normal: "ล", shift: "ฃ" },
      { type: "char", normal: "ฃ", shift: "|" },
    ],
    [
      { type: "caps", label: "Caps", width: 2.2 },
      { type: "char", normal: "ฟ", shift: "ฤ" },
      { type: "char", normal: "ห", shift: "ฆ" },
      { type: "char", normal: "ก", shift: "ฏ" },
      { type: "char", normal: "ด", shift: "โ" },
      { type: "char", normal: "เ", shift: "ฌ" },
      { type: "char", normal: "้", shift: "็" },
      { type: "char", normal: "่", shift: "๋" },
      { type: "char", normal: "า", shift: "ษ" },
      { type: "char", normal: "ส", shift: "ศ" },
      { type: "char", normal: "ว", shift: "ซ" },
      { type: "char", normal: "ง", shift: "." },
      { type: "enter", label: "Enter", width: 2.4 },
    ],
    [
      { type: "shift", side: "left", label: "Shift", width: 2.8 },
      { type: "char", normal: "ผ", shift: "(" },
      { type: "char", normal: "ป", shift: ")" },
      { type: "char", normal: "แ", shift: "ฉ" },
      { type: "char", normal: "อ", shift: "ฮ" },
      { type: "char", normal: "ิ", shift: "ฺ" },
      { type: "char", normal: "ื", shift: "์" },
      { type: "char", normal: "ท", shift: "," },
      { type: "char", normal: "ม", shift: "ฒ" },
      { type: "char", normal: "ใ", shift: "ฑ" },
      { type: "char", normal: "ฝ", shift: "ฦ" },
      { type: "shift", side: "right", label: "Shift", width: 2.8 },
    ],
    [
      { type: "lang", label: "TH/EN", width: 1.8 },
      { type: "clear", label: "Clear", width: 1.8 },
      { type: "space", label: "Space", width: 8.5 },
    ],
  ];

  return { enRows, thRows };
}

export function OnScreenKeyboard({
  targetEl,
  visible,
  onClose,
  initialLayout = "th",
}: {
  targetEl: HTMLInputElement | HTMLTextAreaElement | null;
  visible: boolean;
  onClose: () => void;
  initialLayout?: Layout;
}) {
  const [layout, setLayout] = useState<Layout>(initialLayout);
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);

  const { enRows, thRows } = useKeyboardLayouts();
  const rows = layout === "en" ? enRows : thRows;

  // ✅ ป้องกัน blur ของ input เมื่อกดคีย์บอร์ดบนจอ
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const swallow = (e: Event) => { e.preventDefault(); };
    el.addEventListener("mousedown", swallow);
    el.addEventListener("touchstart", swallow, { passive: false } as any);
    el.addEventListener("pointerdown", swallow);
    return () => {
      el.removeEventListener("mousedown", swallow);
      el.removeEventListener("touchstart", swallow as any);
      el.removeEventListener("pointerdown", swallow);
    };
  }, [visible]);

  const labelForKey = (k: KeyDef) => {
    if (k.type === "char") {
      if (layout === "en") {
        const isLetter = k.normal.length === 1 && /[a-z]/i.test(k.normal);
        if (isLetter) {
          const upper = isCaps !== isShift; // XOR (Caps ^ Shift)
          return upper ? k.normal.toUpperCase() : k.normal.toLowerCase();
        }
        return isShift && k.shift ? k.shift : k.normal;
      } else {
        // ไทย: ใช้ normal/shift (Caps ไม่ส่งผล)
        return isShift && k.shift ? k.shift : k.normal;
      }
    }
    if ("label" in k && k.label) return k.label;
    if (k.type === "backspace") return "⌫";
    if (k.type === "tab") return "Tab";
    if (k.type === "caps") return isCaps ? "Caps ▲" : "Caps";
    if (k.type === "enter") return "Enter";
    if (k.type === "shift") return isShift ? "Shift ▲" : "Shift";
    if (k.type === "space") return "Space";
    if (k.type === "clear") return "Clear";
    if (k.type === "lang") return layout === "en" ? "TH" : "EN";
    return "";
  };

  // ✅ ช่วยให้ React/State ฝั่งฟอร์มรับรู้ว่าค่าถูกแก้
  const dispatchValueChange = (el: HTMLInputElement | HTMLTextAreaElement) => {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // ✅ ใช้ setRangeText เพื่อ "แทรก/แทนที่" โดยไม่ลบค่าทั้งช่อง
  const insertText = (txt: string) => {
    if (!targetEl) return;
    targetEl.focus();
    const start = (targetEl as any).selectionStart ?? targetEl.value.length;
    const end = (targetEl as any).selectionEnd ?? targetEl.value.length;
    targetEl.setRangeText(txt, start, end, "end");
    dispatchValueChange(targetEl);
  };

  const doBackspace = () => {
    if (!targetEl) return;
    targetEl.focus();
    const start = (targetEl as any).selectionStart ?? 0;
    const end = (targetEl as any).selectionEnd ?? 0;
    if (start !== end) {
      targetEl.setRangeText("", start, end, "end");
    } else if (start > 0) {
      targetEl.setRangeText("", start - 1, start, "end");
    }
    dispatchValueChange(targetEl);
  };

  const onKeyPress = (k: KeyDef) => {
    switch (k.type) {
      case "char": {
        const label = labelForKey(k);
        insertText(label);
        if (isShift) setIsShift(false); // Shift เป็นการกดชั่วคราว
        break;
      }
      case "backspace":
        doBackspace();
        break;
      case "tab":
        insertText("\t");
        break;
      case "enter":
        insertText("\n");
        break;
      case "space":
        insertText(" ");
        break;
      case "clear":
        if (targetEl) {
          targetEl.focus();
          // ล้างแบบปลอดภัยด้วย setRangeText ทั้งช่วง
          targetEl.setSelectionRange(0, targetEl.value.length);
          targetEl.setRangeText("", 0, targetEl.value.length, "end");
          dispatchValueChange(targetEl);
        }
        break;
      case "lang":
        setLayout(layout === "en" ? "th" : "en");
        break;
      case "caps":
        setIsCaps((v) => !v);
        break;
      case "shift":
        setIsShift((v) => !v);
        break;
    }
  };

  const keyWidthStyle = (k: KeyDef) => {
    const w = "width" in k && k.width ? k.width : 1;
    return { flex: `${w} 0 auto` };
  };

  const rowView = useMemo(
    () =>
      rows.map((row, i) => (
        <div key={i} className="flex gap-1 mb-1">
          {row.map((k, idx) => (
            <button
              key={idx}
              onClick={() => onKeyPress(k)}
              className={`px-3 py-3 rounded border text-center active:scale-[0.98] select-none ${
                (k.type === "shift" && isShift) || (k.type === "caps" && isCaps)
                  ? "bg-gray-200"
                  : "bg-white"
              }`}
              style={keyWidthStyle(k)}
            >
              {labelForKey(k)}
            </button>
          ))}
        </div>
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, isShift, isCaps, layout]
  );

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 bottom-0 z-50 bg-white border-t shadow-2xl"
      // กัน blur ให้ชัวร์ทุก pointer
      onMouseDown={(e) => e.preventDefault()}
      onTouchStart={(e) => e.preventDefault()}
      onPointerDown={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <KbIcon />
          <span className="text-sm">On-screen Keyboard ({layout.toUpperCase()})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayout(layout === "en" ? "th" : "en")}
            className="px-3 py-1 rounded border"
            aria-label="Switch keyboard"
          >
            {layout === "en" ? "TH" : "EN"}
          </button>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Close keyboard">
            <X />
          </button>
        </div>
      </div>
      <div className="px-3 pb-3">{rowView}</div>
    </div>
  );
}
