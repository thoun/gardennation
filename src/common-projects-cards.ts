class CommonProjectCards {
    constructor(private game: GardenNationGame) {}  

    // gameui.commonProjectCards.debugSeeAllCards()
    private debugSeeAllCards() {
        let html = `<div id="all-common-project-cards">`;
        html += `</div>`;
        dojo.place(html, 'full-table', 'before');

        [1, 2, 3, 4, 5, 6].forEach(subType => {
            const card = {
                id: 10+subType,
                side: 0,
                type: 1,
                subType,
                name: '[name]'
            } as any as CommonProject;
            this.createMoveOrUpdateCard(card, `all-common-project-cards`);
        });

        [2, 3, 4, 5, 6].forEach(type => 
            [1, 2, 3].forEach(subType => {
                const card = {
                    id: 10*type+subType,
                    side: 0,
                    type,
                    subType,
                    name: '[name]'
                } as any as CommonProject;
                this.createMoveOrUpdateCard(card, `all-common-project-cards`);
            })
        );
    }

    public createMoveOrUpdateCard(card: CommonProject, destinationId: string, init: boolean = false, from: string = null) {
        const existingDiv = document.getElementById(`common-project-${card.id}`);
        const side = (card.type ? 0 : 1)
        if (existingDiv) {
            (this.game as any).removeTooltip(`common-project-${card.id}`);
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
            div.id = `common-project-${card.id}`;
            div.classList.add('card', 'common-project');
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
            div.addEventListener('click', () => this.game.onCommonProjectClick(card));

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

    private setVisibleInformations(div: HTMLElement, card: CommonProject) {
        document.getElementById(`${div.id}-name`).innerHTML = _(card.name);
        div.dataset.type = ''+card.type;
        div.dataset.subType = ''+card.subType;
    }

    getTooltip(type: number, subType: number) {
        if (!type) {
            return _('Common projects deck');
        }
        return 'TODO';
    }
}