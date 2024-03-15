<h1 align="center">
  <br>
    Generador de Configuración de Servidor Palworld
  <br>
</h1>
<p align="center">
   • <a href="/README.md">Inglés</a>
   • <a href="/docs/README_zh_CN.md">简体中文</a>
   • <a href="/docs/README_ko_KR.md">한국어</a>
   • <a href="/docs/README_es_ES.md">Español</a>
</p>

¡Gestiona tus [ajustes del servidor](https://tech.palworldgame.com/optimize-game-balance) de [Palworld](https://store.steampowered.com/app/1623730/Palworld/) de manera amigable!

## Uso

Se admiten tanto los ajustes de `WorldOption.sav` como los de `PalWorldSettings.ini`:

- Algunas entradas en `PalWorldSettings.ini` no funcionan (como `BaseCampWorkerMaxNum`).
- `WorldOption.sav` tendrá prioridad sobre `PalWorldSettings.ini` si ambos archivos existen.

### PalWorldSettings.ini

El archivo `PalWorldSettings.ini` se encuentra en:

- Windows: `steamapps/common/PalServer/Pal/Saved/Config/WindowsServer/PalWorldSettings.ini`
- Linux: `steamapps/common/PalServer/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini`

Los botones de carga y copia se comunican con tu portapapeles, por favor copia tus ajustes del servidor antes de hacer clic en el botón de carga,
y el botón de copia copiará los ajustes de salida para ti.

### WorldOption.sav

El archivo `WorldOption.sav` se encuentra en:

- Windows y Linux: `steamapps/common/PalServer/Pal/Saved/SaveGames/0/.../WorldOption.sav`

No se crea por defecto en servidores dedicados, puedes crear un mundo local y subirlo, o simplemente editarlo en el sitio web y descargarlo en el directorio.

### Cambiar de PalWorldSettings.ini a WorldOption.sav

¡Puedes cambiar de modo sin perder ningún dato! Por lo tanto, simplemente puedes:

1. Pegar tus ajustes de `PalWorldSettings.ini` en el modo de `PalWorldSettings.ini`
2. Cambiar al modo de `WorldOption.sav`
3. Descargar y colocar `WorldOption.sav` en la carpeta correcta

## Desarrollo

`pnpm i` y `pnpm run dev`

## Despliegue

`pnpm build` y despliega los archivos en la carpeta `dist` en cualquier servidor web.

## Localización

[![Inlang estado del distintivo](https://badge.inlang.com/?url=github.com/Bluefissure/pal-conf)](https://fink.inlang.com/github.com/Bluefissure/pal-conf?ref=badge)

Puedes usar el editor sin código [fink](https://fink.inlang.com/github.com/Bluefissure/pal-conf) para actualizar traducciones o añadir idiomas.

¡Siéntete libre de traducir el `en-US.json` en [src/assets/i18n](/src/assets/i18n) a tu idioma y hacer un PR!

Puedes añadir `?lng=<códigoDeIdioma>` (como `?lng=zh_CN` o `?lng=ja_JP`) al final de la URL del sitio y se cargará el idioma por defecto.

## Agradecimientos

- La parte de `uesave-wasm` para cargar/guardar archivos `.sav` está adaptada de https://github.com/iebb/PalworldSaveEditor/tree/master/rust/
- El plugin vite que maneja lo suficientemente bien el wasm en https://github.com/Menci/vite-plugin-wasm/

## Patrocinador

¡No es necesario, pero lo agradeceré si puedes marcar este proyecto con una estrella!
<img width="662" alt="imagen" src="https://github.com/Bluefissure/pal-conf/assets/9719003/906de048-99cc-4448-bf21-93440ac0c1f1">
