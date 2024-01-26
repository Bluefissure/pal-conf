<h1 align="center">
  <br>
    幻兽帕鲁服务器配置生成器
  <br>
</h1>
<p align="center">
   • <a href="/README.md">English</a>
   • <a href="/docs/README_zh_CN.md">简体中文</a>
</p>

以友好的方式管理你的 [幻兽帕鲁](https://store.steampowered.com/app/1623730/Palworld/) 服务器设置！

## 使用方法

支持 `WorldOption.sav` 和 `PalWorldSettings.ini` 设置：

- `PalWorldSettings.ini` 中的某些条目不起作用（如 `BaseCampWorkerMaxNum`）。
- 如果同时存在 `WorldOption.sav` 和 `PalWorldSettings.ini` 文件，`WorldOption.sav` 将优先生效。

### PalWorldSettings.ini

`PalWorldSettings.ini` 文件位于：

- Windows: `steamapps/common/PalServer/Pal/Saved/Config/WindowsServer/PalWorldSettings.ini`
- Linux: `steamapps/common/PalServer/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini`

加载和复制按钮与你的 pastebin 通信，请在点击加载按钮之前复制你的服务器设置，
复制按钮将为你复制输出设置。

### WorldOption.sav

`WorldOption.sav` 文件位于：

- Windows & Linux: `steamapps/common/PalServer/Pal/Saved/SaveGames/0/.../WorldOption.sav`

在服务器中默认不创建此文件，你可以创建一个本地世界并上传，或者在网站上编辑并下载到该目录。

### 将 PalWorldSettings.ini 转换为 WorldOption.sav

你可以在不丢失任何数据的情况下简单地切换模式！所以你可以简单地：

1. 在 `PalWorldSettings.ini` 模式下粘贴你的 `PalWorldSettings.ini` 设置
2. 切换到 `WorldOption.sav` 模式
3. 下载并将 `WorldOption.sav` 放置到正确的文件夹

## 开发

`pnpm i` 和 `pnpm run dev`

## 本地化

欢迎将 [src/assets/i18n](/src/assets/i18n) 中的 `en_US.json` 翻译成你的语言，并提出 PR！

## 致谢

- 加载/保存 `.sav` 文件的 `uesave-wasm` 部分移植自 https://github.com/iebb/PalworldSaveEditor/tree/master/rust/uesave-wasm
- 处理 wasm 的 vite 插件，效果不错 https://github.com/Menci/vite-plugin-wasm/

## 捐赠

不需要捐赠，但如果你能为这个项目点一个免费的赞，我会很感激！！

<img width="662" alt="image" src="https://github.com/Bluefissure/pal-conf/assets/9719003/906de048-99cc-4448-bf21-93440ac0c1f1">
