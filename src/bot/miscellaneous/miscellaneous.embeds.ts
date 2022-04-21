import { MessageEmbed } from "discord.js";

export class MiscellaneousEmbeds {
    heads(): MessageEmbed {
        return new MessageEmbed()
            .setAuthor({name: "Подбрасывание монетки"})
            .setColor("#FFB554")
            .setTitle("Орёл! 🌕")
    }

    tails(): MessageEmbed {
        return new MessageEmbed()
            .setAuthor({name: "Подбрасывание монетки"})
            .setColor("#A0A0A0")
            .setTitle("Решка! 🌑")
    }

    random(valueDiceMax: number, valueDice: number): MessageEmbed {
        return new MessageEmbed()
            .setAuthor({name: `Подбрасывание D${valueDiceMax}`})
            .setColor("#FF526C")
            .setTitle(`🎲 Выпало: ${valueDice}${(valueDice == valueDiceMax) ? "! 🔥" : "."}`)
    }

    vote(voteContent: string): MessageEmbed {
        return new MessageEmbed()
            .setTitle("🤔 Вопрос:")
            .setColor("#80C0C0")
            .setDescription(voteContent);
    }
}
