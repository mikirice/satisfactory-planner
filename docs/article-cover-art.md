# Article cover artwork

Updated 2026-10-12.

## Source and usage

The article covers in `public/article-covers/` are original editorial illustrations generated for this project with the built-in image generation tool. They were visually inspected and cropped for this site. No screenshots, game textures, wiki images, or images from other guide sites were reused. The artwork is not an official Satisfactory asset and does not depict a verified in-game build, calculation, or production result.

The images are shared by Japanese and English versions of each guide. Localized alt text is maintained alongside the slug mapping in `content/article-covers.ts`. The article pages state that the cover is an illustration; the directory cards display a localized “Illustration / イラスト” badge. Social preview metadata uses the same cover.

## Asset format

- 1200 × 630 pixels (1.90:1), WebP, quality 82.
- Article cards reserve the same aspect ratio, use lazy loading, and declare intrinsic width and height.
- Article hero covers declare width and height and use high fetch priority.
- The 22 article images are individually selected to distinguish their topics. `article-library.webp` is used for the guide directory and its social preview.

To replace an image, keep the same filename and dimensions, inspect the result at card size, and retain the visible illustration disclaimer. Update localized alt text in `content/article-covers.ts` if the subject changes.
