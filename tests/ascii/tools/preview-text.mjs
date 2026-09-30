// Vista en texto de la escena de prueba (glifos y tonos): para iterar rápido antes de mirar el PNG.
import { createTestScene } from '../fixtures/scene.ts';
import { GAYA_L_SET, GAYA_STACK } from '../fixtures/words.mjs';
import { specDesktop, specMobile, makeCells, makeFrame, toText, toTones, hashCells, STILL_T } from '../../../src/ascii/scenes/common.ts';

const mobile = process.argv.includes('--mobile');
const p = Number(process.argv.find((a) => a.startsWith('--p='))?.slice(4) ?? 1);
const spec = mobile ? specMobile() : specDesktop();
const scene = createTestScene();
const st = scene.build(spec, 'es', [mobile ? GAYA_STACK : GAYA_L_SET]);
const g = makeCells(spec.cols, spec.rows);
scene.paint(g, st, makeFrame(p, STILL_T, 0, p === 1));
console.log(toText(g));
if (process.argv.includes('--tones')) console.log(toTones(g));
console.log(hashCells(g));
