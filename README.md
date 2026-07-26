# Axcira Development Template

このプロジェクトは、Axciraの技術スタックを元に、極限まで開発者体験 (DX) を向上させることと、開発の初動を加速させることを目的としたテンプレートです。

> [!WARNING]
> このプロジェクトはまだ **Work in Progress** です。
> 本番環境での利用は想定されていません。
> 問題が見つかったら、[Issues](https://github.com/Axcira/ktor-tanstack-router-template/issues) で教えてください。よろしくお願いします！

# Project Structure

このテンプレートは、大きく2つのディレクトリに分割されています。

- **`backend/`**: Ktor で作成されたバックエンドのプロジェクト。
- **`frontend/`**: TanStack Router で作成されたフロントエンドのプロジェクト。

# Tech Stack

## Backend

バックエンドでは、以下の技術スタックを採用しています。

|目的|スタック|
|---|---|
|バックエンドフレームワーク|Ktor|
|データベース (ORM)|Exposed|
|コネクションプール|HikariCP|

## Frontend

フロントエンドでは、以下の技術スタックを採用しています。

|目的|スタック|
|---|---|
|フレームワーク|TanStack Router (React)|
|ツールチェイン|Vite|
|UI|shadcn/ui, Radix UI|
|データフェッチ|TanStack Query|

# Why this template

このテンプレートには、以下のような特徴があります。

- **Test included**: テスト用データベースに差し替えたバックエンドサーバーのテストが組み込まれています。
- **Database included**: Exposedを使用したデータベース接続が組み込まれています。
- **Authentication included**: ログイン・アカウント登録機能が組み込まれています。
- **Articles included**: サンプルとして、タグとのMany to Manyリレーションを持つ記事管理機能が組み込まれています。
- **Scalar included**: OpenAPIドキュメントツール "Scalar" が組み込まれています。
- **Vertical Slice Architecture**: 機能拡張・削除がしやすく、結合しづらいディレクトリ構成を採用しています。
- **Type-safe API Client**: Orvalを用いた、TanStack Queryサポートの型安全なAPIクライアント生成に対応しています。
- **Auto-reload**: 自動リロードによって、バックエンド・フロントエンドの変更を即座に反映します。

# Getting Started

## 0. Ready

GitHubの "Use this template" ボタンをクリックし、このテンプレートをもとにした新しいリポジトリを作成します。
作成したリポジトリをクローンしてください。

## 1. Install dependencies

このプロジェクトは [Bun workspace](https://bun.sh/docs/install/workspace) 構成です。
ルートで `bun install` を実行すると、フロントエンドと Lefthook の依存が一度にインストールされます。

```bash
bun install
```

## 2. Start the project

このプロジェクトはモノレポ構成になっています。以下の手順でローカル環境を立ち上げてください。
なお、IntelliJ IDEAを使用している場合、 "Development" と書かれた複合実行構成を起動してください。
VSCodeなど、他のエディターを使用している場合は、以下の手順に従ってください。

### Fast path — one command

プロジェクトルートで `dev.sh` を実行すると、PostgreSQL の起動と接続確認を行い、後続のコマンドを表示します。

```bash
./dev.sh
```

データベースが起動したら、表示されたコマンドをそれぞれ別のターミナルで実行してください。

### Manual steps

**データベースの起動**
Docker Compose経由で、Postgresが起動します。
`--wait` フラグにより、Postgres が接続を受け付けるのを待ってから終了します。

```bash
docker compose up -d --wait
```

**バックエンドの起動**
依存関係の解決はこのタイミングで行われます。
`.class` ファイルが変更された際に、自動で再読み込みします。
⚠️ Java の仕様上、一部の変更は自動で適用されなかったり、オブジェクトが破棄される場合があります。

```bash
cd backend
./gradlew run
```

**フロントエンドの起動**
開発モードで起動するため、ホットリロードに対応しています。

```bash
cd frontend
bun run dev
```

開発を本格的に進める場合は、以下の2つのプロセスも立ちあげてください。
(Compound 実行構成に含まれています。)

**自動コンパイル**
バックエンドのソースコードをリアルタイムで監視し、変更された場合にコンパイルします。
OpenAPI 仕様も自動生成されます。

```bash
cd backend
./gradlew generateOpenApiJson -t -i
```

**Orval監視とクライアントライブラリの自動生成**
OrvalがOpenAPI 仕様を監視し、変更された場合にクライアントライブラリを自動生成します。

```bash
cd frontend
bun run orval:watch
```

## Customize project identity

このテンプレートを元に新しいプロジェクトを作成したら、まずプロジェクトの名前やパッケージを変更してください。

```bash
# 変更内容をプレビュー（ファイルは変更されません）
bun scripts/rename.ts --package com.example.myapp --slug my-app --name "My App"

# 実際に変更を適用する
bun scripts/rename.ts --package com.example.myapp --slug my-app --name "My App" --write
```

`--package` は Kotlin のパッケージ名（`net.axcira` の置き換え）で必須です。
`--slug` は Cloudflare Workers の名前などに使われるプロジェクト識別子、
`--name` は画面に表示されるプロジェクト名です。

その他のオプションは `bun scripts/rename.ts --help` を参照してください。

> [!WARNING]
> 変更を適用するには Git の作業ツリーがクリーンである必要があります。
> ダーティな状態で実行する場合は `--allow-dirty` フラグを追加してください。

### Root scripts (Bun workspace)

プロジェクトルートから共通操作を実行できます。

```bash
# Frontend
bun run frontend:dev        # Vite dev server (HMR, port 3000)
bun run frontend:build      # Production build
bun run frontend:test       # Vitest
bun run frontend:check      # Biome lint + format check
bun run frontend:format     # Biome format
bun run frontend:lint       # Biome lint

# Backend
bun run backend:dev         # Ktor dev server (port 8080, auto-reload)
bun run backend:build       # Gradle build
bun run backend:test        # Gradle test
bun run backend:check       # Gradle check (test + ktlintCheck)
bun run backend:format      # ktlintFormat

# Code generation
bun run generate:openapi    # Generate OpenAPI spec
bun run generate:client     # Generate Orval client from spec
bun run orval:watch         # Watch OpenAPI → auto-regenerate client
```

## 3. Add new features

このプロジェクトを拡張して、新しい機能（例: ToDo）を実装する手順について説明します。

### Extend backend

1. `backend/src/.../features/users` パッケージをコピーし、`todos/`を作成します。
1. 必要なテーブル定義を`backend/src/...db`パッケージにコピーして編集します。（必要な場合）
1. 中にあるファイル名やクラス名 (`UserRouting` --> `ToDoRouting` など) を置換します。
1. `Application.kt` の `dependencies` の中に、`ToDoService`を追加します。
1. `resources/application.yaml` の `modules` の中に、`net.axcira.features.users.ToDoRoutingKt.todos` を追記します。
1. `backend/src/test/.../users` パッケージをコピーし、`todos/`を作成し、テストコードを修正します。

#### Database

`net/axcira/db` 以下に作成された全ての `Table` を継承したオブジェクトは、Exposed Gradle プラグインによって自動で認識され、追跡されます。
データベースにテーブルを作成するには、以下のコマンドを実行してマイグレーションスクリプトを作成します。

```bash
cd backend
./gradlew generateMigrations
```

マイグレーションスクリプトは `resources/db/migration` に作成されます。

> [!WARNING]
> [公式ドキュメント](https://www.jetbrains.com/help/exposed/migrations.html) によると、`DROP COLUMN`や`DROP SEQUENCE`などの
> 破壊的なSQLが生成される可能性があるとされています。
> そのため、生成されたSQLのヒューマンレビューを推奨します。

生成されたマイグレーションファイルは、サーバーの起動時に（未適用のマイグレーションも含めて）適用されます。

### Extend frontend

// TODO: フロントエンドをもうちょっとちゃんと詰めてここを書く

## 4. Backend tests

バックエンドのテストは Testcontainers で PostgreSQL を 1 回起動し、スキーマ移行はスイートごとに 1 回だけ行います。
各テスト間のアイソレーションは `TRUNCATE ... RESTART IDENTITY CASCADE` で行い、Ktor アプリはスイート内で共有されます（Docker が必要）。

```bash
cd backend
./gradlew test
```

## 5. Build the project

アプリケーションが完成し、公開する準備ができた場合、以下の方法でプロジェクトをビルドしてください。

### Build the backend

#### Docker Container (Recommended)

Dockerfile を使用して、本番向けの Docker イメージを作成できます（ビルドは JDK、実行は JRE）。

```bash
cd backend
docker build ./ -t backend
```

#### Build manually

バックエンドをビルドし、 `jar` ファイルを生成するには、以下のコマンドを実行します。

```bash
cd backend
./gradlew shadowJar
```

`backend/build/libs/backend-all.jar` に成果物が生成されます。
生成された jar ファイルは、次の方法で起動できます:

```bash
java --enable-native-access=ALL-UNNAMED -jar backend-all.jar
```

### Build the frontend

以下のコマンドを実行して、フロントエンドをビルドします。

```bash
cd frontend
bun run build
```

`frontend/dist/` に静的アセットが生成されます。

### Deploy the frontend (Cloudflare Workers Static Assets)

このフロントエンドは Cloudflare Workers Static Assets としてデプロイできます。
Cloudflare Pages ではなく Workers の Static Assets 機能を使用するため、Wrangler の設定ファイル `wrangler.jsonc` で SPA フォールバックを構成しています。

**前提条件**
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) が `devDependencies` に含まれています（`bun i` でインストール済み）。
- `wrangler login` または `CLOUDFLARE_API_TOKEN` 環境変数による認証が必要です。
- アカウントは認証情報から自動的に決定されます。未認証の場合は Wrangler がログインを要求します。

**ローカル開発サーバー (Workers エミュレーション)**

`cf:dev` は `dist/` を配信するため、初回実行前やソース変更後に `bun run build` を実行してください。通常の開発には HMR 対応の `bun run dev` を使用します。

```bash
cd frontend
bun run cf:dev
```

**デプロイ**

```bash
cd frontend
bun run cf:deploy
```

`cf:deploy` はビルドを先に実行するため、古い `dist/` がデプロイされることはありません。

> [!NOTE]
> Cloudflare Workers Static Assets は Cloudflare Pages とは異なるプロダクトです。
> 詳しくは [Cloudflare 公式ドキュメント](https://developers.cloudflare.com/workers/static-assets/) を参照してください。
