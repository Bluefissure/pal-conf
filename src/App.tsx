import './App.css'

import { useState, useEffect } from 'react'

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
// UI Icons
import { Languages, AlertCircle } from "lucide-react"
import ReactCountryFlag from "react-country-flag"

// App Components
import { ENTRIES } from './consts'
import { TextInput } from './components/textInput'
import { DeathPenaltyDropDown } from './components/deathPenaltyDropdown'
import { SliderInput } from './components/sliderInput'
import { SwitchInput } from './components/switchInput'

interface ChangeEvent<T> {
    target: {
        value: T
    }
}


function App() {
    const { t } = useTranslation();
    const [locale, setLocale] = useState(i18n.language === 'en' ? 'en_US' : i18n.language)
    const [entries, setEntries] = useState({} as Record<string, string>)

    const onStateChanged = (id: string) => (e: ChangeEvent<string>) => {
        setEntries((prevEntries) => {
            return {
                ...prevEntries,
                [id]: `${e.target.value}`,
            }
        })
    };

    const serializeEntries = () => {
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

    const deserializeEntries = (settingsText: string) => {
        if (!settingsText) {
            toast.error(t('toast.invalid'), {
                description: t('toast.invalidDescription'),
            })
            return;
        }
        const settingsTextList = settingsText.split("\n");
        let loadedEntriesNum = 0;
        let erroredLinesNum = 0;
        settingsTextList.forEach((line) => {
            if (line.startsWith("OptionSettings=(") && line.endsWith(")")) {
                const optionSettings = line.substring("OptionSettings=(".length, line.length - 1);
                const optionSettingsList = optionSettings.split(",");
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

    const settingsText = `[/Script/Pal.PalGameWorldSettings]\nOptionSettings=(${serializeEntries()})`;

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
            deserializeEntries(e);
        }).catch(() => {
            toast.error(t('toast.loadFailed'), {
                description: t('toast.loadFailedDescription'),
            })
        });
    }

    const genInput = (id: string) => {
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
                {...(entry.type === "integer" ? { type: "number" } : {})}
            />
        );
    }

    const serverSettings = [
        'ServerName',
        'ServerDescription',
        'AdminPassword',
        'ServerPassword',
        'PublicIP',
        'PublicPort',
        'ServerPlayerMaxNum',
    ].map(genInput);


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
    ].map(genInput);

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
    ].map(genInput);

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
                                            <div className="px-2"> en-US </div>
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="zh_CN">
                                            <ReactCountryFlag countryCode="CN" svg />
                                            <div className="px-2"> zh-CN </div>
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
                        <Accordion type="single" collapsible defaultValue="server-settings" className="w-full">
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
                    </CardFooter>
                </Card>
                <Alert className="w-full max-w-3xl mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                        <Trans i18nKey='iniHintTitle'>
                            You are using PalWorldSettings.ini
                        </Trans>
                    </AlertTitle>
                    <AlertDescription>
                        Windows: steamapps/common/PalServer/Pal/Saved/Config/WindowsServer/PalWorldSettings.ini
                        <br />
                        Linux: steamapps/common/PalServer/Pal/Saved/Config/LinuxServer/PalWorldSettings.ini
                        <br />
                        Some entries may not work.
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
