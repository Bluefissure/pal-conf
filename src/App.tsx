import './App.css'

import { useState } from 'react'
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

import { Languages, ChevronsUpDown } from "lucide-react"

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

    const [locale, setLocale] = useState("en-US")
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
            toast.error("Invalid settings from clipboard", {
                description: "The settings you pasted are invalid.",
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
            toast.error("Invalid settings from clipboard", {
                description: "The settings you pasted are invalid.",
            })
            return;
        } else if (loadedEntriesNum < Object.keys(entries).length) {
            toast.warning("Some entries are missing", {
                description: "The settings you pasted have been loaded. Some settings are missing.",
            })
            return;
        } else {
            toast.success("Loaded form clipboard", {
                description: "The settings you pasted have been loaded.",
            })
            return;
        }
    };

    const settingsText = `[/Script/Pal.PalGameWorldSettings]\nOptionSettings=(${serializeEntries()})`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(settingsText).then(() => {
            toast.success("Copied to clipboard", {
                description: "The server settings have been copied to your clipboard.",
            })
        }).catch(() => {
            toast.error("Failed to copy to clipboard", {
                description: "The server settings failed to be copied to your clipboard.",
            })
        });
    }

    const readFromClipboard = () => {
        navigator.clipboard.readText().then((e) => {
            deserializeEntries(e);
        }).catch(() => {
            toast.error("Failed to read from clipboard", {
                description: "The server settings failed to be read from your clipboard.",
            })
        });
    }

    const genInput = (id: string) => {
        const entry = ENTRIES[id];
        if (!entry) {
            return null;
        }
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
        if ((entry.type === "integer" || entry.type === "float") && entry.range && entry.step) {
            const minValue = Number(entry.range[0]);
            const maxValue = Number(entry.range[1]);
            return (
                <SliderInput
                    name={entry.name}
                    id={id}
                    key={id}
                    value={Number(entryValue)}
                    defaultValue={Number(entry.defaultValue)}
                    minValue={minValue}
                    maxValue={maxValue}
                    step={entry.step}
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
                    name={entry.name}
                    id={id}
                    key={id}
                    checked={entryValue === "True"}
                    onCheckedChange={(e) => {
                        // console.log(e);
                        onStateChanged(id)({
                            target: { value: e ? "True" : "False"}
                        });
                    }}
                />
            );
        }
        return (
            <TextInput
                name={entry.name}
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


    return (
        <>
            <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
                <Toaster richColors />
                <Card className="w-full max-w-3xl">

                    <CardHeader>
                        <CardTitle className="flex">
                            <div className="">
                                Palworld Server Configuration Generator
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="ml-auto h-7" variant="ghost"><Languages /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuRadioGroup value={locale} onValueChange={setLocale}>
                                        <DropdownMenuRadioItem value="en-US">🇺🇸 en-US</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="zh-CN">🇨🇳 zh-CN</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="ja-JP">🇯🇵 ja-JP</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                        </CardTitle>


                        <CardDescription>Edit the values and the output below will update in real-time.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* <TextInput name="Server Name" id="ServerName" value={entries.ServerName} onChange={onStateChanged('ServerName')} />
                        <TextInput name="Server Description" id="ServerDescription" value={entries.ServerDescription} onChange={onStateChanged('ServerDescription')} />
                        <TextInput name="Admin Password" id="AdminPassword" value={entries.AdminPassword} onChange={onStateChanged('AdminPassword')} />
                        <TextInput name="Server Password" id="ServerPassword" value={entries.ServerPassword} onChange={onStateChanged('ServerPassword')} />
                        <TextInput name="Public IP" id="PublicIP" value={entries.PublicIP} onChange={onStateChanged('PublicIP')}/>
                        <TextInput name="Public Port" id="PublicPort" value={entries.PublicPort} onChange={onStateChanged('PublicPort')} type="number" /> */}
                        
                        {serverSettings}
                        <Separator />
                        <Collapsible className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold">
                                 In-Game Settings
                                </h4>
                                <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <ChevronsUpDown className="h-4 w-4" />
                                    <span className="sr-only">Toggle</span>
                                </Button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="space-y-4">
                                {inGameSliderSettings}
                            </CollapsibleContent>
                        </Collapsible>
                        <Separator />
                        <Collapsible className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold">
                                 Advanced Settings
                                </h4>
                                <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <ChevronsUpDown className="h-4 w-4" />
                                    <span className="sr-only">Toggle</span>
                                </Button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="space-y-4">
                                {advancedSettings}
                            </CollapsibleContent>
                        </Collapsible>
                        <Separator />

                    </CardContent>
                    <CardFooter>
                        <Button className="mr-auto" onClick={() => {
                            readFromClipboard();
                        }}>Load</Button>
                        <Button className="ml-auto" onClick={() => {
                            copyToClipboard();
                        }}>Copy</Button>

                    </CardFooter>
                </Card>
                <div className="w-full max-w-3xl mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <pre className="text-wrap break-all whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                        {settingsText}
                    </pre>
                </div>
            </main>
        </>
    )
}

export default App
