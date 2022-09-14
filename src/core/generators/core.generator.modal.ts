import {ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle} from "discord.js";

export class CoreGeneratorModal {
    public static build(
        customID: string,
        title: string,
        inputCustomIDs: string[],
        inputLabels: string[],
        inputStyles: TextInputStyle[] = []
    ): ModalBuilder {
        let modal: ModalBuilder = new ModalBuilder()
            .setCustomId(customID)
            .setTitle(title);
        for(let i in inputCustomIDs)
            modal.addComponents(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId(inputCustomIDs[i])
                    .setLabel(inputLabels[i])
                    .setStyle(inputStyles[i] || TextInputStyle.Short)
            ));
        return modal;
    }
}
