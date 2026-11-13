import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { InstitutionTopicPage } from "./topic-page";
import { getInstitutionTopic, INSTITUTION_TOPICS } from "./topics";

function renderTopic(topicId: string) {
  return render(
    <MemoryRouter>
      <InstitutionTopicPage topicId={topicId} />
    </MemoryRouter>,
  );
}

describe("<InstitutionTopicPage />", () => {
  it("renders the shell header with scope badge, intro and the topic as page", () => {
    const topic = getInstitutionTopic("official-system");
    if (!topic) throw new Error("official-system topic should be registered");

    renderTopic(topic.id);

    expect(screen.getByRole("heading", { level: 1, name: "官制" })).toBeInTheDocument();
    // 徽章在页头里（目录条目的 scope 同文案，不在此断言）
    const header = screen.getByRole("heading", { level: 1, name: "官制" }).closest("header");
    if (!header) throw new Error("shell header should exist");
    expect(within(header).getByText(/职官 · 品级 · 央地结构/)).toBeInTheDocument();
    expect(screen.getByText(/官制是王朝的骨架/)).toBeInTheDocument();
    // 左侧目录：当前条目以 aria-current 标记为当前页
    const menu = within(screen.getByRole("navigation", { name: "典章制度目录" }));
    const activeLink = menu.getByRole("link", { name: /^官制/ });
    expect(activeLink).toHaveAttribute("aria-current", "page");
    expect(activeLink).toHaveAttribute("href", "/china/institutions/official-system");
    for (const other of INSTITUTION_TOPICS.filter((item) => item.id !== topic.id)) {
      expect(menu.getByRole("link", { name: new RegExp(`^${other.name}`) })).not.toHaveAttribute(
        "aria-current",
      );
    }
  });

  it("renders the annal-style timeline with one card per era", () => {
    const topic = getInstitutionTopic("official-system");
    if (!topic) throw new Error("official-system topic should be registered");

    renderTopic(topic.id);

    const timeline = screen.getByLabelText("编年沿革时间轴");
    expect(within(timeline).getAllByRole("heading", { level: 3 })).toHaveLength(topic.eras.length);
    expect(document.querySelectorAll("[data-era-dot]")).toHaveLength(topic.eras.length);
    expect(screen.getByText(/沿革脉络/)).toBeInTheDocument();
    const firstDynasty = topic.eras[0].dynasty;
    const lastDynasty = topic.eras[topic.eras.length - 1].dynasty;
    expect(
      screen.getByRole("heading", { name: `${firstDynasty}到${lastDynasty}：官制的演变` }),
    ).toBeInTheDocument();
    for (const era of topic.eras) {
      expect(screen.getByRole("heading", { level: 3, name: era.title })).toBeInTheDocument();
      expect(screen.getByText(era.summary)).toBeInTheDocument();
    }
    expect(screen.getAllByText("沿革")).toHaveLength(topic.eras.length);
  });

  it("renders the key-term cards", () => {
    const topic = getInstitutionTopic("official-system");
    if (!topic) throw new Error("official-system topic should be registered");

    renderTopic(topic.id);

    expect(screen.getByText(/关键条目/)).toBeInTheDocument();
    for (const term of topic.keyTerms) {
      expect(screen.getByText(term.name)).toBeInTheDocument();
    }
  });

  it("keeps each topic self-contained: no cross-topic related panel", () => {
    renderTopic("official-system");

    // 每个条目只呈现自身内容：页面内没有指向其他条目的关联区
    expect(screen.queryByText("关联条目")).not.toBeInTheDocument();
    const content = screen.getByLabelText("编年沿革时间轴").closest("div");
    expect(content?.querySelectorAll('a[href^="/china/institutions/"]').length ?? 0).toBe(0);
  });

  it("falls back to a friendly card for an unregistered topic id", () => {
    renderTopic("nonexistent-topic");

    expect(screen.getByRole("heading", { name: "条目尚未收录" })).toBeInTheDocument();
    expect(screen.getByText(/可以从左侧目录选择已开放的条目/)).toBeInTheDocument();
  });
});
