// Imprime las huellas de la Variante A como JSON (las usa scenes-variant-a.test.mjs en procesos hijos, con y sin JIT).
import { computeVariantHashes } from './variant-a-hashes.mjs';

process.stdout.write(JSON.stringify(await computeVariantHashes()));
