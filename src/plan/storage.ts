/**
 * 保存済みプランの永続化（IndexedDB）。
 *
 * バックエンドは差し替え可能にしてある。IndexedDB が無い環境（Node のテスト・
 * プライベートモードで壊れているブラウザ）ではメモリ実装に落ちるので、
 * 「保存できないから画面が動かない」にはならない。
 *
 * 保存するのは入力（PlanSnapshot）だけ。解は読み込み時に解き直す。
 */
import type { IDBPDatabase } from 'idb'

import type { PlanSnapshot } from './serialize.ts'

export const DB_NAME = 'satisfactory-planner'
export const DB_VERSION = 1
const PLAN_STORE = 'plans'
const META_STORE = 'meta'
const AUTOSAVE_KEY = 'autosave'

/** 保存済みプランの1件。 */
export type SavedPlan = {
  id: string
  name: string
  /** 更新日時（epoch ms） */
  updatedAt: number
  snapshot: PlanSnapshot
}

export type PlanStorage = {
  /** 更新日時の新しい順 */
  list(): Promise<SavedPlan[]>
  get(id: string): Promise<SavedPlan | undefined>
  /** 同名のプランがあれば上書き。戻り値は保存後のレコード */
  save(name: string, snapshot: PlanSnapshot, now?: number): Promise<SavedPlan>
  remove(id: string): Promise<void>
  /** 自動保存（直前の作業状態）。無ければ null */
  getAutosave(): Promise<PlanSnapshot | null>
  putAutosave(snapshot: PlanSnapshot): Promise<void>
}

function newId(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c?.randomUUID !== undefined) return c.randomUUID()
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

const byUpdatedDesc = (a: SavedPlan, b: SavedPlan): number => b.updatedAt - a.updatedAt

/** テスト・フォールバック用のメモリ実装。 */
export function createMemoryPlanStorage(): PlanStorage {
  const plans = new Map<string, SavedPlan>()
  let autosave: PlanSnapshot | null = null

  return {
    list: async () => [...plans.values()].sort(byUpdatedDesc),
    get: async (id) => plans.get(id),
    save: async (name, snapshot, now = Date.now()) => {
      const existing = [...plans.values()].find((p) => p.name === name)
      const record: SavedPlan = {
        id: existing?.id ?? newId(),
        name,
        updatedAt: now,
        snapshot,
      }
      plans.set(record.id, record)
      return record
    },
    remove: async (id) => {
      plans.delete(id)
    },
    getAutosave: async () => autosave,
    putAutosave: async (snapshot) => {
      autosave = snapshot
    },
  }
}

type PlanDb = IDBPDatabase<unknown>

/** IndexedDB 実装。DB は最初のアクセス時にだけ開く。 */
export function createIdbPlanStorage(): PlanStorage {
  let dbPromise: Promise<PlanDb> | null = null

  const db = async (): Promise<PlanDb> => {
    if (dbPromise === null) {
      dbPromise = import('idb').then(({ openDB }) =>
        openDB(DB_NAME, DB_VERSION, {
          upgrade(database) {
            if (!database.objectStoreNames.contains(PLAN_STORE)) {
              const store = database.createObjectStore(PLAN_STORE, { keyPath: 'id' })
              store.createIndex('updatedAt', 'updatedAt')
            }
            if (!database.objectStoreNames.contains(META_STORE)) {
              database.createObjectStore(META_STORE)
            }
          },
        }),
      )
    }
    return dbPromise
  }

  return {
    list: async () => {
      const all = (await (await db()).getAll(PLAN_STORE)) as SavedPlan[]
      return all.sort(byUpdatedDesc)
    },
    get: async (id) => (await (await db()).get(PLAN_STORE, id)) as SavedPlan | undefined,
    save: async (name, snapshot, now = Date.now()) => {
      const database = await db()
      const all = (await database.getAll(PLAN_STORE)) as SavedPlan[]
      const existing = all.find((p) => p.name === name)
      const record: SavedPlan = { id: existing?.id ?? newId(), name, updatedAt: now, snapshot }
      await database.put(PLAN_STORE, record)
      return record
    },
    remove: async (id) => {
      await (await db()).delete(PLAN_STORE, id)
    },
    getAutosave: async () => {
      const value = (await (await db()).get(META_STORE, AUTOSAVE_KEY)) as PlanSnapshot | undefined
      return value ?? null
    },
    putAutosave: async (snapshot) => {
      await (await db()).put(META_STORE, snapshot, AUTOSAVE_KEY)
    },
  }
}

let storage: PlanStorage | null = null

/** 現在のバックエンド。未設定なら環境に応じて選ぶ。 */
export function planStorage(): PlanStorage {
  if (storage === null) {
    storage =
      typeof indexedDB === 'undefined' ? createMemoryPlanStorage() : createIdbPlanStorage()
  }
  return storage
}

/** バックエンドを差し替える（テスト用）。null でリセット。 */
export function setPlanStorage(next: PlanStorage | null): void {
  storage = next
}
