import { useContext, type ReactNode } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getPublicContent } from "./studio.functions";
import { images, resolveImage } from "./images";
import { StudioContentContext, type StudioContent } from "./studio-content-context";
import type { Json } from "@/integrations/supabase/types";
import { StudioDetailsContext, studioFromSettings } from "@/config/studio";

export type { StudioContent } from "./studio-content-context";
export function decodeContent(rows: { kind: string; id: string; data: Json }[]): StudioContent {
  const result: StudioContent = {
    categories: [],
    portfolio: [],
    packages: [],
    addOns: [],
    testimonials: [],
  };
  for (const row of rows) {
    if (!(row.kind in result)) continue;
    const item: Record<string, unknown> = { ...(row.data as Record<string, unknown>), id: row.id };
    if (typeof item["image"] === "string") item["image"] = resolveImage(item["image"]);
    (result[row.kind as keyof StudioContent] as unknown[]).push(item);
  }
  return result;
}
export function encodeContent(item: unknown) {
  const data = { ...(item as Record<string, unknown>) };
  if (typeof data["image"] === "string") {
    const pair = Object.entries(images).find(([, v]) => v === data["image"]);
    if (pair) data["image"] = `image:${pair[0]}`;
  }
  return data;
}
export const publicContentOptions = queryOptions({
  queryKey: ["studio-public"],
  queryFn: () => getPublicContent(),
  staleTime: 30000,
});
export function StudioContentProvider({ children }: { children: ReactNode }) {
  const { data } = useSuspenseQuery(publicContentOptions);
  return (
    <StudioDetailsContext.Provider
      value={studioFromSettings(data.find((r) => r.kind === "settings")?.data)}
    >
      <StudioContentContext.Provider value={decodeContent(data)}>
        {children}
      </StudioContentContext.Provider>
    </StudioDetailsContext.Provider>
  );
}
export function useStudioContent() {
  const data = useContext(StudioContentContext);
  if (!data) throw new Error("Studio content missing");
  return data;
}
