const POINT_CASE_SIZE = 47.24;

/*
[1, 2],
[6, 0, 3],
[4, 5],
*/
const Z_INDEXES = [
    2,
    1,
    1,
    2,
    3,
    3,
    2,
]

class Board {
    private points = new Map<number, number>();

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

        let html = '';
        // points
        players.forEach(player =>
            html += `<div id="player-${player.id}-point-marker" class="point-marker ${/*this.game.isColorBlindMode() ? 'color-blind' : */''}" data-player-no="${player.playerNo}" style="background: #${player.color};"></div>`
        );
        dojo.place(html, 'board');
        players.forEach(player => {
            this.points.set(Number(player.id), Number(player.score));
        });
        this.movePoints();

        dojo.place(`<div id="torticrane-spot--1" class="torticrane-spot"></div>`, `board`);

        [0,1,2,3,4,5,6].forEach(territoryPosition => {
            const territoryNumber = territories[territoryPosition][0];
            const territoryRotation = territories[territoryPosition][1];
            dojo.place(`
                <div id="territory${territoryPosition}" class="territory" data-position="${territoryPosition}" data-number="${territoryNumber}" data-rotation="${territoryRotation}">
                    <div class="shadow"></div>
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
                const cost = mapPosition.cost;
                let rotation = areaPosition;
                if (areaPosition > 0) {
                    rotation = (areaPosition + territoryRotation - 1) % 6 + 1;
                }

                let zIndex = (Z_INDEXES[territoryPosition] - 1) * 3 + Z_INDEXES[rotation];

                let html = `<div id="area${position}" class="area" data-position="${position}" data-type="${type}" data-cost="${cost}" data-position="${areaPosition}" data-rotation="${rotation}" style="z-index: ${zIndex};">`;
                html += bramble && type ? `<div class="bramble-type-token" data-type="${type}"><div class="land-number">${cost}</div></div>` : `<div class="land-number">${cost}</div>`
                html += `</div>`;
                dojo.place(html, `territory${territoryPosition}`);

                document.getElementById(`area${position}`).addEventListener('click', () => this.game.onAreaClick(position));

                if (mapPosition.building) {
                    this.setBuilding(position, mapPosition.building);
                }
            });
        });

        dojo.place(`<div id="torticrane"></div>`, `torticrane-spot-${torticranePosition}`);
        document.getElementById(`board`).dataset.torticranePosition = ''+torticranePosition;
    }

    private createRemainingBrambleTokens(brambleIds: number[][]) {
        dojo.place(`
        <div id="remaining-bramble-tokens" class="whiteblock">
            <div id="remaining-bramble-tokens-containers">
                <div id="remaining-bramble-tokens-container-1" class="bramble-container"></div>
                <div id="remaining-bramble-tokens-container-2" class="bramble-container"></div>
                <div id="remaining-bramble-tokens-container-3" class="bramble-container"></div>
            </div>
            <div class="title">${_('Remaining bramble tokens')}</div>
            </div>
        </div>
        `, `board`);

        [1,2,3].forEach(type => brambleIds[type].forEach(id =>
                dojo.place(`<div id="bramble${id}" class="bramble-type-token" data-type="${type}"><div class="land-number">5</div></div>`, `remaining-bramble-tokens-container-${type}`)
        ));
    }

    private getPointsCoordinates(points: number) {
        const cases = points % 70;

        const top = cases >= 48 ? 0 : (24 - Math.max(0, cases - 24)) * POINT_CASE_SIZE;
        const left = cases < 48 ? (24 - Math.min(cases, 24)) * POINT_CASE_SIZE : (cases - 48)*POINT_CASE_SIZE;

        return [8 + left, 8 + top];
    }

    private movePoints() {
        this.points.forEach((points, playerId) => {
            const markerDiv = document.getElementById(`player-${playerId}-point-marker`);

            const coordinates = this.getPointsCoordinates(points);
            const left = coordinates[0];
            const top = coordinates[1];
    
            let topShift = 0;
            let leftShift = 0;
            this.points.forEach((iPoints, iPlayerId) => {
                if (iPoints % 70 === points % 70 && iPlayerId < playerId) {
                    topShift += 5;
                    leftShift += 5;
                }
            });
    
            markerDiv.style.transform = `translateX(${left + leftShift}px) translateY(${top + topShift}px)`;
        });
    }
    
    setPoints(playerId: number, points: number) {
        this.points.set(playerId, points);
        this.movePoints();
    }
    
    public activatePossibleAreasWithCost(possibleAreas: {[position: number]: number /* cost */}) {
        const playerColor = this.game.getPlayerColor(this.game.getPlayerId());
        Array.from(document.getElementsByClassName('area')).forEach((area: HTMLDivElement) => {
            const selectable = Object.keys(possibleAreas).includes(area.dataset.position);
            area.classList.toggle('selectable', selectable);
            if (selectable) {
                const cost = possibleAreas[area.dataset.position];
                const costStr = cost > 0 ? '+'+cost : cost;
                dojo.place(`<div id="cost-tag${area.dataset.position}" class="cost-tag"><span>${costStr}</span> <div class="icon inhabitant" data-color="${playerColor}"></div></div>`, area);
                this.game.setTooltip(`cost-tag${area.dataset.position}`, costStr);
            }
        });
    }
    
    public activatePossibleAreas(possibleAreas: number[], selectedPosition?: number) {
        Array.from(document.getElementsByClassName('area')).forEach((area: HTMLDivElement) => {
            area.classList.toggle('selectable', possibleAreas.includes(Number(area.dataset.position)))
            area.classList.toggle('selected', selectedPosition == Number(area.dataset.position))
        });
    }
    
    public setBrambleType(areaPosition: number, type: number, id: number) {
        const areaDiv = document.getElementById(`area${areaPosition}`);
        areaDiv.dataset.type = ''+type;
        const brambleDiv = document.getElementById(`bramble${id}`);
        slideToObjectAndAttach(this.game, brambleDiv, areaDiv.id);
    }

    public setBuilding(areaPosition: number, building: Building | null) {
        const buildingDiv = document.getElementById(`building${areaPosition}`) as HTMLDivElement;
        if (building) {
            if (!buildingDiv) {
                dojo.place(`<div id="building${areaPosition}" class="building"></div>`, `area${areaPosition}`);
            }
            building.buildingFloors.forEach((floor, index) => {
                const buildingFloorDiv = document.getElementById(`building-floor-${floor.id}`);
                if (!buildingFloorDiv) {
                    dojo.place(`<div id="building-floor-${floor.id}" class="building-floor" data-player-id="${floor.playerId}" data-color="${floor.playerId ? this.game.getPlayerColor(floor.playerId): 0}" style="z-index: ${10 + index}"></div>`, `building${areaPosition}`);
                } else {
                    const currentAreaDiv = buildingFloorDiv.closest('.area') as HTMLDivElement;
                    if (!currentAreaDiv || currentAreaDiv.id != `area${areaPosition}`) {
                        buildingFloorDiv.style.zIndex = '' + (10 + index);
                        slideToObjectAndAttach(this.game, buildingFloorDiv, `building${areaPosition}`);
                    }
                }
            });
        } else {
            Array.from(buildingDiv.children).forEach((child: HTMLDivElement) => 
                slideToObjectAndAttach(this.game, child, Number(child.dataset.playerId) ? `player-table-${child.dataset.playerId}-remaining-building-floors` : `remaining-roofs`));
            buildingDiv?.parentElement?.removeChild(buildingDiv);
        }
    }

    public highlightBuilding(buildingsToHighlight: Building[]) {
        buildingsToHighlight.forEach(building => 
            document.getElementById(`building${building.areaPosition}`)?.classList.add('highlight')
        );
    }

    public moveTorticrane(torticranePosition: number) {
        slideToObjectAndAttach(this.game, document.getElementById('torticrane'), `torticrane-spot-${torticranePosition}`);
        document.getElementById(`board`).dataset.torticranePosition = ''+torticranePosition;
    }
}