/**
 * Official gameplay covers shared by the Japanese and English article pages.
 * Each cover identifies its official source and states that the title is editorial.
 */
export type ArticleCoverLocale = 'ja' | 'en'

type CoverDefinition = {
  readonly alt: Readonly<Record<ArticleCoverLocale, string>>
  readonly caption?: Readonly<Record<ArticleCoverLocale, string>>
  readonly badge?: Readonly<Record<ArticleCoverLocale, string>>
  readonly creditLinks?: Readonly<Record<ArticleCoverLocale, readonly { href: string; label: string }[]>>
  readonly localizedSrc?: Readonly<Record<ArticleCoverLocale, string>>
  readonly width?: number
  readonly height?: number
  readonly type?: string
}

export const ARTICLE_COVERS = {
  "production-planning-tutorial": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの工場と鉄道の広いゲーム内風景。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A broad factory and rail scene from official Satisfactory media. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://a.storyblok.com/f/110098/2560x1440/243e0e90e4/satisfactory_10_screenshot_1.jpg",
          "label": "掲載画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://a.storyblok.com/f/110098/2560x1440/243e0e90e4/satisfactory_10_screenshot_1.jpg",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/production-planning-tutorial-ja.webp",
      "en": "/article-covers/production-planning-tutorial-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "alternate-recipe-metrics": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの製造機が並ぶ生産ライン。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: Machines arranged along a production line. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1poSyLXsibWXiZ1Wpcc76fdGWnYF2FWo7/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1poSyLXsibWXiZ1Wpcc76fdGWnYF2FWo7/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/alternate-recipe-metrics-ja.webp",
      "en": "/article-covers/alternate-recipe-metrics-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "power-generation-planning": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの石炭発電機とベルトコンベア。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: Coal generators and conveyor belts. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1bFlaTr2-ROI3J_V2GqWwXp3KODyze094/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1bFlaTr2-ROI3J_V2GqWwXp3KODyze094/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/power-generation-planning-ja.webp",
      "en": "/article-covers/power-generation-planning-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "somersloop-and-power-shards": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの製造機が並ぶ生産ライン。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: Machines arranged along a production line. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1poSyLXsibWXiZ1Wpcc76fdGWnYF2FWo7/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1poSyLXsibWXiZ1Wpcc76fdGWnYF2FWo7/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/somersloop-and-power-shards-ja.webp",
      "en": "/article-covers/somersloop-and-power-shards-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "excel-export-guide": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの貨物列車と線路設備。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: Freight train buffers and rail lines. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1PdYzwpPX21gLd4Ovav0KSzpXjl5z-Iv5/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1PdYzwpPX21gLd4Ovav0KSzpXjl5z-Iv5/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/excel-export-guide-ja.webp",
      "en": "/article-covers/excel-export-guide-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "coal-power-startup": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの石炭発電機とベルトコンベア。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: Coal generators and conveyor belts. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1bFlaTr2-ROI3J_V2GqWwXp3KODyze094/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1bFlaTr2-ROI3J_V2GqWwXp3KODyze094/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/coal-power-startup-ja.webp",
      "en": "/article-covers/coal-power-startup-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "oil-products-basics": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの複数の流体配管。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A network of in-game fluid pipes. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1rlqgdRl98ooLuRss02CJSv3NOjrcoSCY/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1rlqgdRl98ooLuRss02CJSv3NOjrcoSCY/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/oil-products-basics-ja.webp",
      "en": "/article-covers/oil-products-basics-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "aluminum-production-guide": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの製造機が並ぶ生産ライン。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: Machines arranged along a production line. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1poSyLXsibWXiZ1Wpcc76fdGWnYF2FWo7/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1poSyLXsibWXiZ1Wpcc76fdGWnYF2FWo7/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/aluminum-production-guide-ja.webp",
      "en": "/article-covers/aluminum-production-guide-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "awesome-sink-points": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの工場の建設現場。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A broad factory construction scene. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1yzSNatBbEwNULZMizCpr-F8TAkEgECz/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1yzSNatBbEwNULZMizCpr-F8TAkEgECz/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/awesome-sink-points-ja.webp",
      "en": "/article-covers/awesome-sink-points-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "clock-and-efficiency": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの製造機が並ぶ生産ライン。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: Machines arranged along a production line. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1poSyLXsibWXiZ1Wpcc76fdGWnYF2FWo7/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1poSyLXsibWXiZ1Wpcc76fdGWnYF2FWo7/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/clock-and-efficiency-ja.webp",
      "en": "/article-covers/clock-and-efficiency-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "build-checklist-guide": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの工場にブループリントを設置する画面。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A blueprint being placed in a factory. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1BJm3wA78l309yQ_UQsz11WBSpsVbqomx/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1BJm3wA78l309yQ_UQsz11WBSpsVbqomx/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/build-checklist-guide-ja.webp",
      "en": "/article-covers/build-checklist-guide-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "strong-alternate-recipes": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの工場の建設現場。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A broad factory construction scene. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1yzSNatBbEwNULZMizCpr-F8TAkEgECz/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1yzSNatBbEwNULZMizCpr-F8TAkEgECz/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/strong-alternate-recipes-ja.webp",
      "en": "/article-covers/strong-alternate-recipes-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "miner-rate-by-purity": {
    "alt": {
      "ja": "Satisfactory公式Press Kitのスキャナーで見る資源ノードの地形。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A resource field viewed with the in-game scanner. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1a82FG5LAzvFVbmvV8aYQUvv5wAm7SaXE/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1a82FG5LAzvFVbmvV8aYQUvv5wAm7SaXE/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/miner-rate-by-purity-ja.webp",
      "en": "/article-covers/miner-rate-by-purity-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "motor-production-recipes": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの工場の建設現場。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A broad factory construction scene. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1yzSNatBbEwNULZMizCpr-F8TAkEgECz/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1yzSNatBbEwNULZMizCpr-F8TAkEgECz/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/motor-production-recipes-ja.webp",
      "en": "/article-covers/motor-production-recipes-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "oil-loop-complete": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの複数の流体配管。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A network of in-game fluid pipes. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1rlqgdRl98ooLuRss02CJSv3NOjrcoSCY/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1rlqgdRl98ooLuRss02CJSv3NOjrcoSCY/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/oil-loop-complete-ja.webp",
      "en": "/article-covers/oil-loop-complete-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "diluted-fuel-power": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの工場の建設現場。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A broad factory construction scene. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1yzSNatBbEwNULZMizCpr-F8TAkEgECz/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1yzSNatBbEwNULZMizCpr-F8TAkEgECz/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/diluted-fuel-power-ja.webp",
      "en": "/article-covers/diluted-fuel-power-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "turbofuel-power": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの石炭発電機とベルトコンベア。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: Coal generators and conveyor belts. The cover title is editorial."
    },
    "caption": {
      "ja": "石炭発電機を写した公式画像です。電力の一般的な参考であり、ターボ燃料の発電構成ではありません。",
      "en": "Official image of coal generators for general power context; it does not show a Turbofuel setup."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1bFlaTr2-ROI3J_V2GqWwXp3KODyze094/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1bFlaTr2-ROI3J_V2GqWwXp3KODyze094/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/turbofuel-power-ja.webp",
      "en": "/article-covers/turbofuel-power-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "packaged-diluted-fuel-loop": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの流体ステーションを結ぶトラックの経路。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A truck route serving fluid stations. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1BG_wbhrpPi7vRmyredrdhAOTUR2ocYy0/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1BG_wbhrpPi7vRmyredrdhAOTUR2ocYy0/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/packaged-diluted-fuel-loop-ja.webp",
      "en": "/article-covers/packaged-diluted-fuel-loop-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "aluminum-water-loop": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの複数の流体配管。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A network of in-game fluid pipes. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1rlqgdRl98ooLuRss02CJSv3NOjrcoSCY/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1rlqgdRl98ooLuRss02CJSv3NOjrcoSCY/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/aluminum-water-loop-ja.webp",
      "en": "/article-covers/aluminum-water-loop-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "battery-water-loop": {
    "alt": {
      "ja": "Satisfactory公式Press KitのSatisfactoryの雨の降る森林バイオーム。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A rainy forest biome in Satisfactory. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1Bod20Hsqz0P_ZXFgArRB5R8yvS-LDZCo/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1Bod20Hsqz0P_ZXFgArRB5R8yvS-LDZCo/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/battery-water-loop-ja.webp",
      "en": "/article-covers/battery-water-loop-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "nuclear-simplified": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの工場と鉄道の広いゲーム内風景。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A broad factory and rail scene from official Satisfactory media. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://a.storyblok.com/f/110098/2560x1440/243e0e90e4/satisfactory_10_screenshot_1.jpg",
          "label": "掲載画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://a.storyblok.com/f/110098/2560x1440/243e0e90e4/satisfactory_10_screenshot_1.jpg",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/nuclear-simplified-ja.webp",
      "en": "/article-covers/nuclear-simplified-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "nuclear-uranium": {
    "alt": {
      "ja": "Satisfactory公式Press Kitのスキャナーで見る資源ノードの地形。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A resource field viewed with the in-game scanner. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1a82FG5LAzvFVbmvV8aYQUvv5wAm7SaXE/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1a82FG5LAzvFVbmvV8aYQUvv5wAm7SaXE/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/nuclear-uranium-ja.webp",
      "en": "/article-covers/nuclear-uranium-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "nuclear-plutonium": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの工場と鉄道の広いゲーム内風景。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A broad factory and rail scene from official Satisfactory media. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Satisfactory Press Kitのゲーム内画像に記事用の見出しを合成しています。記事内の計算値や具体的な設備構成を示す画面ではありません。",
      "en": "Official Satisfactory Press Kit gameplay with an editorial title overlay. It does not show calculations or a specific machine layout from the guide."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://a.storyblok.com/f/110098/2560x1440/243e0e90e4/satisfactory_10_screenshot_1.jpg",
          "label": "掲載画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://a.storyblok.com/f/110098/2560x1440/243e0e90e4/satisfactory_10_screenshot_1.jpg",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/nuclear-plutonium-ja.webp",
      "en": "/article-covers/nuclear-plutonium-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "nuclear-reprocessing": {
    "alt": {
      "ja": "Satisfactory公式Press Kitのベルト上の搬送量表示。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit screenshot: A conveyor line with in-game throughput readouts. The cover title is editorial."
    },
    "caption": {
      "ja": "ベルト上の核廃棄物ドラムを写した公式画像です。記事のレシピ、処理量、再処理工程を実証する画面ではありません。",
      "en": "Official image of nuclear-waste drums on a conveyor. It does not demonstrate the guide’s recipe, throughput, or reprocessing chain."
    },
    "creditLinks": {
      "ja": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "公式Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1j9VPoDbXLCnWZfcN3yEY_uJVa-Slvy7v/view",
          "label": "元画像"
        }
      ],
      "en": [
        {
          "href": "https://www.satisfactorygame.com/press/",
          "label": "Official Press & Content Creators"
        },
        {
          "href": "https://drive.google.com/file/d/1j9VPoDbXLCnWZfcN3yEY_uJVa-Slvy7v/view",
          "label": "Original screenshot"
        }
      ]
    },
    "badge": {
      "ja": "ゲーム画像",
      "en": "Game screenshot"
    },
    "localizedSrc": {
      "ja": "/article-covers/nuclear-reprocessing-ja.webp",
      "en": "/article-covers/nuclear-reprocessing-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "factory-floor-area": {
    "alt": {
      "ja": "Satisfactory公式Press Kitの工場でブループリントを設置する実ゲーム画面。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory Press Kit gameplay screenshot of placing a blueprint in a factory. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Press Kitの実ゲーム画面に記事用の見出しを重ねています。土台上にブループリントを設置する場面で、記事の鉄板例やPlannerの面積計算結果、完成配置図ではありません。 ",
      "en": "Official Press Kit gameplay with an editorial title overlay. It shows a blueprint being placed on foundations; it is not the article’s Iron Plate example, a Planner area result, or a finished layout. "
    },
    "creditLinks": {
      "ja": [
        { "href": "https://www.satisfactorygame.com/press/", "label": "公式Press & Content Creators" },
        { "href": "https://drive.google.com/file/d/1BJm3wA78l309yQ_UQsz11WBSpsVbqomx/view", "label": "元画像" }
      ],
      "en": [
        { "href": "https://www.satisfactorygame.com/press/", "label": "Official Press & Content Creators" },
        { "href": "https://drive.google.com/file/d/1BJm3wA78l309yQ_UQsz11WBSpsVbqomx/view", "label": "Original screenshot" }
      ]
    },
    "badge": { "ja": "ゲーム画像", "en": "Game screenshot" },
    "localizedSrc": {
      "ja": "/article-covers/factory-floor-area-ja.webp",
      "en": "/article-covers/factory-floor-area-en.webp"
    },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "fluid-truck-delivery": {
    "alt": {
      "ja": "公式Satisfactoryの実ゲーム画面に映る流体トラックと流体ステーション。記事用の見出しを重ねたカバー。",
      "en": "Official Satisfactory gameplay showing a Fluid Truck and Fluid Stations. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Update 1.2の実ゲーム画面を記事の主題を示す背景として使用しています。容量や補給量の実測画面ではありません。",
      "en": "Official Update 1.2 gameplay used as thematic context. This is not a measurement of capacity or delivery rate."
    },
    "creditLinks": {
      "ja": [
        { "href": "https://www.satisfactorygame.com/press/", "label": "公式Press & Content Creators" },
        { "href": "https://drive.google.com/file/d/1BG_wbhrpPi7vRmyredrdhAOTUR2ocYy0/view", "label": "元画像" }
      ],
      "en": [
        { "href": "https://www.satisfactorygame.com/press/", "label": "Official Press & Content Creators" },
        { "href": "https://drive.google.com/file/d/1BG_wbhrpPi7vRmyredrdhAOTUR2ocYy0/view", "label": "Original screenshot" }
      ]
    },
    "badge": { "ja": "ゲーム画像", "en": "Game screenshot" },
    "localizedSrc": { "ja": "/article-covers/fluid-truck-delivery-ja.webp", "en": "/article-covers/fluid-truck-delivery-en.webp" },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "vehicle-paths": {
    "alt": {
      "ja": "Update 1.2の公式実ゲーム画面に車両パスとトラックが映る。記事用の見出しを重ねたカバー。",
      "en": "Official Update 1.2 gameplay showing a vehicle path and truck. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Update 1.2の実ゲーム画面を車両パス機能のイメージとして掲載しています。初期の1.2画面であり、現行UIの説明やルート動作の実証ではありません。",
      "en": "Official Update 1.2 gameplay used to illustrate Vehicle Paths. It is an early 1.2 screen, not a claim about the current UI or a route test."
    },
    "creditLinks": {
      "ja": [
        { "href": "https://www.satisfactorygame.com/press/", "label": "公式Press & Content Creators" },
        { "href": "https://drive.google.com/file/d/1BG_wbhrpPi7vRmyredrdhAOTUR2ocYy0/view", "label": "元画像" }
      ],
      "en": [
        { "href": "https://www.satisfactorygame.com/press/", "label": "Official Press & Content Creators" },
        { "href": "https://drive.google.com/file/d/1BG_wbhrpPi7vRmyredrdhAOTUR2ocYy0/view", "label": "Original screenshot" }
      ]
    },
    "badge": { "ja": "ゲーム画像", "en": "Game screenshot" },
    "localizedSrc": { "ja": "/article-covers/vehicle-paths-ja.webp", "en": "/article-covers/vehicle-paths-en.webp" },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },
  "power-connector-daisy-chain": {
    "alt": {
      "ja": "公式Press Kitの工場内に機械と電線が広がるゲーム画面。記事用の見出しを重ねたカバー。",
      "en": "Official Press Kit gameplay showing machinery and power lines across a factory. The cover title is editorial."
    },
    "caption": {
      "ja": "公式Press Kitの工場風景を電力配線の記事の背景に使用しています。デイジーチェーンの接続箇所や解放画面を示す実証画像ではありません。",
      "en": "Official Press Kit factory gameplay used as context for a power-wiring guide. It does not show daisy-chain connection points or the unlock screen."
    },
    "creditLinks": {
      "ja": [
        { "href": "https://www.satisfactorygame.com/press/", "label": "公式Press & Content Creators" },
        { "href": "https://drive.google.com/file/d/1yzSNatBbEwNULZMizCpr-F8TAkEgECz/view", "label": "元画像" }
      ],
      "en": [
        { "href": "https://www.satisfactorygame.com/press/", "label": "Official Press & Content Creators" },
        { "href": "https://drive.google.com/file/d/1yzSNatBbEwNULZMizCpr-F8TAkEgECz/view", "label": "Original screenshot" }
      ]
    },
    "badge": { "ja": "ゲーム画像", "en": "Game screenshot" },
    "localizedSrc": { "ja": "/article-covers/power-connector-daisy-chain-ja.webp", "en": "/article-covers/power-connector-daisy-chain-en.webp" },
    "width": 1280,
    "height": 720,
    "type": "image/webp"
  },

  "conveyor-throughput-monitor-guide": {
    alt: { ja: "Satisfactory公式Update 1.1 Press Kitのコンベアリフトと分岐・合流。記事用タイトルを重ねた背景画像。", en: "Satisfactory Update 1.1 Press Kit conveyor lifts and splitter/merger routing, with an editorial article title." },
    caption: { ja: "公式Update 1.1 Press Kitの搬送経路画像です。スループットモニターや本稿の測定値は写していません。", en: "Official Update 1.1 Press Kit belt-routing context. It does not show a Throughput Monitor or a reading from this guide." },
    creditLinks: {
      ja: [{ href: "https://www.satisfactorygame.com/press/", label: "公式Press & Content Creators" }, { href: "https://drive.google.com/file/d/172p9je6hfBFH_cYsuM2vgN-UlH8CnZ2c/view", label: "元画像" }],
      en: [{ href: "https://www.satisfactorygame.com/press/", label: "Official Press & Content Creators" }, { href: "https://drive.google.com/file/d/172p9je6hfBFH_cYsuM2vgN-UlH8CnZ2c/view", label: "Original screenshot" }],
    },
    badge: { ja: "ゲーム画像", en: "Game screenshot" },
    localizedSrc: { ja: "/article-covers/conveyor-throughput-monitor-guide-ja.webp", en: "/article-covers/conveyor-throughput-monitor-guide-en.webp" }, width: 1280, height: 720, type: "image/webp",
  },
  "priority-merger-use-cases-guide": {
    alt: { ja: "Satisfactory公式Update 1.1 Press KitのPriority Merger設定画面。記事用タイトルが左入力を覆い、右側にCenter/Right Highが見える。", en: "Official Update 1.1 Priority Merger settings screenshot; the editorial title panel masks the left input while Center and Right High remain visible." },
    caption: { ja: "公式Update 1.1 Press Kitの設定画面です。タイトルパネルは左入力を覆います。例の流れや現行1.2.xを実証する画像ではありません。", en: "Official Update 1.1 settings screenshot. The title panel masks the left input; this is UI context, not a test of example flow or the current 1.2.x client." },
    creditLinks: {
      ja: [{ href: "https://www.satisfactorygame.com/press/", label: "公式Press & Content Creators" }, { href: "https://drive.google.com/file/d/1mle940oY6jkYeVbz-vynIvma6mLEd0Wy/view", label: "元画像" }],
      en: [{ href: "https://www.satisfactorygame.com/press/", label: "Official Press & Content Creators" }, { href: "https://drive.google.com/file/d/1mle940oY6jkYeVbz-vynIvma6mLEd0Wy/view", label: "Original screenshot" }],
    },
    badge: { ja: "ゲーム画像", en: "Game screenshot" },
    localizedSrc: { ja: "/article-covers/priority-merger-use-cases-guide-ja.webp", en: "/article-covers/priority-merger-use-cases-guide-en.webp" }, width: 1280, height: 720, type: "image/webp",
  },
  "space-elevator-project-assembly-batch-planning-guide": {
    alt: { ja: "Satisfactory公式Press Kitの工場内スクリーンショット。生産設備の雰囲気を示す記事用カバー。", en: "Official Satisfactory Press Kit factory screenshot used as production context for an editorial guide cover." },
    caption: { ja: "公式Press Kitの工場画像です。特定のProject Assembly必要数・レート・ライン構成を示すものではありません。", en: "Official Press Kit factory screenshot used as production context. It does not depict a specific Project Assembly quota, rate, or line layout." },
    creditLinks: {
      ja: [{ href: "https://www.satisfactorygame.com/press/", label: "公式Press & Content Creators" }, { href: "https://drive.google.com/file/d/1Nua9FSNK4Z1sIKuxN9jCWFX9HgIcGB5N/view", label: "元画像" }],
      en: [{ href: "https://www.satisfactorygame.com/press/", label: "Official Press & Content Creators" }, { href: "https://drive.google.com/file/d/1Nua9FSNK4Z1sIKuxN9jCWFX9HgIcGB5N/view", label: "Original screenshot" }],
    },
    badge: { ja: "ゲーム画像", en: "Game screenshot" },
    localizedSrc: { ja: "/article-covers/space-elevator-project-assembly-batch-planning-guide-ja.webp", en: "/article-covers/space-elevator-project-assembly-batch-planning-guide-en.webp" }, width: 1280, height: 720, type: "image/webp",
  },
  "dimensional-depot-refill-guide": {
    alt: { ja: "Satisfactory公式Press Kitのコンベアと素材が並ぶ工場内風景。記事用タイトルを重ねたカバー。", en: "Official Satisfactory Press Kit factory interior with conveyors and stacked materials, used as general context for a Depot troubleshooting guide." },
    caption: { ja: "公式Press Kitの工場内画像です。Dimensional Depotや補給状態を写したものではなく、素材搬送の一般的な背景です。", en: "Official Press Kit factory logistics context. This image does not depict a Dimensional Depot or confirm a refill state." },
    creditLinks: {
      ja: [{ href: "https://www.satisfactorygame.com/press/", label: "公式Press & Content Creators" }, { href: "https://drive.google.com/file/d/1Nua9FSNK4Z1sIKuxN9jCWFX9HgIcGB5N/view", label: "元画像" }],
      en: [{ href: "https://www.satisfactorygame.com/press/", label: "Official Press & Content Creators" }, { href: "https://drive.google.com/file/d/1Nua9FSNK4Z1sIKuxN9jCWFX9HgIcGB5N/view", label: "Original screenshot" }],
    },
    badge: { ja: "ゲーム画像", en: "Game screenshot" },
    localizedSrc: { ja: "/article-covers/dimensional-depot-refill-guide-ja.webp", en: "/article-covers/dimensional-depot-refill-guide-en.webp" }, width: 1280, height: 720, type: "image/webp",
  },
  "hypertube-junction-routing-guide": {
    alt: { ja: "3本のチューブ経路につながるJunctionを示す公式Update 1.1 Press Kit画面。記事用タイトルを重ねたカバー。", en: "Official Update 1.1 Press Kit screenshot of a Hypertube Junction connected to several tube paths, with an editorial title." },
    caption: { ja: "公式Update 1.1 Press Kitの接続形状の参考画像です。現行版の進路表示や選択中の経路を示すものではありません。", en: "Official Update 1.1 Press Kit image showing a Junction's connections. It does not show a current-client route prompt or selected route." },
    creditLinks: {
      ja: [{ href: "https://www.satisfactorygame.com/press/", label: "公式Press & Content Creators" }, { href: "https://drive.google.com/file/d/18TR518-5BonLmKtsmhJ5mxhWsm3MRjS4/view", label: "元画像" }],
      en: [{ href: "https://www.satisfactorygame.com/press/", label: "Official Press & Content Creators" }, { href: "https://drive.google.com/file/d/18TR518-5BonLmKtsmhJ5mxhWsm3MRjS4/view", label: "Original screenshot" }],
    },
    badge: { ja: "ゲーム画像", en: "Game screenshot" },
    localizedSrc: { ja: "/article-covers/hypertube-junction-routing-guide-ja.webp", en: "/article-covers/hypertube-junction-routing-guide-en.webp" }, width: 1280, height: 720, type: "image/webp",
  },
} as const satisfies Record<string, CoverDefinition>

export type ArticleCover = {
  readonly src: string
  readonly alt: string
  readonly caption?: string
  readonly creditLinks?: readonly { href: string; label: string }[]
  readonly badge?: string
  readonly width: number
  readonly height: number
  readonly type: string
}

export function articleCoverFor(slug: string, locale: ArticleCoverLocale): ArticleCover {
  const definition = ARTICLE_COVERS[slug as keyof typeof ARTICLE_COVERS]
  if (definition === undefined) throw new Error(`missing article cover: ${slug}`)
  return {
    src:
      'localizedSrc' in definition && definition.localizedSrc !== undefined
        ? definition.localizedSrc[locale]
        : `/article-covers/${slug}.webp`,
    alt: definition.alt[locale],
    caption:
      'caption' in definition && definition.caption !== undefined
        ? definition.caption[locale]
        : undefined,
    creditLinks:
      'creditLinks' in definition && definition.creditLinks !== undefined
        ? definition.creditLinks[locale]
        : undefined,
    badge:
      'badge' in definition && definition.badge !== undefined ? definition.badge[locale] : undefined,
    width: 'width' in definition && typeof definition.width === 'number' ? definition.width : 1200,
    height:
      'height' in definition && typeof definition.height === 'number' ? definition.height : 630,
    type: 'type' in definition && typeof definition.type === 'string' ? definition.type : 'image/webp',
  }
}

export const ARTICLE_INDEX_COVER: ArticleCover = {
  src: '/article-covers/article-library.webp',
  width: 1200,
  height: 630,
  type: 'image/webp',
  alt: {
    ja: '白紙のガイドブックと工場の風景を描いたイラスト',
    en: 'Editorial illustration of a blank guidebook in an industrial landscape',
  }['ja'],
}

export function articleIndexCoverFor(locale: ArticleCoverLocale): ArticleCover {
  return {
    ...ARTICLE_INDEX_COVER,
    alt:
      locale === 'ja'
        ? ARTICLE_INDEX_COVER.alt
        : 'Editorial illustration of a blank guidebook in an industrial landscape',
  }
}


