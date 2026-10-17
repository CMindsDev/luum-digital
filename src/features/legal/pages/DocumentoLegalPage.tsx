import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link, useParams } from "react-router";
import { DOCUMENTOS_LEGALES, FECHA_DOCUMENTOS } from "../documentos";

export default function DocumentoLegalPage({ slug }: { slug?: string }) {
  const parametros = useParams();
  const documento = DOCUMENTOS_LEGALES.find((item) => item.slug === (slug ?? parametros.documento));

  if (!documento) return <div><h1 className="text-2xl font-semibold text-marino">Documento no encontrado</h1><Link to="/" className="text-enlace underline">Volver al inicio</Link></div>;

  return (
    <article lang="es-MX" className="mx-auto max-w-3xl space-y-8">
      <header>
        <Link to="/" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-enlace underline underline-offset-4">
          <ArrowLeft aria-hidden="true" className="size-4" /> Volver al inicio
        </Link>
        <p className="text-sm font-semibold text-tinta-suave">Información del prototipo</p>
        <h1 className="mt-2 text-3xl leading-tight font-semibold text-marino sm:text-4xl">{documento.titulo}</h1>
        <p className="mt-3 text-lg leading-relaxed text-tinta">{documento.resumen}</p>
        <p className="mt-3 text-sm text-tinta-suave">Actualización: {FECHA_DOCUMENTOS}</p>
      </header>
      <aside className="rounded-tarjeta border border-borde bg-superficie p-4 text-sm leading-relaxed text-tinta">
        Prototipo de demostración. Estos documentos describen su funcionamiento y no sustituyen los avisos oficiales del Ayuntamiento ni los de cada trámite.
      </aside>
      <nav aria-label="En este documento" className="rounded-tarjeta bg-superficie-2 p-5">
        <h2 className="font-semibold text-marino">En este documento</h2>
        <ul className="mt-2 space-y-1">
          {documento.secciones.map((seccion) => <li key={seccion.id}><a href={`#${seccion.id}`} className="inline-flex min-h-11 items-center text-sm text-enlace underline underline-offset-4">{seccion.titulo}</a></li>)}
        </ul>
      </nav>
      {documento.secciones.map((seccion) => (
        <section key={seccion.id} aria-labelledby={seccion.id} className="space-y-3">
          <h2 id={seccion.id} tabIndex={-1} className="scroll-mt-[calc(var(--altura-encabezado)+1.5rem)] text-xl font-semibold text-marino">{seccion.titulo}</h2>
          {seccion.parrafos.map((parrafo) => <p key={parrafo} className="leading-relaxed text-tinta">{parrafo}</p>)}
          {seccion.puntos ? <ul className="list-disc space-y-3 pl-5 leading-relaxed text-tinta">{seccion.puntos.map((punto) => <li key={punto}>{punto}</li>)}</ul> : null}
          {seccion.enlaces ? (
            <ul className="space-y-1 pt-1">
              {seccion.enlaces.map((enlace) => <li key={enlace.url}>{enlace.url.startsWith("/") ? (
                <Link to={enlace.url} className="inline-flex min-h-11 items-center text-sm font-semibold text-enlace underline underline-offset-4">{enlace.titulo}</Link>
              ) : (
                <a href={enlace.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-enlace underline underline-offset-4">
                  {enlace.titulo}<ExternalLink aria-hidden="true" className="size-4 shrink-0" /><span className="sr-only"> (abre otra pestaña)</span>
                </a>
              )}</li>)}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}
