class SecretMissionCards {
    constructor(private game: GardenNationGame) {}  

    // gameui.secretMissionCards.debugSeeAllCards()
    private debugSeeAllCards() {
        document.querySelectorAll('.card.secret-mission').forEach(card => card.remove());
        
        let html = `<div id="all-secret-mission-cards">`;
        html += `</div>`;
        dojo.place(html, 'full-table', 'before');

        [1, 2].forEach(type => 
            [1, 2, 3].forEach(subType => {
                const card = {
                    id: 10*type+subType,
                    type,
                    subType,
                    name: this.getTitle(type, subType)
                } as SecretMission;
                this.createMoveOrUpdateCard(card, `all-secret-mission-cards`);
            })
        );

        [1, 2].forEach(subType => {
            const card = {
                id: 10*3+subType,
                type: 3,
                subType,
                name: this.getTitle(3, subType)
            } as SecretMission;
            this.createMoveOrUpdateCard(card, `all-secret-mission-cards`);
        });

        [1, 2, 3, 4, 5, 6, 7].forEach(subType => {
            const card = {
                id: 10*4+subType,
                type: 4,
                subType,
                name: this.getTitle(4, subType)
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

            existingDiv.classList.remove('selected');
        } else {
            const div = document.createElement('div');
            div.id = `secret-mission-${card.id}`;
            div.classList.add('card', 'secret-mission');
            div.dataset.id = ''+card.id;
            div.dataset.side = ''+side;
            div.dataset.type = ''+card.type;
            div.dataset.subType = ''+card.subType;

            div.innerHTML = `
                <div class="card-sides">
                    <div class="card-side front">
                        <div id="${div.id}-name" class="name">${card.type ? this.getTitle(card.type, card.subType) : ''}</div>
                    </div>
                    <div class="card-side back">
                    </div>
                </div>
            `;
            document.getElementById(destinationId).appendChild(div);
            div.addEventListener('click', () => this.game.onSecretMissionClick(card));

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
        if (card.name) {
            document.getElementById(`${div.id}-name`).innerHTML = _(card.name);
        }
        div.dataset.type = ''+card.type;
        div.dataset.subType = ''+card.subType;
    }

    getTitle(type: number, subType: number) {
        switch(type) {
            case 1:
                switch(subType) {
                    case 1: return _('Market');
                    case 2: return _('Sculpture');
                    case 3: return _('Watchtower');
                }
            case 2:
                switch(subType) {
                    case 1: return _('Post Office');
                    case 2: return _('Cabaret');
                    case 3: return _('Barracks');
                }
            case 3:
                switch(subType) {
                    case 1: return _('Belfry');
                    case 2: return _('Observatory');
                }
            case 4:
                return _('Territory Control');
        }
            
    }

    getTooltip(type: number, subType: number) {
        if (!type) {
            return _('Secret mission');
        }
        return `<h3 class="title">${this.getTitle(type, subType)}</h3><div>${this.getTooltipDescription(type, subType)}</div>`;
    }

    getTooltipDescription(type: number, subType: number) {        
        switch (type) {
            case 1: return _('At the end of the game, each building the player has with at least 2 floors constructed on the indicated land type awards 3 VP (2 copies each).');
            case 2: return _('At the end of the game, each floor the player has on the indicated type of land awards 1 VP. So, a player who has a building with 3 floors and a building with 2 floors constructed on the indicated land type earns 5 VP (2 copies each).');
            case 3: switch (subType) {
                case 1: return _('At the end of the game, each building the player has with at least 3 floors is worth 7 VP, regardless of the type of land. Only one belfry can be counted per territory (3 copies).');
                case 2: return _('At the end of the game, each building the player has with at least 4 floors awards 11 VP, regardless of the type of land. Only one observatory can be counted per territory (2 copies).');
            };
            case 4: return _('At the end of the game, having the most floors in one of the two territories indicated awards the player 4 VP. Having the most floors in both territories awards 12 VP. The majority must not be shared. Buildings with roofs count for the calculation of majorities (7 different copies).');
        }
    }
}