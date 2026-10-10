import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

const dict = {
  appName: { ar: "خلوتي", en: "Khalwety" },
  coverTitle: { ar: "الخلوة اليومية", en: "Daily Retreat" },
  dayTitle: { ar: "الخلوة الروحية", en: "Spiritual Retreat" },
  defaultWalker: { ar: "نُوحٌ", en: "Noah" },
  verseRef: { ar: "تكوين ٦: ٩", en: "Genesis 6:9" },
  jesusAlt: { ar: "السيد المسيح يسير في الطريق", en: "Jesus walking on the path" },
  addPhoto: { ar: "أضف صورتك", en: "Add your photo" },
  changePhoto: { ar: "تغيير الصورة", en: "Change photo" },
  photoHint: { ar: "تظهر صورتك على غلاف خلوتك بجوار السيد المسيح", en: "Your photo appears on your cover beside Jesus" },
  uploading: { ar: "جاري رفع الصورة...", en: "Uploading photo…" },
  photoError: { ar: "تعذّر رفع الصورة. حاول مرة أخرى.", en: "Couldn't upload the photo. Please try again." },
  nameLabel: { ar: "الاسم", en: "Name" },
  save: { ar: "حفظ", en: "Save" },
  dateLabel: { ar: "التاريخ", en: "Date" },
  readingRef: { ar: "الشاهد", en: "Reading" },
  q1Sub: { ar: "عن نفسه (صفة من صفات الله)", en: "About Himself (an attribute of God)" },
  q3Sub: { ar: "ردًا على ما قرأته اليوم", en: "In response to what I read today" },
  requestsHint: { ar: "اكتب التاريخ عند الاستجابة لطلبك", en: "Write the date when your request is answered" },
  coverSub: { ar: "٣٦٥ يومًا في حضرته", en: "365 days in His presence" },
  signUp: { ar: "إنشاء حساب", en: "Create account" },
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  yourName: { ar: "اسمك بالعربي (يظهر على الغلاف)", en: "Your name in Arabic (shown on the cover)" },
  passwordHint: { ar: "٦ أحرف على الأقل", en: "At least 6 characters" },
  haveAccount: { ar: "لديك حساب؟ سجّل الدخول", en: "Have an account? Sign in" },
  noAccount: { ar: "ليس لديك حساب؟ أنشئ حسابًا", en: "No account? Create one" },
  checkEmail: {
    ar: "أرسلنا رسالة تأكيد إلى بريدك. اضغط على الرابط فيها، ثم ارجع هنا وسجّل الدخول.",
    en: "We sent a confirmation email. Tap the link in it, then come back here and sign in.",
  },
  badLogin: { ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة.", en: "Wrong email or password." },
  notConfirmed: { ar: "يرجى تأكيد بريدك الإلكتروني أولًا من الرسالة المرسلة إليك.", en: "Please confirm your email first using the link we sent you." },
  alreadyRegistered: { ar: "هذا البريد مسجّل بالفعل. سجّل الدخول.", en: "This email is already registered. Please sign in." },
  emailConfirmed: { ar: "تم تأكيد بريدك الإلكتروني. ارجع إلى التطبيق وسجّل الدخول.", en: "Your email is confirmed. Go back to the app and sign in." },
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
  q1: { ar: "ماذا قال لي اللّٰه", en: "What did God say to me" },
  godAttr: { ar: "صفة من صفات الله", en: "An attribute of God" },
  q2: { ar: "ماذا قال عني أنا", en: "What did He say about me" },
  sin: { ar: "خطية (أتجنبها)", en: "Sin (to avoid)" },
  command: { ar: "وصية (أتبعها)", en: "Commandment (to follow)" },
  privilege: { ar: "امتياز (أشكره عليه)", en: "Privilege (to thank Him for)" },
  promise: { ar: "وعد (أتمسك به)", en: "Promise (to hold on to)" },
  example: { ar: "قدوة (أتمثل بها)", en: "Example (to imitate)" },
  q3: { ar: "ماذا قلت له (في صلاتي)", en: "What did I say to Him (in prayer)" },
  requests: { ar: "طلبات أخرى", en: "Other requests" },
  addRequest: { ar: "إضافة طلب", en: "Add request" },
  requestText: { ar: "نص الطلب", en: "Request" },
  responseDate: { ar: "تاريخ الاستجابة", en: "Answered on" },
  remove: { ar: "حذف", en: "Remove" },
  reflections: { ar: "تأملات أخرى", en: "Other reflections" },
  reflectionsHint: { ar: "كلام الله لي من: عظة - محاضرة - كتاب - مؤتمر... إلخ", en: "God's word to me from: a sermon, lecture, book, conference…" },
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
