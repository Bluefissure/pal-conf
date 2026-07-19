import { Buffer } from "buffer";
import { saveAs } from "file-saver";
import * as LosslessJSON from "lossless-json";
import { decompress as decompressOodle } from "ooz-wasm";
import pako from "pako";

import { Gvas } from "@/types/gvas";

import { deserialize, serialize } from "./uesave/uesave_wasm.js";

const SAVE_HEADER_SIZE = 12;
const OODLE_BLOCK_SIZE = 0x40000;
const OODLE_LEVIATHAN_DECODER_TYPE = 12;

export const SAVE_FORMAT = {
  PLZ1: "PlZ1",
  PLZ2: "PlZ2",
  PLM1: "PlM1",
} as const;

export type SaveFormat = (typeof SAVE_FORMAT)[keyof typeof SAVE_FORMAT];

export interface DecompressedSave {
  lenDecompressed: number;
  lenCompressed: number;
  magic: number;
  format: SaveFormat;
  data: Uint8Array;
}

export interface AnalyzedFile extends Omit<DecompressedSave, "data"> {
  fileName: string;
  gvas: Gvas;
}

const isSaveFormat = (value: string): value is SaveFormat =>
  Object.values(SAVE_FORMAT).some((format) => format === value);

const createTypeMap = () => {
  const typeMap = new Map<string, string>();
  typeMap.set(".worldSaveData.CharacterSaveParameterMap.Key", "Struct");
  typeMap.set(".worldSaveData.FoliageGridSaveDataMap.Key", "Struct");
  typeMap.set(".worldSaveData.FoliageGridSaveDataMap.ModelMap.InstanceDataMap.Key", "Struct");
  typeMap.set(".worldSaveData.MapObjectSpawnerInStageSaveData.Key", "Struct");
  typeMap.set(".worldSaveData.ItemContainerSaveData.Key", "Struct");
  typeMap.set(".worldSaveData.CharacterContainerSaveData.Key", "Struct");
  return typeMap;
};

const encodeOodleStored = (data: Uint8Array) => {
  const blockCount = Math.ceil(data.length / OODLE_BLOCK_SIZE);
  const encoded = new Uint8Array(data.length + blockCount * 2);
  let sourceOffset = 0;
  let targetOffset = 0;

  while (sourceOffset < data.length) {
    const blockLength = Math.min(OODLE_BLOCK_SIZE, data.length - sourceOffset);
    const isFirstBlock = sourceOffset === 0;

    // Oodle block header: version 12, uncompressed, and restart on the first block.
    encoded[targetOffset++] = 0x4c | (isFirstBlock ? 0x80 : 0);
    encoded[targetOffset++] = OODLE_LEVIATHAN_DECODER_TYPE;
    encoded.set(data.subarray(sourceOffset, sourceOffset + blockLength), targetOffset);

    sourceOffset += blockLength;
    targetOffset += blockLength;
  }

  return encoded;
};

export const decompressSave = (input: Uint8Array): DecompressedSave => {
  const save = Buffer.from(input);
  if (save.length < SAVE_HEADER_SIZE) {
    throw new Error("Save file is smaller than its header");
  }

  const lenDecompressed = save.readUInt32LE(0);
  const lenCompressed = save.readUInt32LE(4);
  const magic = save.readInt32LE(8);
  const formatText = save.subarray(8, 12).toString("ascii");
  if (!isSaveFormat(formatText)) {
    throw new Error(`Unsupported save format: ${JSON.stringify(formatText)}`);
  }

  const payload = save.subarray(SAVE_HEADER_SIZE);
  let data: Uint8Array;

  if (formatText === SAVE_FORMAT.PLM1) {
    if (lenCompressed !== payload.length) {
      throw new Error(`Incorrect compressed length: expected ${lenCompressed}, got ${payload.length}`);
    }
    data = decompressOodle(payload, lenDecompressed);
  } else if (formatText === SAVE_FORMAT.PLZ2) {
    const innerCompressed = pako.inflate(payload);
    if (lenCompressed !== innerCompressed.length) {
      throw new Error(`Incorrect inner compressed length: expected ${lenCompressed}, got ${innerCompressed.length}`);
    }
    data = pako.inflate(innerCompressed);
  } else {
    if (lenCompressed !== payload.length) {
      throw new Error(`Incorrect compressed length: expected ${lenCompressed}, got ${payload.length}`);
    }
    data = pako.inflate(payload);
  }

  if (lenDecompressed !== data.length) {
    throw new Error(`Incorrect decompressed length: expected ${lenDecompressed}, got ${data.length}`);
  }

  return {
    lenDecompressed,
    lenCompressed,
    magic,
    format: formatText,
    data,
  };
};

export const compressSave = (
  input: Uint8Array,
  format: SaveFormat = SAVE_FORMAT.PLM1,
) => {
  let payload: Uint8Array;
  let lenCompressed: number;

  if (format === SAVE_FORMAT.PLM1) {
    payload = encodeOodleStored(input);
    lenCompressed = payload.length;
  } else if (format === SAVE_FORMAT.PLZ2) {
    const innerCompressed = pako.deflate(input);
    lenCompressed = innerCompressed.length;
    payload = pako.deflate(innerCompressed);
  } else {
    payload = pako.deflate(input);
    lenCompressed = payload.length;
  }

  const result = Buffer.alloc(SAVE_HEADER_SIZE + payload.length);
  result.writeUInt32LE(input.length, 0);
  result.writeUInt32LE(lenCompressed, 4);
  result.write(format, 8, 4, "ascii");
  result.set(payload, SAVE_HEADER_SIZE);
  return result;
};

export const analyzeSave = (input: Uint8Array) => {
  const decompressed = decompressSave(input);
  const dataStr = deserialize(decompressed.data, createTypeMap());
  const gvas = LosslessJSON.parse(dataStr) as Gvas;

  return {
    ...decompressed,
    gvas,
  };
};

export const analyzeFile = async (
  file: File,
  onLoadError?: (e: unknown) => void,
): Promise<AnalyzedFile> => {
  try {
    const result = analyzeSave(new Uint8Array(await file.arrayBuffer()));
    return {
      fileName: file.name,
      lenDecompressed: result.lenDecompressed,
      lenCompressed: result.lenCompressed,
      magic: result.magic,
      format: result.format,
      gvas: result.gvas,
    };
  } catch (e) {
    console.error(e);
    onLoadError?.(e);
    throw e;
  }
};

export const createSave = (
  gvas: Gvas,
  format: SaveFormat = SAVE_FORMAT.PLM1,
) => {
  const jsonToSerialize = LosslessJSON.stringify(gvas) ?? "{}";
  return compressSave(serialize(jsonToSerialize), format);
};

export const writeFile = (
  {
    format = SAVE_FORMAT.PLM1,
    gvas,
  }: {
    format?: SaveFormat;
    gvas: Gvas;
  },
  filename = "save.sav",
  onWriteSuccess?: () => void,
  onWriteError?: (e: unknown) => void,
) => {
  try {
    const save = createSave(gvas, format);
    saveAs(new Blob([save], { type: "application/binary" }), filename);
    onWriteSuccess?.();
  } catch (e) {
    console.error(e);
    onWriteError?.(e);
  }
};
