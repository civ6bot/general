export type JSONDynamicConfigEntityNumber = {
    configTag: string,
    textTag: string,
    type: string,
    //emojiFromConfig: boolean,

    minValue: number,
    maxValue: number
}

export type JSONDynamicConfigEntityString = {
    configTag: string,
    textTag: string,
    type: string,
    //emojiFromConfig: boolean,

    isEmoji: boolean
}

export type JSONDynamicConfigEntityBoolean = {
    configTag: string,
    textTag: string,
    type: string,
}
