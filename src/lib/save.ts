import { saveAs } from "file-saver";
import * as LosslessJSON from 'lossless-json'
import pako from "pako";
import {deserialize, serialize} from "./uesave";
import { Serializer } from "./serializer";
import { Buffer } from "buffer";

export const analyzeFile = async (file: File) => {
  return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const serial = new Serializer(Buffer.from(reader.result as ArrayBuffer));

            try {
                const lenDecompressed = serial.readInt32();
                const lenCompressed = serial.readInt32();
                const magic = serial.readInt32();
                const decompressedBuffer = serial.read(lenCompressed);
                let decompressed = new Uint8Array(decompressedBuffer);
                const leadingByte = (magic & 0xff000000) >> 24;
                if (leadingByte == 0x32) {
                    decompressed = pako.inflate(decompressed);
                    decompressed = pako.inflate(decompressed);
                } else if (leadingByte == 0x31) {
                    decompressed = pako.inflate(decompressed);
                }
                // saveAs(new Blob([decompressed], {type: "application/binary"}), "chunk0");
                const typeMap = new Map();
                typeMap.set(
                    ".worldSaveData.CharacterSaveParameterMap.Key", "Struct"
                );
                typeMap.set(
                    ".worldSaveData.FoliageGridSaveDataMap.Key", "Struct",
                );
                typeMap.set(
                    ".worldSaveData.FoliageGridSaveDataMap.ModelMap.InstanceDataMap.Key", "Struct",
                );
                typeMap.set(
                    ".worldSaveData.MapObjectSpawnerInStageSaveData.Key", "Struct",
                );
                typeMap.set(
                    ".worldSaveData.ItemContainerSaveData.Key", "Struct",
                );
                typeMap.set(
                    ".worldSaveData.CharacterContainerSaveData.Key", "Struct",
                );

                console.time("deserialize");
                const gvas = LosslessJSON.parse(deserialize(decompressed, typeMap));
                console.timeEnd("deserialize");

                resolve({
                    fileName: file.name,
                    lenDecompressed,
                    lenCompressed,
                    magic,
                    gvas
                });

            } catch (e) {
                console.error(e);
                alert("Is it really a Palworld Save?");
            }
        };
        reader.readAsArrayBuffer(file);
  });
}


export const writeFile = ({ magic, gvas } : {
    magic: number,
    gvas: unknown
}, filename = "save.sav") => {
  try {
    let serialized = serialize(LosslessJSON.stringify(gvas) ?? '');
    const lenDecompressed = serialized.length;
    const leadingByte = (magic & 0xff000000) >> 24;
    if (leadingByte == 0x32) {
        serialized = pako.deflate(serialized);
        serialized = pako.deflate(serialized);
    } else if (leadingByte == 0x31) {
        serialized = pako.deflate(serialized);
    }

    const lenCompressed = serialized.length;
    const buf = Buffer.alloc(4 + 4 + 4 + lenCompressed);

    buf.writeInt32LE(lenDecompressed);
    buf.writeInt32LE(lenCompressed, 4);
    buf.writeInt32LE(magic, 8);
    buf.set(serialized, 12);
    saveAs(new Blob([buf], {type: "application/binary"}), filename);
  } catch (e) {
    alert("Serialization failed. Have you accidentally removed something?");
  }

}