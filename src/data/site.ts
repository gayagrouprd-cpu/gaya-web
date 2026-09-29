// Qué secciones y rutas existen ya. Los enlaces solo aparecen cuando su destino existe (nada de enlaces muertos).
import { anyBuilt } from '../lib/refs';

export const READY = {
  refs: anyBuilt(), // /referencias/  (aparece en cuanto hay referencias construidas)
  services: false, // #servicios   (Hito 4)
  process: false, // #proceso      (Hito 4)
  contact: false, // #contacto     (Hito 4)
};
