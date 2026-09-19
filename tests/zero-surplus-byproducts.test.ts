/**
 * 「余りを許さない副産物」（`power.zeroSurplusByproducts`）。
 *
 * 発電機の燃料が出す副産物（ウラン廃棄物・プルトニウム廃棄物）ごとに「残さない」を指定すると、
 * その副産物と、そこからしか作れない再処理の中間生成物の収支行が等式になる
 * （src/solver/model.ts の `zeroSurplusChain`）。原子力の計画を「ウランで止める / プルトニウムまで /
 * FICSONIUM で閉じる」の3段階に切り替えるための仕組み。
 *
 * 画面（発電計画パネルのチェックボックス）は jsdom が要るので
 * tests/zero-surplus-byproducts-ui.test.tsx に分けている。
 */
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { recipes } from "../src/data/index.ts";
import { SHEET_NAMES, planWorkbookBuffer } from "../src/export/excel.ts";
import {
  PLAN_SCHEMA_VERSION,
  buildShareUrl,
  decodePlan,
  encodePlan,
  parsePlanSnapshot,
  stripPlanParam,
  toPlanSnapshot,
} from "../src/plan/serialize.ts";
import type { PlanSource } from "../src/plan/serialize.ts";
import {
  buildProductionModel,
  generatorByproductItems,
  solveProduction,
  zeroSurplusChain,
} from "../src/solver/index.ts";
import type { Solution, SolveInput } from "../src/solver/index.ts";

const NUCLEAR = "Build_GeneratorNuclear_C";
const URANIUM_ROD = "Desc_NuclearFuelRod_C";
const PLUTONIUM_ROD = "Desc_PlutoniumFuelRod_C";
const FICSONIUM_ROD = "Desc_FicsoniumFuelRod_C";
const URANIUM_WASTE = "Desc_NuclearWaste_C";
const PLUTONIUM_WASTE = "Desc_PlutoniumWaste_C";
const PELLET = "Desc_PlutoniumPellet_C";

const baseRecipeIds = recipes.filter((r) => !r.isAlternate).map((r) => r.id);

async function solveOk(input: SolveInput): Promise<Solution> {
  const result = await solveProduction(input);
  if (result.status !== "optimal")
    throw new Error(`infeasible: ${result.message}`);
  return result;
}

const rateOf = (
  entries: readonly { item: string; ratePerMin: number }[],
  item: string,
): number => entries.find((e) => e.item === item)?.ratePerMin ?? 0;

const balanceOf = (solution: Solution, item: string) =>
  solution.itemBalance.find((b) => b.item === item);

const generatorSteps = (solution: Solution) =>
  solution.steps.filter((s) => (s.powerProductionMW ?? 0) > 0);

const recipeIdsOf = (solution: Solution): Set<string> =>
  new Set(solution.steps.map((s) => s.recipeId));

/** 原子力発電所で 5000 MW。燃料は引数で絞る */
const nuclear5000 = (
  fuels: string[],
  zeroSurplusByproducts: string[],
): SolveInput => ({
  targets: [],
  power: {
    generators: [NUCLEAR],
    fuels: { [NUCLEAR]: fuels },
    targetMW: 5000,
    zeroSurplusByproducts,
  },
});

// ---------------------------------------------------------------------------
// 候補と LP モデル
// ---------------------------------------------------------------------------

describe("候補と LP モデル", () => {
  it("指定できる副産物は generators.json の byproduct から導く（重複なし・宣言順）", () => {
    const items = generatorByproductItems();
    expect(new Set(items).size).toBe(items.length);
    expect(items).toContain(URANIUM_WASTE);
    expect(items).toContain(PLUTONIUM_WASTE);
    expect(items.every((item) => item !== FICSONIUM_ROD)).toBe(true);
  });

  it("副産物でないアイテムを指定すると例外", () => {
    expect(() =>
      buildProductionModel({
        targets: [],
        power: { zeroSurplusByproducts: ["Desc_IronPlate_C"] },
      }),
    ).toThrow(/not a generator byproduct/);
  });

  it("ウラン廃棄物の等式はペレット〜プルトニウム燃料棒まで及び、プルトニウム廃棄物で止まる", () => {
    const model = buildProductionModel(
      nuclear5000([URANIUM_ROD, PLUTONIUM_ROD], [URANIUM_WASTE]),
    );
    const chain = model.zeroSurplusItems;
    expect(chain.has(URANIUM_WASTE)).toBe(true);
    expect(chain.has("Desc_NonFissibleUranium_C")).toBe(true);
    expect(chain.has(PELLET)).toBe(true);
    expect(chain.has("Desc_PlutoniumCell_C")).toBe(true);
    expect(chain.has(PLUTONIUM_ROD)).toBe(true);
    // 別のチェックボックスの管轄なので入れない
    expect(chain.has(PLUTONIUM_WASTE)).toBe(false);
    expect(chain.has("Desc_Ficsonium_C")).toBe(false);
    // 他の経路でも作れるもの（非核分裂性ウランが出す水）は入れない
    expect(chain.has("Desc_Water_C")).toBe(false);

    for (const item of chain) {
      const row = model.lp.constraints.find((c) => c.key === `balance:${item}`);
      if (!row) continue;
      expect(row.upper, item).toBe(row.lower);
    }
    // 指定していない副産物の行は従来どおり >= のまま
    const plutonium = model.lp.constraints.find(
      (c) => c.key === `balance:${PLUTONIUM_WASTE}`,
    )!;
    expect(plutonium.upper).toBeUndefined();
  });

  it("zeroSurplusChain: 指定が無ければ空", () => {
    const model = buildProductionModel(nuclear5000([URANIUM_ROD], []));
    expect(model.zeroSurplusItems.size).toBe(0);
    expect(
      zeroSurplusChain(
        new Set(),
        model.recipes,
        model.generatorVariants,
        model.supplies,
      ).size,
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 解（原子力の3段階）
// ---------------------------------------------------------------------------

describe("原子力の3段階", () => {
  it("ウラン + プルトニウム許可・ウラン廃棄物を残さない → プルトニウムまで進み、その廃棄物は余る", async () => {
    const solution = await solveOk(
      nuclear5000([URANIUM_ROD, PLUTONIUM_ROD], [URANIUM_WASTE]),
    );
    expect(solution.powerGeneration!.totalMW).toBeGreaterThanOrEqual(
      5000 - 1e-6,
    );

    const uranium = balanceOf(solution, URANIUM_WASTE)!;
    expect(uranium.producedPerMin).toBeGreaterThan(0);
    expect(uranium.netPerMin).toBeCloseTo(0, 6);
    expect(rateOf(solution.byproducts, URANIUM_WASTE)).toBe(0);

    const ids = recipeIdsOf(solution);
    for (const id of [
      "Recipe_Plutonium_C",
      "Recipe_PlutoniumCell_C",
      "Recipe_PlutoniumFuelRod_C",
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
    const fuels = generatorSteps(solution)
      .map((s) => s.fuelItem)
      .sort();
    expect(fuels).toEqual([URANIUM_ROD, PLUTONIUM_ROD].sort());
    // 燃料棒・ペレットは捨てない（燃やす）
    expect(rateOf(solution.byproducts, PELLET)).toBe(0);
    expect(rateOf(solution.byproducts, PLUTONIUM_ROD)).toBe(0);
    // プルトニウム廃棄物は指定していないので余る
    expect(rateOf(solution.byproducts, PLUTONIUM_WASTE)).toBeGreaterThan(0);
    expect(ids.has("Recipe_Ficsonium_C")).toBe(false);
  });

  it("3燃料許可・両方の廃棄物を残さない → FICSONIUM で閉じる", async () => {
    const solution = await solveOk(
      nuclear5000(
        [URANIUM_ROD, PLUTONIUM_ROD, FICSONIUM_ROD],
        [URANIUM_WASTE, PLUTONIUM_WASTE],
      ),
    );
    expect(solution.powerGeneration!.totalMW).toBeGreaterThanOrEqual(
      5000 - 1e-6,
    );
    for (const waste of [URANIUM_WASTE, PLUTONIUM_WASTE]) {
      expect(balanceOf(solution, waste)!.producedPerMin, waste).toBeGreaterThan(
        0,
      );
      expect(rateOf(solution.byproducts, waste), waste).toBe(0);
    }
    const ids = recipeIdsOf(solution);
    for (const id of [
      "Recipe_Plutonium_C",
      "Recipe_PlutoniumFuelRod_C",
      "Recipe_Ficsonium_C",
      "Recipe_FicsoniumFuelRod_C",
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
    const fuels = generatorSteps(solution)
      .map((s) => s.fuelItem)
      .sort();
    expect(fuels).toEqual([URANIUM_ROD, PLUTONIUM_ROD, FICSONIUM_ROD].sort());
    expect(rateOf(solution.byproducts, FICSONIUM_ROD)).toBe(0);
  });

  it("指定なしなら従来どおり: 3燃料を許可しても FICSONIUM までは組まず、廃棄物を捨てる", async () => {
    const solution = await solveOk(
      nuclear5000([URANIUM_ROD, PLUTONIUM_ROD, FICSONIUM_ROD], []),
    );
    // 希少度重みではウラン廃棄物の再処理（ウラン鉱石の節約）は元から選ばれるが、
    // プルトニウム廃棄物は消費先（FICSONIUM）が高いので捨てる
    expect(rateOf(solution.byproducts, PLUTONIUM_WASTE)).toBeGreaterThan(0);
    expect(recipeIdsOf(solution).has("Recipe_Ficsonium_C")).toBe(false);
  });

  it("消費するレシピをすべて無効にすると、新しい理由（副産物の余り）で実行不能", async () => {
    const enabledRecipes = baseRecipeIds.filter(
      (id) =>
        !recipes
          .find((r) => r.id === id)!
          .ingredients.some((i) => i.item === URANIUM_WASTE),
    );
    const result = await solveProduction({
      ...nuclear5000([URANIUM_ROD], [URANIUM_WASTE]),
      enabledRecipes,
    });
    expect(result.status).toBe("infeasible");
    if (result.status !== "infeasible") return;
    expect(result.reasons).toHaveLength(1);
    const reason = result.reasons[0];
    expect(reason.kind).toBe("byproductMustBeConsumed");
    if (reason.kind !== "byproductMustBeConsumed") return;
    expect(reason.item).toBe(URANIUM_WASTE);
    expect(reason.cause).toBe("noEnabledConsumer");
    expect(reason.message).toContain("ウラン廃棄物");
    expect(result.message).toContain("ウラン廃棄物");
  });

  it("両方の廃棄物を残さない指定で FICSONIUM のレシピが無効なら、プルトニウム廃棄物が原因", async () => {
    const enabledRecipes = baseRecipeIds.filter(
      (id) =>
        !recipes
          .find((r) => r.id === id)!
          .ingredients.some((i) => i.item === PLUTONIUM_WASTE),
    );
    const result = await solveProduction({
      ...nuclear5000(
        [URANIUM_ROD, PLUTONIUM_ROD, FICSONIUM_ROD],
        [URANIUM_WASTE, PLUTONIUM_WASTE],
      ),
      enabledRecipes,
    });
    expect(result.status).toBe("infeasible");
    if (result.status !== "infeasible") return;
    expect(result.reasons.map((r) => r.kind)).toEqual([
      "byproductMustBeConsumed",
    ]);
    const reason = result.reasons[0];
    if (reason.kind !== "byproductMustBeConsumed") return;
    expect(reason.item).toBe(PLUTONIUM_WASTE);
    expect(reason.cause).toBe("noEnabledConsumer");
  });

  it("燃料棒を燃やす方式が無く、その廃棄物の消費先も無ければ「再処理チェーンの行き先が無い」", async () => {
    // ウランだけ許可 + ウラン廃棄物を残さない + FICSONIUM のレシピを無効:
    // 再処理でできるプルトニウム燃料棒の行き先（許可した原子力 / 廃棄物が消費される需要駆動の原子力）が無い
    const enabledRecipes = baseRecipeIds.filter(
      (id) =>
        !recipes
          .find((r) => r.id === id)!
          .ingredients.some((i) => i.item === PLUTONIUM_WASTE),
    );
    const result = await solveProduction({
      ...nuclear5000([URANIUM_ROD], [URANIUM_WASTE]),
      enabledRecipes,
    });
    expect(result.status).toBe("infeasible");
    if (result.status !== "infeasible") return;
    expect(result.reasons.map((r) => r.kind)).toEqual([
      "byproductMustBeConsumed",
    ]);
    const reason = result.reasons[0];
    if (reason.kind !== "byproductMustBeConsumed") return;
    expect(reason.item).toBe(URANIUM_WASTE);
    expect(reason.cause).toBe("consumerChainUnavailable");
  });

  it("発電計画なし・プルトニウム・ペレット目標・ウラン廃棄物を残さない → 従来と同じ解", async () => {
    const constrained = await solveOk({
      targets: [{ item: PELLET, ratePerMin: 10 }],
      power: { zeroSurplusByproducts: [URANIUM_WASTE] },
    });
    const plain = await solveOk({
      targets: [{ item: PELLET, ratePerMin: 10 }],
    });
    expect(constrained.targets[0].producedPerMin).toBeCloseTo(10, 6);
    expect(rateOf(constrained.byproducts, URANIUM_WASTE)).toBe(0);
    expect(constrained.totalMachineCount).toBeCloseTo(
      plain.totalMachineCount,
      6,
    );
    expect(constrained.powerGeneration!.totalMW).toBeCloseTo(
      plain.powerGeneration!.totalMW,
      6,
    );
  });

  it("廃棄物の出ない計画では指定があっても解は変わらない", async () => {
    const plain = await solveOk({
      targets: [{ item: "Desc_IronPlate_C", ratePerMin: 60 }],
    });
    const constrained = await solveOk({
      targets: [{ item: "Desc_IronPlate_C", ratePerMin: 60 }],
      power: { zeroSurplusByproducts: [URANIUM_WASTE, PLUTONIUM_WASTE] },
    });
    expect(constrained.steps.map((s) => s.recipeId)).toEqual(
      plain.steps.map((s) => s.recipeId),
    );
    constrained.steps.forEach((step, index) => {
      expect(step.machineCount).toBeCloseTo(plain.steps[index].machineCount, 9);
    });
    expect(constrained.powerGeneration).toBeUndefined();
  });

  it("2段階解法: 需要駆動の発電機が回る計画でも等式は最終解で成り立つ", async () => {
    // 石炭だけ許可 + ウラン廃棄物を残さない + プルトニウム・ペレット目標
    //（需要駆動の原子力が回り、2段目でその発電量を石炭から差し引く）
    const solution = await solveOk({
      targets: [{ item: PELLET, ratePerMin: 10 }],
      power: {
        generators: ["Build_GeneratorCoal_C"],
        targetMW: 300,
        zeroSurplusByproducts: [URANIUM_WASTE],
      },
    });
    expect(balanceOf(solution, URANIUM_WASTE)!.netPerMin).toBeCloseTo(0, 6);
    expect(solution.powerGeneration!.totalMW).toBeGreaterThanOrEqual(
      300 - 1e-6,
    );
    expect(generatorSteps(solution).some((s) => s.buildingId === NUCLEAR)).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// 保存形式・共有URL
// ---------------------------------------------------------------------------

const source: PlanSource = {
  targets: [{ key: "t1", item: PELLET, ratePerMin: 10 }],
  enabledAlternates: {},
  limitOverrides: {},
  objective: "resources",
  minerId: "Build_MinerMk3_C",
  enabledGenerators: { [NUCLEAR]: true },
  enabledFuels: { [NUCLEAR]: { [URANIUM_ROD]: true } },
  powerTargetMW: 2500,
  planName: "v6 pinned",
  beltId: "Build_ConveyorBeltMk6_C",
  pipeId: "Build_PipelineMK2_C",
};

describe("保存形式（v7: z）", () => {
  it("「残さない」副産物を保存して復元できる。空なら z を省略する", () => {
    const empty = toPlanSnapshot(source) as unknown as Record<string, unknown>;
    expect("z" in empty).toBe(false);

    const snapshot = toPlanSnapshot({
      ...source,
      zeroSurplusByproducts: { [PLUTONIUM_WASTE]: true, [URANIUM_WASTE]: true },
    });
    expect(snapshot.v).toBe(PLAN_SCHEMA_VERSION);
    expect(snapshot.z).toEqual([URANIUM_WASTE, PLUTONIUM_WASTE].sort());

    const parsed = decodePlan(encodePlan(snapshot));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.warnings).toEqual([]);
    expect(parsed.input.zeroSurplusByproducts).toEqual({
      [URANIUM_WASTE]: true,
      [PLUTONIUM_WASTE]: true,
    });
  });

  it("副産物でない ID は保存時に落とし、読み込み時は警告して無視する", () => {
    const snapshot = toPlanSnapshot({
      ...source,
      zeroSurplusByproducts: { Desc_IronPlate_C: true, [URANIUM_WASTE]: true },
    });
    expect(snapshot.z).toEqual([URANIUM_WASTE]);

    const parsed = parsePlanSnapshot({
      ...snapshot,
      z: [URANIUM_WASTE, "Desc_IronPlate_C", 3],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.input.zeroSurplusByproducts).toEqual({
      [URANIUM_WASTE]: true,
    });
    expect(parsed.warnings).toHaveLength(2);

    const broken = parsePlanSnapshot({ ...snapshot, z: "nope" });
    expect(broken.ok).toBe(true);
    if (!broken.ok) return;
    expect(broken.input.zeroSurplusByproducts).toEqual({});
    expect(broken.warnings).toHaveLength(1);
  });

  it("v6 で作った共有URL（z なし）は同じ入力に復元される", () => {
    // 変更前（v6）の encodePlan 相当で作った「プルトニウム・ペレット 10/min・原子力 2500MW」
    const encoded =
      "N4IgbiBcBsA0IDsrmgAgA4EsEIKYBMR4AXKAbTJABFcBnAYwH0AFAGwFdiB7BTdgW2a5WrXMUYBhIgEYADAF158AIbklIVlGABfeF2QAnOl3YH6dIiH7IAQu0yt8jALLZcB5wGsAzJMsAjW3tHSR4wXABPLgMbYWIvaD94dCCHJ2ZMdGE3ZwBpACYkkABzchA7NMYAcVw8A2VuAwA5dnpRZQM-dXYtcuCnGrqG6Ja23A6-SEoaBkZR9oMAMXZhACUuJyl5XRAAdyh8gFZZWW0gA";
    const parsed = decodePlan(encoded);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.warnings).toEqual([]);
    expect(parsed.input.targets).toEqual([{ item: PELLET, ratePerMin: 10 }]);
    expect(parsed.input.enabledGenerators).toEqual({ [NUCLEAR]: true });
    expect(parsed.input.enabledFuels).toEqual({
      [NUCLEAR]: { [URANIUM_ROD]: true },
    });
    expect(parsed.input.powerTargetMW).toBe(2500);
    expect(parsed.input.zeroSurplusByproducts).toEqual({});
    expect(parsed.input.planName).toBe("v6 pinned");
    // 同じ入力を今の版で保存し直しても z は増えない（v だけ上がる）
    const resaved = toPlanSnapshot({ ...source, zeroSurplusByproducts: {} });
    expect(JSON.stringify({ ...resaved, v: 6 })).toBe(
      JSON.stringify({ ...JSON.parse(JSON.stringify(resaved)), v: 6 }),
    );
    expect("z" in resaved).toBe(false);
  });

  it("stripPlanParam / buildShareUrl は z の有無に関係なく往復する", () => {
    const snapshot = toPlanSnapshot({
      ...source,
      zeroSurplusByproducts: { [URANIUM_WASTE]: true },
    });
    const url = buildShareUrl("https://example.test/app?x=1#foo=bar", snapshot);
    expect(url.startsWith("https://example.test/app?x=1#plan=")).toBe(true);
    expect(stripPlanParam(url)).toBe("https://example.test/app?x=1");
    const encoded = url.slice(url.indexOf("#plan=") + "#plan=".length);
    const parsed = decodePlan(encoded);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.input.zeroSurplusByproducts).toEqual({
      [URANIUM_WASTE]: true,
    });
  });
});

// ---------------------------------------------------------------------------
// Excel
// ---------------------------------------------------------------------------

describe("Excel のサマリー", () => {
  async function summaryLabels(
    zeroSurplusByproducts: string[],
  ): Promise<Map<string, ExcelJS.CellValue>> {
    const solution = await solveOk(
      nuclear5000([URANIUM_ROD, PLUTONIUM_ROD], zeroSurplusByproducts),
    );
    const buffer = await planWorkbookBuffer({
      solution,
      extraction: null,
      generatedAt: new Date("2026-01-01T00:00:00Z"),
      zeroSurplusByproducts,
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const summary = workbook.getWorksheet(SHEET_NAMES.summary)!;
    const labels = new Map<string, ExcelJS.CellValue>();
    for (let r = 1; r <= summary.rowCount; r += 1) {
      const key = summary.getRow(r).getCell(1).value;
      if (typeof key === "string")
        labels.set(key, summary.getRow(r).getCell(2).value);
    }
    return labels;
  }

  it("指定があるときだけ「余りを許さない副産物」の行が出る", async () => {
    const withRow = await summaryLabels([URANIUM_WASTE]);
    expect(withRow.get("余りを許さない副産物")).toBe("ウラン廃棄物");
    const without = await summaryLabels([]);
    expect(without.has("余りを許さない副産物")).toBe(false);
  });
});
