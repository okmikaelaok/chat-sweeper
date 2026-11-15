# ChatSweeper — third-party notices

Copyright © 2026 Mikaela Marie Punzalan. ChatSweeper's original code is licensed under **GPL-3.0-only**; see [LICENSE](LICENSE). Third-party materials retain their own notices and licenses.

| Material | Attribution | License |
| --- | --- | --- |
| [shadcn/ui](https://github.com/shadcn-ui/ui) Button, Card, Badge and Input source | Copyright (c) 2023 shadcn | MIT — [full text](licenses/shadcn-ui-MIT.txt) |
| [Lucide](https://lucide.dev) interface icons | Lucide contributors; derived Feather artwork where noted upstream | ISC and upstream notices — [full text](licenses/lucide-ISC.txt) |
| React, Radix Slot, Tailwind CSS, class-variance-authority, clsx, tailwind-merge and esbuild | Respective authors/contributors | MIT — [bundled dependency notices](licenses/dependencies.txt) |
| resvg-js and platform SVG rasterisation tooling (build only) | Yisibl and resvg contributors | See [dependency notices](licenses/dependencies.txt) and the pinned package's license |

shadcn/ui components are retained as editable TypeScript source in `src/ui/components/ui/`. They are rendered at build time, with Tailwind CSS compiled locally. The extension does not ship a React runtime or download remote scripts, icons, fonts or styles. Lucide SVGs and generated CSS/markup are included in the extension bundle.

Gemini, ChatGPT, Google Chrome and other product names belong to their respective owners. ChatSweeper is an independent project, not affiliated with or endorsed by Google or OpenAI.
