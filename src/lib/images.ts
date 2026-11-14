// Centralised image registry — swap these for storage URLs later.
import hero from "@/assets/hero-wedding.jpg";
import prewedding from "@/assets/prewedding.jpg";
import engagement from "@/assets/engagement.jpg";
import portrait from "@/assets/portrait.jpg";
import event from "@/assets/event.jpg";
import maternity from "@/assets/maternity.jpg";
import baby from "@/assets/baby.jpg";
import haldi from "@/assets/haldi.jpg";
import cinema from "@/assets/cinema.jpg";
import product from "@/assets/product.jpg";
import birthday from "@/assets/birthday.jpg";
import bride from "@/assets/bride.jpg";

export const images = {
  hero,
  prewedding,
  engagement,
  portrait,
  event,
  maternity,
  baby,
  haldi,
  cinema,
  product,
  birthday,
  bride,
};
export type ImageKey = keyof typeof images;
export function resolveImage(value: string) {
  const key = value.replace(/^image:/, "") as ImageKey;
  return value.startsWith("image:") ? (images[key] ?? images.hero) : value;
}
