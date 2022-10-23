// Этот тип не используется
export type RequestResponseUserSteam = {
    status: "error_incorrect" | "error_no_steam" | "error_unknown" | "success_add" | "success_update";
    discordID: string | null;
    steamID: string | null;
}
