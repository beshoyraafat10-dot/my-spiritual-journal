import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

const dict = {
  appName: { ar: "خلوتي", en: "Khalwety" },
  coverTitle: { ar: "مذكرتي الروحية", en: "My Spiritual Journal" },
  coverSub: { ar: "٣٦٥ يومًا في حضرته", en: "365 days in His presence" },
  signUp: { ar: "إنشاء حساب باستخدام Google", en: "Sign up with Google" },
  signIn: { ar: "تسجيل الدخول باستخدام Google", en: "Sign in with Google" },
  notConfigured: { ar: "لم يتم ضبط الاتصال بقاعدة البيانات بعد.", en: "Database connection is not configured yet." },
  loading: { ar: "جاري التحميل...", en: "Loading…" },
  errorGeneric: { ar: "حدث خطأ. حاول مرة أخرى.", en: "Something went wrong. Please try again." },
  retry: { ar: "إعادة المحاولة", en: "Try again" },
  home: { ar: "السنة", en: "Year" },
  search: { ar: "بحث", en: "Search" },
  profile: { ar: "حسابي", en: "Profile" },
  today: { ar: "اليوم", en: "Today" },
  journeyDay: { ar: "يوم الرحلة", en: "Journey day" },
  day: { ar: "اليوم", en: "Day" },
  of: { ar: "من", en: "of" },
  completed: { ar: "مكتمل", en: "Completed" },
  completedEntries: { ar: "تأملات مكتملة", en: "Completed entries" },
  current: { ar: "الحالي", en: "Current" },
  upcoming: { ar: "قادم", en: "Upcoming" },
  openToday: { ar: "افتح صفحة اليوم", en: "Open today's page" },
  journeyEnded: { ar: "اكتملت أيام الرحلة — كل الصفحات متاحة", en: "Journey days complete — every page stays open" },
  q1: { ar: "ماذا قال لي الله عن نفسه؟", en: "What did God say to me about Himself?" },
  godAttr: { ar: "صفة من صفات الله", en: "An attribute of God" },
  q2: { ar: "ماذا قال عني أنا؟", en: "What did He say about me?" },
  sin: { ar: "خطية — أتجنبها", en: "Sin — avoid it" },
  command: { ar: "وصية — أتبعها", en: "Commandment — follow it" },
  privilege: { ar: "امتياز — أشكره", en: "Privilege — thank Him" },
  promise: { ar: "وعد — أتمسك به", en: "Promise — hold on to it" },
  example: { ar: "قدوة — أتمثل به", en: "Example — imitate it" },
  q3: { ar: "ماذا قلت له في صلاتي؟", en: "What did I say to Him in prayer?" },
  requests: { ar: "طلبات أخرى", en: "Other requests" },
  addRequest: { ar: "إضافة طلب", en: "Add request" },
  requestText: { ar: "نص الطلب", en: "Request" },
  responseDate: { ar: "تاريخ الاستجابة", en: "Answered on" },
  remove: { ar: "حذف", en: "Remove" },
  reflections: { ar: "تأملات أخرى", en: "Other reflections" },
  reflectionsHint: { ar: "عظة، محاضرة، كتاب، مؤتمر...", en: "Sermon, lecture, book, conference…" },
  verse: { ar: "آية للحفظ", en: "Memory verse" },
  reference: { ar: "الشاهد", en: "Reference" },
  markDone: { ar: "تمّت خلوة اليوم", en: "Mark as completed" },
  saving: { ar: "جاري الحفظ...", en: "Saving…" },
  saved: { ar: "تم الحفظ", en: "Saved" },
  saveError: { ar: "تعذّر الحفظ", en: "Couldn't save" },
  prev: { ar: "السابق", en: "Previous" },
  next: { ar: "التالي", en: "Next" },
  locked: { ar: "هذا اليوم لم يأتِ بعد", en: "This day hasn't arrived yet" },
  lockedSub: { ar: "سيُفتح في", en: "Opens on" },
  back: { ar: "العودة للسنة", en: "Back to year" },
  searchPh: { ar: "ابحث في مذكرتك...", en: "Search your journal…" },
  noResults: { ar: "لا توجد نتائج", en: "No results" },
  searchEmpty: { ar: "اكتب كلمة للبحث في صفحاتك", en: "Type a word to search your pages" },
  language: { ar: "اللغة", en: "Language" },
  startedOn: { ar: "بدأت الرحلة في", en: "Journey started on" },
  endsOn: { ar: "اليوم ٣٦٥ في", en: "Day 365 falls on" },
  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
  completing: { ar: "جاري إكمال الدخول...", en: "Completing sign-in…" },
  notFoundDay: { ar: "رقم يوم غير صحيح", en: "Invalid day number" },
} as const;

export type Key = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "ar",
  setLang: () => {},
  t: (k) => dict[k].ar,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  useEffect(() => {
    const s = localStorage.getItem("khalwety-lang");
    if (s === "ar" || s === "en") setLangState(s);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("khalwety-lang", l);
  };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[k][lang] }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
