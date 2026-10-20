import { beforeEach, describe, expect, it } from "vitest";
import { defaultCardName, useQrCardsStore } from "./qr-cards-store";

const base = { shop: "lidl" as const, name: "lidl card #1", value: "634009509005331837" };

beforeEach(() => {
  localStorage.clear();
  useQrCardsStore.setState({ cards: [] });
});

describe("qr cards store", () => {
  it("adds a card with a generated id", () => {
    useQrCardsStore.getState().add(base);
    const [card] = useQrCardsStore.getState().cards;
    expect(card).toMatchObject(base);
    expect(card.id).toBeTruthy();
  });

  it("updates only the given fields", () => {
    useQrCardsStore.getState().add(base);
    const { id } = useQrCardsStore.getState().cards[0];
    useQrCardsStore.getState().update(id, { name: "renamed" });
    expect(useQrCardsStore.getState().cards[0]).toMatchObject({ ...base, name: "renamed", id });
  });

  it("removes a card", () => {
    useQrCardsStore.getState().add(base);
    const { id } = useQrCardsStore.getState().cards[0];
    useQrCardsStore.getState().remove(id);
    expect(useQrCardsStore.getState().cards).toEqual([]);
  });

  it("persists cards to localStorage", () => {
    useQrCardsStore.getState().add(base);
    const saved = JSON.parse(localStorage.getItem("groceries-discount:qr-cards")!);
    expect(saved.state.cards).toHaveLength(1);
  });
});

describe("defaultCardName", () => {
  it("numbers cards per shop", () => {
    expect(defaultCardName("lidl", [])).toBe("lidl card #1");
    const cards = [
      { id: "1", shop: "lidl" as const, name: "a", value: "1" },
      { id: "2", shop: "lidl" as const, name: "b", value: "2" },
      { id: "3", shop: "tesco" as const, name: "c", value: "3" },
    ];
    expect(defaultCardName("lidl", cards)).toBe("lidl card #3");
    expect(defaultCardName("tesco", cards)).toBe("tesco card #2");
    expect(defaultCardName("billa", cards)).toBe("billa card #1");
  });
});
