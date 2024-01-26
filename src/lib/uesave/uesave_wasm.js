import * as wasm from "./uesave_wasm_bg.wasm";
import { __wbg_set_wasm } from "./uesave_wasm_bg.js";
__wbg_set_wasm(wasm);
export * from "./uesave_wasm_bg.js";
