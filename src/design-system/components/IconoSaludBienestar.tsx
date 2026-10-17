import type { LucideProps } from "lucide-react";
import { forwardRef, useId } from "react";
import { ICONOS_BANDA } from "../lib/recursos-laboratorio";

/** Conserva el recurso de marca y adapta su color al contexto, como los demás iconos. */
export const IconoSaludBienestar = forwardRef<SVGSVGElement, LucideProps>(function IconoSaludBienestar(
  { size = 24, ...props },
  ref,
) {
  const mascara = useId();
  return (
    <svg ref={ref} width={size} height={size} aria-hidden="true" {...props} viewBox="0 0 121 99" fill="none">
      <defs>
        <mask id={mascara} x="0" y="0" width="121" height="99" maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }}>
          <image href={ICONOS_BANDA.salud} width="121" height="99" />
        </mask>
      </defs>
      <rect width="121" height="99" fill="currentColor" mask={`url(#${mascara})`} />
    </svg>
  );
});
