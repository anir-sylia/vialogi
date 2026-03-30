import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Leaf,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  Users,
  WalletCards,
} from "lucide-react";

export type HowItWorksDict = {
  hero: {
    title: string;
    primaryCta: string;
    secondaryCta: string;
  };
  valueProp: {
    stat: string;
    description: string;
  };
  profileTypes: {
    title: string;
    cards: Array<{ title: string; icon: LucideIcon }>;
  };
  transporterBenefit: {
    title: string;
    description: string;
  };
  process123: {
    title: string;
    steps: Array<{ title: string; icon: LucideIcon }>;
  };
  trustBadges: {
    title: string;
    badges: Array<{ title: string; icon: LucideIcon }>;
  };
  proTransporter: {
    title: string;
    description: string;
    cta: string;
  };
  testimonials: {
    title: string;
    items: Array<{ quote: string; author: string }>;
  };
  stats: {
    title: string;
    items: Array<{ label: string; icon: LucideIcon }>;
  };
  faq: {
    title: string;
    items: Array<{ q: string; a: string }>;
  };
  footer: {
    contact: string;
    cgu: string;
    language: string;
  };
};

export const HOW_IT_WORKS: Record<"fr" | "ar", HowItWorksDict> = {
  fr: {
    hero: {
      title: "Le bon chargement, au bon endroit",
      primaryCta: "Expédier un colis",
      secondaryCta: "Devenir transporteur",
    },
    valueProp: {
      stat: "60% Moins cher",
      description:
        "ViaLogi est une solution de livraison collaborative qui s'appuie sur une communauté de conducteurs particuliers et professionnels pour permettre des livraisons moins chères, plus vertes et dans des délais très courts, pour presque tout, partout au Maroc.",
    },
    profileTypes: {
      title: "Quatre types de profils",
      cards: [
        { title: "Expéditeur particulier", icon: User },
        { title: "Transporteur particulier", icon: Truck },
        { title: "Expéditeur professionnel", icon: BriefcaseBusiness },
        { title: "Transporteur professionnel", icon: Users },
      ],
    },
    transporterBenefit: {
      title: "Voyagez intelligent et gratuitement !",
      description:
        "En tant que transporteur, recherchez simplement des colis le long de votre itinéraire ou configurez des alertes en enregistrant vos trajets à l'avance. Dès qu'une annonce correspond à votre trajet, vous recevez une alerte en temps réel et pouvez faire une offre.",
    },
    process123: {
      title: "Le meilleur moyen de se connecter",
      steps: [
        { title: "Publier une annonce", icon: Sparkles },
        { title: "Recevoir des offres", icon: MessageSquare },
        { title: "Confirmer la réception de l'article", icon: BadgeCheck },
      ],
    },
    trustBadges: {
      title: "Confiance et transparence",
      badges: [
        { title: "Profils vérifiés", icon: BadgeCheck },
        { title: "Avis et recommandations", icon: ShieldCheck },
        { title: "Équipe dédiée à la satisfaction client", icon: Users },
      ],
    },
    proTransporter: {
      title: "Vous êtes un transporteur professionnel ?",
      description:
        "ViaLogi permet aux entreprises de transport et de déménagement de s'inscrire pour remplir leurs chargements et augmenter leur chiffre d'affaires.",
      cta: "Voir les annonces",
    },
    testimonials: {
      title: "Clients heureux",
      items: [
        {
          quote:
            "J’ai trouvé un transporteur en quelques minutes. Simple, rapide, et transparent.",
          author: "Expéditeur",
        },
        {
          quote:
            "Je rentabilise mes trajets et je reçois des demandes adaptées à ma route.",
          author: "Transporteur",
        },
        {
          quote:
            "La messagerie intégrée facilite tout : on s’accorde sur les détails sans intermédiaires.",
          author: "Utilisateur",
        },
      ],
    },
    stats: {
      title: "Impact",
      items: [
        { label: "Colis livrés", icon: WalletCards },
        { label: "CO2 économisé", icon: Leaf },
        { label: "Argent gagné par les transporteurs", icon: Truck },
      ],
    },
    faq: {
      title: "FAQ",
      items: [
        {
          q: "Comment se déroule le paiement ?",
          a: "Vous recevez des offres et vous choisissez la meilleure. Le paiement suit le parcours défini sur la plateforme.",
        },
        {
          q: "Comment fonctionne l'assurance ?",
          a: "ViaLogi facilite la mise en relation et sécurise vos transactions. La garde et l'intégrité du colis relèvent de la confiance mutuelle et de la responsabilité directe entre l'expéditeur et le transporteur. C'est pourquoi nous recommandons de bien vérifier le colis ensemble au départ et à l'arrivée.",
        },
        {
          q: "Que faire si mon colis est endommagé ?",
          a: "Contactez le support et fournissez des preuves (photos). Nous vous guidons dans la procédure.",
        },
        {
          q: "Qui sont les transporteurs ?",
          a: "Des conducteurs particuliers et professionnels. Les profils peuvent être vérifiés selon les informations fournies.",
        },
      ],
    },
    footer: {
      contact: "Contact",
      cgu: "CGU",
      language: "Langue : Fr/Ar",
    },
  },
  ar: {
    hero: {
      title: "الحمولة المناسبة، في المكان المناسب",
      primaryCta: "إرسال طرد",
      secondaryCta: "كن ناقلاً",
    },
    valueProp: {
      stat: "أرخص بـ 60%",
      description:
        "فيالوجي هو حل توصيل تشاركي يعتمد على مجتمع من السائقين الخواص والمهنيين للسماح بتوصيل أرخص، وأكثر صداقة للبيئة، وفي آجال قصيرة جداً، لكل شيء تقريباً، في أي مكان في المغرب.",
    },
    profileTypes: {
      title: "أربعة أنواع من الملفات الشخصية",
      cards: [
        { title: "مرسل خاص", icon: User },
        { title: "ناقل خاص", icon: Truck },
        { title: "مرسل مهني", icon: BriefcaseBusiness },
        { title: "ناقل مهني", icon: Users },
      ],
    },
    transporterBenefit: {
      title: "سافر بذكاء ومجاناً!",
      description:
        "بصفتك ناقلاً، ابحث ببساطة عن طرود على طول مسارك أو قم بإعداد تنبيهات من خلال تسجيل رحلاتك مسبقاً. بمجرد أن تتطابق إعلانات مع رحلتك، تتلقى تنبيهاً في الوقت الفعلي ويمكنك تقديم عرض.",
    },
    process123: {
      title: "أفضل طريقة للتواصل",
      steps: [
        { title: "نشر إعلان", icon: Sparkles },
        { title: "تلقي عروض", icon: MessageSquare },
        { title: "تأكيد استلام السلعة", icon: BadgeCheck },
      ],
    },
    trustBadges: {
      title: "الثقة والشفافية",
      badges: [
        { title: "ملفات شخصية موثقة", icon: BadgeCheck },
        { title: "آراء وتوصيات", icon: ShieldCheck },
        { title: "فريق مخصص لإرضاء العملاء", icon: Users },
      ],
    },
    proTransporter: {
      title: "هل أنت ناقل مهني؟",
      description:
        "تتيح فيالوجي لشركات النقل والترحيل التسجيل لملء حمولاتهم وزيادة رقم معاملاتهم.",
      cta: "انظر الإعلانات",
    },
    testimonials: {
      title: "عملاء سعداء",
      items: [
        {
          quote:
            "لقيت ناقل فدقائق قليلة. الخدمة واضحة وسهلة بلا تعقيد.",
          author: "مرسل",
        },
        {
          quote:
            "كنستغل الطريق ديالي ونكملها بالربح بلا ما نرجع خاوي.",
          author: "ناقل",
        },
        {
          quote:
            "المراسلة داخل المنصة كتسهّل الاتفاق على التفاصيل بلا وسطاء.",
          author: "مستخدم",
        },
      ],
    },
    stats: {
      title: "الأثر",
      items: [
        { label: "طرود تم تسليمها", icon: WalletCards },
        { label: "توفير ثاني أكسيد الكربون", icon: Leaf },
        { label: "أموال كسبها الناقلون", icon: Truck },
      ],
    },
    faq: {
      title: "الأسئلة الشائعة",
      items: [
        {
          q: "كيف يتم الدفع؟",
          a: "كتوصلك العروض وكتختار الأنسب. الدفع كيمشي حسب المسار اللي كتوفره المنصة.",
        },
        {
          q: "كيف يعمل التأمين؟",
          a: "فيالوجي هي وسيط كيضمن ليكم التعامل الآمن وتقريب المسافات. ملي كيتسلم الناقل الطرد، كتولي الأمانة والمسؤولية عليه مباشرة حتى يوصلها لعندك. داكشي علاش كنصحوكم ديما تفحصو الطرد ديالكم بجوج في وقت التسليم وفي وقت الاستلام باش تضمنوا حقكم.",
        },
        {
          q: "ماذا أفعل إذا تضرر طردي؟",
          a: "تواصل مع الدعم ووفّر إثباتات (صور). غادي نرشدوك فالخطوات اللازمة.",
        },
        {
          q: "من هم الناقلون؟",
          a: "سائقون خواص ومهنيون. كاينين ملفات ممكن تكون موثقة حسب المعطيات المتوفرة.",
        },
      ],
    },
    footer: {
      contact: "اتصال",
      cgu: "شروط الاستخدام العامة",
      language: "اللغة: Fr/Ar",
    },
  },
};

