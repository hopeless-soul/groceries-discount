import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./carousel";

describe("Carousel", () => {
  it("renders every slide and both arrow buttons", () => {
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>one</CarouselItem>
          <CarouselItem>two</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("two")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });
});
