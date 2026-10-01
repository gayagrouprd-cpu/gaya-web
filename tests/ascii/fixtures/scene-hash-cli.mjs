// Imprime las huellas de las escenas de WP6 como JSON (las usa scenes-a.test.mjs en procesos hijos, con y sin JIT).
import { computeSceneHashes } from './scene-hashes.mjs';

process.stdout.write(JSON.stringify(await computeSceneHashes()));
