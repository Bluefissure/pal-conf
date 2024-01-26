# Palworld Server Configuration Generator

## Use

`WorldOption.sav` will take precedence over `PalWorldSettings.ini` if both files exist.

### PalWorldSettings.ini

The `PalWorldSettings.ini` file is located in:

- Windows: `steamapps/common/PalServer/Pal/Saved/Config/WindowsServer/PalWorldSettings.ini`
- Linux: `steamapps/common/PalServer/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini`

Use copy & paste to load & save them, but some of the entries may not work (such as `BaseCampWorkerMaxNum`).

### WorldOption.sav

The `WorldOption.sav` file is located in:

- Windows & Linux: `steamapps/common/PalServer/Pal/Saved/SaveGames/0/.../WorldOption.sav`

You can create a local world and upload, or you can edit in the website and download it into the directory.



## Develop

`pnpm i` and `pnpm run dev`

## Localization

Feel free to translate the `en_US.json` in [src/assets/i18n](https://github.com/Bluefissure/pal-conf/tree/main/src/assets/i18n) into your language and make a PR!

## Acknowledgement

- The `uesave-wasm` part to load/save `.sav` file is ported from https://github.com/iebb/PalworldSaveEditor/tree/master/rust/uesave-wasm
- The vite plugin that handles wasm well enough at https://github.com/Menci/vite-plugin-wasm/
