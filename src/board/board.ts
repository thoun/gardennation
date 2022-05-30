class Board {


    constructor(
        private game: GardenNationGame, 
        private players: GardenNationPlayer[],
        gamedatas: GardenNationGamedatas,
    ) {
        const territories = gamedatas.territories;
        const map = gamedatas.map;
        const torticranePosition = gamedatas.torticranePosition;

        document.getElementById(`order-track`).dataset.playerNumber = ''+players.length;

        this.createRemainingBrambleTokens(gamedatas.brambleIds);

        players.forEach(player => dojo.place(`
            <div id="order-token-${player.id}" class="token" data-color="${player.color}"></div>
        `, `order-track-${player.turnTrack}`));

        dojo.place(`<div id="torticrane-spot--1" class="torticrane-spot"></div>`, `board`);

        [0,1,2,3,4,5,6].forEach(territoryPosition => {
            const territoryNumber = territories[territoryPosition][0];
            const territoryRotation = territories[territoryPosition][1];
            dojo.place(`
                <div id="territory${territoryPosition}" class="territory" data-position="${territoryPosition}" data-number="${territoryNumber}" data-rotation="${territoryRotation}">
                    <div class="territory-number top">${territoryNumber}</div>
                    <div class="territory-number left">${territoryNumber}</div>
                    <div class="territory-number right">${territoryNumber}</div>
                    <div id="torticrane-spot-${territoryPosition}" class="torticrane-spot"></div>
                </div>
            `, `board`);

            [0,1,2,3,4,5,6].forEach(areaPosition => {
                const position = territoryNumber * 10 + areaPosition;
                const mapPosition: AreaSpot = map[position];
                const type = mapPosition.type;
                const bramble = mapPosition.bramble;
                let rotation = areaPosition;
                if (areaPosition > 0) {
                    rotation = (areaPosition + territoryRotation - 1) % 6 + 1;
                }
                dojo.place(`
                    <div id="area${position}" class="area" data-position="${position}" data-type="${type}" data-bramble="${bramble.toString()}" data-cost="${mapPosition[1]}" data-position="${areaPosition}" data-rotation="${rotation}">
                        <div class="land-number">${mapPosition.cost}</div>
                    </div>
                `, `territory${territoryPosition}`);

                document.getElementById(`area${position}`).addEventListener('click', () => this.game.onAreaClick(position));

                if (mapPosition.building) {
                    this.setBuilding(position, mapPosition.building);
                }
            });
        });

        dojo.place(`<div id="torticrane"></div>`, `torticrane-spot-${torticranePosition}`);
    }

    private createRemainingBrambleTokens(brambleIds: number[][]) {
        dojo.place(`
        <div id="remaining-bramble-tokens" class="whiteblock">
            <div class="title">${_('Remaining bramble tokens')}</div>
            <div id="remaining-bramble-tokens-container-1" class="container"></div>
            <div id="remaining-bramble-tokens-container-2" class="container"></div>
            <div id="remaining-bramble-tokens-container-3" class="container"></div>
            </div>
        </div>
        `, `board`);

        [1,2,3].forEach(type => brambleIds[type].forEach(id =>
                dojo.place(`<div id="bramble${id}" class="bramble-type-token" data-type="${type}"><div class="land-number">5</div></div>`, `remaining-bramble-tokens-container-${type}`)
        ));
    }
    
    setPoints(playerId: number, points: number) {
        // TODO
    }
    
    public activatePossibleAreas(possibleAreas: number[]) {
        Array.from(document.getElementsByClassName('area')).forEach((area: HTMLDivElement) => area.classList.toggle('selectable', possibleAreas.includes(Number(area.dataset.position))));
    }
    
    public setBrambleType(areaPosition: number, type: number, id: number) {
        const areaDiv = document.getElementById(`area${areaPosition}`);
        areaDiv.dataset.type = ''+type;
        // TODO slide with id
        const brambleDiv = document.getElementById(`bramble${id}`);
        brambleDiv?.parentElement?.removeChild(brambleDiv);
    }

    public setBuilding(areaPosition: number, building: Building | null) {
        const buildingDiv = document.getElementById(`building${areaPosition}`);
        if (building) {
            if (!buildingDiv) {
                dojo.place(`<div id="building${areaPosition}" class="building"></div>`, `area${areaPosition}`);
            }
            building.buildingFloors.forEach((floor, index) => {
                if (!document.getElementById(`building-floor-${floor.id}`)) {
                    dojo.place(`<div id="building-floor-${floor.id}" class="building-floor" data-color="${this.game.getPlayerColor(floor.playerId)}" style="z-index: ${index}"></div>`, `building${areaPosition}`);
                }
            });
        } else {
            buildingDiv?.parentElement?.removeChild(buildingDiv);
        }
    }

    highlightBuilding(buildingsToHighlight: Building[]) {
        buildingsToHighlight.forEach(building => 
            document.getElementById(`building${building.areaPosition}`)?.classList.add('highlight')
        );
    }
}