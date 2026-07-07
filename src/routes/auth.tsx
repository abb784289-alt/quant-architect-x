import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "بوابة الدخول — منصة المِقْيَاس الذكية" },
      { name: "description", content: "بوابة الدخول التجريبية الفورية لمنصة المِقْيَاس الذكية مع الأستاذ أسامة فتح الدين." },
    ],
  }),
  component: LuxuryAuthPage,
});

function LuxuryAuthPage() {
  const handleBypass = (route: string) => {
    window.location.href = route;
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#022C22] to-[#065F46] flex flex-col items-center justify-center p-6 text-white"
      style={{ direction: "rtl" }}
    >
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl w-full max-w-md text-center shadow-2xl">
        <h1 className="text-3xl font-bold mb-2 text-[#D4AF37]">منصة المِقْيَاس الذكية</h1>
        <p className="text-gray-300 text-sm mb-8">
          بوابة الدخول التجريبية الفورية للأستاذ أسامة فتح الدين
        </p>

        <div className="space-y-4">
          <button
            onClick={() => handleBypass("/admin")}
            className="w-full bg-[#D4AF37] hover:bg-[#F59E0B] text-black font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg transform hover:scale-[1.02]"
          >
            الدخول المباشر كـ "أدمن / لوحة التحكم" 🔑
          </button>
          <button
            onClick={() => handleBypass("/dashboard")}
            className="w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            الدخول المباشر كـ "طالب / الـ 150 قسم" 🎓
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center">
          تم تفعيل وضع التخطيط الآمن لتجاوز أخطاء الاتصال بنجاح
        </p>
      </div>
    </div>
  );
}