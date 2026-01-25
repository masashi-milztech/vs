
# StagingPro - 最終デプロイマニュアル

Supabase（データベース）の準備は完了しています！Cloudflareの設定を以下の通りに進めてください。

---

## 🌐 Cloudflare Pages 公開設定

1. **GitHubとの連携**:
   - Cloudflareの画面で「Connect GitHub」を押します。
   - **※もし反応がない場合**: ブラウザのアドレスバー右側を確認し、ポップアップがブロックされていないか確認してください。

2. **リポジトリ選択**: `vs` を選択。

3. **ビルド設定 (Build settings)**:
   - **Framework preset**: `Vite`
   - **Root directory**: `staging-pro_milztech` ← 【重要】リポジトリ内のフォルダ名を指定
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

4. **環境変数 (Environment variables)**:
   以下の値を設定してください。
   - `VITE_SUPABASE_URL`: (SupabaseのURL)
   - `VITE_SUPABASE_ANON_KEY`: (SupabaseのKey)

---

## 🚀 公開後のトラブルシューティング

### 画面が真っ白になったら
もしサイトにアクセスして画面が真っ白な場合、Cloudflareの設定画面で以下を確認してください：

1. **Root directory の設定ミス**:
   - GitHubリポジトリの直下にファイルがある場合は、`Root directory` を **「空欄」** にして保存し、再度デプロイしてください。
   - もし `staging-pro_milztech` というフォルダの中にファイルがある場合は、そのままでOKです。

2. **ブラウザのキャッシュ**:
   - 一度ブラウザを閉じて開き直すか、シークレットモードで試してみてください。

### ログインについて
1. サイトにアクセスし、ログイン画面下の「Join the studio circle」からメールアドレスとパスワードを入力して登録してください。
2. 管理者（masashi@milz.tech または masashi@thisismerci.com）でログインすると、管理画面（Production Hub）が開きます。
