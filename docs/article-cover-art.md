# Article cover artwork

Updated 2026-10-17.

## Source and usage

Most images in `public/article-covers/` are original editorial illustrations generated for this project. The Motor guide is an exception: it uses a real factory screenshot distributed through official Satisfactory media, with a localized title panel. The [official Press & Content Creators page](https://www.satisfactorygame.com/press/) directs press and content creators who need assets to its linked press kit; the supplied screenshot is hosted on the official Satisfactory site. This is the recorded creator/editorial-use basis for the image in this guide. The pages reviewed did not state a blanket commercial-reuse or image-overlay license, so source credit alone must not be treated as unrestricted permission. Preserve this context and re-check suitability if the use changes. The screenshot is a general factory scene, not evidence of a specific Motor line or calculation.

Most covers are shared by Japanese and English versions of each guide. A guide may use language-specific artwork when localized cover text improves clarity; localized asset paths, alt text, caption, and badge are maintained alongside the slug mapping in `content/article-covers.ts`. Cover captions and card badges identify whether an image is an illustration or an official game screenshot. Social preview metadata uses the same locale-specific cover as the article.

## Asset format

- Legacy covers: 1200 × 630 pixels (1.90:1), WebP, quality 82. New or revised covers may use 1280 × 720 pixels (16:9) when specified by the article brief.
- Article cards reserve the same aspect ratio, use lazy loading, and declare intrinsic width and height.
- Article hero covers declare width and height and use high fetch priority.
- Each registered guide slug has a selected image; the Motor guide has two localized variants. `article-library.webp` is used for the guide directory and its social preview.

To replace an image, inspect the result at card size, and retain a visible caption that accurately identifies the image source and distinguishes artwork from gameplay evidence. Update localized alt text in `content/article-covers.ts` if the subject changes. For text-bearing covers, review each locale separately at full size and article-card size for readability, clipping, overlap, whitespace, and agreement with the article's actual promise. Treat an editorial illustration as artwork, and a game screenshot as a general scene unless it demonstrably shows the stated gameplay or calculation.

## 2026-10-16 editorial QA notes

Reference-based production notes were adapted into this site's cover workflow: compare the full article and existing site coverage before choosing a topic; put the reader's answer before conditions and examples; verify version-sensitive facts against the repository's game data or primary sources; and review generated pages at desktop and phone widths, including links, images, language links, canonical, social metadata, and sitemap entries. These are this site's implementation choices, not a promise of search or traffic results. The reference author’s reported performance is not treated as a forecast for this site.

For the Motor guide, the Japanese and English 1280 × 720 covers use the same full-frame official factory screenshot, scaled without cropping, with a localized title panel over it. The title panel introduces the article’s 15 Motors/min comparison; the screenshot itself is a general factory view and does not show Motor gameplay or the calculated line.
