import "./App.css";

import { useState, useEffect, useRef, useCallback } from "react";

// i18n
import i18n, { I18nStr } from "./i18n";
import { useTranslation, Trans } from "react-i18next";

// UI Components
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
// UI Icons
import { AlertCircle, FileUp, Moon, Sun, Server, Gamepad2, SlidersHorizontal, ChevronDown, Copy, Download, ClipboardPaste, Github, ShieldCheck, Search, RotateCcw, Code2, Sparkles } from "lucide-react";
import ReactCountryFlag from "react-country-flag";

// App Components
import { TextInput } from "./components/textInput";
import { SelectInput } from "./components/selectInput";
import { MultiSelectInput } from "./components/multiSelectInput";
import { SliderInput } from "./components/sliderInput";
import { SwitchInput } from "./components/switchInput";
import { Input } from "./components/ui/input";

// lib & utils
import * as LosslessJSON from "lossless-json";
import { analyzeFile, writeFile } from "./lib/save";

// Constants
import { configVersion } from '../package.json';
import { ENTRIES } from "./consts/entries";
import { DEFAULT_WORLDOPTION_SAV, VALID_WORLDOPTION_KEYS, DEFAULT_WORLDOPTION } from "./consts/worldoption";
import { AdvancedSettings, InGameSettings, ServerSettings, EntryIdToEnumName } from "./consts/settings";

// Types
import { Gvas, WorldOption, WorldOptionEntry } from "./types/gvas";
import { LabelValue } from "./components/selectInput";
import { LabelValues } from "./components/multiSelectInput";

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

const SUPPORTED_LOCALES = ["en_US", "zh_CN", "zh_TW", "ja_JP", "ko_KR", "de_DE", "pt_BR", "es_ES", "fr_FR"] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

const LANGUAGE_OPTIONS: ReadonlyArray<{ value: SupportedLocale; country: string; label: string }> = [
  { value: "en_US", country: "US", label: "English" },
  { value: "zh_CN", country: "CN", label: "简体中文" },
  { value: "zh_TW", country: "TW", label: "繁體中文" },
  { value: "ja_JP", country: "JP", label: "日本語" },
  { value: "ko_KR", country: "KR", label: "한국어" },
  { value: "de_DE", country: "DE", label: "Deutsch" },
  { value: "pt_BR", country: "BR", label: "Português (Brasil)" },
  { value: "es_ES", country: "ES", label: "Español" },
  { value: "fr_FR", country: "FR", label: "Français" },
];

const normalizeLocale = (language?: string): SupportedLocale => {
  const normalized = (language || "en_US").replace("-", "_");
  const exact = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === normalized.toLowerCase());
  if (exact) return exact;
  const base = normalized.split("_")[0].toLowerCase();
  return SUPPORTED_LOCALES.find((locale) => locale.split("_")[0].toLowerCase() === base) ?? "en_US";
};

function App() {
  const { t } = useTranslation();
  const [locale, setLocale] = useState<SupportedLocale>(() => normalizeLocale(i18n.resolvedLanguage || i18n.language));
  const [entries, setEntries] = useState({} as Record<string, string>);
  const [fileMode, setFileMode] = useState<FileMode>(FileMode.INI);
  const [openedAccordion, setOpenedAccordion] = useState(SettingCategory.ServerSettings);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const currentYear = new Date().getFullYear();
  const [commitHash, setCommitHash] = useState(__COMMIT_HASH__ && __COMMIT_HASH__ !== "unknown" ? __COMMIT_HASH__ : "");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("pal-conf-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("pal-conf-theme", theme);
  }, [theme]);


  useEffect(() => {
    if (commitHash) return;
    const controller = new AbortController();
    fetch("https://api.github.com/repos/Bluefissure/pal-conf/commits?per_page=1", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`GitHub API ${response.status}`)))
      .then((commits: Array<{ sha?: string }>) => {
        const sha = commits[0]?.sha?.slice(0, 7);
        if (sha) setCommitHash(sha);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Could not load latest GitHub commit", error);
      });
    return () => controller.abort();
  }, [commitHash]);

  useEffect(() => {
    const handleLanguageChanged = (language: string) => {
      const nextLocale = normalizeLocale(language);
      setLocale(nextLocale);
      document.documentElement.lang = nextLocale.replace("_", "-");
      localStorage.setItem("pal-conf-language", nextLocale);
    };

    i18n.on("languageChanged", handleLanguageChanged);
    const storedLocale = localStorage.getItem("pal-conf-language");
    const initialLocale = normalizeLocale(storedLocale || i18n.resolvedLanguage || i18n.language);
    if (i18n.resolvedLanguage !== initialLocale) void i18n.changeLanguage(initialLocale);
    handleLanguageChanged(initialLocale);

    return () => i18n.off("languageChanged", handleLanguageChanged);
  }, []);

  const changeLocale = (value: string) => {
    const nextLocale = normalizeLocale(value);
    setLocale(nextLocale);
    void i18n.changeLanguage(nextLocale).catch((error) => {
      console.error("Could not change language", error);
      toast.error("Language could not be changed");
    });
  };

  useEffect(() => {
    if (tabRef.current && tabRef.current.getBoundingClientRect().top < 0) {
      tabRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [openedAccordion]);

  const onStateChanged = (id: string) => (e: ChangeEvent<string>) => {
    setEntries((prevEntries) => ({ ...prevEntries, [id]: `${e.target.value}` }));
  };

  const resetAllSettings = () => {
    const defaultEntries = Object.fromEntries(
      Object.values(ENTRIES).map((entry) => [entry.id, entry.defaultValue]),
    ) as Record<string, string>;
    setEntries(defaultEntries);
    toast.success(t("dashboard.resetDone"), {
      description: t("dashboard.resetDoneDescription"),
    });
  };

  const serializeEntriesToIni = () => {
    const resultList: string[] = [];
    Object.values(ENTRIES).forEach((entry) => {
      const entryValue = entries[entry.id] ?? entry.defaultValue;
      switch (entry.type) {
        case "array":
          resultList.push(`${entry.id}=(${entryValue})`);
          break;
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
    const settingsTextList = settingsText.trim().split(/\r\n|\r|\n/);
    let loadedEntriesNum = 0;
    let erroredLinesNum = 0;
    settingsTextList.forEach((line) => {
      if (line.startsWith("OptionSettings=(") && line.endsWith(")")) {
        const optionSettings = line.substring("OptionSettings=(".length, line.length - 1);
        const optionSettingsList: string[] = [];
        let start = 0;
        let end = 0;
        let quotation = false;
        let bracket = false;
        for (const char of optionSettings) {
          if (char === '"') {
            quotation = !quotation;
          }
          if (char === '(') {
            bracket = true;
          }
          if (char === ')') {
            bracket = false;
          }
          end++;
          if (char === "," && false === quotation && false === bracket) {
            optionSettingsList.push(optionSettings.substring(start, end - 1));
            start = end;
          }
        }
        // the last one
        optionSettingsList.push(optionSettings.substring(start, end));
        const newEntries = { ...entries };
        optionSettingsList.forEach((optionSetting) => {
          // console.log(optionSetting);
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
            if (entry.type === "array") {
              optionSettingValue = optionSettingValue.trim().replace(/^\(|\)$/g, "");
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

  const serializeEntriesToWorldOptionJson = () => {
    const worldOptionJson: Partial<Record<keyof WorldOption, WorldOptionEntry>> = {};
    Object.values(ENTRIES).forEach((entry) => {
      const entryValue = entries[entry.id] ?? entry.defaultValue;
      let dictValue = {} as WorldOptionEntry;
      if (!(entry.id in DEFAULT_WORLDOPTION)) {
        return;
      }
      if (entryValue === entry.defaultValue) {
        return;
      }
      if (entry.type === "select" && entry.id in EntryIdToEnumName) {
        const enumType = EntryIdToEnumName[entry.id];
        dictValue = {
          Enum: {
            value: `${enumType}::${entryValue}`,
            enum_type: enumType,
          },
        };
      } else if (entry.type === "array" && entry.id in EntryIdToEnumName) {
        const enumType = EntryIdToEnumName[entry.id];
        const enums = entryValue.trim() === "" ? []
          : entryValue.split(",").map((e) => `${enumType}::${e}`);
        dictValue = {
          Array: {
            array_type: "EnumProperty",
            value: {
              Base: {
                Enum: enums
              }
            }
          },
        };
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
      worldOptionJson[entry.id as keyof WorldOption] = dictValue;
    });
    return worldOptionJson;
  };

  const deserializeEntriesFromGvasJson = (gvas: Gvas) => {
    if (!gvas) {
      toast.error(t(I18nStr.toast.invalidFile), {
        description: t(I18nStr.toast.invalidFileDescription),
      });
      return;
    }
    const worldOptionStructDictJson = gvas.root.properties.OptionWorldData.Struct.value.Struct.Settings.Struct.value.Struct;
    const newEntries = { ...entries };
    Object.entries(worldOptionStructDictJson).forEach(([key, value]) => {
      if (key in ENTRIES) {
        const entry = ENTRIES[key];
        // const valueRecord = value as Record<string, { value: string, array_type?: string }>;
        const valueRecord = value ;
        let entryValue: number | boolean | string | undefined = undefined;
        if ("Enum" in valueRecord) {
          entryValue = valueRecord.Enum.value.split("::")[1];
        } else if ("Int" in valueRecord ) {
          entryValue = valueRecord.Int.value;
        } else if ("Float" in valueRecord) {
          entryValue = valueRecord.Float?.value;
        } else if ("Bool" in valueRecord) {
          entryValue = valueRecord.Bool.value ? "True" : "False";
        } else if ("Str" in valueRecord) {
          entryValue = valueRecord.Str.value;
        } else if ("Array" in valueRecord && valueRecord.Array.array_type === "EnumProperty") {
          entryValue = valueRecord.Array.value.Base.Enum.map((e: string) => e.split("::")[1]).join(",");
        }
        newEntries[entry.id] = entryValue?.toString() ?? entry.defaultValue;
      }
    });
    setEntries(newEntries);
  };

  const openSavFile = async (f: File) => {
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
    const gvas: Gvas = result.gvas ?? DEFAULT_WORLDOPTION_SAV.gvas;
    toast.success(t(I18nStr.toast.savFileLoaded), {
      description: t(I18nStr.toast.savFileLoadedDescription),
    });
    deserializeEntriesFromGvasJson(gvas);
  };

  const saveFile = () => {
    const gvasToSave: Gvas = LosslessJSON.parse(LosslessJSON.stringify(DEFAULT_WORLDOPTION_SAV.gvas)!) as Gvas;
    gvasToSave.root.properties.OptionWorldData.Struct.value.Struct.Settings.Struct.value.Struct = serializeEntriesToWorldOptionJson() as WorldOption;
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
    openSavFile(file)
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

  const getEntryDescription = (id: string): string => {
    const raw = t(`entry.description.${id}`, { returnObjects: true }) as unknown;
    if (!raw || typeof raw !== "object") return "";
    const values = raw as Record<string, string>;
    const lines: string[] = [];
    if (values.help) lines.push(values.help);
    if (values.False) lines.push(`False - ${values.False}`);
    if (values.True) lines.push(`True - ${values.True}`);
    return lines.join("\n");
  };

  const genInput = (id: string, disabled = false) => {
    const entry = ENTRIES[id];
    if (!entry) {
      return null;
    }
    const entryName = t(`entry.name.${entry.id}`);
    const entryValue = entries[entry.id] ?? entry.defaultValue;
    if (entry.type === "select") {
      return (
        <SelectInput
          key={id}
          dKey={entry.id as "DeathPenalty" | "LogFormatType" | "RandomizerType"}
          label={entryValue as LabelValue}
          onLabelChange={(labelName: string) => {
            onStateChanged(entry.id)({
              target: { value: labelName },
            });
          }}
          description={getEntryDescription(id)}
        />
      );
    }
    if (entry.type === "array") {
      const labelValues = (entryValue.trim() === "" ? [] : entryValue.split(",")) as LabelValues;
      return (
        <MultiSelectInput
          key={id}
          dKey={entry.id as "CrossplayPlatforms"}
          selectedLabels={labelValues}
          onLabelsChange={(labelNames: string[]) => {
            onStateChanged(entry.id)({
              target: { value: labelNames.join(",") },
            });
          }}
          description={getEntryDescription(id)}
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
          description={getEntryDescription(id)}
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
          description={getEntryDescription(id)}
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
        description={getEntryDescription(id)}
        {...(entry.type === "integer" ? { type: "number" } : {})}
      />
    );
  };

  const isEntryValid = useCallback((entryKey: string) => fileMode === FileMode.INI || VALID_WORLDOPTION_KEYS.indexOf(entryKey) >= 0, [fileMode]);

  const matchesSearch = (key: string) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const translatedName = t(`entry.name.${key}`).toLowerCase();
    return translatedName.includes(query) || key.toLowerCase().includes(query);
  };

  const serverSettings = ServerSettings.filter(matchesSearch).map((k) => genInput(k, !isEntryValid(k)));
  const inGameSettings = InGameSettings.filter(matchesSearch).map((k) => genInput(k, !isEntryValid(k)));
  const advancedSettings = AdvancedSettings.filter(matchesSearch).map((k) => genInput(k, !isEntryValid(k)));

  const activeSettings = openedAccordion === SettingCategory.ServerSettings
    ? serverSettings
    : openedAccordion === SettingCategory.InGameSettings
      ? inGameSettings
      : advancedSettings;

  const settingsText =
    fileMode === FileMode.INI
      ? `[/Script/Pal.PalGameWorldSettings]\nOptionSettings=(${serializeEntriesToIni()})`
      : LosslessJSON.stringify(serializeEntriesToWorldOptionJson(), null, 4) ?? "";

  const copyToClipboard = () => {
    const copyText = (text: string) => {
      if (navigator.clipboard) {
        return navigator.clipboard.writeText(text);
      } else if (document.queryCommandSupported?.('copy')) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
          document.execCommand('copy');
          return Promise.resolve();
        } catch (e) {
          // console.error(e);
          return Promise.reject(e);
        } finally {
          document.body.removeChild(textarea);
        }
      }
      return Promise.reject(new Error('Copy failed'));
    };

    copyText(settingsText)
      .then(() => toast.success(t(I18nStr.toast.copied), { description: t(I18nStr.toast.copiedDescription) }))
      .catch(() => toast.error(t(I18nStr.toast.copyFailed), { description: t(I18nStr.toast.copyFailedDescription) }));
  };

  const readFromClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .readText()
        .then((e) => deserializeEntriesFromIni(e))
        .catch(() => {
          toast.error(t(I18nStr.toast.loadFailed), {
            description: t(I18nStr.toast.loadFailedDescription),
          })
        });
    } else {
      setPasteDialogOpen(true);
    }
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
        className="app-shell"
        onDragOver={(e) => { e.preventDefault(); setShowUploadPrompt(true); }}
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
          <div className="drag-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70">
            <div className="drag-overlay-card"><FileUp /><Trans i18nKey={I18nStr.drag} /></div>
          </div>
        )}
        <Toaster richColors />

        <div className="dashboard-shell">
          <header className="dashboard-hero">
            <div className="hero-art" aria-hidden="true">
              <span className="hero-island island-one" />
              <span className="hero-island island-two" />
              <span className="hero-cloud cloud-one" />
              <span className="hero-cloud cloud-two" />
            </div>
            <div className="dashboard-topbar">
              <div className="palworld-brand">
                <div className="palworld-wordmark">PALWORLD</div>
                <div className="palworld-subtitle">SERVER CONFIG GENERATOR</div>
              </div>
              <a className="version-pill" href="https://docs.palworldgame.com/settings-and-operation/configuration/" target="_blank" rel="noreferrer">
                <ShieldCheck className="h-4 w-4" /> v{configVersion}
              </a>
              <div className="topbar-actions">
                <Button type="button" variant="secondary" className="round-control" onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Light mode" : "Dark mode"}>
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="secondary" className="language-control">
                      <ReactCountryFlag countryCode={LANGUAGE_OPTIONS.find((option) => option.value === locale)?.country ?? "US"} svg />
                      <span>{LANGUAGE_OPTIONS.find((option) => option.value === locale)?.label ?? "English"}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="language-menu">
                    <DropdownMenuRadioGroup value={locale} onValueChange={changeLocale}>
                      {LANGUAGE_OPTIONS.map(({ value, country, label }) => (
                        <DropdownMenuRadioItem key={value} value={value}>
                          <ReactCountryFlag countryCode={country} svg /><span className="ml-2">{label}</span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

          </header>

          <section className="dashboard-grid">
            <aside className="category-sidebar">
              <div className="sidebar-title">{t("dashboard.categories")}</div>
              <nav className="category-nav">
                <button className={openedAccordion === SettingCategory.ServerSettings ? "active" : ""} onClick={() => setOpenedAccordion(SettingCategory.ServerSettings)}>
                  <Server /><span><Trans i18nKey={I18nStr.serverSettings} /></span><b>{ServerSettings.length}</b>
                </button>
                <button className={openedAccordion === SettingCategory.InGameSettings ? "active" : ""} onClick={() => setOpenedAccordion(SettingCategory.InGameSettings)}>
                  <Gamepad2 /><span><Trans i18nKey={I18nStr.ingameSettings} /></span><b>{InGameSettings.length}</b>
                </button>
                <button className={openedAccordion === SettingCategory.AdvancedSettings ? "active" : ""} onClick={() => setOpenedAccordion(SettingCategory.AdvancedSettings)}>
                  <SlidersHorizontal /><span><Trans i18nKey={I18nStr.advancedSettings} /></span><b>{AdvancedSettings.length}</b>
                </button>
              </nav>
              <button type="button" className="reset-button" onClick={resetAllSettings}><RotateCcw /><span>{t("dashboard.resetAll")}<small>{t("dashboard.resetSubtitle")}</small></span></button>
            </aside>

            <section className="settings-workspace" ref={tabRef}>
              <div className="settings-toolbar">
                <div className="search-box"><Search /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t("dashboard.searchPlaceholder")} /></div>
                <span className="result-count">{t("dashboard.settingsCount", { count: activeSettings.filter(Boolean).length })}</span>
              </div>
              <div className="workspace-heading"><Sparkles /><span>{openedAccordion === SettingCategory.ServerSettings ? t(I18nStr.serverSettings) : openedAccordion === SettingCategory.InGameSettings ? t(I18nStr.ingameSettings) : t(I18nStr.advancedSettings)}</span></div>
              <div className="settings-list">{activeSettings}</div>
            </section>

            <aside className="preview-sidebar">
              <div className="preview-heading"><span>{t("dashboard.previewTitle")}</span><Code2 /></div>
              <div className="preview-code"><pre>{settingsText}</pre></div>
              <Button variant="outline" className="preview-copy" onClick={copyToClipboard}><Copy className="h-4 w-4" /><Trans i18nKey={I18nStr.copy} /></Button>
            </aside>
          </section>

          <section className="file-action-bar">
            <Input className="hidden" id="file-upload" type="file" ref={fileInputRef} onChange={handleFileInput} />
            <div className="file-mode-switch">
              <button className={fileMode === FileMode.INI ? "active" : ""} onClick={() => setFileMode(FileMode.INI)}>PalWorldSettings.ini</button>
              <button className={fileMode === FileMode.SAV ? "active" : ""} onClick={() => setFileMode(FileMode.SAV)}>WorldOption.sav</button>
            </div>
            <button className="upload-zone" onClick={() => fileMode === FileMode.INI ? readFromClipboard() : fileInputRef.current?.click()}>
              {fileMode === FileMode.INI ? <ClipboardPaste /> : <FileUp />}
              <span><strong>{fileMode === FileMode.INI ? t(I18nStr.paste) : t(I18nStr.upload)}</strong><small>{t(I18nStr.dragAndDrop)}</small></span>
            </button>
            <Button className="download-button" onClick={fileMode === FileMode.INI ? copyToClipboard : saveFile}>
              {fileMode === FileMode.INI ? <Copy /> : <Download />}
              <span>{fileMode === FileMode.INI ? t(I18nStr.copy) : t(I18nStr.download)}</span>
            </Button>
          </section>

          <Alert className="path-alert">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle><Trans i18nKey={I18nStr.usingSettingsFile} defaults="You are using {{settingsFile}}" values={{ settingsFile: fileMode === FileMode.INI ? "PalWorldSettings.ini" : "WorldOption.sav" }} /></AlertTitle>
            <AlertDescription>{fileMode === FileMode.INI ? "Pal/Saved/Config/.../PalWorldSettings.ini" : "Pal/Saved/SaveGames/.../WorldOption.sav"}</AlertDescription>
          </Alert>

          <footer className="dashboard-footer">
            <div className="footer-brand">
              <span className="footer-product"><ShieldCheck /> Palworld Server Config Generator</span>
              <span className="footer-community">{t("footer.community")}</span>
            </div>
            <div className="footer-credits">
              <span className="copyright-text">2024-{currentYear} @Bluefissure</span>
              <span className="redesign-credit">Redesign by Koenigsegg</span>
            </div>
            <div className="footer-links">
              <a href="https://github.com/Bluefissure/pal-conf" target="_blank" rel="noreferrer"><Github /> GitHub</a>
              {commitHash && (
                <a className="commit-link" href={`https://github.com/Bluefissure/pal-conf/commit/${commitHash}`} target="_blank" rel="noreferrer">@{commitHash}</a>
              )}
            </div>
          </footer>
        </div>
      </main>
      <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
        <DialogContent>
          <DialogTitle>{t(I18nStr.paste)}</DialogTitle>
          <Textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            className="min-h-[200px]"
          />
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setPasteDialogOpen(false)}>
              <Trans i18nKey={I18nStr.cancel} />
            </Button>
            <Button
              onClick={() => {
                deserializeEntriesFromIni(pasteContent);
                setPasteDialogOpen(false);
                setPasteContent("");
              }}
            >
              <Trans i18nKey={I18nStr.confirm} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default App;
