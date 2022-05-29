class Board {

    constructor(
        private game: GardenNationGame, 
        private players: GardenNationPlayer[],
        private territories: number[][],
        private map: { [position: number]: AreaSpot },
        torticranePosition: number
    ) {
        document.getElementById(`order-track`).dataset.playerNumber = ''+players.length;

        players.forEach(player => dojo.place(`
            <div id="order-token-${player.id}" class="token" data-color="${player.color}"></div>
        `, `order-track-${player.turnTrack}`));

        dojo.place(`<div id="torticrane-spot--1" class="torticrane-spot"></div>`, `board`);

        [0,1,2,3,4,5,6].forEach(territoryPosition => {
            const territoryNumber = territories[territoryPosition][0];
            const territoryRotation = territories[territoryPosition][1];
            dojo.place(`
                <div id="territory${territoryPosition}" class="territory" data-position="${territoryPosition}" data-number="${territoryNumber}" data-rotation="${territoryRotation}">
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
                    <div id="area${position}" class="area" data-position="${position}" data-type="${type}" data-bramble="${bramble.toString()}" data-cost="${mapPosition[1]}" data-position="${areaPosition}" data-rotation="${rotation}"></div>
                `, `territory${territoryPosition}`);

                document.getElementById(`area${position}`).addEventListener('click', () => this.game.onAreaClick(position));
            });
        });

        dojo.place(`<div id="torticrane"></div>`, `torticrane-spot-${torticranePosition}`);
    }
    
    setPoints(playerId: number, points: number) {
        // TODO
    }
    
    public activatePossibleAreas(possibleAreas: number[]) {
        Array.from(document.getElementsByClassName('area')).forEach((area: HTMLDivElement) => area.classList.toggle('selectable', possibleAreas.includes(Number(area.dataset.position))));
    }
    
    public setBrambleType(areaPosition: number, type: number) {
        const areaDiv = document.getElementById(`area${areaPosition}`);
        areaDiv.dataset.type = ''+type;
    }
}