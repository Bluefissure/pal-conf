import { Buffer } from "buffer";
import * as LosslessJSON from "lossless-json";
import { describe, expect, it } from "vitest";

import { DEFAULT_WORLDOPTION_SAV } from "@/consts/worldoption";
import { Gvas } from "@/types/gvas";

import { serialize } from "./uesave/uesave_wasm.js";
import {
  analyzeSave,
  compressSave,
  createSave,
  decompressSave,
  SAVE_FORMAT,
} from "./save";

const cloneDefaultGvas = () =>
  LosslessJSON.parse(LosslessJSON.stringify(DEFAULT_WORLDOPTION_SAV.gvas)!) as Gvas;

const getSettings = (gvas: Gvas) =>
  gvas.root.properties.OptionWorldData.Struct.value.Struct.Settings.Struct.value.Struct;

describe("Palworld save compression", () => {
  it("writes PlM1 saves that round-trip GVAS and world settings", () => {
    const gvas = cloneDefaultGvas();
    const settings = getSettings(gvas);
    settings.DayTimeSpeedRate = { Float: { value: 5 } };
    settings.NightTimeSpeedRate = { Float: { value: 5 } };
    settings.PalSpawnNumRate = { Float: { value: 3 } };
    settings.EnemyDropItemRate = { Float: { value: 2 } };

    const save = createSave(gvas);
    expect(save.subarray(8, 12).toString("ascii")).toBe(SAVE_FORMAT.PLM1);

    const decompressed = decompressSave(save);
    const expectedGvas = serialize(LosslessJSON.stringify(gvas)!);
    expect(Buffer.from(decompressed.data)).toEqual(Buffer.from(expectedGvas));

    const decodedSettings = getSettings(analyzeSave(save).gvas);
    expect(Number(decodedSettings.DayTimeSpeedRate.Float.value)).toBe(5);
    expect(Number(decodedSettings.NightTimeSpeedRate.Float.value)).toBe(5);
    expect(Number(decodedSettings.PalSpawnNumRate.Float.value)).toBe(3);
    expect(Number(decodedSettings.EnemyDropItemRate.Float.value)).toBe(2);
  });

  it("keeps PlZ1 imports compatible", () => {
    const gvas = cloneDefaultGvas();
    const save = createSave(gvas, SAVE_FORMAT.PLZ1);

    expect(save.subarray(8, 12).toString("ascii")).toBe(SAVE_FORMAT.PLZ1);
    expect(analyzeSave(save).format).toBe(SAVE_FORMAT.PLZ1);
  });

  it("encodes multiple Oodle stored blocks", () => {
    const input = Uint8Array.from(
      { length: 0x40000 + 17 },
      (_, index) => (index * 31) & 0xff,
    );
    const save = compressSave(input);

    expect(save[12]).toBe(0xcc);
    expect(save[13]).toBe(12);
    expect(save[12 + 2 + 0x40000]).toBe(0x4c);
    expect(save[12 + 2 + 0x40000 + 1]).toBe(12);
    expect(Buffer.from(decompressSave(save).data)).toEqual(Buffer.from(input));
  });
});
