import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudioContentContext } from "./studio-content-context";
import { StudioContentProvider, publicContentOptions, useStudioContent } from "./studio-content";
import { Testimonials } from "@/components/site/Testimonials";
import { Gallery } from "@/components/site/Gallery";

vi.mock("./studio.functions", () => ({ getPublicContent: vi.fn() }));
afterEach(cleanup);

function Consumer() {
  const content = useStudioContent();
  return <output>{content.categories[0]?.name}</output>;
}

describe("Shared studio content", () => {
  it("reads the stable context used across separately loaded consumers", () => {
    render(
      <StudioContentContext.Provider
        value={{
          categories: [
            {
              id: "wedding",
              name: "Wedding",
              slug: "wedding",
              image: "",
              description: "",
              short: "Wedding",
              active: true,
              features: [],
            },
          ],
          portfolio: [],
          packages: [],
          addOns: [],
          testimonials: [],
        }}
      >
        <Consumer />
      </StudioContentContext.Provider>,
    );
    expect(screen.getByText("Wedding")).toBeInTheDocument();
  });

  it("provides saved catalog content to a page", () => {
    const client = new QueryClient();
    client.setQueryData(publicContentOptions.queryKey, [
      { id: "wedding", kind: "categories", data: { name: "Saved wedding category" } },
    ]);
    render(
      <QueryClientProvider client={client}>
        <StudioContentProvider>
          <Consumer />
        </StudioContentProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByText("Saved wedding category")).toBeInTheDocument();
  });

  it("safely renders Testimonials when list is empty without NaN locks", () => {
    const { container } = render(
      <StudioContentContext.Provider
        value={{ categories: [], portfolio: [], packages: [], addOns: [], testimonials: [] }}
      >
        <Testimonials />
      </StudioContentContext.Provider>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a single published testimonial cleanly", () => {
    render(
      <StudioContentContext.Provider
        value={{
          categories: [],
          portfolio: [],
          packages: [],
          addOns: [],
          testimonials: [
            {
              id: "t1",
              name: "Rohan",
              event: "Wedding",
              rating: 5,
              review: "Fantastic work",
              published: true,
            },
          ],
        }}
      >
        <Testimonials />
      </StudioContentContext.Provider>,
    );
    expect(screen.getByText("“Fantastic work”")).toBeInTheDocument();
  });

  it("safely renders Gallery with zero items and shows empty state", () => {
    render(<Gallery items={[]} />);
    expect(screen.getByText("No photographs found in this category.")).toBeInTheDocument();
  });

  it("renders Gallery with items and categorizes correctly", () => {
    render(
      <Gallery
        items={[
          {
            id: "p1",
            title: "Sunset Vows",
            location: "Udaipur",
            category: "Wedding",
            image: "test.jpg",
            ratio: "landscape",
            featured: true,
          },
        ]}
      />,
    );
    expect(screen.getByText("Sunset Vows")).toBeInTheDocument();
    expect(screen.getAllByText("Wedding").length).toBeGreaterThanOrEqual(1);
  });
});
