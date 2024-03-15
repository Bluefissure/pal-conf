<h1 align="center">
  <br>
    팰월드 서버 설정 생성기
  <br>
</h1>
<p align="center">
   • <a href="/README.md">English</a>
   • <a href="/docs/README_zh_CN.md">简体中文</a>
   • <a href="/docs/README_ko_KR.md">한국어</a>
   • <a href="/docs/README_es_ES.md">Español</a>
</p>

[팰월드](https://store.steampowered.com/app/1623730/Palworld/) [서버설정](https://tech.palworldgame.com/optimize-game-balance)을 편리하게 관리해줍니다.

## 사용법

'World Option.sav' 및 'PalWorld Settings.ini' 설정은 모두 지원됩니다:

- PalWorld Settings.ini의 일부 항목이 적용되지 않습니다('BaseCampWorkerMaxNum' 등).
- 두 파일이 모두 존재할 경우 World Option.sav가 PalWorld Settings.ini보다 우선합니다.

### PalWorldSettings.ini

'PalWorldSettings.ini' 파일은 다음 위치에 있습니다:

- Windows: `steamapps/common/PalServer/Pal/Saved/Config/WindowsServer/PalWorldSettings.ini`
- Linux: `steamapps/common/PalServer/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini`

로드 및 복사 버튼은 클립보드와 연결되어 있습니다. 로드 버튼을 클릭하기 전에 서버 설정을 복사하십시오,
복사 버튼이 출력 설정을 복사합니다.

### WorldOption.sav

'World Option.sav' 파일은 다음 위치에 있습니다:

- Windows & Linux: `steamapps/common/PalServer/Pal/Saved/SaveGames/0/.../WorldOption.sav`

전용 서버에서 기본적으로 생성되지 않고 로컬 월드를 만들어 업로드하거나 웹 사이트에서 편집하여 디렉토리에 다운로드할 수 있습니다.

### PalWorld Settings.ini를 World Option.sav로 변경

데이터를 잃지 않고 모드를 간단히 전환할 수 있습니다! 따라서 다음과 같이 간단하게 전환할 수 있습니다:

1. 'PalWorldSettings.ini' 모드에서 'PalWorldSettings.ini' 설정 붙여넣기
2. 'World Option.sav' 모드로 전환
3. 'World Option.sav'를 다운로드하여 올바른 폴더에 배치합니다

## Develop

`pnpm i` and `pnpm run dev`

## Deploy

`pnpm build` and deploy the files in `dist` folder to any webserver.

## 번역

[![inlang status badge](https://badge.inlang.com/?url=github.com/Bluefissure/pal-conf)](https://fink.inlang.com/github.com/Bluefissure/pal-conf?ref=badge)

여러분은 [fink editor](https://fink.inlang.com/github.com/Bluefissure/pal-conf)를 통해 문장 번역을 업데이트 하거나 새로 추가할 수 있습니다.

자유롭게 `en-US.json` in [src/assets/i18n](/src/assets/i18n)파일을 참조하여 여러분 국가 언어를 추가하여 PR(Pull-Request)를 생성하세요.

`?lng=<langCode>`(such as `?lng=zh_CN` or `?lng=ko_KR`)과 같이 주소끝에 언어코드를 삽입하여 기본값으로 언어가 출력되도록 할 수 도 있습니다.

## Acknowledgement

- The `uesave-wasm` part to load/save `.sav` file is ported from https://github.com/iebb/PalworldSaveEditor/tree/master/rust/
- The vite plugin that handles wasm well enough at https://github.com/Menci/vite-plugin-wasm/

## Sponsor

Not necessary, but I'll appreciate it if you can star this project!!
<img width="662" alt="image" src="https://github.com/Bluefissure/pal-conf/assets/9719003/906de048-99cc-4448-bf21-93440ac0c1f1">
