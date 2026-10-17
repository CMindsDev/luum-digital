import { FlaskConical } from "lucide-react";
import { Link } from "react-router";
import { cx } from "../lib/cx";

export const TEXTO_ROTULO_DEMO = "Prototipo de demostración. No realiza gestiones oficiales";

export interface DemoRibbonProps {
  /** Ruta con la explicación de las limitaciones. */
  destino?: string;
  className?: string;
}

/**
 * Rótulo permanente del AppShell (regla de producto 1). Enlaza a «Cuenta de demostración → Acerca
 * del prototipo». Se usa fuera de un router (pantalla de error raíz) con `sinRouter`.
 */
export function DemoRibbon({ destino = "/cuenta#acerca", className, sinRouter = false }: DemoRibbonProps & { sinRouter?: boolean }) {
  // marino sobre lima-logo 8.73:1
  const clases = cx(
    "flex min-h-8 w-full items-center justify-center gap-2 bg-lima-logo px-4 py-1.5 text-center text-[0.8125rem] leading-tight font-semibold text-marino underline-offset-2 hover:underline",
    className,
  );
  const contenido = (
    <>
      <FlaskConical aria-hidden="true" className="size-4 shrink-0" />
      <span>
        {TEXTO_ROTULO_DEMO}
        <span className="hidden font-medium sm:inline"> · Saber más</span>
      </span>
    </>
  );
  return sinRouter ? (
    <a href={destino} className={clases} data-rotulo-demo="">
      {contenido}
    </a>
  ) : (
    <Link to={destino} className={clases} data-rotulo-demo="">
      {contenido}
    </Link>
  );
}
