import { Cookie, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Button, cx, Dialog } from "@/design-system";
import { avisoCookiesAtendido, omitirAvisoInicial, recordarAvisoCookies } from "../aviso-cookies";
import { AVISO_OFICIAL, DOCUMENTOS_LEGALES } from "../documentos";

/** Pie legal compartido. La aceptación recuerda la lectura; no habilita tratamientos opcionales. */
export function LegalFooter({ compacto = false }: { compacto?: boolean }) {
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(() => !omitirAvisoInicial(pathname) && !avisoCookiesAtendido());
  const [sinPersistencia, setSinPersistencia] = useState(false);

  function atender(aceptar: boolean) {
    const guardado = recordarAvisoCookies(aceptar);
    setSinPersistencia(!guardado);
    setAbierto(false);
  }

  const enlaces = (
    <>
      <nav aria-label="Información legal">
        <ul className={cx("gap-x-6 gap-y-1", compacto ? "flex flex-wrap" : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")}>
          {DOCUMENTOS_LEGALES.map((documento) => (
            <li key={documento.slug}>
              <Link to={`/legal/${documento.slug}`} className="inline-flex min-h-11 items-center text-sm font-medium text-marino underline-offset-4 hover:underline focus-visible:underline">
                {documento.titulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-borde pt-2">
        <button type="button" onClick={() => setAbierto(true)} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-enlace underline underline-offset-4" aria-haspopup="dialog">
          <Cookie aria-hidden="true" className="size-4" /> Revisar aviso de cookies
        </button>
        <a href={AVISO_OFICIAL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm text-tinta-suave underline underline-offset-4">
          Aviso oficial del Ayuntamiento<ExternalLink aria-hidden="true" className="size-4" /><span className="sr-only"> (abre otra pestaña)</span>
        </a>
      </div>
    </>
  );

  return (
    <div lang="es-MX">
      <footer className={cx("border-t border-borde text-tinta", compacto ? "py-1" : "mt-10 pt-7")}>
        {!compacto ? (
          <div className="mb-4">
            <p className="font-semibold text-marino">Servicios digitales · Demostración</p>
            <p className="mt-1 text-sm text-tinta-suave">Información, privacidad y condiciones de uso.</p>
          </div>
        ) : null}
        {compacto ? (
          <details className="max-h-[28dvh] overflow-y-auto">
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-marino">Información legal y cookies</summary>
            {enlaces}
          </details>
        ) : enlaces}
        {sinPersistencia ? <p role="status" className="mt-2 text-sm text-tinta-suave">Tu navegador no permitió guardar la elección. Puedes seguir usando la app; el aviso podría aparecer de nuevo.</p> : null}
      </footer>
      <Dialog
        abierto={abierto}
        onCerrar={() => atender(false)}
        titulo="Cookies y tu privacidad"
        descripcion="Te contamos qué guarda esta demostración en tu navegador."
        tamano="md"
        acciones={
          <>
            <Button variante="secundario" onClick={() => atender(false)}>Ahora no</Button>
            <Button onClick={() => atender(true)}>Aceptar y continuar</Button>
          </>
        }
      >
        <div className="space-y-4 pb-2 text-[0.9375rem] leading-relaxed">
          <span aria-hidden="true" className="inline-flex size-12 items-center justify-center rounded-tarjeta bg-marino-suave text-marino"><Cookie className="size-6" /></span>
          <p>Usamos almacenamiento del navegador para tus avances ficticios, preferencias y recursos de la app. Esta versión no configura cookies propias de publicidad ni herramientas propias de analítica.</p>
          <div className="rounded-control bg-superficie-2 p-3 text-sm">
            Aceptar recuerda únicamente que leíste este aviso. No autoriza tu ubicación, el micrófono ni el uso de IA. También puedes elegir «Ahora no» y seguir navegando.
          </div>
          <Link to="/legal/politica-cookies" onClick={() => atender(false)} className="inline-flex min-h-11 items-center font-semibold text-enlace underline underline-offset-4">Consultar la Política de Cookies</Link>
        </div>
      </Dialog>
    </div>
  );
}
