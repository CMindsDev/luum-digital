import { Search } from "lucide-react";
import { Link } from "react-router";
import { BrandLogo, IconButtonLink } from "@/design-system";
import { GlobalSearch } from "./GlobalSearch";
import { IdentityMenu } from "./IdentityMenu";
import { NotificationBell } from "./NotificationBell";

/** Encabezado único del AppShell sobre marino (logotipo oficial + «Servicios digitales»). */
export function Header() {
  return (
    <div className="superficie-oscura bg-marino text-white">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:h-[4.5rem] lg:px-6">
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-boton py-1 pr-2 sm:gap-3" data-guia="encabezado.inicio">
          <BrandLogo className="h-9 sm:h-10 lg:h-11" />
          <span aria-hidden="true" className="hidden h-8 w-px bg-white/30 min-[24rem]:block" />
          <span className="hidden text-[0.8125rem] leading-[1.15] font-semibold text-white min-[24rem]:block sm:text-sm">
            Servicios
            <br />
            digitales
          </span>
        </Link>
        <div className="hidden flex-1 justify-center px-4 lg:flex">
          <GlobalSearch />
        </div>
        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <IconButtonLink to="/buscar" etiqueta="Buscar" icono={Search} variante="oscuro" className="lg:hidden" />
          <NotificationBell />
          <IdentityMenu />
        </div>
      </div>
    </div>
  );
}
