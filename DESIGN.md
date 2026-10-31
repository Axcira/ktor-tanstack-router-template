# Design system (frontend)

Material Design 3–inspired **tokens only** — no MD3 components. The stack stays shadcn, Radix, and Tailwind.

## Generated artifacts

| File | Tool | Hand-edit? |
| --- | --- | --- |
| `frontend/src/theme.generated.css` | `bun run --cwd frontend theme` | No |
| `frontend/src/styles.css` (pill radius, Tailwind `@theme` aliases) | Maintained in repo | Yes (aliases / pill only) |

`bun run frontend:check` runs `theme:check`, `radius:check`, and `select:check`.

## Theme generator

From the repo root (after `bun install`):

```bash
bun run --cwd frontend theme --help
bun run frontend:theme
bun run --cwd frontend theme '#6750A4'
bun run --cwd frontend theme --variant=vibrant '#6750A4'
bun run --cwd frontend theme --success=#1b873f --info=#0277bd --warning=#f9a825
bun run --cwd frontend theme:check
```

### Defaults

Defaults are the constants in `frontend/scripts/theme.ts` (`DEFAULT_THEME`, `DEFAULT_RADIUS`, `DEFAULT_CONTRAST`). `package.json` does not duplicate them. `theme:check` runs the generator with only `--check`, so the committed CSS must match those constants. The header comment of `theme.generated.css` records every chosen option.

| Flag | Default | Role |
| --- | --- | --- |
| Primary (positional arg) | `#0061f3` | Brand / `primary` scheme (legacy template primary) |
| `--success=` | `#1b873f` | Success semantic palette |
| `--info=` | `#0277bd` | Info semantic palette |
| `--warning=` | `#f9a825` | Warning semantic palette |
| `--variant=` | `tonal-spot` | Every `Variant` exported by the installed `@material/material-color-utilities` (`tonal-spot`, `neutral`, `vibrant`, `expressive`, `fidelity`, `content`, `monochrome`, `rainbow`, `fruit-salad`, …). `--help` and unknown-variant errors list the installed set. |
| `--contrast=` | `0` | `DynamicScheme` `contrastLevel`, from `-1` to `1` |
| `--radius-sm=` | `0.375rem` | `--radius-sm` / `rounded-sm` |
| `--radius-md=` | `0.5rem` | `--radius-md` / `rounded-md` |
| `--radius-lg=` | `0.75rem` | `--radius-lg`, `--radius`, `rounded-lg` |
| `--radius-xl=` | `1.25rem` | `--radius-xl` / `rounded-xl` |

Radius lengths are `rem` or `px` (`0.25rem`, `4px`). `rounded-full` and `--radius-pill` (`9999px` in `styles.css`) are not flags.

Implementation: `@material/material-color-utilities` (`frontend/scripts/theme.ts`). Colors are written as **hex / rgba** (library ARGB output), not custom OKLCH conversion. Contrast is passed to the scheme constructor; this repo does not reimplement tone math.

Each semantic seed is harmonized toward the primary source via MD3 `customColor(..., blend: true)` and exposes `--success`, `--success-foreground`, `--success-container`, `--success-container-foreground` (and the same pattern for `info` and `warning`).

Preview scopes for the settings theme picker:

- `.theme-preview-light` — same variables as `:root`, `color-scheme: light`, and **`background-color: var(--background)`**
- `.theme-preview-dark` — same variables as `.dark`, `color-scheme: dark`, and **`background-color: var(--background)`**

The preview mock sits on a card (`bg-card`). Resetting custom properties is not enough: a preview with no background is transparent, so the card’s color shows through. In a dark app that makes the light preview look black even when its `--background` / `--muted` variables are already the light values. Dark previews looked correct because they also had the `bg-background` utility. Both scopes now paint their own background in generated CSS, and the settings markup uses `bg-background` on every preview pane.

Tailwind `dark:` utilities are scoped in `frontend/src/styles.css` so they follow the app theme **except** inside `.theme-preview-light` (light preview stays light when the app is dark). `.theme-preview-dark` is treated as a dark context when the app is light. That variant scope does not paint the preview surface; the background declarations above do.

## Color token mapping (MD3 → app)

| App / shadcn token | MD3 role |
| --- | --- |
| `--background`, `--foreground` | `surface`, `on-surface` |
| `--card`, `--popover`, `--muted` | surface container steps |
| `--primary`, `--primary-foreground` | `primary`, `on-primary` |
| `--primary-container`, `--on-primary-container` | primary container roles |
| `--secondary`, `--accent` | secondary / tertiary containers |
| `--destructive` (+ container pair) | error roles |
| `--border`, `--input`, `--outline*` | outline / outline-variant. Light `--input` and `--border` are `outline-variant`. Dark `--input` is `rgba(255, 255, 255, 0.16)`. |
| `--success` / `--info` / `--warning` (+ containers) | custom-color groups from their seeds |
| Sidebar `*` tokens | same roles on `surface-container-low` |
| `--chart-1` … `--chart-5` | primary, secondary, tertiary, containers |

## Shape scale (corner radius)

`rounded-sm|md|lg|xl` read `--radius-*` from `frontend/src/theme.generated.css` (see the generator flags). Defaults, at a 16px root:

| Token / class | Default | ~Size | Use for |
| --- | --- | --- | --- |
| `--radius-sm` / `rounded-sm` | `0.375rem` | 6px | Checkbox, badge, tag, tooltip |
| `--radius-md` / `rounded-md` | `0.5rem` | 8px | Input, button, select, tabs, menu items |
| `--radius-lg` / `rounded-lg` | `0.75rem` | 12px | Card, popover, dropdown, toast (`--radius` aliases this) |
| `--radius-xl` / `rounded-xl` | `1.25rem` | 20px | Dialog, sheet, drawer, alert-dialog |
| `rounded-full` | fixed | pill | Avatar, chip, status badge (`--radius-pill: 9999px` in `styles.css`) |

Inner corners must use a **smaller** step than their container.

### Allowed Tailwind classes

Only `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`, `rounded-none`, plus directional variants (e.g. `rounded-t-lg`). No bare `rounded`, no `rounded-[…]`, no `rounded-2xl` / `3xl` / `4xl`.

Enforcement: `frontend/scripts/radius-check.ts` (part of `bun run frontend:check`). Changing a radius flag updates every `rounded-*` utility. The check still rejects arbitrary radii such as `rounded-[4px]`; pick a step on the scale instead of a one-off length.

## 見た目の調整

ローカルで色味や角丸を試すときは、`frontend` で `bun run theme` にフラグを渡します。リポジトリルートからは `bun run --cwd frontend theme …` です。一覧は `bun run theme --help`。色の計算は `@material/material-color-utilities` に任せ、このリポジトリではトーンを手計算しません。

試した CSS は既定値と違うので `bun run theme:check` が失敗します。戻すときはフラグなしの `bun run theme`。採用する見た目をリポジトリの既定にするときは `frontend/scripts/theme.ts` の `DEFAULT_THEME` / `DEFAULT_RADIUS` / `DEFAULT_CONTRAST` を変えてから、同じ既定で再生成します。`package.json` に既定値のコピーはありません。生成ファイル先頭のコメントに、そのときのフラグがすべて残ります。

| フラグ | 既定 | 効果 |
| --- | --- | --- |
| 位置引数の primary | `#0061f3` | スキームの種。primary そのものではなく、variant がこの色からロールを作ります |
| `--variant=` | `tonal-spot` | 下の一覧。インストール済みライブラリの `Variant` 全部を受け、`--help` とエラーメッセージに列挙します |
| `--contrast=` | `0` | `-1`（最低）から `1`（最大）。`0` が仕様どおり。primary / on-primary と outline の強さが変わります |
| `--success=` | `#1b873f` | success の種 |
| `--info=` | `#0277bd` | info の種 |
| `--warning=` | `#f9a825` | warning の種 |
| `--radius-sm=` | `0.375rem` | チェック、バッジ、ツールチップ（約 6px） |
| `--radius-md=` | `0.5rem` | 入力、ボタン、セレクト（約 8px） |
| `--radius-lg=` | `0.75rem` | カード、ポップオーバー、トースト。`--radius` もこれと同じ（約 12px） |
| `--radius-xl=` | `1.25rem` | ダイアログ、シート、ドロワー（約 20px） |

角丸は `0.25rem` のような rem か、`4px` のような px。`rounded-full` と `--radius-pill`（`9999px`）は固定で、フラグはありません。

### variant の見え方

既定の primary `#0061f3`、contrast `0` での傾向です。

| variant | 傾向 |
| --- | --- |
| `tonal-spot` | 既定。ニュートラルに種の色相が乗ります。この種だと背景 `--background` は `#faf8ff` で、わずかに青紫です。primary は `#4a5d92` まで落ち、白文字とのコントラストも種そのものより弱く見えます |
| `neutral` | 彩度をほとんど抜いたグレー。背景は `#fcf8fa` で、青紫のティントはほぼ消えます |
| `monochrome` | グレースケール。背景 `#f9f9f9`、primary は黒 |
| `vibrant` | primary パレットの彩度を最大まで上げます |
| `expressive` | 種の色相から意図的に離した、より遊んだ配色 |
| `fidelity` | 種を primary container に置き、primary を種に近づけます（この種では `#004bc0`）。白とのコントラストも tonal-spot より強くなります |
| `content` | fidelity と同じく種を primary container に置きます。このライブラリ版では色がほぼ fidelity と同じになることがあります |
| `rainbow` | 遊び心のある配色。種の色相はテーマに出ません |
| `fruit-salad` | rainbow と同様、種の色相を使わない遊び心のある配色 |

### コントラスト

`--contrast` は `DynamicScheme` の `contrastLevel` です。背景色は variant 側の仕事で、tonal-spot の `#faf8ff` は contrast を動かしても変わりません。変わるのはロールのトーンです。

- `0`: 今の見た目。primary `#4a5d92`、on-primary `#ffffff`、outline `#757680`、outline-variant `#c5c6d0`
- `1` に近づける: primary は濃くなり（`#14295c`）、on-primary は白のまま、outline / outline-variant も濃くなります。文字と面のコントラストは上がります
- `-1` に近づける: primary は薄くなり（`#6073aa`）、on-primary は純白ではなくなり、outline も薄くなります

背景の青紫を取りたいときは contrast ではなく `neutral` か `monochrome`。primary を種の青に戻してコントラストも上げたいときは `fidelity`（必要なら contrast も少し上げる）。

### 角丸

値は `theme.generated.css` の `:root` に書き出され、`styles.css` の `@theme` 経由で `rounded-sm` / `md` / `lg` / `xl` 全部に流れます。クラス名は変えないでください。`radius:check` はクラス名だけを見て、数値は見ません。

昔のシャープな角に近づける例（ニュートラル寄り、コントラストを上げ、半径を小さく）:

```bash
bun run theme --variant=neutral --contrast=0.5 \
  --radius-sm=0.125rem --radius-md=0.25rem \
  --radius-lg=0.375rem --radius-xl=0.5rem
```

px でも同じです。`--radius-sm=2px --radius-md=4px --radius-lg=6px --radius-xl=8px`

### テキスト入力の背景

入力コンポーネント（`frontend/src/components/ui/input.tsx`）は `bg-input/50` です。色トークンは `--input`（Tailwind の `--color-input`）で、50% の不透明度で下地に載ります。

- ライト: `--input` は MD3 の `outline-variant`（既定では `#c5c6d0`）。`--outline-variant` およびライトの `--border` と同じ値です。50% で `#faf8ff` の上に置くと、グレーの塗りが目立ちます
- ダーク: `--input` は `rgba(255, 255, 255, 0.16)` 固定です

contrast を上げると outline-variant が濃くなり、このグレーはより目立ちます。薄くしたいときは contrast を上げず、`neutral` / `monochrome` で色相を抜くか、Input の `bg-input/50` を `bg-transparent` やより低い透明度に変えます。後者はフラグではなくコンポーネントのクラスです。

## UI coding rules

- Use semantic color classes: `bg-background`, `text-primary`, `border-border`, `bg-primary-container`, `text-success`, etc.
- `frontend/src/components/ui/` is shadcn code owned by this project. Edit it directly so components follow these rules (semantic tokens, the shape scale). It is not generated output to leave untouched. Biome ignores that directory.
- Do **not** use raw Tailwind palette utilities (`bg-gray-100`, `text-red-500`, …) or hard-coded hex in app code.
- Prefer `frontend/src/lib/theme-tokens.ts` for repeated patterns (form errors, toasts, role badges).
- Use `ResponsiveSelect` (`frontend/src/components/ResponsiveSelect.tsx`) for every dropdown in app routes and feature components — not raw `<select>` and not direct imports from `@/components/ui/select`. Native `<select>` on coarse pointers, shadcn Select on fine pointers. Pass Radix Select root props (`value`, `defaultValue`, `onValueChange`, `name`, `required`, `disabled`, `form`, `autoComplete`, and the open/dir props). `id`, `className`, `aria-*`, and `data-*` are forwarded to both the native control and the shadcn trigger. Radix-only props (`open`, `defaultOpen`, `onOpenChange`, `dir`, …) apply on fine pointers and are ignored on the native control. Branch overrides are `triggerProps`, `contentProps`, and `nativeProps`.

Enforcement: `frontend/scripts/select-check.ts` (part of `bun run frontend:check`).

### Semantic status colors (`success`, `info`, `warning`)

| Location | Usage |
| --- | --- |
| `lib/theme-tokens.ts` | `roleBadgeClass` (Editor → info, Writer → warning containers); `notificationToastClass` (success/info/error inline banners) |
| `Header.tsx` | User menu role chip (`bg-info-container`) |
| `UsersTable.tsx` | Role badges via `roleBadgeClass` |
| `permissions/roles/index.tsx` | Copy-role notification banner via `notificationToastClass` |
| Showcase upload | Upload stats (`text-success`, `text-info`) and completed-row icon |
| Showcase form | Success state hero icon (`text-success`) |
| Showcase dashboard | Reference badges, status banners, and Sonner buttons (default / success / info / warning / error) |

Sonner (`frontend/src/components/ui/sonner.tsx`) follows the app theme from `themeAtom` and sets toaster CSS variables from `sonnerToastCssVars` in `theme-tokens.ts`:

| Sonner variable | App token |
| --- | --- |
| `--normal-bg` / `--normal-text` / `--normal-border` | `--surface-container`, `--foreground`, `--border` |
| `--success-*` | `--success-container`, `--success-container-foreground`, `--success` |
| `--info-*` | `--info-container`, `--info-container-foreground`, `--info` |
| `--warning-*` | `--warning-container`, `--warning-container-foreground`, `--warning` |
| `--error-*` | `--destructive-container`, `--destructive-container-foreground`, `--destructive` |

`richColors` stays on so those variables paint typed toasts. Description text uses `!text-current` so Sonner’s hardcoded description color does not override the token.
