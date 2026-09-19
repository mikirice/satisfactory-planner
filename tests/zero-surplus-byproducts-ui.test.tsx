// @vitest-environment jsdom
/**
 * 発電計画パネルの「副産物の扱い」ブロックと、実行不能パネルの新しい理由の表示。
 * ソルバー本体（glpk.js）は jsdom で起動できないので、store の変化と再計算の着火
 * （status が 'solving' になる）までを確認する（解の正しさは tests/zero-surplus-byproducts.test.ts）。
 */
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import App from "../src/App.tsx";
import {
  LocaleProvider,
  getDictionary,
  preloadLocale,
} from "../src/i18n/index.ts";
import { SUPPORTED_LOCALES } from "../src/i18n/types.ts";
import type { InfeasibleResult } from "../src/solver/index.ts";
import {
  cancelPendingSolve,
  generatorByproducts,
  usePlanner,
} from "../src/store/planner.ts";
import { InfeasiblePanel } from "../src/ui/InfeasiblePanel.tsx";
import { PowerPanel } from "../src/ui/PowerPanel.tsx";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const URANIUM_WASTE = "Desc_NuclearWaste_C";
const PLUTONIUM_WASTE = "Desc_PlutoniumWaste_C";
const JAPANESE = /[々〆〇〻぀-ヿ㐀-鿿ｦ-ﾟ]/;

const mounted: { unmount: () => void }[] = [];

async function render(node: ReactNode): Promise<HTMLElement> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  mounted.push({ unmount: () => root.unmount() });
  return container;
}

afterEach(async () => {
  await act(async () => {
    for (const entry of mounted.splice(0)) entry.unmount();
  });
  document.body.innerHTML = "";
  cancelPendingSolve();
  usePlanner.setState({
    targets: [],
    enabledGenerators: {},
    enabledFuels: {},
    powerTargetMW: 0,
    coverFactoryPower: false,
    zeroSurplusByproducts: {},
    status: "idle",
    result: null,
  });
});

/** 「副産物の扱い」ブロックのチェックボックス（アイテム順） */
function byproductBoxes(container: HTMLElement): HTMLInputElement[] {
  return [
    ...container.querySelectorAll<HTMLInputElement>(
      '.byproduct-list input[type="checkbox"]',
    ),
  ];
}

describe("発電計画パネルの「副産物の扱い」", () => {
  it("発電計画がオフでも、候補の副産物がすべてチェックボックス付きで出る", async () => {
    expect(usePlanner.getState().enabledGenerators).toEqual({});
    const container = await render(<PowerPanel />);
    const text = container.textContent ?? "";
    expect(text).toContain("副産物の扱い");
    expect(text).toContain("残さない（全量を再処理で消費）");
    expect(text).toContain("ウラン廃棄物");
    expect(text).toContain("プルトニウム廃棄物");

    const boxes = byproductBoxes(container);
    expect(boxes).toHaveLength(generatorByproducts.length);
    expect(generatorByproducts).toEqual(
      expect.arrayContaining([URANIUM_WASTE, PLUTONIUM_WASTE]),
    );
    expect(boxes.every((box) => !box.checked)).toBe(true);
    // アイテム名の前にアイコン
    const label = container.querySelector(".byproduct-list .checkbox__label")!;
    expect(label.querySelector("img, .item-icon, svg")).not.toBeNull();
  });

  it("チェックすると store に入り、再計算が着火する。外すと消える", async () => {
    const container = await render(<PowerPanel />);
    const index = generatorByproducts.indexOf(URANIUM_WASTE);
    const box = byproductBoxes(container)[index]!;

    await act(async () => {
      box.click();
    });
    expect(usePlanner.getState().zeroSurplusByproducts).toEqual({
      [URANIUM_WASTE]: true,
    });
    expect(usePlanner.getState().status).toBe("solving");
    expect(byproductBoxes(container)[index]!.checked).toBe(true);

    await act(async () => {
      byproductBoxes(container)[index]!.click();
    });
    expect(usePlanner.getState().zeroSurplusByproducts).toEqual({});
  });

  it("store が候補外の ID を持っていても無視される（setZeroSurplusByproduct）", () => {
    usePlanner.getState().setZeroSurplusByproduct("Desc_IronPlate_C", true);
    expect(usePlanner.getState().zeroSurplusByproducts).toEqual({});
  });

  it("アプリ全体でも既存の発電方式のチェックの並びは変わらない（副産物は末尾）", async () => {
    const container = await render(<App />);
    const all = [
      ...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    ];
    const inBlock = byproductBoxes(container);
    expect(inBlock.length).toBeGreaterThan(0);
    // 発電方式（3種）のチェックがブロックより前に並ぶ
    expect(all.indexOf(inBlock[0]!)).toBeGreaterThan(2);
  });
});

describe("実行不能パネルの「副産物の余り」", () => {
  const result: InfeasibleResult = {
    status: "infeasible",
    message: "x",
    reasons: [
      {
        kind: "byproductMustBeConsumed",
        item: URANIUM_WASTE,
        cause: "noEnabledConsumer",
        message: "x",
      },
      { kind: "byproductMustBeConsumed", item: PLUTONIUM_WASTE, message: "y" },
    ],
  };

  it("ja: 理由ラベル・アイテム名入りメッセージ・原因・対処が出る", async () => {
    const container = await render(<InfeasiblePanel result={result} />);
    const text = container.textContent ?? "";
    const t = getDictionary("ja").infeasible;
    expect(text).toContain(t.reason.byproductMustBeConsumed);
    expect(text).toContain(
      t.reasonMessage.byproductMustBeConsumed("ウラン廃棄物"),
    );
    expect(text).toContain(t.byproductCause.noEnabledConsumer);
    expect(text).toContain(t.advice.byproductMustBeConsumed);
    // 原因の分からない2件目は原因行を出さない
    expect(container.querySelectorAll(".reason__detail")).toHaveLength(1);
  });

  it.each(SUPPORTED_LOCALES.filter((locale) => locale !== "ja"))(
    "%s: 新しい文言に日本語が混ざっていない",
    async (locale) => {
      await preloadLocale(locale);
      const t = getDictionary(locale);
      for (const text of [
        t.sidebar.powerByproducts,
        t.sidebar.powerByproductZero,
        t.sidebar.powerByproductsHint,
        t.infeasible.reason.byproductMustBeConsumed,
        t.infeasible.reasonMessage.byproductMustBeConsumed("X"),
        t.infeasible.advice.byproductMustBeConsumed,
        t.infeasible.byproductCause.noEnabledConsumer,
        t.infeasible.byproductCause.consumerChainUnavailable,
        t.excel.summary.zeroSurplusByproducts,
      ]) {
        expect(text.length).toBeGreaterThan(0);
        if (!locale.startsWith("zh")) expect(text, text).not.toMatch(JAPANESE);
      }
      // 描画しても日本語は出ない（中国語はCJK統合漢字を共有するので対象外）
      const container = await render(
        <LocaleProvider initialLocale={locale}>
          <InfeasiblePanel result={result} />
        </LocaleProvider>,
      );
      expect(container.textContent).toContain(
        t.infeasible.reason.byproductMustBeConsumed,
      );
      if (!locale.startsWith("zh"))
        expect(container.textContent).not.toMatch(JAPANESE);
    },
  );
});
