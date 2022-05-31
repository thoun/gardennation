class SecretMissionCards {
    constructor(private game: GardenNationGame) {}  

    // gameui.secretMissionCards.debugSeeAllCards()
    private debugSeeAllCards() {
        let html = `<div id="all-secret-mission-cards">`;
        html += `</div>`;
        dojo.place(html, 'full-table', 'before');

        [1, 2].forEach(type => 
            [1, 2, 3].forEach(subType => {
                const card = {
                    id: 10*type+subType,
                    side: 0,
                    type,
                    subType,
                    name: '[name]'
                } as SecretMission;
                this.createMoveOrUpdateCard(card, `all-secret-mission-cards`);
            })
        );

        [1, 2].forEach(subType => {
            const card = {
                id: 10*3+subType,
                side: 0,
                type: 3,
                subType,
                name: '[name]'
            } as SecretMission;
            this.createMoveOrUpdateCard(card, `all-secret-mission-cards`);
        });

        [1, 2, 3, 4, 5, 6, 7].forEach(subType => {
            const card = {
                id: 10*4+subType,
                side: 0,
                type: 4,
                subType,
                name: '[name]'
            } as SecretMission;
            this.createMoveOrUpdateCard(card, `all-secret-mission-cards`);
        });
    }

    public createMoveOrUpdateCard(card: SecretMission, destinationId: string, init: boolean = false, from: string = null) {
        const existingDiv = document.getElementById(`secret-mission-${card.id}`);
        const side = (card.type ? 0 : 1)
        if (existingDiv) {
            (this.game as any).removeTooltip(`secret-mission-${card.id}`);
            const oldType = Number(existingDiv.dataset.type);

            if (init) {
                document.getElementById(destinationId).appendChild(existingDiv);
            } else {
                slideToObjectAndAttach(this.game, existingDiv, destinationId);
            }
            existingDiv.dataset.side = ''+side;
            if (!oldType && card.type) {
                this.setVisibleInformations(existingDiv, card);
            }
            this.game.setTooltip(existingDiv.id, this.getTooltip(card.type, card.subType));
        } else {
            const div = document.createElement('div');
            div.id = `secret-mission-${card.id}`;
            div.classList.add('card', 'secret-mission');
            div.dataset.side = ''+side;
            div.dataset.type = ''+card.type;
            div.dataset.subType = ''+card.subType;

            div.innerHTML = `
                <div class="card-sides">
                    <div class="card-side front">
                        <div id="${div.id}-name" class="name"></div>
                    </div>
                    <div class="card-side back">
                    </div>
                </div>
            `;
            document.getElementById(destinationId).appendChild(div);

            if (from) {
                const fromCardId = document.getElementById(from).children[0].id;
                slideFromObject(this.game, div, fromCardId);
            }

            if (card.type) {
                this.setVisibleInformations(div, card);
            }
            this.game.setTooltip(div.id, this.getTooltip(card.type, card.subType));
        }
    }

    private setVisibleInformations(div: HTMLElement, card: SecretMission) {
        document.getElementById(`${div.id}-name`).innerHTML = _(card.name);
        div.dataset.type = ''+card.type;
        div.dataset.subType = ''+card.subType;
    }

    getTooltip(type: number, subType: number) {
        if (!type) {
            return _('Secret mission');
        }
        return 'TODO';
    }
}