## 起動方法

プロジェクト直下に.env.production を作成し、その中に以下を記述。

```
NEXT_PUBLIC_RESAS_API_KEY={RESASのAPI key}
```

以下コマンドで起動。

```
yarn build
yarn start
```

起動後、http://localhost:3000/populations にアクセスする。
