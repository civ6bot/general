export interface JSONDynamicConfigEntity {
    configTag: string,
    textTag: string,
    type: string
}

export interface JSONDynamicConfigEntityNumber extends JSONDynamicConfigEntity {
    minValue: number,
    maxValue: number
}

export interface JSONDynamicConfigEntityString extends JSONDynamicConfigEntity {
    isEmoji: boolean
}

export interface JSONDynamicConfigEntityBoolean extends JSONDynamicConfigEntity {}

export interface JSONDynamicConfigEntityTeamersForbiddenPairs extends JSONDynamicConfigEntity {}

export interface JSONDynamicConfigEntityBooleanGameSetting extends JSONDynamicConfigEntity {}
