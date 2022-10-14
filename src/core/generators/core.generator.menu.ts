import {ActionRowBuilder, SelectMenuBuilder, SelectMenuComponentOptionData} from "discord.js";

export class CoreGeneratorMenu {
    public static build (
        customID: string,
        placeholder: string,
        labels: string[],
        emojis: string[],
        values: string[],
        descriptions: string[] = []
    ): ActionRowBuilder<SelectMenuBuilder>[] {
        return [new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId(customID)
                    .setPlaceholder(placeholder)
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(labels.map((label: string, index: number): SelectMenuComponentOptionData => {
                        console.log(emojis[index]);
                        return (emojis[index] === "")
                            ? {
                                label: labels[index],
                                value: values[index],
                                description: descriptions[index]
                            }
                            : {
                                label: labels[index],
                                emoji: emojis[index],
                                value: values[index],
                                description: descriptions[index]
                            };
                    })),
            )
        ];
    }
}
