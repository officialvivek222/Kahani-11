import { createContext } from "react";
import type { AddOn, Category, Package, PortfolioItem, Testimonial } from "@/types";

export interface StudioContent {
  categories: Category[];
  portfolio: PortfolioItem[];
  packages: Package[];
  addOns: AddOn[];
  testimonials: Testimonial[];
}

// Keep context identity separate from the refreshable provider and consumers.
export const StudioContentContext = createContext<StudioContent | null>(null);
