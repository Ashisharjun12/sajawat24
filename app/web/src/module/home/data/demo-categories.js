import {
  BabyIcon,
  Building2Icon,
  CakeIcon,
  GemIcon,
  HeartHandshakeIcon,
  HeartIcon,
  PartyPopperIcon,
  SparklesIcon,
} from "lucide-react";

export const DEMO_CATEGORIES = [
  {
    id: "birthday",
    name: "Birthday",
    slug: "birthday",
    icon: CakeIcon,
    extra: false,
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400",
  },
  {
    id: "anniversary",
    name: "Anniversary",
    slug: "anniversary",
    icon: HeartIcon,
    extra: false,
    iconBg: "bg-rose-100 text-rose-500 dark:bg-rose-400/15 dark:text-rose-400",
  },
  {
    id: "baby-kids",
    name: "Baby & Kids",
    slug: "baby-kids",
    icon: BabyIcon,
    extra: false,
    iconBg: "bg-sky-100 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400",
  },
  {
    id: "wedding",
    name: "Wedding",
    slug: "wedding",
    icon: GemIcon,
    extra: false,
    iconBg: "bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  },
  {
    id: "balloon-decor",
    name: "Balloon Decor",
    slug: "balloon-decor",
    icon: PartyPopperIcon,
    extra: true,
    iconBg: "bg-orange-100 text-orange-500 dark:bg-orange-400/15 dark:text-orange-400",
  },
  {
    id: "festive",
    name: "Festive",
    slug: "festive",
    icon: SparklesIcon,
    extra: true,
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400",
  },
  {
    id: "corporate",
    name: "Corporate",
    slug: "corporate",
    icon: Building2Icon,
    extra: true,
    iconBg: "bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
  },
  {
    id: "proposal",
    name: "Proposal",
    slug: "proposal",
    icon: HeartHandshakeIcon,
    extra: true,
    iconBg: "bg-pink-100 text-pink-500 dark:bg-pink-400/15 dark:text-pink-400",
  },
];

export const DEMO_OCCASIONS = DEMO_CATEGORIES.filter((item) => !item.extra);

export const DEMO_BUDGETS = [
  { value: "any", label: "Any budget" },
  { value: "under-3k", label: "Under ₹3,000" },
  { value: "3k-6k", label: "₹3,000–6,000" },
  { value: "6k-plus", label: "₹6,000+" },
];
