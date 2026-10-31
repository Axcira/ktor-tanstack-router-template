# frontend

TanStack Router + React + Vite SPA for this monorepo.

## Commands

Prefer root workspace scripts (from the repository root after `bun install`):

```bash
bun run frontend:dev      # Vite on :3000 (proxies /api → :8080)
bun run frontend:build
bun run frontend:test
bun run frontend:check
```

Or from this directory:

```bash
bun run dev
bun run build
bun run test
bun run check
```

## テーマの見た目を試す

色味・コントラスト・角丸は `frontend/scripts/theme.ts` のフラグで変えます。既定値のまま再生成するコマンドは次です。

```bash
bun run theme          # このディレクトリ
bun run frontend:theme # リポジトリルート
bun run theme --help
```

角を尖らせ、背景の色味を抑えた例:

```bash
bun run theme --variant=neutral --contrast=0.5 \
  --radius-sm=0.125rem --radius-md=0.25rem \
  --radius-lg=0.375rem --radius-xl=0.5rem
```

試したファイルは `bun run theme:check` に失敗します。戻すときは引数なしの `bun run theme`。各フラグの効果、variant の見え方、入力欄の背景（`--input` / `bg-input/50`）は [DESIGN.md の「見た目の調整」](../DESIGN.md#見た目の調整) にまとめてあります。

## Notes

- Path alias: `@/*` → `./src/*`
- Generated (do not edit): `src/routeTree.gen.ts`, `src/api/generated/`, `src/theme.generated.css`
- **Design tokens:** See [DESIGN.md](../DESIGN.md) (colors, shape scale, theme generator, radius check).
- API client: regenerate via root `bun run generate:client` (see `.agents/skills/regenerate-api-client/SKILL.md`)
- Cloudflare Workers Static Assets: `bun run cf:dev` / `bun run cf:deploy`

See the repository root [README.md](../README.md) and [AGENTS.md](../AGENTS.md) for full setup.
