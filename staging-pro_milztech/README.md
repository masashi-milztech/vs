
# StagingPro - プロフェッショナル運用マニュアル

## 🔐 アカウント認証メールの設定 (Supabase)

登録時に確認メールを `info@milz.tech` から自動送信するための設定です。

1.  **SMTP (Resend) の詳細設定**:
    *   画面右上（または `Cmd+K`）の検索窓で **「SMTP」** と入力。
    *   **「SMTP Settings」** で以下を入力して保存：
        *   **Enable Custom SMTP**: ON
        *   **Sender email**: `info@milz.tech`
        *   **Sender name**: `StagingPro Studio`
        *   **Host**: `smtp.resend.com` / **Port**: `587`
        *   **User**: `resend` / **Password**: (ResendのAPIキー)

2.  **認証（Confirm email）の有効化**:
    *   左メニューの **Authentication > Sign In / Providers > Email** を開く。
    *   **Confirm email** を **ON** にして保存。これで登録時に確認メールが飛びます。

---

## 📧 納品通知メールの設定 (Resend API)

Cloudflare Pagesの **Settings > Variables** に以下を設定してください。

*   **VITE_RESEND_API_KEY**: Resendで発行したAPIキー。

### ✅ 接続テストの手順
1. アプリに管理者メールアドレス（`masashi@milz.tech`等）でログイン。
2. ヘッダーの **「Production Hub」** を開く。
3. 右上の **「Test Email」** ボタンをクリック。
4. 自分のメールに `Connection Test` というメールが届けば完了です！

### ⚠️ メールが届かない場合
*   **Resendの管理画面** を確認してください。
*   `Domains` セクションで `milz.tech` が **Verified** になっていますか？
*   CloudflareのDNS設定（MX, TXTレコード等）が反映されるまで最大24時間かかる場合があります。

---

## 🛠️ 管理者アカウント
以下のメールアドレスで登録・ログインすると、全注文の閲覧と納品が可能な「Production Hub」が開きます。
*   `masashi@milz.tech`
*   `masashi@thisismerci.com`
