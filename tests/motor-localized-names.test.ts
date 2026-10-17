import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const repository = process.cwd()

describe('Motor article uses the official Japanese names from the bundled 1.1.x data', () => {
  it('uses item names, alt text, and SVG labels matching the game data', async () => {
    const items = JSON.parse(await readFile(join(repository, 'src/data/items.json'), 'utf8')) as Array<{
      id: string
      name: { ja: string; en: string }
    }>
    const jaSource = await readFile(join(repository, 'content/articles/motor-production-recipes.ts'), 'utf8')
    const jaDiagram = await readFile(join(repository, 'public/article-images/motor-recipe-inputs-ja.svg'), 'utf8')
    const enSource = await readFile(join(repository, 'content/articles/en/motor-production-recipes.ts'), 'utf8')
    const nameOf = (id: string) => items.find((item) => item.id === id)?.name

    expect(nameOf('Desc_Rotor_C')).toEqual({ ja: 'ローター', en: 'Rotor' })
    expect(nameOf('Desc_Stator_C')).toEqual({ ja: '固定子', en: 'Stator' })
    expect(nameOf('Desc_CrystalOscillator_C')).toEqual({ ja: '水晶発振器', en: 'Crystal Oscillator' })
    expect(nameOf('Desc_ElectromagneticControlRod_C')).toEqual({ ja: '電磁制御棒', en: 'Electromagnetic Control Rod' })

    expect(jaSource).toContain('ローター・固定子・電磁制御棒')
    expect(jaSource).toContain('水晶発振器')
    expect(jaDiagram).toContain('固定子')
    expect(jaDiagram).toContain('水晶発振器')
    expect(jaSource).not.toMatch(/ステーター|クリスタル・オシレーター/)
    expect(jaDiagram).not.toMatch(/ステーター|オシレーター/)

    expect(enSource).toContain('Rotors')
    expect(enSource).toContain('Stators')
    expect(enSource).toContain('Crystal Oscillators')
    expect(enSource).not.toMatch(/Fixed|Quartz Oscillator/)
  })
})
