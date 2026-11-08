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
    // 左侧目录中当前条目以 aria-current 标记为当前页
    const menu = within(screen.getByRole("navigation", { name: "典章制度目录" }));
    const activeLink = menu.getByRole("link", { name: /^官制/ });
    expect(activeLink).toHaveAttribute("aria-current", "page");
    expect(activeLink).toHaveAttribute("href", "/china/institutions/official-system");
    // 总览条目始终在目录里且不是当前页
    const overviewLink = menu.getByRole("link", { name: /^总览/ });
    expect(overviewLink).toHaveAttribute("href", "/china/institutions");
    expect(overviewLink).not.toHaveAttribute("aria-current");
  });

  it("renders the annal-style timeline with one node per era", () => {
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

  it("links the registered sibling topics through the related-entries panel", () => {
    // 注册表随条目落地逐个增长：渲染表中最后一个条目，它必然拥有其余条目作为关联；
    // 只有单条目时关联面板整体不渲染。
    const lastTopic = INSTITUTION_TOPICS[INSTITUTION_TOPICS.length - 1];
    renderTopic(lastTopic.id);

    const siblings = INSTITUTION_TOPICS.filter((sibling) => sibling.id !== lastTopic.id);
    if (siblings.length === 0) {
      expect(screen.queryByText("关联条目")).not.toBeInTheDocument();
      return;
    }

    expect(screen.getByText("关联条目")).toBeInTheDocument();
    const panel = screen.getByText("关联条目").closest("aside");
    if (!panel) throw new Error("related-entries panel should exist");
    for (const sibling of siblings) {
      const link = within(panel).getByRole("link", { name: new RegExp(`^${sibling.name}`) });
      expect(link).toHaveAttribute("href", `/china/institutions/${sibling.slug}`);
    }
  });

  it("falls back to a friendly card for an unregistered topic id", () => {
    renderTopic("nonexistent-topic");

    expect(screen.getByRole("heading", { name: "条目尚未收录" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /← 返回典章制度索引/ })).toHaveAttribute(
      "href",
      "/china/institutions",
    );
  });
});
