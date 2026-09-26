import type { PageSlug } from "@/constants";

// Content for /page/[slug]. Tokens {free}, {standard}, {express} are filled
// from the store's pricing settings. Text in [brackets] is a placeholder the
// business must replace (legal copy, policies, contact details).

export type PageSection = { id: string; title: string; body: string[] };
export type PageContent = { title: string; intro?: string; updated?: string; sections: PageSection[] };
type Localized = { en: PageContent; ar: PageContent };

const legalSections = (
  en: string[],
  ar: string[],
  kind: { en: string; ar: string }
): { en: PageSection[]; ar: PageSection[] } => ({
  en: en.map((title, i) => ({ id: `s${i + 1}`, title, body: [`[${title} — ${kind.en} text provided by WalStore.]`] })),
  ar: ar.map((title, i) => ({ id: `s${i + 1}`, title, body: [`[${title} — نص ${kind.ar} يقدّمه وولستور.]`] })),
});

const terms = legalSections(
  ["Using WalStore", "Your account", "Orders and pricing", "Shipping and delivery", "Returns and refunds", "Contact us"],
  ["استخدام وولستور", "حسابك", "الطلبات والأسعار", "الشحن والتوصيل", "الإرجاع واسترداد المبلغ", "تواصل معنا"],
  { en: "legal", ar: "قانوني" }
);
const privacy = legalSections(
  ["What we collect", "How we use it", "Cookies and local storage", "Sharing with others", "Your choices", "Contact us"],
  ["ما الذي نجمعه", "كيف نستخدمه", "ملفات تعريف الارتباط والتخزين المحلي", "المشاركة مع الآخرين", "خياراتك", "تواصل معنا"],
  { en: "privacy", ar: "الخصوصية" }
);

const placeholderPage = (en: string, ar: string): Localized => ({
  en: { title: en, sections: [{ id: "s1", title: en, body: [`[${en} — content provided by WalStore.]`] }] },
  ar: { title: ar, sections: [{ id: "s1", title: ar, body: [`[${ar} — محتوى يقدّمه وولستور.]`] }] },
});

export const PAGES: Record<Exclude<PageSlug, "help">, Localized> = {
  "conditions-of-use": {
    en: { title: "Conditions of Use", updated: "[date]", sections: terms.en },
    ar: { title: "شروط الاستخدام", updated: "[التاريخ]", sections: terms.ar },
  },
  "privacy-policy": {
    en: { title: "Privacy Notice", updated: "[date]", sections: privacy.en },
    ar: { title: "إشعار الخصوصية", updated: "[التاريخ]", sections: privacy.ar },
  },
  shipping: {
    en: {
      title: "Shipping Rates & Policies",
      intro: "Where we ship, how much it costs and how long it takes.",
      sections: [
        {
          id: "rates",
          title: "Rates",
          body: [
            "Standard shipping is free on orders over {free}. Below that, standard shipping costs {standard}.",
            "Express shipping costs {express} on any order.",
          ],
        },
        { id: "times", title: "Delivery times", body: ["[Delivery time per region — provided by WalStore.]"] },
        {
          id: "tracking",
          title: "Tracking your order",
          body: ["Open Your orders from the account menu to see whether an order is processing, shipped or delivered."],
        },
        {
          id: "payment",
          title: "Paying for your order",
          body: ["Pay in cash when your order arrives. Card and PayPal payments are not available yet."],
        },
      ],
    },
    ar: {
      title: "أسعار وسياسات الشحن",
      intro: "إلى أين نشحن، وكم يكلّف، وكم يستغرق.",
      sections: [
        {
          id: "rates",
          title: "الأسعار",
          body: [
            "الشحن العادي مجاني للطلبات فوق {free}. وأقل من ذلك تكلفته {standard}.",
            "الشحن السريع تكلفته {express} لأي طلب.",
          ],
        },
        { id: "times", title: "مدة التوصيل", body: ["[مدة التوصيل لكل منطقة — يقدّمها وولستور.]"] },
        {
          id: "tracking",
          title: "تتبّع طلبك",
          body: ["افتح «طلباتك» من قائمة الحساب لترى إن كان الطلب قيد التجهيز أو تم شحنه أو توصيله."],
        },
        {
          id: "payment",
          title: "الدفع",
          body: ["ادفع نقدًا عند وصول طلبك. الدفع بالبطاقة أو عبر PayPal غير متاح حاليًا."],
        },
      ],
    },
  },
  returns: {
    en: {
      title: "Returns & Replacements",
      sections: [
        { id: "window", title: "Return window", body: ["[Return window, item condition and exceptions — provided by WalStore.]"] },
        { id: "how", title: "How to return", body: ["[Steps to start a return — provided by WalStore.]"] },
        { id: "refunds", title: "Refunds", body: ["[How and when refunds are issued — provided by WalStore.]"] },
      ],
    },
    ar: {
      title: "الإرجاع والاستبدال",
      sections: [
        { id: "window", title: "مدة الإرجاع", body: ["[مدة الإرجاع وحالة المنتج والاستثناءات — يقدّمها وولستور.]"] },
        { id: "how", title: "طريقة الإرجاع", body: ["[خطوات بدء الإرجاع — يقدّمها وولستور.]"] },
        { id: "refunds", title: "استرداد المبلغ", body: ["[طريقة وموعد استرداد المبلغ — يقدّمها وولستور.]"] },
      ],
    },
  },
  "about-us": {
    en: {
      title: "About WalStore",
      intro: "T-shirts, jeans, shoes and watches from brands you know.",
      sections: [{ id: "s1", title: "Our story", body: ["[Company story — provided by WalStore.]"] }],
    },
    ar: {
      title: "عن وولستور",
      intro: "تيشيرتات وجينز وأحذية وساعات من علامات تعرفها.",
      sections: [{ id: "s1", title: "قصتنا", body: ["[قصة الشركة — يقدّمها وولستور.]"] }],
    },
  },
  careers: placeholderPage("Careers", "الوظائف"),
  blog: placeholderPage("Blog", "المدونة"),
  sell: placeholderPage("Sell on WalStore", "بِع على وولستور"),
  affiliate: placeholderPage("Become an Affiliate", "انضم كشريك تسويق"),
  advertise: placeholderPage("Advertise Your Products", "أعلن عن منتجاتك"),
};

// Contact details shown on Help — fill in before launch.
export const SUPPORT = { email: "[support email]", phone: "[support phone]" };
