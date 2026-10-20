import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { decodeImageBlob, cropToBlob } = vi.hoisted(() => ({ decodeImageBlob: vi.fn(), cropToBlob: vi.fn() }));
vi.mock("@/lib/qr/decode", () => ({ decodeImageBlob }));
vi.mock("@/lib/qr/crop", () => ({ cropToBlob }));

import { QrImageCropper } from "./QrImageCropper";

beforeEach(() => {
  decodeImageBlob.mockReset();
  cropToBlob.mockReset().mockResolvedValue(new Blob(["x"]));
});

describe("QrImageCropper", () => {
  it("decodes the crop on Confirm and reports the value", async () => {
    const user = userEvent.setup();
    decodeImageBlob.mockResolvedValue("634009509005331837");
    const onConfirm = vi.fn();
    render(<QrImageCropper imageSrc="blob:test" onBack={() => {}} onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledWith("634009509005331837");
  });

  it("shows an error and stays when decoding fails", async () => {
    const user = userEvent.setup();
    decodeImageBlob.mockRejectedValue(new Error("No code found"));
    const onConfirm = vi.fn();
    render(<QrImageCropper imageSrc="blob:test" onBack={() => {}} onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not read/i);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
  });

  it("calls onBack", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<QrImageCropper imageSrc="blob:test" onBack={onBack} onConfirm={() => {}} />);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
