import './App.css'

import { useState, useEffect, useRef, useCallback } from 'react'

// i18n
import i18n from './i18n';
import { useTranslation, Trans } from 'react-i18next';

// UI Components
import { CardTitle, CardDescription, CardHeader, CardContent, CardFooter, Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
// UI Icons
import { Languages, AlertCircle } from "lucide-react"
import ReactCountryFlag from "react-country-flag"

// App Components
import { TextInput } from './components/textInput'
import { DeathPenaltyDropDown } from './components/deathPenaltyDropdown'
import { SliderInput } from './components/sliderInput'
import { SwitchInput } from './components/switchInput'
import { Input } from './components/ui/input';

// lib & utils
import * as LosslessJSON from 'lossless-json'
import { analyzeFile, writeFile } from './lib/save';

// Constants
import { ENTRIES } from './consts/entries'
import { DEFAULT_WORLDOPTION, VALID_WORLDOPTION_KEYS } from './consts/worldoption';

// Types
import { Gvas } from './types/gvas';

interface ChangeEvent<T> {
    target: {
        value: T
    }
}


function App() {
    const { t } = useTranslation();
    const [locale, setLocale] = useState(i18n.language === 'en' ? 'en_US' : i18n.language)
    const [entries, setEntries] = useState({} as Record<string, string>)
    const [fileMode, setFileMode] = useState("ini")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [openedAccordion, setOpenedAccordion] = useState("server-settings")
    // useEffect(() => {
    //     if (fileMode === 'sav') {
    //         setOpenedAccordion("ingame-settings");
    //     }
    // }, [fileMode]);

    const onStateChanged = (id: string) => (e: ChangeEvent<string>) => {
        setEntries((prevEntries) => {
            return {
                ...prevEntries,
                [id]: `${e.target.value}`,
            }
        })
    };

    const serializeEntriesToIni = () => {
        const resultList: string[] = []
        Object.values(ENTRIES).forEach((entry) => {
            let entryStr = "";
            const entryValue = entries[entry.id] ?? entry.defaultValue;
            if (entry.type === "string") {
                entryStr = `${entry.id}="${entryValue}"`
            } else if (entry.type === "select") {
                entryStr = `${entry.id}=${entryValue}`
            } else if (entry.type === "boolean") {
                entryStr = `${entry.id}=${entryValue}`
            } else if (entry.type === "integer") {
                entryStr = `${entry.id}=${entryValue}`
            } else if (entry.type === "float") {
                entryStr = `${entry.id}=${Number(entryValue).toFixed(6)}`
            }
            resultList.push(entryStr)
        })
        return resultList.join(",");
    }

    const deserializeEntriesFromIni = (settingsText: string) => {
        if (!settingsText) {
            toast.error(t('toast.invalid'), {
                description: t('toast.invalidDescription'),
            })
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
                    if (char === "\"") {
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
                    const optionSettingList = optionSetting.split("=");
                    const optionSettingName = optionSettingList[0];
                    let optionSettingValue = optionSettingList[1];
                    const entry = ENTRIES[optionSettingName];
                    if (entry) {
                        if (entry.type === "string" && optionSettingValue.startsWith("\"") && optionSettingValue.endsWith("\"")) {
                            optionSettingValue = optionSettingValue.substring(1, optionSettingValue.length - 1);
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
            toast.error(t('toast.invalid'), {
                description: t('toast.invalidDescription'),
            })
            return;
        } else if (loadedEntriesNum < Object.keys(entries).length) {
            toast.warning(t('toast.missing'), {
                description: t('toast.missingDescription'),
            })
            return;
        } else {
            toast.success(t('toast.loaded'), {
                description: t('toast.loadedDescription'),
            })
            return;
        }
    };

    const serializeEntriesToGvasJson = () => {
        const gvasJson: Record<string, unknown> = {}
        Object.values(ENTRIES).forEach((entry) => {
            const entryValue = entries[entry.id] ?? entry.defaultValue;
            let dictValue = {};
            if (!(entry.id in DEFAULT_WORLDOPTION.gvas.
                root.properties.OptionWorldData.Struct.value.Struct.Settings.Struct.value.Struct)) {
                return;
            }
            if (entryValue === entry.defaultValue) {
                return;
            }
            if (entry.type === "select") {
                if (entry.id === "DeathPenalty") {
                    dictValue = {
                        "Enum": {
                            "value": `EPalOptionWorldDeathPenalty::${entryValue}`,
                            "enum_type": "EPalOptionWorldDeathPenalty"
                        }
                    }
                } else if (entry.id === "Difficulty") {
                    dictValue = {
                        "Enum": {
                            "value": `EPalOptionWorldDifficulty::Custom`,
                            "enum_type": "EPalOptionWorldDifficulty"
                        }
                    }
                }
            } else if (entry.type === "boolean") {
                dictValue = {
                    "Bool": {
                        "value": entryValue === "True"
                    }
                }
            } else if (entry.type === "integer") {
                if (Number(entryValue) === Number(entry.defaultValue)) {
                    return;
                }
                dictValue = {
                    "Int": {
                        "value": Number(entryValue)
                    }
                }
            } else if (entry.type === "float") {
                if (Number(entryValue) === Number(entry.defaultValue)) {
                    return;
                }
                dictValue = {
                    "Float": {
                        "value": Number(entryValue)
                    }
                }
            } else if (entry.type === "string") {
                dictValue = {
                    "Str": {
                        "value": entryValue
                    }
                }
            }
            gvasJson[entry.id] = dictValue;
        })
        return gvasJson;
    }

    const deserializeEntriesFromGvasJson = (gvas: Gvas) => {
        if (!gvas) {
            toast.error(t('toast.invalidFile'), {
                description: t('toast.invalidFileDescription'),
            })
            return;
        }
        const gvasJson: Record<string, unknown> = gvas.
            root.properties.OptionWorldData.Struct.value.Struct.Settings.Struct.value.Struct;
        const newEntries = { ...entries };
        Object.entries(gvasJson).forEach(([key, value]) => {
            if (key in ENTRIES) {
                const entry = ENTRIES[key];
                const valueRecord = value as Record<string, { "value": string }>;
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
    }

    const openFile = async (f: File) => {
        const result = await analyzeFile(f, (e) => {
            console.error(e);
            toast.error(t('toast.invalidFile'), {
                description: t('toast.invalidFileDescription'),
            })
        }).catch((e) => {
            console.error(e);
        });
        if (!result) {
            return;
        }
        // console.log(result);
        // console.log('magic: ' + result.magic);
        const gvas: Gvas = result.gvas ?? DEFAULT_WORLDOPTION.gvas;
        toast.success(t('toast.savFileLoaded'), {
            description: t('toast.savFileLoadedDescription'),
        })
        deserializeEntriesFromGvasJson(gvas);
    }

    const saveFile = () => {
        const gvasToSave: Gvas = LosslessJSON.parse(LosslessJSON.stringify(DEFAULT_WORLDOPTION.gvas)!) as Gvas;
        gvasToSave.root.properties.OptionWorldData.Struct.value.Struct.Settings.Struct.value.Struct = serializeEntriesToGvasJson();
        writeFile(
            {
                magic: 828009552,
                gvas: gvasToSave,
            },
            'WorldOption.sav',
            () => {
                toast.success(t('toast.saved'), {
                    description: t('toast.savedDescription'),
                })
            },
            (e) => {
                console.error(e);
                toast.error(t('toast.saveFailed'), {
                    description: t('toast.saveFailedDescription'),
                })
            },
        );
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            toast.error(t('toast.invalidFile'), {
                description: t('toast.invalidFileDescription'),
            })
            return;
        }
        // if (file.name !== 'WorldOption.sav') {
        //     toast.error(t('toast.invalidFileName'), {
        //         description: t('toast.invalidFileNameDescription'),
        //     })
        //     return;
        // }
        openFile(file).then(() => {
            // console.log("File opened");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }).catch((e) => {
            console.error(e);
            toast.error(t('toast.invalidFile'), {
                description: t('toast.invalidFileDescription'),
            });
        });
    };

    const genInput = (id: string, disabled = false) => {
        const entry = ENTRIES[id];
        if (!entry) {
            return null;
        }
        const entryName = t(`entry.name.${entry.id}`)
        const entryValue = entries[entry.id] ?? entry.defaultValue;
        if (entry.id === "DeathPenalty") {
            return (
                <DeathPenaltyDropDown
                    key={id}
                    label={entryValue}
                    onLabelChange={(labelName: string) => {
                        onStateChanged('DeathPenalty')({
                            target: { value: labelName }
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
                            target: { value: `${values[0]}` }
                        });
                    }}
                    type={entry.type}
                    disabled={disabled}
                    difficultyType={entry.difficultyType}
                />
            )
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
                            target: { value: e ? "True" : "False" }
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
                {...(entry.type === "integer" ? { type: "number" } : {})}
            />
        );
    }

    const isEntryValid = useCallback((entryKey: string) => {
        if (fileMode === 'ini') {
            return true;
        }
        return VALID_WORLDOPTION_KEYS.indexOf(entryKey) >= 0;
    }, [fileMode]);

    const serverSettings = [
        'ServerName',
        'ServerDescription',
        'AdminPassword',
        'ServerPassword',
        'PublicIP',
        'PublicPort',
        'ServerPlayerMaxNum',
    ].map((k) => genInput(k, !isEntryValid(k)));

    const inGameSliderSettings = [
        'DayTimeSpeedRate',
        'NightTimeSpeedRate',
        'ExpRate',
        'PalCaptureRate',
        'PalSpawnNumRate',
        'PalDamageRateAttack',
        'PalDamageRateDefense',
        'PalStomachDecreaceRate',
        'PalStaminaDecreaceRate',
        'PalAutoHPRegeneRate',
        'PalAutoHpRegeneRateInSleep',
        'PlayerDamageRateAttack',
        'PlayerDamageRateDefense',
        'PlayerStomachDecreaceRate',
        'PlayerStaminaDecreaceRate',
        'PlayerAutoHPRegeneRate',
        'PlayerAutoHpRegeneRateInSleep',
        'BuildObjectDamageRate',
        'BuildObjectDeteriorationDamageRate',
        'DropItemMaxNum',
        'CollectionDropRate',
        'CollectionObjectHpRate',
        'CollectionObjectRespawnSpeedRate',
        'EnemyDropItemRate',
        'PalEggDefaultHatchingTime',
        'bEnableInvaderEnemy',
        'DeathPenalty',
        'GuildPlayerMaxNum',
        'BaseCampWorkerMaxNum',
    ].map((k) => genInput(k, !isEntryValid(k)));

    const advancedSettings = [
        'bEnablePlayerToPlayerDamage',
        'bEnableFriendlyFire',
        'bActiveUNKO',
        'bEnableAimAssistPad',
        'bEnableAimAssistKeyboard',
        'DropItemMaxNum_UNKO',
        'BaseCampMaxNum',
        'DropItemAliveMaxHours',
        'bAutoResetGuildNoOnlinePlayers',
        'AutoResetGuildTimeNoOnlinePlayers',
        'WorkSpeedRate',
        'bIsMultiplay',
        'bIsPvP',
        'bCanPickupOtherGuildDeathPenaltyDrop',
        'bEnableNonLoginPenalty',
        'bEnableFastTravel',
        'bIsStartLocationSelectByMap',
        'bExistPlayerAfterLogout',
        'bEnableDefenseOtherGuildPlayer',
        'RCONEnabled',
        'RCONPort',
        'Region',
        'bUseAuth',
        'BanListURL',
    ].map((k) => genInput(k, !isEntryValid(k)));

    const settingsText = fileMode === 'ini'
        ? `[/Script/Pal.PalGameWorldSettings]\nOptionSettings=(${serializeEntriesToIni()})`
        : LosslessJSON.stringify(serializeEntriesToGvasJson(), null, 4) ?? '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(settingsText).then(() => {
            toast.success(t('toast.copied'), {
                description: t('toast.copiedDescription'),
            })
        }).catch(() => {
            toast.error(t('toast.copyFailed'), {
                description: t('toast.copyFailedDescription'),
            })
        });
    }

    const readFromClipboard = () => {
        navigator.clipboard.readText().then((e) => {
            deserializeEntriesFromIni(e);
        }).catch(() => {
            toast.error(t('toast.loadFailed'), {
                description: t('toast.loadFailedDescription'),
            })
        });
    }

    useEffect(() => {
        document.title = t('title');
    }, [t]);

    return (
        <>
            <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <Toaster richColors />
                <Card className="w-full max-w-3xl">

                    <CardHeader>
                        <CardTitle className="flex">
                            <div className="leading-10">
                                <Trans i18nKey={'title'}>
                                    Palworld Server Configuration Generator
                                </Trans>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="ml-auto h-10" variant="secondary"><Languages /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuRadioGroup value={locale} onValueChange={(value) => {
                                        i18n.changeLanguage(value).then(() => {
                                            // console.log("Language changed to " + value)
                                        }).catch((e) => { console.error(e); });
                                        setLocale(value);
                                    }}>
                                        <DropdownMenuRadioItem value="en_US">
                                            <ReactCountryFlag countryCode="US" svg />
                                            <div className="px-2"> English </div>
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="zh_CN">
                                            <ReactCountryFlag countryCode="CN" svg />
                                            <div className="px-2"> 简体中文 </div>
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="ja_JP">
                                            <ReactCountryFlag countryCode="JP" svg />
                                            <div className="px-2"> 日本語 </div>
                                        </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardTitle>
                        <CardDescription>
                            <Trans i18nKey={'introduction'}>
                                Edit the values and the output below will update in real-time.
                            </Trans>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Accordion type="single" collapsible value={openedAccordion} className="w-full" onValueChange={setOpenedAccordion}>
                            <AccordionItem value="server-settings" >
                                <AccordionTrigger>
                                    <Trans i18nKey={'serverSettings'}>
                                        Server Settings
                                    </Trans>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    {serverSettings}
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="ingame-settings" >
                                <AccordionTrigger>
                                    <Trans i18nKey={'ingameSettings'}>
                                        In-Game Settings
                                    </Trans>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    {inGameSliderSettings}
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="advanced-settings">
                                <AccordionTrigger>
                                    <Trans i18nKey={'advancedSettings'}>
                                        Advanced Settings
                                    </Trans>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4">
                                    {advancedSettings}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                    <CardFooter>
                        <Tabs value={fileMode} className="flex flex-col w-full min-h-10" onValueChange={setFileMode}>
                            <TabsList>
                                <TabsTrigger className="w-[50%]" value="ini">PalWorldSettings.ini</TabsTrigger>
                                <TabsTrigger className="w-[50%]" value="sav">WorldOption.sav</TabsTrigger>
                            </TabsList>
                            <div className="mt-4">
                                <TabsContent value="ini" className="flex mt-0">
                                    <Button className="mr-auto" onClick={() => {
                                        readFromClipboard();
                                    }}>
                                        <Trans i18nKey={'load'}>
                                            Load
                                        </Trans>
                                    </Button>
                                    <Button className="ml-auto" onClick={() => {
                                        copyToClipboard();
                                    }}>
                                        <Trans i18nKey={'copy'}>
                                            Copy
                                        </Trans>
                                    </Button>
                                </TabsContent>
                                <TabsContent value="sav" className="flex mt-0">
                                    <Input className="hidden w-[50%]" id="file-upload" type="file" ref={fileInputRef}
                                        onChange={handleFileInput} />
                                    <Button className="mr-auto" onClick={() => {
                                        fileInputRef.current?.click();
                                    }}>
                                        <Trans i18nKey={'upload'}>
                                            Upload
                                        </Trans>
                                    </Button>
                                    <Button className="ml-auto" onClick={saveFile}>
                                        <Trans i18nKey={'download'}>
                                            Download
                                        </Trans>
                                    </Button>
                                </TabsContent>
                            </div>
                        </Tabs>

                    </CardFooter>
                </Card>
                <Alert className="w-full max-w-3xl mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                        <Trans
                            i18nKey="usingSettingsFile"
                            defaults="You are using {{settingsFile}}"
                            values={{
                                settingsFile: fileMode === 'ini' ? 'PalWorldSettings.ini' : 'WorldOption.sav',
                            }}
                        />
                    </AlertTitle>
                    <AlertDescription className="text-wrap break-all whitespace-pre-wrap">
                        {
                            fileMode === 'ini' ? (<>
                                Windows: steamapps/common/PalServer/Pal/Saved/Config/WindowsServer/PalWorldSettings.ini
                                <br />
                                Linux: steamapps/common/PalServer/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini
                                <br />
                                <Trans i18nKey="iniFileWarning">
                                    Some entries may not work.
                                </Trans>
                            </>) : (<>
                                Windows & Linux:
                                steamapps/common/PalServer/Pal/Saved/SaveGames/0/.../WorldOption.sav
                                <br />
                                <Trans i18nKey="savFileWarning">
                                    Will take control of PalWorldSettings.ini.
                                </Trans>
                            </>)
                        }
                    </AlertDescription>
                </Alert>
                <div className="w-full max-w-3xl mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <pre className="text-wrap break-all whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                        {settingsText}
                    </pre>
                </div>
                <div className="w-full max-w-3xl flex justify-center pt-2">
                    2024 @Bluefissure <a
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
    )
}

export default App
