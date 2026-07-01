import {
  Shield, ShieldAlert, ShieldCheck, X, Plus, Pencil, Trash2, Eye, Check, Copy,
  Link, ExternalLink, FileText, FileCheck2, ChevronUp, ChevronDown, Target,
  AlertTriangle, Building2, Users, UserPlus, UserMinus, LogOut, LayoutDashboard,
  LayoutGrid, Globe, Menu, MailCheck, FolderOpen, Database, Key, Code, Lock,
} from 'lucide-react';

// ════════════════════════════════════════════════════
// Icon — reemplaza el helper Ic() del HTML original.
// El código usa nombres kebab-case (los de lucide UMD / data-lucide) en
// estructuras de datos (NAV del Sidebar, grids del Dashboard, etc.), así que
// mantenemos esa API por nombre y la mapeamos a los componentes de lucide-react.
//
//   Antes:  {Ic('shield-alert', { width: 16, height: 16 })}
//   Ahora:  <Icon name="shield-alert" size={16} />
//
// Por defecto los iconos heredan el color del contenedor (currentColor), igual
// que en el original.
// ════════════════════════════════════════════════════
const MAP = {
  'shield': Shield,
  'shield-alert': ShieldAlert,
  'shield-check': ShieldCheck,
  'x': X,
  'plus': Plus,
  'pencil': Pencil,
  'trash-2': Trash2,
  'eye': Eye,
  'check': Check,
  'copy': Copy,
  'link': Link,
  'external-link': ExternalLink,
  'file-text': FileText,
  'file-check-2': FileCheck2,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'target': Target,
  'alert-triangle': AlertTriangle,
  'building-2': Building2,
  'users': Users,
  'user-plus': UserPlus,
  'user-minus': UserMinus,
  'log-out': LogOut,
  'layout-dashboard': LayoutDashboard,
  'layout-grid': LayoutGrid,
  'globe': Globe,
  'menu': Menu,
  'mail-check': MailCheck,
  'folder-open': FolderOpen,
  'database': Database,
  'key': Key,
  'code': Code,
  'lock': Lock,
};

export default function Icon({ name, size = 18, color, strokeWidth, style }) {
  const Cmp = MAP[name];
  if (!Cmp) {
    if (import.meta.env.DEV) console.warn(`[Icon] nombre desconocido: "${name}"`);
    return null;
  }
  return (
    <Cmp
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      style={{ flexShrink: 0, verticalAlign: 'middle', ...style }}
    />
  );
}
