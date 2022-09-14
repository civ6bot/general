import {ModuleBaseModel} from "../base/base.models";
import {CommandInteraction} from "discord.js";
import {JSONDynamicConfigEntityBoolean, JSONDynamicConfigEntityNumber, JSONDynamicConfigEntityString} from "../../types/type.JSON.DynamicConfigEntities";

export class DynamicConfig extends ModuleBaseModel {
    private _pageCurrent: number = 1;
    private readonly entitiesPerPage: number;
    private readonly _pageTotal: number;

    public readonly lifeTimeMs: number;

    public titleOptionTag: string;
    public optionTags: string[];

    public pickedIndex: number = -1;
    private _child: DynamicConfig | null = null;
    private _configs: DynamicConfigEntity[] = [];

    constructor(
        interaction: CommandInteraction, entitiesPerPage: number, lifeTimeMs: number,
        titleOptionTag: string, optionTags: string[],
        configs: DynamicConfigEntity[] = []
    ) {
        super(interaction);
        this.titleOptionTag = titleOptionTag;

        // При создании объекта
        // все теги из объектов Config
        // переписываются в optionTags

        this.optionTags = optionTags;
        this._configs = configs;
        if(this._configs.length > 0)
            this.optionTags = this._configs.map((config: DynamicConfigEntity): string => config.properties.textTag);

        this.entitiesPerPage = entitiesPerPage;
        this._pageTotal = Math.ceil(this.optionTags.length/this.entitiesPerPage);
        this.lifeTimeMs = lifeTimeMs;
    }

    public hasAnyChild(): boolean { return !!(this._child); }

    // Эти методы нужны, потому что
    // вложенность структуры DynamicConfigs
    // не ограничена лишь 1 объектом (поле child)
    public get isConfig(): boolean {
        return (this._child) ? this._child.isConfig : (this._configs.length > 0);
    }

    public getTitleTag(): string {
        return (this._child) ? this._child.getTitleTag() : this.titleOptionTag;
    }

    public getEmojiTags(): string[] {
        return (this._child)
            ? this._child.getEmojiTags()
            : this.optionTags
                .slice((this.pageCurrent-1)*this.entitiesPerPage, this.pageCurrent*this.entitiesPerPage)
                .map((tag: string): string => tag + "_EMOJI");
    }

    public getOptionTags(): string[] {
        return (this._child)
            ? this._child.getOptionTags()
            : this.optionTags.slice((this.pageCurrent-1)*this.entitiesPerPage, this.pageCurrent*this.entitiesPerPage);
    }

    public getLastChild(): DynamicConfig {
        return (this._child) ? this._child.getLastChild() : this;
    }

    public createChild(index: number, optionTags: string[], configs: DynamicConfigEntity[] = []): void {
        (this._child)
            ? this._child.createChild(index, optionTags, configs)
            : this._child = (!this.isConfig)
                ? new DynamicConfig(
                    this.interaction as CommandInteraction,
                    this.entitiesPerPage,
                    this.lifeTimeMs,
                    this.optionTags[index],
                    optionTags,
                    configs
                ) : null;
    }

    public deleteLastChild(): void {
        if(this._child === null)
            return;
        if(this._child === this.getLastChild()) {
            this._child = null;
            return;
        }
        return this._child.deleteLastChild();
    }

    public getStringifiedValues(): string[] {
        return (this._child)
            ? this._child.getStringifiedValues()
            : this._configs
                .slice((this.pageCurrent-1)*this.entitiesPerPage, this.pageCurrent*this.entitiesPerPage)
                .map((entity: DynamicConfigEntity): string => entity.stringifiedValue);
    }

    public get configs(): DynamicConfigEntity[] {
        return (this._child)
            ? this._child.configs
            : this._configs.slice((this.pageCurrent-1)*this.entitiesPerPage, this.pageCurrent*this.entitiesPerPage);

    }

    public get pageCurrent(): number {
        return (this._child) ? this._child.pageCurrent : this._pageCurrent;
    }

    private set pageCurrent(page: number) {
        (this._child) ? this._child.pageCurrent = page : this._pageCurrent = Math.min(this._pageTotal, Math.max(page, 1));
    }

    public get pageTotal(): number {
        return (this._child) ? this._child.pageTotal : this._pageTotal;
    }

    public toFirstPage(): void { (this._child) ? this._child.toFirstPage() : this.pageCurrent = 1; }
    public toPreviousPage(): void { (this._child) ? this._child.toPreviousPage() : this.pageCurrent -= 1; }
    public toNextPage(): void { (this._child) ? this._child.toNextPage() : this.pageCurrent += 1; }
    public toLastPage(): void { (this._child) ? this._child.toLastPage() : this.pageCurrent = this.pageTotal; }
}

export abstract class DynamicConfigEntity {
    public readonly abstract type: string;

    public abstract check(value: string): boolean;
    public abstract get stringifiedValue(): string;
    public abstract properties: JSONDynamicConfigEntityNumber | JSONDynamicConfigEntityString | JSONDynamicConfigEntityBoolean;
}

export class DynamicConfigEntityNumber extends DynamicConfigEntity {
    public readonly type: string = "Number";
    public value: number;
    public readonly properties: JSONDynamicConfigEntityNumber;

    constructor(properties: JSONDynamicConfigEntityNumber, value: number) {
        super();
        this.value = value;
        this.properties = properties;
    }

    public get stringifiedValue(): string { return String(this.value); }

    public check(value: string): boolean {
        return (Number(value) >= this.properties.minValue) && (Number(value) <= this.properties.maxValue);
    }
}

export class DynamicConfigEntityString extends DynamicConfigEntity {
    public readonly type: string = "String";
    public value: string;
    public readonly properties: JSONDynamicConfigEntityString;

    constructor(properties: JSONDynamicConfigEntityString, value: string) {
        super();
        this.value = value;
        this.properties = properties;
    }

    public get stringifiedValue(): string { return this.value; }

    public check(value: string): boolean {
        return (value !== "");
    }
}

export class DynamicConfigEntityBoolean extends DynamicConfigEntity {
    public readonly type: string = "Boolean";
    public value: boolean;
    public readonly properties: JSONDynamicConfigEntityBoolean;

    constructor(properties: JSONDynamicConfigEntityBoolean, value: boolean) {
        super();
        this.value = value;
        this.properties = properties;
    }

    public get stringifiedValue(): string { return this.value ? "✅" : "🚫"; }

    public check(value: string): boolean {
        if(value === "true")
            return !this.value;
        else if(value === "false")
            return this.value;
        else return false;
    }
}
