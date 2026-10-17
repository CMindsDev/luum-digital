import { Search, X } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Button, IconButton } from "@/design-system";

export interface BuscadorCatalogoProps {
  /** Texto inicial (desde la URL). Para reiniciarlo, cambia la `key` del componente. */
  inicial?: string;
  onBuscar: (texto: string) => void;
  etiqueta?: string;
  marcador?: string;
  guia?: string;
}

/** Buscador del catálogo en lenguaje natural (envía al pulsar «Buscar» o Enter). */
export function BuscadorCatalogo({
  inicial = "",
  onBuscar,
  etiqueta = "Buscar en el catálogo",
  marcador = "p. ej. «licencia de funcionamiento», «becas», «predial»",
  guia = "servicios.buscador",
}: BuscadorCatalogoProps) {
  const [texto, setTexto] = useState(inicial);
  const id = useId();
  const idAyuda = `${id}-ayuda`;

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    onBuscar(texto.trim());
  };

  return (
    <form role="search" aria-label={etiqueta} onSubmit={enviar} data-guia={guia} className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.9375rem] font-semibold text-tinta">
        {etiqueta}
      </label>
      <p id={idAyuda} className="text-sm text-tinta-suave">
        Escribe con tus palabras: buscamos en nombres, descripciones y sinónimos de las fichas.
      </p>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-tinta-suave" />
          <input
            id={id}
            type="search"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder={marcador}
            aria-describedby={idAyuda}
            autoComplete="off"
            enterKeyHint="search"
            maxLength={120}
            className="h-12 w-full rounded-control border border-borde-control bg-superficie pr-12 pl-11 text-base text-tinta placeholder:text-tinta-suave hover:border-marino [&::-webkit-search-cancel-button]:hidden"
          />
          {texto ? (
            <IconButton
              etiqueta="Borrar búsqueda"
              icono={X}
              onClick={() => {
                setTexto("");
                onBuscar("");
              }}
              className="absolute top-1/2 right-0.5 -translate-y-1/2"
            />
          ) : null}
        </div>
        <Button type="submit" iconoInicio={Search}>
          Buscar
        </Button>
      </div>
    </form>
  );
}
