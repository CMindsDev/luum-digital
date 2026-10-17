/**
 * Colonias y comisarías de Mérida con centroides APROXIMADOS para ubicar en la demostración los
 * reportes que se capturan de forma manual. No son límites oficiales ni nombres catastrales: sólo
 * sirven para centrar el mapa (Mérida Móvil usa los nombres catastrales de cada colonia).
 */
export interface ColoniaDemo {
  id: string;
  nombre: string;
  tipo: "colonia" | "fraccionamiento" | "comisaria";
  lat: number;
  lng: number;
}

export const LEYENDA_COLONIAS = "Centroides aproximados para la demostración; no son límites oficiales.";

export const COLONIAS_DEMO: readonly ColoniaDemo[] = [
  { id: "centro", nombre: "Centro", tipo: "colonia", lat: 20.9671, lng: -89.6237 },
  { id: "garcia-gineres", nombre: "García Ginerés", tipo: "colonia", lat: 20.9805, lng: -89.6385 },
  { id: "itzimna", nombre: "Itzimná", tipo: "colonia", lat: 20.9952, lng: -89.6098 },
  { id: "mexico", nombre: "México", tipo: "colonia", lat: 21.0012, lng: -89.6168 },
  { id: "chuburna", nombre: "Chuburná de Hidalgo", tipo: "colonia", lat: 21.0122, lng: -89.6405 },
  { id: "francisco-de-montejo", nombre: "Francisco de Montejo", tipo: "fraccionamiento", lat: 21.0285, lng: -89.6542 },
  { id: "pensiones", nombre: "Pensiones", tipo: "fraccionamiento", lat: 20.9935, lng: -89.6658 },
  { id: "juan-pablo-ii", nombre: "Juan Pablo II", tipo: "fraccionamiento", lat: 21.0105, lng: -89.6745 },
  { id: "caucel", nombre: "Ciudad Caucel", tipo: "fraccionamiento", lat: 20.9998, lng: -89.7065 },
  { id: "las-americas", nombre: "Las Américas", tipo: "fraccionamiento", lat: 21.0362, lng: -89.6683 },
  { id: "san-damian", nombre: "San Damián", tipo: "colonia", lat: 20.9824, lng: -89.6611 },
  { id: "bojorquez", nombre: "Bojórquez", tipo: "colonia", lat: 20.9763, lng: -89.6532 },
  { id: "xoclan", nombre: "Xoclán", tipo: "colonia", lat: 20.9668, lng: -89.6738 },
  { id: "santa-rosa", nombre: "Santa Rosa", tipo: "colonia", lat: 20.9536, lng: -89.6189 },
  { id: "san-jose-tecoh", nombre: "San José Tecoh", tipo: "colonia", lat: 20.9241, lng: -89.6311 },
  { id: "emiliano-zapata-sur", nombre: "Emiliano Zapata Sur", tipo: "colonia", lat: 20.9208, lng: -89.6068 },
  { id: "meliton-salazar", nombre: "Melitón Salazar", tipo: "colonia", lat: 20.9432, lng: -89.6112 },
  { id: "san-antonio-kaua", nombre: "San Antonio Kaua", tipo: "colonia", lat: 20.9601, lng: -89.5852 },
  { id: "vergel", nombre: "Vergel", tipo: "fraccionamiento", lat: 20.9724, lng: -89.5747 },
  { id: "fidel-velazquez", nombre: "Fidel Velázquez", tipo: "fraccionamiento", lat: 20.9622, lng: -89.5978 },
  { id: "azcorra", nombre: "Azcorra", tipo: "colonia", lat: 20.9511, lng: -89.5968 },
  { id: "pacabtun", nombre: "Pacabtún", tipo: "fraccionamiento", lat: 20.9718, lng: -89.5866 },
  { id: "jesus-carranza", nombre: "Jesús Carranza", tipo: "colonia", lat: 20.9879, lng: -89.6004 },
  { id: "montes-de-ame", nombre: "Montes de Amé", tipo: "colonia", lat: 21.0375, lng: -89.6203 },
  { id: "altabrisa", nombre: "Altabrisa", tipo: "colonia", lat: 21.0189, lng: -89.5824 },
  { id: "san-ramon-norte", nombre: "San Ramón Norte", tipo: "colonia", lat: 21.0428, lng: -89.6252 },
  { id: "temozon-norte", nombre: "Temozón Norte", tipo: "comisaria", lat: 21.0601, lng: -89.6024 },
  { id: "cholul", nombre: "Cholul", tipo: "comisaria", lat: 21.0453, lng: -89.5598 },
  { id: "sitpach", nombre: "Sitpach", tipo: "comisaria", lat: 21.0326, lng: -89.5576 },
  { id: "komchen", nombre: "Komchén", tipo: "comisaria", lat: 21.1018, lng: -89.6635 },
  { id: "dzitya", nombre: "Dzityá", tipo: "comisaria", lat: 21.0526, lng: -89.6798 },
  { id: "san-jose-tzal", nombre: "San José Tzal", tipo: "comisaria", lat: 20.8256, lng: -89.6519 },
  { id: "caucel-comisaria", nombre: "Caucel (comisaría)", tipo: "comisaria", lat: 21.0028, lng: -89.7178 },
];

export function buscarColonia(nombre: string): ColoniaDemo | undefined {
  const clave = nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  return COLONIAS_DEMO.find(
    (c) => c.nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() === clave || c.id === clave,
  );
}
