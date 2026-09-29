// Iconos Lucide (ISC) que usa el sitio. Se importan como texto en tiempo de compilación: nada llega al cliente salvo el SVG usado.
import utensils from 'lucide-static/icons/utensils.svg?raw';
import hardHat from 'lucide-static/icons/hard-hat.svg?raw';
import appWindow from 'lucide-static/icons/app-window.svg?raw';
import smile from 'lucide-static/icons/smile.svg?raw';
import scissors from 'lucide-static/icons/scissors.svg?raw';
import sailboat from 'lucide-static/icons/sailboat.svg?raw';
import scale from 'lucide-static/icons/scale.svg?raw';
import library from 'lucide-static/icons/library.svg?raw';
import shoppingBag from 'lucide-static/icons/shopping-bag.svg?raw';
import leaf from 'lucide-static/icons/leaf.svg?raw';
import coffee from 'lucide-static/icons/coffee.svg?raw';
import dumbbell from 'lucide-static/icons/dumbbell.svg?raw';
import camera from 'lucide-static/icons/camera.svg?raw';
import building2 from 'lucide-static/icons/building-2.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import calendarCheck from 'lucide-static/icons/calendar-check.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import chevronLeft from 'lucide-static/icons/chevron-left.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import monitor from 'lucide-static/icons/monitor.svg?raw';
import tablet from 'lucide-static/icons/tablet.svg?raw';
import smartphone from 'lucide-static/icons/smartphone.svg?raw';
import externalLink from 'lucide-static/icons/external-link.svg?raw';
import heart from 'lucide-static/icons/heart.svg?raw';
import link from 'lucide-static/icons/link.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import mail from 'lucide-static/icons/mail.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import qrCode from 'lucide-static/icons/qr-code.svg?raw';

export const lucide = {
  utensils,
  'hard-hat': hardHat,
  'app-window': appWindow,
  smile,
  scissors,
  sailboat,
  scale,
  library,
  'shopping-bag': shoppingBag,
  leaf,
  coffee,
  dumbbell,
  camera,
  'building-2': building2,
  info,
  'calendar-check': calendarCheck,
  'layout-grid': layoutGrid,
  'arrow-left': arrowLeft,
  'arrow-right': arrowRight,
  'chevron-left': chevronLeft,
  'chevron-right': chevronRight,
  monitor,
  tablet,
  smartphone,
  'external-link': externalLink,
  heart,
  link,
  x,
  mail,
  check,
  'qr-code': qrCode,
} as const;

export type LucideName = keyof typeof lucide;
export const hasIcon = (name: string): name is LucideName => name in lucide;
