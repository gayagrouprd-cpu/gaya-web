// Imprime las huellas de regresión como JSON. golden.test.mjs lo lanza en procesos hijos (también con --jitless).
import { computeHashes } from './hashes.mjs';

process.stdout.write(JSON.stringify(computeHashes()));
