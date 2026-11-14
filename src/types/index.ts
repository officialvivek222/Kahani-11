// Data models shaped like future database tables.
export type PortfolioFilter = "Wedding" | "Pre-Wedding" | "Engagement" | "Events" | "Portraits";

export interface Category {
  id: string;
  slug: string;
  name: string;
  short: string;
  description: string;
  image: string;
  active: boolean;
  features: string[];
}
export interface PortfolioItem {
  id: string;
  title: string;
  location: string;
  category: PortfolioFilter;
  image: string;
  ratio: "portrait" | "landscape" | "square";
  featured: boolean;
}
export type PackageTier = "Basic" | "Premium" | "Luxury";
export type PackageGroup =
  "Wedding" | "Pre-Wedding" | "Birthday" | "Engagement" | "Events" | "Other Services";
export interface Package {
  id: string;
  group: PackageGroup;
  tier: PackageTier;
  price: number;
  description: string;
  features: string[];
  active: boolean;
}
export interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
  active: boolean;
}
export interface Testimonial {
  id: string;
  name: string;
  event: string;
  rating: number;
  review: string;
  published: boolean;
}
export type InquiryStatus =
  "New" | "Contacted" | "Follow-up" | "Quotation Sent" | "Converted" | "Cancelled";
export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  eventDate: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}
export type QuotationStatus = "Pending" | "Sent" | "Accepted" | "Declined";
export interface Quotation {
  id: string;
  customer: string;
  phone: string;
  packageName: string;
  estimate: number;
  eventDate: string;
  status: QuotationStatus;
  email?: string;
  location?: string;
  notes?: string;
  addOns?: string;
  durationDays?: number;
}
