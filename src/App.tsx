import "./App.css";

import { useState, useEffect, useRef, useCallback } from "react";

// i18n
import i18n, { I18nStr } from "./i18n";
import { useTranslation, Trans } from "react-i18next";

// UI Components
import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
// UI Icons
import { Languages, AlertCircle, FileUp } from "lucide-react";
import ReactCountryFlag from "react-country-flag";

// App Components
import { TextInput } from "./components/textInput";
import { DeathPenaltyDropDown } from "./components/deathPenaltyDropdown";
import { SliderInput } from "./components/sliderInput";
import { SwitchInput } from "./components/switchInput";
import { Input } from "./components/ui/input";

// lib & utils
import * as LosslessJSON from "lossless-json";
import { analyzeFile, writeFile } from "./lib/save";

// Constants
import { ENTRIES } from "./consts/entries";
import { DEFAULT_WORLDOPTION, VALID_WORLDOPTION_KEYS } from "./consts/worldoption";
import { AdvancedSettings, InGameSettings, ServerSettings } from "./consts/settings";

// Types
import { Gvas } from "./types/gvas";
import { DeathPenaltyLabel } from "./components/deathPenaltyDropdown";

interface ChangeEvent<T> {
  target: {
    value: T;
  };
}

enum FileMode {
  INI = "ini",
  SAV = "sav",
}

enum SettingCategory {
  ServerSettings = "server-settings",
  InGameSettings = "ingame-settings",
  AdvancedSettings = "advanced-settings",
}

function App() {
  const { t } = useTranslation();
  const [locale, setLocale] = useState(i18n.language === "en" ? "en_US" : i18n.language);
  const [entries, setEntries] = useState({} as Record<string, string>);
  const [fileMode, setFileMode] = useState<FileMode>(FileMode.INI);
  const [openedAccordion, setOpenedAccordion] = useState(SettingCategory.ServerSettings);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tabRef.current && tabRef.current.getBoundingClientRect().top < 0) {
      tabRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [openedAccordion]);

  const onStateChanged = (id: string) => (e: ChangeEvent<string>) => {
    setEntries((prevEntries) => ({ ...prevEntries, [id]: `${e.target.value}` }));
  };

  const serializeEntriesToIni = () => {
    const resultList: string[] = [];
    Object.values(ENTRIES).forEach((entry) => {
      const entryValue = entries[entry.id] ?? entry.defaultValue;
      switch (entry.type) {
        case "select":
        case "boolean":
        case "integer":
          resultList.push(`${entry.id}=${entryValue}`);
          break;
        case "float":
          resultList.push(`${entry.id}=${Number(entryValue).toFixed(6)}`);
          break;
        case "string":
          resultList.push(`${entry.id}=${JSON.stringify(entryValue)}`);
          break;
        default:
          resultList.push("");
      }
    });
    return resultList.join(",");
  };

  const deserializeEntriesFromIni = (settingsText: string) => {
    if (!settingsText) {
      toast.error(t(I18nStr.toast.invalid), { description: t(I18nStr.toast.invalidDescription) });
      return;
    }
    const settingsTextList = settingsText.trim().split("\n");
    let loadedEntriesNum = 0;
    let erroredLinesNum = 0;
    settingsTextList.forEach((line) => {
      if (line.startsWith("OptionSettings=(") && line.endsWith(")")) {
        const optionSettings = line.substring("OptionSettings=(".length, line.length - 1);
        const optionSettingsList: string[] = [];
        let start = 0;
        let end = 0;
        let quotation = false;
        for (const char of optionSettings) {
          if (char === '"') {
            quotation = !quotation;
          }
          end++;
          if (char === "," && false === quotation) {
            optionSettingsList.push(optionSettings.substring(start, end - 1));
            start = end;
          }
        }
        // the last one
        optionSettingsList.push(optionSettings.substring(start, end));
        const newEntries = { ...entries };
        optionSettingsList.forEach((optionSetting) => {
          // console.log(optionSetting)
          const equalSignIndex = optionSetting.indexOf("=");
          const optionSettingName = optionSetting.slice(0, equalSignIndex);
          let optionSettingValue = optionSetting.slice(equalSignIndex + 1);
          const entry = ENTRIES[optionSettingName];
          if (entry) {
            if (entry.type === "string" && optionSettingValue.startsWith('"') && optionSettingValue.endsWith('"')) {
              optionSettingValue = optionSettingValue.substring(1, optionSettingValue.length - 1);
            }
            if (entry.type === "float" || entry.type === "integer") {
              const optionSettingValueNum = Number(optionSettingValue);
              if (!Number.isFinite(optionSettingValueNum)) {
                console.error(`${entry.id} has an invalid number: ${optionSettingValue}`);
                return;
              }
            }
            if (entry.type === "boolean") {
              optionSettingValue = optionSettingValue.toLowerCase() === "true" ? "True" : "False";
            }
            newEntries[entry.id] = optionSettingValue;
            loadedEntriesNum++;
          }
        });
        // console.log(newEntries);
        setEntries(newEntries);
      } else if (line.trim().startsWith(";") || line.trim() === "" || line.trim() === "[/Script/Pal.PalGameWorldSettings]") {
        // skip
      } else {
        erroredLinesNum++;
      }
    });
    if (loadedEntriesNum === 0 || erroredLinesNum > 0) {
      toast.error(t(I18nStr.toast.invalid), {
        description: t(I18nStr.toast.invalidDescription),
      });
      return;
    } else if (loadedEntriesNum < Object.keys(ENTRIES).length) {
      toast.warning(t(I18nStr.toast.missing), {
        description: t(I18nStr.toast.missingDescription),
      });
      return;
    } else {
      toast.success(t(I18nStr.toast.loaded), {
        description: t(I18nStr.toast.loadedDescription),
      });
      return;
    }
  };

  const serializeEntriesToGvasJson = () => {
    const gvasJson: Record<string, unknown> = {};
    Object.values(ENTRIES).forEach((entry) => {
      const entryValue = entries[entry.id] ?? entry.defaultValue;
      let dictValue = {};
      if (!(entry.id in DEFAULT_WORLDOPTION.gvas.root.properties.OptionWorldData.Struct.value.Struct.Settings.Struct.value.Struct)) {
        return;
      }
      if (entryValue === entry.defaultValue) {
        return;
      }
      if (entry.type === "select") {
        if (entry.id === "DeathPenalty") {
          dictValue = {
            Enum: {
              value: `EPalOptionWorldDeathPenalty::${entryValue}`,
              enum_type: "EPalOptionWorldDeathPenalty",
            },
          };
        } else if (entry.id === "Difficulty") {
          dictValue = {
            Enum: {
              value: `EPalOptionWorldDifficulty::Custom`,
              enum_type: "EPalOptionWorldDifficulty",
            },
          };
        }
      } else if (entry.type === "boolean") {
        dictValue = {
          Bool: {
            value: entryValue === "True",
          },
        };
      } else if (entry.type === "integer") {
        if (Number(entryValue) === Number(entry.defaultValue)) {
          return;
        }
        dictValue = {
          Int: {
            value: Number(entryValue),
          },
        };
      } else if (entry.type === "float") {
        if (Number(entryValue) === Number(entry.defaultValue)) {
          return;
        }
        dictValue = {
          Float: {
            value: Number(entryValue),
          },
        };
      } else if (entry.type === "string") {
        dictValue = {
          Str: {
            value: entryValue,
          },
        };
      }
      gvasJson[entry.id] = dictValue;
    });
    return gvasJson;
  };

  const deserializeEntriesFromGvasJson = (gvas: Gvas) => {
    if (!gvas) {
      toast.error(t(I18nStr.toast.invalidFile), {
        description: t(I18nStr.toast.invalidFileDescription),
      });
      return;
    }
    const gvasJson: Record<string, unknown> = gvas.root.properties.OptionWorldData.Struct.value.Struct.Settings.Struct.value.Struct;
    const newEntries = { ...entries };
    Object.entries(gvasJson).forEach(([key, value]) => {
      if (key in ENTRIES) {
        const entry = ENTRIES[key];
        const valueRecord = value as Record<string, { value: string }>;
        let entryValue: number | boolean | string | undefined = undefined;
        if ("Enum" in valueRecord) {
          entryValue = valueRecord.Enum.value.split("::")[1];
        } else if ("Int" in valueRecord || "Float" in valueRecord) {
          entryValue = valueRecord.Int?.value ?? valueRecord.Float?.value;
        } else if ("Bool" in valueRecord) {
          entryValue = valueRecord.Bool.value ? "True" : "False";
        } else if ("Str" in valueRecord) {
          entryValue = valueRecord.Str.value;
        }
        newEntries[entry.id] = entryValue?.toString() ?? entry.defaultValue;
      }
    });
    setEntries(newEntries);
  };

  const openFile = async (f: File) => {
    const result = await analyzeFile(f, (e) => {
      console.error(e);
      toast.error(t(I18nStr.toast.invalidFile), {
        description: t(I18nStr.toast.invalidFileDescription),
      });
    }).catch((e) => {
      console.error(e);
    });
    if (!result) {
      return;
    }
    // console.log(result);
    // console.log('magic: ' + result.magic);
    const gvas: Gvas = result.gvas ?? DEFAULT_WORLDOPTION.gvas;
    toast.success(t(I18nStr.toast.savFileLoaded), {
      description: t(I18nStr.toast.savFileLoadedDescription),
    });
    deserializeEntriesFromGvasJson(gvas);
  };

  const saveFile = () => {
    const gvasToSave: Gvas = LosslessJSON.parse(LosslessJSON.stringify(DEFAULT_WORLDOPTION.gvas)!) as Gvas;
    gvasToSave.root.properties.OptionWorldData.Struct.value.Struct.Settings.Struct.value.Struct = serializeEntriesToGvasJson();
    writeFile(
      {
        magic: 828009552,
        gvas: gvasToSave,
      },
      "WorldOption.sav",
      () => {
        toast.success(t(I18nStr.toast.saved), {
          description: t(I18nStr.toast.savedDescription),
        });
      },
      (e) => {
        console.error(e);
        toast.error(t(I18nStr.toast.saveFailed), {
          description: t(I18nStr.toast.saveFailedDescription),
        });
      }
    );
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error(t(I18nStr.toast.invalidFile), {
        description: t(I18nStr.toast.invalidFileDescription),
      });
      return;
    }

    if (file.size > 102400) {
      toast.error(t(I18nStr.toast.fileTooLarge), {
        description: t(I18nStr.toast.fileTooLargeDescription),
      });
      return;
    }

    // if (file.name !== 'WorldOption.sav') {
    //     toast.error(t('toast.invalidFileName'), {
    //         description: t('toast.invalidFileNameDescription'),
    //     })
    //     return;
    // }
    if (file.name.endsWith(".ini")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result) {
          toast.error(t(I18nStr.toast.invalidFile), {
            description: t(I18nStr.toast.invalidFileDescription),
          });
          return;
        }
        deserializeEntriesFromIni(e.target.result as string);
      };
      reader.readAsText(file);
      setFileMode(FileMode.INI);
      return;
    }
    openFile(file)
      .then(() => {
        // console.log("File opened");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
          setFileMode(FileMode.SAV);
        }
      })
      .catch((e) => {
        console.error(e);
        toast.error(t(I18nStr.toast.invalidFile), {
          description: t(I18nStr.toast.invalidFileDescription),
        });
      });
  };

  const genInput = (id: string, disabled = false) => {
    const entry = ENTRIES[id];
    if (!entry) {
      return null;
    }
    const entryName = t(`entry.name.${entry.id}`);
    const entryValue = entries[entry.id] ?? entry.defaultValue;
    if (entry.id === "DeathPenalty") {
      return (
        <DeathPenaltyDropDown
          key={id}
          label={entryValue as DeathPenaltyLabel}
          onLabelChange={(labelName: string) => {
            onStateChanged("DeathPenalty")({
              target: { value: labelName },
            });
          }}
        />
      );
    }
    if ((entry.type === "integer" || entry.type === "float") && entry.range) {
      const minValue = Number(entry.range[0]);
      const maxValue = Number(entry.range[1]);
      const step = entry.type === "integer" ? 1 : 0.000001;
      return (
        <SliderInput
          name={entryName}
          id={id}
          key={id}
          value={Number(entryValue)}
          defaultValue={Number(entry.defaultValue)}
          minValue={minValue}
          maxValue={maxValue}
          step={step}
          onValueChange={(values) => {
            onStateChanged(id)({
              target: { value: `${values[0]}` },
            });
          }}
          type={entry.type}
          disabled={disabled}
          difficultyType={entry.difficultyType}
        />
      );
    }
    if (entry.type === "boolean") {
      return (
        <SwitchInput
          name={entryName}
          id={id}
          key={id}
          checked={entryValue === "True"}
          onCheckedChange={(e) => {
            // console.log(e);
            onStateChanged(id)({
              target: { value: e ? "True" : "False" },
            });
          }}
          disabled={disabled}
        />
      );
    }
    return (
      <TextInput
        name={entryName}
        id={id}
        key={id}
        value={entryValue}
        onChange={onStateChanged(id)}
        disabled={disabled}
        multiline={entry.id === "ServerDescription"}
        {...(entry.type === "integer" ? { type: "number" } : {})}
      />
    );
  };

  const isEntryValid = useCallback((entryKey: string) => fileMode === FileMode.INI || VALID_WORLDOPTION_KEYS.indexOf(entryKey) >= 0, [fileMode]);

  const serverSettings = ServerSettings.map((k) => genInput(k, !isEntryValid(k)));

  const inGameSettings = InGameSettings.map((k) => genInput(k, !isEntryValid(k)));

  const advancedSettings = AdvancedSettings.map((k) => genInput(k, !isEntryValid(k)));

  const settingsText =
    fileMode === FileMode.INI
      ? `[/Script/Pal.PalGameWorldSettings]\nOptionSettings=(${serializeEntriesToIni()})`
      : LosslessJSON.stringify(serializeEntriesToGvasJson(), null, 4) ?? "";

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(settingsText)
      .then(() => toast.success(t(I18nStr.toast.copied), { description: t(I18nStr.toast.copiedDescription) }))
      .catch(() => toast.error(t(I18nStr.toast.copyFailed), { description: t(I18nStr.toast.copyFailedDescription) }));
  };

  const readFromClipboard = () => {
    navigator.clipboard
      .readText()
      .then((e) => deserializeEntriesFromIni(e))
      .catch(() =>
        toast.error(t(I18nStr.toast.loadFailed), {
          description: t(I18nStr.toast.loadFailedDescription),
        })
      );
  };

  useEffect(() => {
    document.title = t(I18nStr.title);
  }, [t]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // const code = e.which || e.keyCode;
      // const charCode = String.fromCharCode(code).toLowerCase();
      const charCode = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && charCode === "s") {
        e.preventDefault();
        saveFile();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <main
        className="flex flex-col items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4"
        onDragOver={(e) => {
          e.preventDefault();
          setShowUploadPrompt(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setShowUploadPrompt(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setShowUploadPrompt(false);
          if (fileInputRef.current) {
            fileInputRef.current.files = e.dataTransfer.files;
            fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }}
      >
        {showUploadPrompt && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="text-white flex items-center justify-center">
              <FileUp className="mr-2" />
              <span className="text-lg">
                <Trans i18nKey={I18nStr.drag} />
              </span>
            </div>
          </div>
        )}

        <Toaster richColors />
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle className="flex">
              <div className="leading-10">
                <Trans i18nKey={I18nStr.title} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="ml-auto h-10" variant="secondary">
                    <Languages />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={locale}
                    onValueChange={(value) => {
                      i18n
                        .changeLanguage(value)
                        .then(() => {
                          // console.log("Language changed to " + value)
                        })
                        .catch((e) => {
                          console.error(e);
                        });
                      setLocale(value);
                    }}
                  >
                    <DropdownMenuRadioItem value="en_US">
                      <ReactCountryFlag countryCode="US" svg />
                      <div className="px-2"> English </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="zh_CN">
                      <ReactCountryFlag countryCode="CN" svg />
                      <div className="px-2"> 简体中文 </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="zh_TW">
                      <ReactCountryFlag countryCode="TW" svg />
                      <div className="px-2"> 繁體中文 </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="ja_JP">
                      <ReactCountryFlag countryCode="JP" svg />
                      <div className="px-2"> 日本語 </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="ko_KR">
                      <ReactCountryFlag countryCode="KR" svg />
                      <div className="px-2"> 한국인 </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="de_DE">
                      <ReactCountryFlag countryCode="DE" svg />
                      <div className="px-2"> Deutsch </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="pt_BR">
                      <ReactCountryFlag countryCode="BR" svg />
                      <div className="px-2"> Português </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="es_ES">
                      <ReactCountryFlag countryCode="ES" svg />
                      <div className="px-2"> Español </div>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
            <CardDescription>
              <Trans i18nKey={I18nStr.introduction} />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" ref={tabRef}>
            <Tabs value={openedAccordion} className="flex flex-col w-full min-h-10" onValueChange={(v) => setOpenedAccordion(v as SettingCategory)}>
              <TabsList className="sticky top-2 z-10 shadow-lg">
                <TabsTrigger className="w-[33%] whitespace-normal" value={SettingCategory.ServerSettings}>
                  <Trans i18nKey={I18nStr.serverSettings} />
                </TabsTrigger>
                <TabsTrigger className="w-[33%] whitespace-normal" value={SettingCategory.InGameSettings}>
                  <Trans i18nKey={I18nStr.ingameSettings} />
                </TabsTrigger>
                <TabsTrigger className="w-[33%] whitespace-normal" value={SettingCategory.AdvancedSettings}>
                  <Trans i18nKey={I18nStr.advancedSettings} />
                </TabsTrigger>
              </TabsList>
              <div className="mt-4 overflow-hidden">
                <TabsContent value={SettingCategory.ServerSettings} className="space-y-2">
                  {serverSettings}
                </TabsContent>
                <TabsContent value={SettingCategory.InGameSettings} className="space-y-2">
                  {inGameSettings}
                </TabsContent>
                <TabsContent value={SettingCategory.AdvancedSettings} className="space-y-2">
                  {advancedSettings}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
        <Card className="w-full max-w-3xl mt-8 sticky bottom-0 z-10 shadow-lg">
          <CardHeader>
            <Tabs value={fileMode} className="flex flex-col w-full min-h-10" onValueChange={(v) => setFileMode(v as FileMode)}>
              <TabsList>
                <TabsTrigger className="w-[50%]" value={FileMode.INI}>
                  PalWorldSettings.ini
                </TabsTrigger>
                <TabsTrigger className="w-[50%]" value={FileMode.SAV}>
                  WorldOption.sav
                </TabsTrigger>
              </TabsList>
              <Input className="hidden w-[50%]" id="file-upload" type="file" ref={fileInputRef} onChange={handleFileInput} />
              <div className="mt-4">
                <TabsContent value={FileMode.INI} className="flex justify-between items-center gap-4 mt-0">
                  <Button className="mr-auto" onClick={readFromClipboard}>
                    <Trans i18nKey={I18nStr.paste} />
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    <Trans i18nKey={I18nStr.dragAndDrop} />
                  </div>
                  <Button className="ml-auto" onClick={copyToClipboard}>
                    <Trans i18nKey={I18nStr.copy} />
                  </Button>
                </TabsContent>
                <TabsContent value={FileMode.SAV} className="flex justify-between items-center gap-4 mt-0">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Trans i18nKey={I18nStr.upload} />
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    <Trans i18nKey={I18nStr.dragAndDrop} />
                  </div>
                  <Button className="" onClick={saveFile}>
                    <Trans i18nKey={I18nStr.download} />
                  </Button>
                </TabsContent>
              </div>
            </Tabs>
          </CardHeader>
        </Card>
        <Alert className="w-full max-w-3xl mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            <Trans
              i18nKey={I18nStr.usingSettingsFile}
              defaults="You are using {{settingsFile}}"
              values={{ settingsFile: fileMode === FileMode.INI ? "PalWorldSettings.ini" : "WorldOption.sav" }}
            />
          </AlertTitle>
          <AlertDescription className="text-wrap break-all whitespace-pre-wrap">
            {fileMode === FileMode.INI ? (
              <>
                Windows: steamapps/common/PalServer/Pal/Saved/Config/WindowsServer/PalWorldSettings.ini
                <br />
                Linux: steamapps/common/PalServer/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini
                <br />
                <Trans i18nKey={I18nStr.iniFileWarning} />
              </>
            ) : (
              <>
                Windows & Linux: steamapps/common/PalServer/Pal/Saved/SaveGames/0/.../WorldOption.sav
                <br />
                <Trans i18nKey={I18nStr.savFileWarning} />
              </>
            )}
          </AlertDescription>
        </Alert>
        <div className="w-full max-w-3xl mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <pre className="text-wrap break-all whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{settingsText}</pre>
        </div>
        <div className="w-full max-w-3xl flex justify-center pt-2">
          2024 @Bluefissure{" "}
          <a
            href="https://github.com/Bluefissure/pal-conf"
            className="pl-2 font-medium text-primary underline underline-offset-4 top-2"
            target="_blank"
            rel="noreferrer"
          >
            Github
          </a>
        </div>
      </main>
    </>
  );
}

export default App;
