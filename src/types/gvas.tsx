import { DEFAULT_WORLDOPTION_SAV } from "../consts/worldoption";
// import { OptionalDict } from "./optionalDict";

export type Gvas = typeof DEFAULT_WORLDOPTION_SAV.gvas;
export type WorldOption = typeof DEFAULT_WORLDOPTION_SAV.gvas.root.properties.OptionWorldData.Struct.value.Struct.Settings.Struct.value.Struct;
export type WorldOptionEntry = WorldOption[keyof WorldOption];