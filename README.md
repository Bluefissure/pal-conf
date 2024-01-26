<h1 align="center">
  <br>
    Palworld Server Configuration Generator
  <br>
</h1>
<p align="center">
   • <a href="/README.md">English</a>
   • <a href="/docs/README_zh_CN.md">简体中文</a>
</p>

Manage you [Palworld](https://store.steampowered.com/app/1623730/Palworld/) server settings in a friendly way!

## Use

Both `WorldOption.sav` and `PalWorldSettings.ini` settings are supported:

- Some entries in `PalWorldSettings.ini` don't work (such as `BaseCampWorkerMaxNum`).
- `WorldOption.sav` will take precedence over `PalWorldSettings.ini` if both files exist.

### PalWorldSettings.ini

The `PalWorldSettings.ini` file is located in:

- Windows: `steamapps/common/PalServer/Pal/Saved/Config/WindowsServer/PalWorldSettings.ini`
- Linux: `steamapps/common/PalServer/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini`

The load & copy buttons communicate with your clipboard, please copy your server setings before click the load button,
and the copy button will copy the output settings for you.

### WorldOption.sav

The `WorldOption.sav` file is located in:

- Windows & Linux: `steamapps/common/PalServer/Pal/Saved/SaveGames/0/.../WorldOption.sav`

It's not created by default in dedicated servers, you can either create a local world and upload it, or just edit in the website and download it into the directory.

### Change PalWorldSettings.ini to WorldOption.sav

You can simply switch mode without losing any data! So you can simply:

1. Paste your `PalWorldSettings.ini` settings in `PalWorldSettings.ini` mode
2. Switch to `WorldOption.sav` mode
3. Download and place `WorldOption.sav` to the correct folder

## Develop

`pnpm i` and `pnpm run dev`

## Localization

Feel free to translate the `en_US.json` in [src/assets/i18n](/src/assets/i18n) into your language and make a PR!

## Acknowledgement

- The `uesave-wasm` part to load/save `.sav` file is ported from https://github.com/iebb/PalworldSaveEditor/tree/master/rust/uesave-wasm
- The vite plugin that handles wasm well enough at https://github.com/Menci/vite-plugin-wasm/

## Donation

Not necessary, but I'll appreciate it if you can star this project!!
<img width="662" alt="image" src="https://github.com/Bluefissure/pal-conf/assets/9719003/906de048-99cc-4448-bf21-93440ac0c1f1">

