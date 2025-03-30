export const DeathPenaltyLabels = [
    {
        name: "None",
        desc: "No lost",
    },
    {
        name: "Item",
        desc: "Lost item without equipment",
    },
    {
        name: "ItemAndEquipment",
        desc: "Lost item and equipment",
    },
    {
        name: "All",
        desc: "Lost All item, equipment, pal(in inventory)",
    },
] as const;

export const CrossplayPlatformsLabels = [
    {
        name: "Steam",
    },
    {
        name: "Xbox",
    },
    {
        name: "PS5",
    },
    {
        name: "Mac",
    },
] as const;

export const LogFormatTypeLabels = [
    {
        name: "Text",
        desc: "Use Text format to log",
    },
    {
        name: "Json",
        desc: "Use Json format to log",
    },
] as const;

export const RandomizerTypeLabels = [
    {
        name: "None",
        desc: "No randomizer set"
    },
    {
        name: "Region",
        desc: "Set to randomize region"
    },
    {
        name: "All",
        desc: "Set to randomize all"
    }
] as const;