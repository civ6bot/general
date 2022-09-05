export class CoreServiceLetters {
    private static letters: string[] = ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯", "🇰", "🇱", "🇲", "🇳", "🇴", "🇵"];

    public static getLetters(): string[] {
        return this.letters.slice();
    }
}
