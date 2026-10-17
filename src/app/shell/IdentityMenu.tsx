import { Check, ChevronDown, RotateCcw, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useRestablecerDemo } from "@/app/hooks/useRestablecerDemo";
import { ETIQUETA_ROL } from "@/app/session/roles";
import { buscarIdentidad, useDemoSession } from "@/app/session/store";
import { IDENTIDADES_DEMO } from "@/data/identidades";
import { Avatar, ConfirmDialog, cx, notificar } from "@/design-system";

/**
 * Menú de identidad ficticia (botón de divulgación con panel). El avatar sólo aparece aquí.
 * Cambiar de identidad no es autenticación: sólo elige qué datos de demostración ves.
 */
export function IdentityMenu() {
  const navegar = useNavigate();
  const identidadId = useDemoSession((estado) => estado.identidadId);
  const cambiarIdentidad = useDemoSession((estado) => estado.cambiarIdentidad);
  const identidad = buscarIdentidad(identidadId);
  const [abierto, setAbierto] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const { restablecer, restableciendo } = useRestablecerDemo();
  const contenedorRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const idPanel = useId();

  useEffect(() => {
    if (!abierto) return;
    const alPulsarFuera = (evento: PointerEvent) => {
      if (contenedorRef.current && evento.target instanceof Node && !contenedorRef.current.contains(evento.target)) setAbierto(false);
    };
    document.addEventListener("pointerdown", alPulsarFuera);
    return () => document.removeEventListener("pointerdown", alPulsarFuera);
  }, [abierto]);

  const cerrarYEnfocar = () => {
    setAbierto(false);
    botonRef.current?.focus();
  };

  const elegir = (id: string) => {
    if (id !== identidadId) {
      cambiarIdentidad(id);
      notificar({ tono: "info", titulo: `Ahora usas la demostración como ${buscarIdentidad(id).nombre}`, descripcion: "Identidad ficticia: no es una cuenta municipal." });
    }
    cerrarYEnfocar();
    navegar(buscarIdentidad(id).rol === "ciudadania" ? "/" : "/operador");
  };

  return (
    <div
      ref={contenedorRef}
      className="relative"
      onKeyDown={(evento) => {
        if (evento.key === "Escape" && abierto) {
          evento.stopPropagation();
          cerrarYEnfocar();
        }
      }}
    >
      <button
        ref={botonRef}
        type="button"
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={() => setAbierto((valor) => !valor)}
        data-guia="encabezado.identidad"
        className="flex min-h-11 items-center gap-1.5 rounded-pildora py-1 pr-2 pl-1 text-white hover:bg-white/12"
      >
        <Avatar iniciales={identidad.iniciales} tamano="sm" />
        <span className="sr-only">Identidad de demostración: {identidad.nombre}. Abrir menú de identidad</span>
        <ChevronDown aria-hidden="true" className={cx("size-4 transition-transform", abierto && "rotate-180")} />
      </button>

      <div
        id={idPanel}
        hidden={!abierto}
        className="absolute top-full right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-tarjeta border border-borde bg-superficie p-2 text-tinta shadow-flotante [--color-foco:var(--color-azul)] motion-safe:animate-entrada"
      >
        <div className="px-3 pt-2 pb-3">
          <p className="text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase">Usas la demo como</p>
          <p className="mt-1 font-semibold text-marino">{identidad.nombre}</p>
          <p className="text-sm text-tinta-suave">
            {ETIQUETA_ROL[identidad.rol]} · Identidad ficticia
          </p>
        </div>
        <div className="border-t border-borde pt-2">
          <p id={`${idPanel}-titulo`} className="px-3 pb-1 text-sm font-semibold text-marino">
            Cambiar identidad ficticia
          </p>
          <ul aria-labelledby={`${idPanel}-titulo`} className="flex flex-col">
            {IDENTIDADES_DEMO.map((opcion) => {
              const actual = opcion.id === identidadId;
              return (
                <li key={opcion.id}>
                  <button
                    type="button"
                    aria-pressed={actual}
                    onClick={() => elegir(opcion.id)}
                    className={cx(
                      "flex min-h-12 w-full items-center gap-3 rounded-boton px-3 py-1.5 text-left",
                      actual ? "bg-marino-suave" : "hover:bg-superficie-2",
                    )}
                  >
                    <Avatar iniciales={opcion.iniciales} tamano="sm" tono={actual ? "oscuro" : "claro"} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{opcion.nombre}</span>
                      <span className="block text-xs text-tinta-suave">{opcion.descripcion}</span>
                    </span>
                    {actual ? <Check aria-hidden="true" className="size-4 text-exito" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-2 flex flex-col border-t border-borde pt-2">
          <Link
            to="/cuenta"
            onClick={() => setAbierto(false)}
            className="flex min-h-11 items-center gap-3 rounded-boton px-3 text-sm font-semibold text-marino hover:bg-superficie-2"
          >
            <UserRound aria-hidden="true" className="size-4" />
            Cuenta de demostración
          </Link>
          <button
            type="button"
            onClick={() => {
              setAbierto(false);
              setConfirmar(true);
            }}
            className="flex min-h-11 items-center gap-3 rounded-boton px-3 text-left text-sm font-semibold text-peligro hover:bg-peligro-suave"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Restablecer demostración
          </button>
        </div>
      </div>

      <ConfirmDialog
        abierto={confirmar}
        onCerrar={() => setConfirmar(false)}
        onConfirmar={restablecer}
        cargando={restableciendo}
        tono="peligro"
        titulo="¿Restablecer la demostración?"
        descripcion="Se borrarán los reportes, gestiones, puntos y preferencias que creaste en este navegador. Volverás al inicio con los datos ficticios originales."
        textoConfirmar="Sí, restablecer"
      />
    </div>
  );
}
