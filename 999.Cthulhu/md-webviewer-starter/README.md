# Markdown WebViewer - nested folder version

この版は、`md-webviewer-starter` フォルダをリポジトリ直下に残したまま使う構成です。

```text
repo/
├─ 999.Cthulhu/
└─ md-webviewer-starter/
   ├─ index.html
   ├─ manifest.json
   ├─ css/
   ├─ js/
   └─ tools/
```

## ローカル確認

必ずリポジトリ直下でサーバーを起動します。

```powershell
cd D:\イジュンハ\memo_mafiya-master
py -m http.server 8000
```

ブラウザで以下を開きます。

```text
http://localhost:8000/md-webviewer-starter/
```

## Markdown追加後のmanifest再生成

```powershell
cd D:\イジュンハ\memo_mafiya-master
powershell -ExecutionPolicy Bypass -File .\md-webviewer-starter\tools\generate-manifest.ps1
```

`manifest.json` には `999.Cthulhu/...` 形式のパスを書きます。
実際の読み込み時には `js/app.js` が自動で `../` を付けて、上位階層の `999.Cthulhu` を読みに行きます。
