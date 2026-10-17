import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSinConexion } from "@/app/hooks/useSinConexion";
import { esConsultaSensible } from "@/features/home/lib/destino-busqueda";
import { crearClienteBusquedaInteligente } from "@/services/busqueda-inteligente";
import { CLAVES } from "./comun";

const cliente = crearClienteBusquedaInteligente();
const LARGO_MINIMO_CONSULTA = 2;

export interface OpcionesBusquedaInteligente {
  habilitada?: boolean;
}

export function puedeUsarBusquedaInteligente(
  consulta: string,
  { habilitada = true, sinConexion = false }: OpcionesBusquedaInteligente & { sinConexion?: boolean } = {},
): boolean {
  const texto = consulta.trim();
  return habilitada && !sinConexion && texto.length >= LARGO_MINIMO_CONSULTA && !esConsultaSensible(texto);
}

export function useBusquedaInteligente(consulta: string, { habilitada = true }: OpcionesBusquedaInteligente = {}) {
  const sinConexion = useSinConexion();
  const { i18n } = useTranslation();
  const texto = consulta.trim();
  const activa = puedeUsarBusquedaInteligente(texto, { habilitada, sinConexion });
  const query = useQuery({
    queryKey: [CLAVES.busquedaInteligente, activa ? "activa" : "silencio", texto, i18n.language],
    queryFn: () => cliente.buscar(texto),
    enabled: activa,
    staleTime: 2 * 60_000,
    retry: false,
    networkMode: "always",
  });

  return { ...query, habilitada: activa };
}
