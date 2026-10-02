import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_SCROLL_UNFOLD_CONFIG,
  getScrollRollOffsets,
  HistoryScrollUnfold,
} from "./history-scroll-unfold";

const gsapMock = vi.hoisted(() => {
  const timeline = {
    eventCallback: vi.fn(),
    to: vi.fn(),
  };
  timeline.to.mockReturnValue(timeline);

  return {
    context: vi.fn((callback: () => void) => {
      callback();
      return { revert: vi.fn() };
    }),
    delayedCall: vi.fn(),
    set: vi.fn(),
    timeline: vi.fn(() => timeline),
    timelineInstance: timeline,
  };
});

vi.mock("gsap", () => ({
  gsap: {
    context: gsapMock.context,
    delayedCall: gsapMock.delayedCall,
    set: gsapMock.set,
    timeline: gsapMock.timeline,
  },
}));

function mockMotionPreference(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      removeEventListener: vi.fn(),
    }),
  });
}

describe("getScrollRollOffsets", () => {
  it("places both rolls side by side when the scroll starts closed", () => {
    expect(getScrollRollOffsets(960, 48)).toEqual({ left: 432, right: -432 });
  });

  it("does not produce negative travel on narrow stages", () => {
    expect(getScrollRollOffsets(32, 48)).toEqual({ left: 0, right: -0 });
  });
});

describe("<HistoryScrollUnfold />", () => {
  beforeEach(() => {
    mockMotionPreference(false);
    gsapMock.context.mockClear();
    gsapMock.set.mockClear();
    gsapMock.delayedCall.mockReset();
    gsapMock.timeline.mockClear();
    gsapMock.timelineInstance.eventCallback.mockClear();
    gsapMock.timelineInstance.to.mockClear();
    gsapMock.timelineInstance.to.mockReturnValue(gsapMock.timelineInstance);
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("renders the hero content inside an accessible history scroll region", () => {
    render(
      <HistoryScrollUnfold
        contentClassName="custom-content"
        paperClassName="custom-paper"
        stageClassName="custom-stage"
      >
        <h1>中国古代全览</h1>
      </HistoryScrollUnfold>,
    );

    expect(screen.getByRole("region", { name: "历史画卷展开" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "中国古代全览" })).toBeInTheDocument();
    expect(screen.getByTestId("history-scroll-unfold")).toHaveClass("opacity-0", "custom-stage");
    expect(document.querySelector(".custom-paper")).toBeInTheDocument();
    expect(document.querySelector(".custom-content")).toBeInTheDocument();
  });

  it("builds a GSAP timeline with the configured 2-3 second easing curve", () => {
    render(
      <HistoryScrollUnfold config={{ duration: 2.4, ease: "power4.inOut" }}>
        <p>以编年为经</p>
      </HistoryScrollUnfold>,
    );

    expect(gsapMock.timeline).toHaveBeenCalledWith(
      expect.objectContaining({ defaults: { ease: "power4.inOut" } }),
    );
    expect(gsapMock.timelineInstance.to).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ duration: 2.4, scaleX: 1 }),
      0,
    );
    expect(gsapMock.timelineInstance.to).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        duration: 2.4 * DEFAULT_SCROLL_UNFOLD_CONFIG.contentRevealRatio,
        filter: "blur(0px)",
        opacity: 1,
        y: 0,
      }),
      2.4 * DEFAULT_SCROLL_UNFOLD_CONFIG.contentDelayRatio,
    );
  });

  it("skips the timeline and reveals the full scroll for reduced motion users", () => {
    mockMotionPreference(true);

    render(
      <HistoryScrollUnfold>
        <p>治乱兴替</p>
      </HistoryScrollUnfold>,
    );

    expect(gsapMock.timeline).not.toHaveBeenCalled();
    expect(gsapMock.context).not.toHaveBeenCalled();
    expect(gsapMock.set).toHaveBeenCalledWith(expect.any(HTMLElement), { opacity: 1 });
    expect(gsapMock.set).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ clipPath: "inset(0 0% 0 0%)" }),
    );
    expect(gsapMock.set).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ filter: "blur(0px)", opacity: 1, y: 0 }),
    );
  });

  it("registers the completion callback after the GSAP timeline is assembled", () => {
    const onComplete = vi.fn();

    render(
      <HistoryScrollUnfold onComplete={onComplete}>
        <p>入场完成</p>
      </HistoryScrollUnfold>,
    );

    expect(gsapMock.timeline).toHaveBeenCalledWith(
      expect.objectContaining({ defaults: { ease: DEFAULT_SCROLL_UNFOLD_CONFIG.ease } }),
    );
    expect(gsapMock.timelineInstance.eventCallback).toHaveBeenCalledWith(
      "onComplete",
      expect.any(Function),
    );

    const eventCallbackCalls = gsapMock.timelineInstance.eventCallback.mock.calls;
    const [, registeredCallback] = eventCallbackCalls[eventCallbackCalls.length - 1] ?? [];
    registeredCallback?.();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("delays the completion callback by the configured hold duration", () => {
    const onComplete = vi.fn();
    const delayedCall = vi.fn();
    gsapMock.delayedCall.mockImplementation(delayedCall);

    render(
      <HistoryScrollUnfold config={{ holdDuration: 1.5 }} onComplete={onComplete}>
        <p>停留片刻</p>
      </HistoryScrollUnfold>,
    );

    const eventCallbackCalls = gsapMock.timelineInstance.eventCallback.mock.calls;
    const [, registeredCallback] = eventCallbackCalls[eventCallbackCalls.length - 1] ?? [];
    registeredCallback?.();

    expect(onComplete).not.toHaveBeenCalled();
    expect(delayedCall).toHaveBeenCalledWith(1.5, onComplete);
  });
});
