import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EventCard } from "./event-card";

const base = {
  id: "1",
  title: "Open Source Nairobi Day",
  type: "other",
  startsAt: new Date("2026-11-28T06:00:00Z"),
  isOnline: true,
  venue: null,
  source: null,
};

describe("EventCard", () => {
  it("keeps metadata directly under the title (no mt-auto push-down)", () => {
    const html = renderToStaticMarkup(
      createElement(EventCard, { e: { ...base, organiser: null } }),
    );
    const dl = html.match(/<dl class="([^"]*)"/)?.[1] ?? "";
    expect(dl).not.toContain("mt-auto");
  });

  it("omits the organiser part when there is none", () => {
    const html = renderToStaticMarkup(
      createElement(EventCard, { e: { ...base, organiser: null } }),
    );
    expect(html).not.toContain("By ");
    expect(
      renderToStaticMarkup(
        createElement(EventCard, { e: { ...base, organiser: "OSN" } }),
      ),
    ).toContain("By OSN");
  });
});
