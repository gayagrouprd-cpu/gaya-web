// Ilustraciones ASCII de los servicios (decoración: se pintan en <pre aria-hidden>, nunca llevan información que no esté en el texto).
// Dibujadas a mano con caracteres ASCII imprimibles. Datos de ejemplo ficticios (tunegocio.do).
import type { ServiceId } from './services.ts';

const web = String.raw`
 .---------------------------------------.
 | ( ) ( ) ( )   tunegocio.do        [=] |
 |---------------------------------------|
 |                                       |
 |   ##################                  |
 |   ###########                         |
 |   :::::::::::::::::::::::             |
 |                         .-----------. |
 |   .-----------.         | WhatsApp  | |
 |   '-----------'         '-----------' |
 |                                       |
 |   .---------.  .---------.  .-------. |
 |   |   /\    |  |    /\   |  |  .-.  | |
 |   |  /  \/\ |  |   /  \  |  | (   ) | |
 |   | /    \ \|  |  /    \ |  |  '-'  | |
 |   '---------'  '---------'  '-------' |
 '---------------------------------------'`;

const automation = String.raw`
  .----------------------.
  |  ¿tienen cita hoy?   |
  '---.------------------'
      |
      '-->  [ :: ]  ----.
                        |
           .--------------------------.
           |  sí: jueves, 3:00 p. m.  |
           |  ¿te la reservo?         |
           '-------------.------------'
                         |
  .----------------------'
  |
  '-->  [ ok ]   -->   ( tú lo ves todo )
`;

const marketing = String.raw`
        .--------------------.
        |  @tunegocio    ... |
        |--------------------|
        |  .----. .----. .--.|
        |  |####| |::::| |##||
        |  '----' '----' '--'|
        |  .----. .----. .--.|
        |  |::::| |####| |::||
        |  '----' '----' '--'|
        |--------------------|
        |   ( WhatsApp )     |
        '--------------------'
     ))        ))         ))
`;

const it = String.raw`
                          .--------.
     .-----------------.  |  .--.  |
     |  o  ========  [] |  | (    ) |
     |-----------------|  |  '--'  |
     |  o  ========  [] |  |  ====  |
     |-----------------|  '--------'
     |  o  ========  [] |       |
     '--------.--------'        |
              |                 |
     =========+=================+=====
              |
         .----'----.
         |  [###]  |   x3  x2  x1
         '---------'
`;

export const SERVICE_ART: Record<ServiceId, string> = {
  web: web.replace(/^\n/, ''),
  automation: automation.replace(/^\n/, ''),
  marketing: marketing.replace(/^\n/, ''),
  it: it.replace(/^\n/, ''),
};
