## 全体ルール
- any禁止
- 不要なキャスト禁止
- 単一責務の原則、dry原則に可能な限り従う
- 1ファイル1責務にし、関数などもまとめたファイルなどは作らない。ディレクトリでまとめてファイルは分ける
- reactのドキュメント、NextJSのプラクティスに従う
- typeでなくinterface推奨
- Claude APIの利用については想定される質とトークン消費のバランスを考えること

## FEアーキテクチャルール
src/components --- 共通コンポーネント
src/hooks --- 共通フック
src/stores --- 共通グローバルストア
src/features/XXX/components --- featureに閉じたコンポーネント
src/features/XXX/hooks --- featureに閉じたフック
src/features/XXX/stores --- featureに閉じたグローバルストア

- app/内のレイアウト、ページにはページコンテンツの詳細は含めずにfeature内のコンポーネントを利用する
- 定数ファイルなどもスコープを閉じれるものはfeature内に配置する

## BEアーキテクチャルール
提案の通りでOK.

## 推奨ライブラリ
- biome
- tailwind
- jotai
- zod
- reactはreact compilerを使ってメリットを享受すること

## デザイン
Attlasian design systemを理解し、従うこと。
モダンでシンプル、洗練されたデザインを心がけること。
https://atlassian.design/
