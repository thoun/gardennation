class Board {

    constructor(
        private game: GardenNationGame, 
        private players: GardenNationPlayer[],
        private territories: number[][],
    ) {
        document.getElementById(`order-track`).dataset.playerNumber = ''+players.length;

        [0,1,2,3,4,5,6].forEach(position => dojo.place(`
            <div class="territory" data-position="${position}" data-number="${territories[position][0]}" data-rotation="${territories[position][1]}"></div>
        `, `board`));
    }
}