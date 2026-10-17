export const FECHA_DOCUMENTOS = "17 de octubre de 2026";
export const AVISO_OFICIAL = "https://www.merida.gob.mx/avisoprivacidad/";

interface SeccionLegal {
  id: string;
  titulo: string;
  parrafos: readonly string[];
  puntos?: readonly string[];
  enlaces?: readonly { titulo: string; url: string }[];
}

export interface DocumentoLegal {
  slug: string;
  titulo: string;
  resumen: string;
  secciones: readonly SeccionLegal[];
}

const PROVEEDORES = [
  { titulo: "Privacidad de OpenFreeMap", url: "https://openfreemap.org/privacy/" },
  { titulo: "Privacidad de Mapbox", url: "https://www.mapbox.com/legal/privacy" },
  { titulo: "Privacidad de OpenAI", url: "https://openai.com/policies/privacy-policy/" },
  { titulo: "Privacidad de Cloudflare", url: "https://www.cloudflare.com/privacypolicy/" },
] as const;

export const DOCUMENTOS_LEGALES: readonly DocumentoLegal[] = [
  {
    slug: "politica-cookies",
    titulo: "Política de Cookies",
    resumen: "Qué se guarda en tu navegador, para qué sirve y cómo puedes eliminarlo.",
    secciones: [
      {
        id: "tecnologias",
        titulo: "Cookies y almacenamiento del navegador",
        parrafos: ["Esta versión del prototipo no configura cookies propias de publicidad ni incorpora herramientas propias de analítica. Sí utiliza almacenamiento local y caché para sus funciones de demostración. El almacenamiento local no es una cookie: permanece en tu navegador y no se adjunta automáticamente a cada solicitud web."],
        puntos: [
          "Datos de demostración y preferencias: se guardan en claves con el prefijo merida-demo:v1:. Incluyen la identidad ficticia seleccionada, avances, reportes y otras colecciones simuladas.",
          "Lectura de este aviso: al aceptar se guarda únicamente el valor «leido» en luum:aviso-cookies:v1, sin nombre ni identificador personal. Se conserva hasta que borres los datos del sitio o cambie la versión del aviso.",
          "Si eliges «Ahora no», solo se recuerda el aplazamiento durante la sesión de esta pestaña, con la clave luum:aviso-cookies:v1:sesion.",
          "Aplicación instalable: el service worker conserva recursos estáticos, como imágenes, estilos y código. No está configurado para almacenar respuestas de la API, conversaciones o documentos privados en su caché.",
        ],
      },
      {
        id: "eleccion",
        titulo: "Qué significa aceptar",
        parrafos: ["Aceptar confirma que has leído este aviso y recuerda esa elección. No activa publicidad, analítica ni servicios adicionales. No autoriza el micrófono, tu ubicación ni el envío de conversaciones a una IA. Cada permiso se solicita en el momento de usar la función correspondiente.", "Puedes cerrar el aviso o elegir «Ahora no» y seguir navegando. No se muestran categorías opcionales que esta versión no utiliza. Si se incorporan tecnologías opcionales, deberán informarse y ofrecer una elección específica antes de activarlas."],
      },
      {
        id: "control",
        titulo: "Cómo revisar o borrar lo guardado",
        parrafos: ["Puedes abrir de nuevo el panel con «Revisar aviso de cookies» en el pie de página. «Restablecer demostración», en Cuenta de demostración, elimina las claves merida-demo:v1:; no borra la aceptación de este aviso. Para borrar también el aviso y la caché, utiliza los controles de datos del sitio de tu navegador. Al eliminar los datos locales se pierden los avances ficticios guardados."],
        enlaces: [{ titulo: "Ir a Cuenta de demostración", url: "/cuenta" }],
      },
      {
        id: "terceros",
        titulo: "Recursos y servicios externos",
        parrafos: ["Al abrir mapas o utilizar una integración activa, el proveedor puede recibir tu dirección IP y datos técnicos de la solicitud. Los mapas utilizan OpenFreeMap o Mapbox según la configuración. La búsqueda y la voz pueden utilizar OpenAI; las comprobaciones de seguridad pueden utilizar Cloudflare. Sus condiciones son independientes de este aviso. Los enlaces externos también tienen sus propias políticas."],
        enlaces: PROVEEDORES,
      },
    ],
  },
  {
    slug: "aviso-privacidad",
    titulo: "Aviso de Privacidad",
    resumen: "Información sobre los datos de esta demostración y los canales oficiales del Ayuntamiento.",
    secciones: [
      {
        id: "alcance",
        titulo: "Alcance de este documento",
        parrafos: ["Este texto describe el prototipo Luum Digital. No acredita una integración municipal ni sustituye el aviso aplicable a un trámite oficial. El aviso del portal del Ayuntamiento identifica al Municipio de Mérida, Yucatán, a través de su Dirección de Innovación y Gobierno Inteligente, como responsable del tratamiento que ese portal realiza. Esa declaración no atribuye automáticamente al Ayuntamiento la operación de este prototipo."],
        enlaces: [{ titulo: "Consultar el aviso oficial del Ayuntamiento", url: AVISO_OFICIAL }],
      },
      {
        id: "datos",
        titulo: "Datos y finalidades de la demostración",
        parrafos: ["La app utiliza perfiles, documentos, folios, reportes y movimientos ficticios para demostrar los recorridos. Guarda avances y preferencias en el navegador. No ingreses CURP, INE, tarjetas bancarias, documentos auténticos ni información sensible de otras personas."],
        puntos: [
          "La ubicación del dispositivo se pide tras una acción expresa. También puedes indicar una ubicación manualmente. Al usar un mapa, su proveedor recibe las solicitudes de las zonas que visualizas.",
          "Las fotos de reportes se validan y previsualizan temporalmente; no se guardan como parte de la persistencia de demostración.",
          "Las conversaciones de salud mental se mantienen en memoria en el diseño de esta demo y se separan del expediente y del asistente general. Los proveedores externos, si se habilitan, tienen sus propias condiciones de tratamiento.",
        ],
      },
      {
        id: "integraciones",
        titulo: "Cuándo intervienen terceros",
        parrafos: ["Con una configuración de IA real activa, la búsqueda puede enviar tu consulta a OpenAI para recuperar información y redactar una respuesta con fuentes. La voz transmite audio y texto a OpenAI cuando la activas y autorizas el micrófono. Las guardas Clef pueden enviar mensajes recientes a Cloudflare para comprobar ciertas acciones. En bienestar, la IA real requiere habilitación y consentimiento específico; aceptar el aviso de cookies no lo sustituye.", "El servidor puede procesar datos técnicos para operar y limitar el uso del servicio. Este documento no promete ausencia de registros del alojamiento ni una retención determinada de los proveedores. Evita datos personales en búsquedas y conversaciones."],
        enlaces: PROVEEDORES,
      },
      {
        id: "derechos",
        titulo: "Control local y derechos ante el Ayuntamiento",
        parrafos: ["Puedes borrar avances ficticios con «Restablecer demostración» o eliminar los datos del sitio desde el navegador. Para conocer el acceso, rectificación, cancelación u oposición respecto de datos entregados al Ayuntamiento, consulta su aviso y la Unidad de Transparencia. Los trámites y las dependencias pueden contar con avisos específicos; revisa el correspondiente antes de proporcionar información."],
        enlaces: [
          { titulo: "Aviso de Privacidad Simplificado del Ayuntamiento", url: AVISO_OFICIAL },
          { titulo: "Avisos de privacidad por dependencias", url: "https://www.merida.gob.mx/avisodirecciones" },
          { titulo: "Unidad de Transparencia Municipal", url: "https://www.merida.gob.mx/transparencia/" },
          { titulo: "Cuenta de demostración", url: "/cuenta" },
        ],
      },
    ],
  },
  {
    slug: "uso-etico-ia",
    titulo: "Uso Ético de IA",
    resumen: "Qué puede hacer el asistente, sus límites y las decisiones que siempre te corresponden.",
    secciones: [
      {
        id: "transparencia",
        titulo: "Transparencia y verificación",
        parrafos: ["Pekito es un asistente del prototipo. Según la configuración puede usar respuestas programadas, búsqueda con IA o voz. Una respuesta automatizada puede contener errores incluso cuando incluye referencias. Verifica requisitos, costos, plazos y disponibilidad en la fuente oficial del servicio antes de tomar decisiones."],
      },
      {
        id: "control-humano",
        titulo: "Las personas mantienen el control",
        parrafos: ["El asistente ciudadano puede orientar, abrir pantallas y preparar información dentro de las acciones permitidas. Los envíos y las decisiones que requieren confirmación permanecen en manos de la persona. La IA no sustituye a la autoridad municipal ni convierte una simulación en un trámite oficial.", "En el Centro de operaciones, las sugerencias de clasificación, prioridad o canalización deben ser revisadas por una persona autorizada. No se deben usar la popularidad, las recompensas ni las conversaciones de bienestar para decidir la atención de un caso."],
      },
      {
        id: "salud-seguridad",
        titulo: "Salud y situaciones de riesgo",
        parrafos: ["El acompañamiento de bienestar es opcional. No diagnostica, no prescribe ni sustituye atención profesional. La ayuda humana debe poder consultarse sin terminar una conversación. El prototipo no activa servicios de emergencia ni envía alertas reales por sí mismo. Usa los canales humanos verificados que aparecen en Ayuda inmediata."],
        enlaces: [{ titulo: "Abrir Bienestar y sus opciones de ayuda", url: "/bienestar" }],
      },
      {
        id: "datos-responsabilidad",
        titulo: "Privacidad y uso responsable",
        parrafos: ["No compartas datos sensibles, documentos reales ni información de terceros con el asistente. El micrófono y la ubicación requieren permisos propios. La aceptación del aviso de cookies no autoriza estos usos.", "No utilices la app para discriminar, acosar, suplantar identidades o presentar información falsa como oficial. Si una respuesta no es clara o contradice su fuente, consulta el documento original y al área municipal responsable. Este compromiso describe el diseño del prototipo; no es una certificación de seguridad o de ausencia de sesgos."],
        enlaces: [{ titulo: "Revisar el Aviso de Privacidad", url: "/legal/aviso-privacidad" }],
      },
    ],
  },
  {
    slug: "terminos-condiciones",
    titulo: "Términos y condiciones",
    resumen: "Condiciones para explorar esta demostración de servicios digitales.",
    secciones: [
      {
        id: "demostracion",
        titulo: "Un entorno de demostración",
        parrafos: ["Luum Digital permite explorar una experiencia de servicios municipales con datos ficticios. No realiza gestiones oficiales, pagos reales, citas válidas ni solicitudes efectivas al Ayuntamiento. Los folios DEMO, puntos, beneficios y documentos de ejemplo no tienen validez administrativa, fiscal o comercial. Las identidades seleccionables son ficticias y no constituyen autenticación municipal."],
      },
      {
        id: "uso",
        titulo: "Uso permitido y cuidado de los datos",
        parrafos: ["Utiliza información ficticia y respeta a las demás personas. No aportes documentos oficiales, datos bancarios ni datos sensibles reales. No intentes acceder a información ajena, alterar permisos o utilizar las sugerencias del asistente para causar daño. La ayuda humana y la información legal permanecen disponibles sin aceptar un uso de IA."],
      },
      {
        id: "fuentes",
        titulo: "Fuentes y servicios externos",
        parrafos: ["Las fichas indican la fuente y el estado de la información; algunos datos pueden estar pendientes de verificación. Las condiciones de cada servicio oficial se determinan en su portal y su dependencia responsable. Un enlace a un servicio no equivale a una integración ni garantiza su disponibilidad.", "Los mapas, la IA, las tiendas de aplicaciones y otros sitios enlazados tienen condiciones propias. El funcionamiento de una opción depende de la configuración y de la conexión. Si una integración no está disponible, una simulación no debe presentarse como un resultado oficial."],
        enlaces: [{ titulo: "Avisos oficiales del Ayuntamiento", url: AVISO_OFICIAL }],
      },
      {
        id: "conservacion",
        titulo: "Disponibilidad y contenido",
        parrafos: ["Los avances de la demo se guardan en el navegador y pueden perderse al borrar sus datos o restablecerla. Este prototipo no ofrece respaldo ni garantía de continuidad de esos avances. Los logotipos, imágenes y contenidos de terceros conservan los derechos de sus titulares; su presencia no acredita patrocinio ni una autorización adicional de uso.", "Estos documentos pueden actualizarse cuando cambien las funciones o integraciones. Revisa la fecha publicada. Antes de utilizar el sistema como servicio real, sus condiciones y el responsable del tratamiento deberán validarse por las áreas competentes; este prototipo no acredita esa validación."],
      },
    ],
  },
];
