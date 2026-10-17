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
  }
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


