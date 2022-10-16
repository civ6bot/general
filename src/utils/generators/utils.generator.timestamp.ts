export class UtilsGeneratorTimestamp {
    public static getDate(date: Date = new Date): string { return `<t:${Math.floor(date.getTime() / 1000)}:f>` }
    public static getRelativeTime(addMs: number): string { return `<t:${Math.floor((Date.now()+addMs) / 1000)}:R>` }
}
