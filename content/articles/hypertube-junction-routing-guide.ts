import type { HandwrittenArticle } from './types.ts'

export const hypertube_junction_routing_guideArticle = {
  "slug": "hypertube-junction-routing-guide",
  "title": "ハイパーチューブの接合部 と 分岐路 の進路診断",
  "description": "ハイパーチューブの接合部 と ハイパーチューブの分岐 は、どちらもチューブを分岐させますが、進路の選び方が異なります。Coffee Stain の アップデート1.1 ノートでは、接合部では接近中にプレイヤーが進路を選べます。分岐路では、形状上、長い区間を通って分岐経路にアクセスします。分岐路全体が「一方向専用」だとは、この説明だけからは言えません。往路と復路は、現行ゲーム版で個別に確認してください。",
  "sections": [
    {
      "heading": "部品の違い",
      "paragraphs": [
        "根拠はCoffee Stain の公式 Satisfactory 1.1 リリースノートです。この記述は1.1の仕様説明であり、現在の1.2.xクライアントでの挙動を実機確認した結果ではありません。"
      ],
      "illustrations": [
        {
          "src": "/article-images/hypertube-junctions.jpg",
          "alt": "3本のチューブ経路につながるハイパーチューブ接合部を上から見たSatisfactory 1.1の画像.",
          "caption": "複数のチューブ経路につながる接合部の公式1.1 プレスキット画像です。接続形状の参考であり、現行版の進路表示や選択中の経路を示すものではありません。",
          "creditLinks": [
            {
              "label": "元画像",
              "href": "https://drive.google.com/file/d/18TR518-5BonLmKtsmhJ5mxhWsm3MRjS4/view?usp=drivesdk"
            }
          ]
        }
      ]
    },
    {
      "heading": "作り直す前に操作を確認する",
      "paragraphs": [],
      "lists": [
        {
          "ordered": true,
          "items": [
            "接合部の進路選択ヒントを見る。 接合部へ近づいたとき、進路選択の表示があるか確認します。公式1.1ノートでは、キーボード操作の例として、接近中にEを押して経路を選ぶと説明しています。このキーを全機種・現行版共通の操作とは扱いません。表示の有無とタイミングは、現行クライアントで確認してください。分岐路では、まず形状と通過経路を別に確認します。",
            "使っている入力機器の表示に従う。 PCのキーを全機種共通の操作として使わず、ゲーム画面のヒントを読みます。PS5プレイヤーの報告には、チューブ内でヒントを見落とし、後から案内を確認した例があります。これはユーザー報告であり、現行UIの保証ではありません。",
            "入力設定と操作のタイミングを確認する。 表示された入力が反応しない場合は、現在の操作設定設定と接続中の入力機器を確認します。接合部を通過してから操作していないかを確かめます。使う進入経路ごとに、接合部へ接近している間に一度ずつ進路選択を試します。公式ノートの「接近時」という説明を超えて、正確な入力受付時間は断定しません。",
            "物理的な接続を点検する。 表示と入力を確認した後、各チューブが部品のどの接続口につながり、目的地まで続いているかを見ます。",
            "分岐路の形状と通過経路を照合する。 行きたい分岐経路へ進むとき、公式説明にある「長い区間を通る」条件に合う経路かを確認します。戻りも必要なら、分岐へ向かう経路と帰路を個別に乗って試します。公式ノートは、分岐路全体が一方向専用か、各構成で往復できるかまでは説明していません。"
          ]
        }
      ]
    },
    {
      "heading": "症状ごとに切り分ける",
      "paragraphs": [],
      "lists": [
        {
          "ordered": false,
          "items": [
            "接合部で違う出口へ進む場合は、画面の選択ヒントと入力を先に確認します。操作のタイミングと機器設定を確かめた後、各接続口と行き先を調べます。プレイヤー投稿やQ&A投稿には、選択入力の問題も報告されています。ただし、それだけで現行版の恒常的な不具合とは言えません。",
            "分岐路の分岐経路に進めない場合は、部品の形状と、長い区間を通る経路かを確認します。部品全体を単純な「一方通行」と呼ばず、どの接続経路から分岐へ進もうとしているかを記録します。",
            "帰路で期待どおりに移動できるか分からない場合は、実際に帰路へ乗って別に確認します。片道の結果だけから往復できるとは判断しません。1.1の公式説明は、分岐路を使った全構成の往復可否を示していません。",
            "操作ヒントが出ない、または入力しても変化しない場合は、接近時の表示、操作機器、操作設定設定、正確なゲーム版、進入経路を確認します。建築不良と決めつけず、別の進入経路でも再現するかを調べます。1.2.xでの再現性は本稿では未確認です。"
          ]
        }
      ]
    }
  ],
  "references": {
    "heading": "参照資料",
    "links": [
      {
        "label": "Coffee Stain Studios: Satisfactory 1.1 Out Now!",
        "href": "https://store.steampowered.com/news/posts/?appids=526870&enddate=1757345783&feed=steam_community_announcements"
      },
      {
        "label": "r/SatisfactoryGame: “How to control hypertube branch direction? PS5”",
        "href": "https://www.reddit.com/r/SatisfactoryGame/comments/1oxrwhv/how_to_control_hypertube_branch_direction_ps5/"
      },
      {
        "label": "Satisfactory Q&A: “Junctions stop letting you change direction”",
        "href": "https://questions.satisfactorygame.com/post/684852136b7c57319638347f"
      },
      {
        "label": "Official Satisfactory Wiki: Hypertube Junction",
        "href": "https://satisfactory.wiki.gg/wiki/Hypertube_Junction"
      }
    ]
  },
  "relatedItemIds": [],
  "publishedDate": "2026-10-18",
  "relatedArticleSlugs": [
    "power-generation-planning",
    "vehicle-paths"
  ],
  "versionNotice": "Plannerの収録データは1.1.xです。挙動の説明は安定版アップデート1.1の公式資料に基づきます。現行1.2.xの進路表示と入力機器別操作は実機確認していません。"
} as const satisfies HandwrittenArticle
