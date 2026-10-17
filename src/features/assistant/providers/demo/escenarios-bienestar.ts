/**
 * Escenarios programados del acompañante de bienestar (ámbito "bienestar"). Revisables y sin IA.
 *
 * Reglas: no diagnostica, no prescribe, no aplica cuestionarios clínicos ni da puntuaciones, no
 * presiona a revelar, no promueve dependencia, sin rachas ni culpa, se identifica como simulación y
 * deriva a ayuda humana. Ante señales de riesgo o «Necesito ayuda inmediata», muestra ayuda humana
 * ANTES de escribir nada. Para personas adultas.
 */
import type { Escenarios, HerramientasEscenario } from "./sesion-demo";
import { contiene, detectarRiesgo, esAfirmacion, esNegacion } from "./texto";

export const ENTRADAS_BIENESTAR = [
  "Quiero hablar de cómo me siento",
  "Busco apoyo para alguien",
  "Quiero encontrar atención",
  "Necesito ayuda inmediata",
] as const;

const PRESENTACION =
  "Soy un acompañante de demostración con respuestas programadas: no soy una persona, no soy una IA conectada ni un servicio oficial, y no doy diagnósticos.";

/** Respuestas de escucha: validan sin dramatizar ni minimizar y recuerdan la ayuda humana. */
const ESCUCHA = [
  "Te leo. Gracias por compartirlo. ¿Qué te ayudaría ahora: seguir contando, buscar atención profesional o ver opciones de ayuda humana?",
  "Tiene sentido que te sientas así con lo que estás viviendo. No tienes que resolverlo todo hoy. ¿Hay alguien de confianza con quien puedas hablar?",
  "Aquí sigo para leerte un momento más. Recuerda que no soy una persona profesional: si lo que sientes pesa mucho, hablar con alguien puede ayudar, y «Ayuda inmediata» siempre está visible.",
] as const;

/** Frases con las que la persona pide empezar a conversar (abren la escucha una sola vez). */
const ENTRADAS_ESCUCHA = ["como me siento", "hablar de", "quiero hablar", "necesito desahogarme", "quiero platicar"] as const;

/** La persona describe cómo se siente: se continúa la conversación, nunca se reinicia el saludo. */
const SENTIMIENTOS = ["me siento", "me he sentido", "me senti", "me estoy sintiendo", "me sentia"] as const;

/** Reflejos breves, no clínicos: nombran lo que la persona comparte y ofrecen ayuda humana sin presionar. */
const REFLEJOS = [
  "Gracias por contarme cómo te sientes. Lo que sientes importa y no tienes que justificarlo. ¿Quieres contarme un poco más de lo que está pasando? Si prefieres hablar con una persona, puedo mostrarte las líneas de ayuda humana.",
  "Te leo. Suena a que esto te está pesando. No tienes que resolverlo todo ahora. Si te ayuda, sigue contándome a tu ritmo; y si quieres hablar con alguien, las líneas de ayuda humana y «Ayuda inmediata» están a la mano.",
  "Entiendo que te sientas así. Gracias por seguir compartiéndolo. Recuerda que no soy una persona profesional: hablar con alguien de confianza o con una línea de ayuda humana puede acompañarte mejor que yo.",
] as const;

function objetivoDeAtencion(herramientas: HerramientasEscenario): string | null {
  return herramientas.pantalla.objetivos.find((objetivo) => /atencion|ubicacion|donde/.test(objetivo.id))?.id ?? null;
}

async function encontrarAtencion(herramientas: HerramientasEscenario) {
  await herramientas.accion("mostrarApoyoHumano", { motivo: "orientacion" });
  const objetivo = objetivoDeAtencion(herramientas);
  if (objetivo) await herramientas.accion("senalarElemento", { objetivo });
  herramientas.decir(
    "Te mostré los canales y lugares de atención verificados, con su fuente. Tú decides si y cuándo contactarlos. Si quieres, también puedes probar la solicitud de orientación simulada (es una demostración: nadie la recibe).",
  );
}

export const escenariosBienestar: Escenarios = async (texto, n, herramientas) => {
  const { memoria } = herramientas;

  // 1) Riesgo o ayuda inmediata: primero la ayuda humana, después las palabras.
  const riesgo = detectarRiesgo(texto);
  if (riesgo) {
    memoria.propuesta = null;
    await herramientas.accion("mostrarApoyoHumano", { motivo: riesgo });
    herramientas.decir(
      riesgo === "emergencia"
        ? "Te mostré la ayuda humana disponible ahora. Si estás en peligro, llama ya con «Ayuda inmediata». No tienes que explicarme nada para hacerlo."
        : "Gracias por decírmelo. Lo más importante ahora es que hables con una persona: te mostré la ayuda humana disponible. Si estás en peligro inmediato, usa «Ayuda inmediata». Puedo quedarme aquí mientras tanto.",
    );
    return;
  }

  // 2) Personas menores de edad: este prototipo no está diseñado para atenderlas.
  if (/\btengo (1[0-7]|[1-9]) anos\b|\bsoy menor\b|\bsoy (un )?nin[oa]\b|\bvoy en la secundaria\b/.test(n)) {
    await herramientas.accion("mostrarApoyoHumano", { motivo: "orientacion" });
    herramientas.decir(
      "Gracias por contarme. Este espacio de demostración es para personas adultas, así que no es el lugar adecuado para acompañarte. Te mostré opciones de ayuda humana; también puedes hablar con una persona adulta de confianza.",
    );
    return;
  }

  // 3) ¿Quién eres? / privacidad.
  if (/\b(eres|estoy hablando con) (una |un )?(ia|inteligencia artificial|persona|humano|humana|real|robot|bot|psicolog[oa])\b|\bquien eres\b|\bque eres\b/.test(n)) {
    herramientas.decir(`${PRESENTACION} Esta conversación sólo vive en esta pestaña: no se guarda ni se comparte con el asistente general.`);
    return;
  }
  if (/guarda|privad|confidencial|quien lee|se queda/.test(n)) {
    herramientas.decir(
      "Esta conversación sólo vive en la memoria de esta pestaña: no se guarda, no va a analítica ni al asistente general. Al cerrar o al borrar la conversación desaparece.",
    );
    return;
  }

  // 4) Respuesta a «¿Quieres que te muestre dónde hay atención?».
  if (memoria.propuesta?.tipo === "atencion") {
    if (esAfirmacion(n)) {
      memoria.propuesta = null;
      await encontrarAtencion(herramientas);
      return;
    }
    if (esNegacion(n)) {
      memoria.propuesta = null;
      herramientas.decir("Está bien. Si cambias de opinión, aquí estará la opción. ¿Quieres contarme algo más?");
      return;
    }
  }

  // 5) Entradas de la pantalla.
  if (contiene(n, ["encontrar atencion", "donde me atienden", "donde puedo ir", "atencion psicologica", "busco psicolog", "quiero terapia", "hablar con un profesional"])) {
    memoria.propuesta = null;
    await encontrarAtencion(herramientas);
    return;
  }
  if (contiene(n, ["apoyo para alguien", "ayudar a alguien", "para alguien", "mi amigo", "mi amiga", "mi hijo", "mi hija", "mi pareja", "mi mama", "mi papa", "mi hermano", "mi hermana"])) {
    memoria.propuesta = { tipo: "atencion" };
    herramientas.decir(
      "Qué bueno que quieras acompañar a alguien. Suele ayudar escuchar sin juzgar, preguntarle qué necesita y no forzarle a hablar. Cuídate también tú. Si notas señales de peligro, busca ayuda humana de inmediato. ¿Quieres que te muestre dónde hay atención?",
    );
    return;
  }
  // La bienvenida de escucha sólo abre la conversación una vez; después, la conversación sigue.
  if (!memoria.escuchando && contiene(n, ENTRADAS_ESCUCHA)) {
    memoria.escuchando = true;
    memoria.turnosEscucha = 0;
    herramientas.decir(
      `Gracias por darte este espacio. Puedes contarme lo que quieras, a tu ritmo; no tienes que explicarlo todo. ${PRESENTACION} Si en algún momento prefieres hablar con alguien, «Ayuda inmediata» siempre está visible.`,
    );
    return;
  }
  // «Me siento…»: la persona ya está contando algo. Se refleja sin evaluar y se ofrece ayuda humana.
  if (contiene(n, SENTIMIENTOS)) {
    const primeraVez = !memoria.escuchando;
    memoria.escuchando = true;
    const respuesta = REFLEJOS[memoria.turnosEscucha % REFLEJOS.length] ?? REFLEJOS[0];
    memoria.turnosEscucha += 1;
    herramientas.decir(primeraVez ? `${respuesta} ${PRESENTACION}` : respuesta);
    return;
  }

  // 6) Escucha: respuestas breves, sin diagnóstico ni evaluación.
  if (memoria.escuchando) {
    const respuesta = ESCUCHA[memoria.turnosEscucha % ESCUCHA.length] ?? ESCUCHA[0];
    memoria.turnosEscucha += 1;
    herramientas.decir(respuesta);
    return;
  }

  herramientas.decir(
    `Puedo acompañarte con alguna de estas opciones: «${ENTRADAS_BIENESTAR.join("», «")}». ${PRESENTACION}`,
  );
};
