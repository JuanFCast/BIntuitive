import type { Language } from "@/lib/language";

/**
 * La política de privacidad y los términos de uso.
 *
 * Tienen que decir la verdad de lo que hace la aplicación hoy, no lo que hará:
 * las tiendas los comparan con lo que declara su formulario de datos, y quien
 * los lee decide con ellos. Por eso, **al cambiar qué datos se guardan, a quién
 * se envían o qué se cobra, se cambia aquí y se mueve `LEGAL_UPDATED`**. El día
 * que lleguen los anuncios o la suscripción, estas dos páginas cambian con
 * ellos, no después.
 *
 * Es un texto de partida escrito para la aplicación, no asesoría legal:
 * conviene que lo revise un abogado antes de publicar en las tiendas.
 */

export const LEGAL_ENTITY = "AUM Creative Specialists LLC";

/** El único buzón de contacto: soporte, privacidad y borrado de cuentas. */
export const SUPPORT_EMAIL = "support@aumcrsp.com";

/** ISO corto. Se enseña con el formato del idioma. */
export const LEGAL_UPDATED = "2026-11-22";

export type LegalSection = {
  /** Ancla para enlazar a una sección concreta (`/privacy#delete`). */
  id?: string;
  heading: string;
  paragraphs: string[];
  list?: string[];
};

export type LegalDocument = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

export const PRIVACY: Record<Language, LegalDocument> = {
  en: {
    title: "Privacy Policy",
    intro: `BIntuitive is an educational game made by ${LEGAL_ENTITY} ("we"). This policy explains what information BIntuitive uses, why, and what you can do about it. BIntuitive is for people aged 18 and over.`,
    sections: [
      {
        heading: "You can play without an account",
        paragraphs: [
          "If you play as a guest, we do not receive any information about you. Your progress, your profile name and avatar, your favourites and your settings (language, sound, text size) are saved only in your browser or on your device, and they never leave it.",
        ],
      },
      {
        heading: "What we collect if you create an account",
        paragraphs: ["Only what the sign-up form asks for:"],
        list: [
          "Your name, to greet you in the app.",
          "Your date of birth, only to confirm that you are 18 or older.",
          "Your email address, to sign you in, send you the code that activates your account and help you recover your password.",
          "Your password, which is stored encrypted by our account provider. We never see it.",
          "The language you used to sign up, so our emails reach you in that language.",
        ],
      },
      {
        heading: "What we do not do",
        paragraphs: [
          "We do not sell your information, share it for advertising, or use analytics or tracking tools. Your progress in the games stays on your device and is not linked to your account.",
        ],
      },
      {
        heading: "Who helps us run BIntuitive",
        paragraphs: [
          "These companies process information on our behalf and only to provide the service:",
        ],
        list: [
          "Supabase, which stores accounts (servers in the United States).",
          "Resend, which sends account emails such as your activation code.",
          "Amazon Web Services, which hosts the app.",
        ],
      },
      {
        heading: "How long we keep it",
        paragraphs: [
          "We keep your account information while your account exists. When you delete your account, your name, date of birth, email address and password are removed from our systems right away.",
        ],
      },
      {
        id: "delete",
        heading: "Your choices and how to delete your account",
        paragraphs: [
          "You can delete your account at any time inside the app: go to Profile, then Account, and tap \"Delete my account\". It is permanent and takes effect immediately.",
          `You can also ask us to see, correct or delete your information by writing to ${SUPPORT_EMAIL} from the email address of your account. We will answer within 30 days.`,
        ],
      },
      {
        heading: "Security",
        paragraphs: [
          "BIntuitive is served only over an encrypted connection (HTTPS), and passwords are stored encrypted. No system is perfectly secure, but we only collect what the app needs, which limits what could ever be exposed.",
        ],
      },
      {
        heading: "Changes to this policy",
        paragraphs: [
          "If we change how BIntuitive uses information, we will update this page and its date before the change takes effect, and we will let you know in the app if the change is important.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [`${LEGAL_ENTITY} · ${SUPPORT_EMAIL}`],
      },
    ],
  },
  es: {
    title: "Política de privacidad",
    intro: `BIntuitive es un juego educativo de ${LEGAL_ENTITY} ("nosotros"). Esta política explica qué información usa BIntuitive, para qué y qué puedes hacer con ella. BIntuitive es para personas mayores de 18 años.`,
    sections: [
      {
        heading: "Puedes jugar sin cuenta",
        paragraphs: [
          "Si juegas como invitado, no recibimos ninguna información sobre ti. Tu progreso, tu nombre y avatar de perfil, tus favoritos y tus ajustes (idioma, sonido, tamaño de texto) se guardan solo en tu navegador o en tu dispositivo, y nunca salen de ahí.",
        ],
      },
      {
        heading: "Qué recogemos si creas una cuenta",
        paragraphs: ["Solo lo que pide el formulario de registro:"],
        list: [
          "Tu nombre, para saludarte en la aplicación.",
          "Tu fecha de nacimiento, solo para comprobar que tienes 18 años o más.",
          "Tu correo electrónico, para iniciar sesión, enviarte el código que activa tu cuenta y ayudarte a recuperar tu contraseña.",
          "Tu contraseña, que nuestro proveedor de cuentas guarda cifrada. Nosotros nunca la vemos.",
          "El idioma con el que te registraste, para que nuestros correos te lleguen en ese idioma.",
        ],
      },
      {
        heading: "Lo que no hacemos",
        paragraphs: [
          "No vendemos tu información, no la compartimos para publicidad y no usamos herramientas de analítica ni de seguimiento. Tu progreso en los juegos se queda en tu dispositivo y no está ligado a tu cuenta.",
        ],
      },
      {
        heading: "Quién nos ayuda a que BIntuitive funcione",
        paragraphs: [
          "Estas empresas tratan información en nuestro nombre y solo para prestar el servicio:",
        ],
        list: [
          "Supabase, que guarda las cuentas (servidores en Estados Unidos).",
          "Resend, que envía los correos de la cuenta, como tu código de activación.",
          "Amazon Web Services, que aloja la aplicación.",
        ],
      },
      {
        heading: "Cuánto tiempo la guardamos",
        paragraphs: [
          "Guardamos la información de tu cuenta mientras la cuenta exista. Cuando la borras, tu nombre, tu fecha de nacimiento, tu correo y tu contraseña se eliminan de nuestros sistemas en el momento.",
        ],
      },
      {
        id: "delete",
        heading: "Tus opciones y cómo borrar tu cuenta",
        paragraphs: [
          "Puedes borrar tu cuenta cuando quieras desde la aplicación: entra en Perfil, luego en Cuenta, y toca \"Borrar mi cuenta\". Es definitivo y se hace en el momento.",
          `También puedes pedirnos ver, corregir o borrar tu información escribiendo a ${SUPPORT_EMAIL} desde el correo de tu cuenta. Te responderemos en un plazo de 30 días.`,
        ],
      },
      {
        heading: "Seguridad",
        paragraphs: [
          "BIntuitive se sirve solo por conexión cifrada (HTTPS) y las contraseñas se guardan cifradas. Ningún sistema es totalmente seguro, pero solo recogemos lo que la aplicación necesita, y eso limita lo que podría quedar expuesto.",
        ],
      },
      {
        heading: "Cambios en esta política",
        paragraphs: [
          "Si cambiamos cómo usa BIntuitive la información, actualizaremos esta página y su fecha antes de que el cambio entre en vigor, y te avisaremos en la aplicación si el cambio es importante.",
        ],
      },
      {
        heading: "Contacto",
        paragraphs: [`${LEGAL_ENTITY} · ${SUPPORT_EMAIL}`],
      },
    ],
  },
};

export const TERMS: Record<Language, LegalDocument> = {
  en: {
    title: "Terms of Use",
    intro: `These terms apply when you use BIntuitive, an educational game made by ${LEGAL_ENTITY} ("we"). By using BIntuitive you accept them.`,
    sections: [
      {
        heading: "Who can use BIntuitive",
        paragraphs: [
          "BIntuitive is for people aged 18 and over. To create an account you must give your real date of birth.",
        ],
      },
      {
        heading: "Your account",
        paragraphs: [
          "Give accurate information, keep your password to yourself and tell us if you think someone else is using your account. You can delete your account at any time from Profile.",
        ],
      },
      {
        heading: "Using BIntuitive",
        paragraphs: [
          "Use BIntuitive for learning and having fun. Do not try to break it, get around its limits, access other people's accounts or use it in a way that breaks the law.",
        ],
      },
      {
        heading: "Paid features",
        paragraphs: [
          "BIntuitive is free to use today. If paid features are offered in the future, their price and conditions will be shown clearly before you pay, and purchases in the app stores will follow the store's own terms.",
        ],
      },
      {
        heading: "Content",
        paragraphs: [
          "The games, texts and drawings in BIntuitive belong to us or are used with permission. The activity icons are adapted from Twemoji, © Twitter and contributors, licensed under CC BY 4.0. You may use BIntuitive for your own learning, but not copy or resell it.",
        ],
      },
      {
        heading: "No guarantees",
        paragraphs: [
          "We work to keep BIntuitive available and correct, but it is provided as it is, and we cannot promise it will always be available or free of mistakes. To the extent the law allows, we are not responsible for indirect losses that come from using it.",
        ],
      },
      {
        heading: "Ending your use",
        paragraphs: [
          "You can stop using BIntuitive and delete your account whenever you want. We may suspend an account that breaks these terms.",
        ],
      },
      {
        heading: "Changes",
        paragraphs: [
          "If we change these terms, we will update this page and its date. If the change is important, we will tell you in the app before it applies.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [`${LEGAL_ENTITY} · ${SUPPORT_EMAIL}`],
      },
    ],
  },
  es: {
    title: "Términos de uso",
    intro: `Estos términos se aplican cuando usas BIntuitive, un juego educativo de ${LEGAL_ENTITY} ("nosotros"). Al usar BIntuitive los aceptas.`,
    sections: [
      {
        heading: "Quién puede usar BIntuitive",
        paragraphs: [
          "BIntuitive es para personas mayores de 18 años. Para crear una cuenta tienes que dar tu fecha de nacimiento real.",
        ],
      },
      {
        heading: "Tu cuenta",
        paragraphs: [
          "Da información correcta, no compartas tu contraseña y avísanos si crees que alguien más está usando tu cuenta. Puedes borrar tu cuenta cuando quieras desde Perfil.",
        ],
      },
      {
        heading: "Cómo usar BIntuitive",
        paragraphs: [
          "Usa BIntuitive para aprender y divertirte. No intentes romperlo, saltarte sus límites, entrar en cuentas de otras personas ni usarlo de una forma que vaya contra la ley.",
        ],
      },
      {
        heading: "Funciones de pago",
        paragraphs: [
          "Hoy BIntuitive se usa gratis. Si en el futuro se ofrecen funciones de pago, su precio y condiciones se mostrarán con claridad antes de pagar, y las compras en las tiendas de aplicaciones seguirán los términos de cada tienda.",
        ],
      },
      {
        heading: "Contenido",
        paragraphs: [
          "Los juegos, textos y dibujos de BIntuitive son nuestros o se usan con permiso. Los iconos de las actividades están adaptados de Twemoji, © Twitter y colaboradores, con licencia CC BY 4.0. Puedes usar BIntuitive para tu propio aprendizaje, pero no copiarlo ni revenderlo.",
        ],
      },
      {
        heading: "Sin garantías",
        paragraphs: [
          "Trabajamos para que BIntuitive esté disponible y funcione bien, pero se ofrece tal como es, y no podemos prometer que siempre esté disponible ni libre de errores. En la medida en que la ley lo permita, no respondemos por pérdidas indirectas derivadas de su uso.",
        ],
      },
      {
        heading: "Dejar de usarlo",
        paragraphs: [
          "Puedes dejar de usar BIntuitive y borrar tu cuenta cuando quieras. Podemos suspender una cuenta que no cumpla estos términos.",
        ],
      },
      {
        heading: "Cambios",
        paragraphs: [
          "Si cambiamos estos términos, actualizaremos esta página y su fecha. Si el cambio es importante, te avisaremos en la aplicación antes de que se aplique.",
        ],
      },
      {
        heading: "Contacto",
        paragraphs: [`${LEGAL_ENTITY} · ${SUPPORT_EMAIL}`],
      },
    ],
  },
};
