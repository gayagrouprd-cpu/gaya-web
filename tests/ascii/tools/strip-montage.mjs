// Monta varias capturas PNG en una sola imagen (en vertical) y las reduce a un ancho cómodo para mirarlas de una vez.
//   node tests/ascii/tools/strip-montage.mjs out.png in1.png in2.png … [--w 1400]
import sharp from 'sharp';
const args = process.argv.slice(2);
const wi = args.indexOf('--w');
const W = wi >= 0 ? Number(args[wi + 1]) : 1400;
const files = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--w');
const out = files.shift();
const imgs = await Promise.all(files.map(async (f) => {
  const b = await sharp(f).resize({ width: W }).png().toBuffer();
  const m = await sharp(b).metadata();
  return { b, h: m.height };
}));
const H = imgs.reduce((a, i) => a + i.h + 6, 0);
let y = 0;
await sharp({ create: { width: W, height: H, channels: 3, background: '#30363f' } })
  .composite(imgs.map((i) => { const o = { input: i.b, left: 0, top: y }; y += i.h + 6; return o; }))
  .png()
  .toFile(out);
console.log(out);
