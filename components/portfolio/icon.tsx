import * as React from "react";
import {
  Activity,
  Banknote,
  BarChart3,
  Blocks,
  Bot,
  Box,
  Boxes,
  Briefcase,
  Building2,
  Car,
  Cloud,
  Code2,
  Compass,
  Cpu,
  CreditCard,
  Database,
  FileText,
  Globe,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Layers,
  LayoutDashboard,
  LineChart,
  Lock,
  Mail,
  MessageSquare,
  Monitor,
  Network,
  Package,
  Palette,
  PenTool,
  Plane,
  Rocket,
  Search,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Stethoscope,
  Store,
  Tablet,
  Terminal,
  TrendingUp,
  Truck,
  Users,
  Utensils,
  Wallet,
  Workflow,
  Wrench,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/**
 * Whitelist of lucide icons resolvable by kebab-case name from the CMS
 * (services.icon, industries.icon, skills.icon). Unknown names fall back to `Box`.
 */
const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  banknote: Banknote,
  "bar-chart": BarChart3,
  "bar-chart-3": BarChart3,
  blocks: Blocks,
  bot: Bot,
  box: Box,
  boxes: Boxes,
  briefcase: Briefcase,
  building: Building2,
  "building-2": Building2,
  car: Car,
  cloud: Cloud,
  code: Code2,
  "code-2": Code2,
  compass: Compass,
  cpu: Cpu,
  "credit-card": CreditCard,
  database: Database,
  "file-text": FileText,
  globe: Globe,
  "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse,
  home: Home,
  landmark: Landmark,
  layers: Layers,
  layout: LayoutDashboard,
  "layout-dashboard": LayoutDashboard,
  "line-chart": LineChart,
  lock: Lock,
  mail: Mail,
  "message-square": MessageSquare,
  monitor: Monitor,
  network: Network,
  package: Package,
  palette: Palette,
  "pen-tool": PenTool,
  plane: Plane,
  rocket: Rocket,
  search: Search,
  server: Server,
  settings: Settings,
  shield: Shield,
  "shield-check": ShieldCheck,
  "shopping-cart": ShoppingCart,
  smartphone: Smartphone,
  stethoscope: Stethoscope,
  store: Store,
  tablet: Tablet,
  terminal: Terminal,
  "trending-up": TrendingUp,
  truck: Truck,
  users: Users,
  utensils: Utensils,
  wallet: Wallet,
  workflow: Workflow,
  wrench: Wrench,
  zap: Zap,
};

export const ICON_NAMES = Object.keys(ICONS);

function normalize(name: string) {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return Box;
  return ICONS[normalize(name)] ?? Box;
}

/** `<DynamicIcon name="layers" />` — resolves a lucide icon from a CMS string. */
export function DynamicIcon({
  name,
  ...props
}: Omit<LucideProps, "name"> & { name?: string | null }) {
  return React.createElement(resolveIcon(name), { "aria-hidden": true, ...props });
}
