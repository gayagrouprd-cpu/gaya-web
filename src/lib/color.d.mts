export function parseOklch(str: string): { L: number; C: number; h: number };
export function toLinearSrgb(str: string): [number, number, number];
export function oklchToRgb255(str: string): [number, number, number];
export function oklchToHex(str: string): string;
export function luminance(str: string): number;
export function contrast(a: string, b: string): number;
export function contrastRgb255(a: [number, number, number], b: [number, number, number]): number;
