
# StagingPro - 公開マニュアル（最新版）

ターミナルで `Authentication failed` と出た場合は、GitHubのセキュリティ制限（パスワード不可）によるものです。以下の**マウス操作**で進めるのが一番簡単です。

---

## 🚀 【推奨】マウス操作でGitHubへアップロードする

1. **GitHubを開く**: [https://github.com/masashi-milztech/vs](https://github.com/masashi-milztech/vs)
2. **ボタンを押す**: `Add file` ＞ `Upload files` をクリック。
3. **ファイルを選ぶ**:
   - パソコンのフォルダ `staging-pro_milztech` を開きます。
   - 中にあるファイル（`index.html`, `App.tsx`, `package.json`など）とフォルダ（`components`, `lib`など）を**すべて選択**します。
4. **ドラッグ＆ドロップ**: 選択したものを、GitHub画面の「Drag files here」と書かれた枠内に放り込みます。
5. **保存**: ページ下部の緑色のボタン `Commit changes` をクリックして完了！

---

## 🌐 公開後の設定 (Cloudflare Pages)

アップロードが終わったら、Cloudflareの設定画面で以下の「環境変数」を登録してください。
※これを入れないとアプリが動きません。

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_RESEND_API_KEY`

設定後、再デプロイを行えばサイトが世界中に公開されます！
