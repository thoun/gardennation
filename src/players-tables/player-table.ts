class PlayerTable {
    public playerId: number;

    constructor(
        private game: GardenNationGame, 
        player: GardenNationPlayer) {

        this.playerId = Number(player.id);  

        let html = `
        <div id="player-table-${this.playerId}" class="player-table whiteblock">
            <div id="player-table-${this.playerId}-name" class="player-name" style="color: #${player.color};">${player.name}</div>
            <div id="player-table-${this.playerId}-score-board" class="player-score-board" data-color="${player.color}">
                <div id="player-table-${this.playerId}-meeple-marker" class="meeple-marker" data-color="${player.color}"></div>
            </div>
        </div>`;

        dojo.place(html, 'playerstables');
    
        this.setInhabitants(player.inhabitants);
    }

    private getPointsCoordinates(points: number) {
        const cases = Math.min(points, 40);

        const top = points <= 20 ? 0 : 44;
        const left = (cases % 20) * 29.5;

        return [-17 + left, 203 + top];
    }

    public setInhabitants(points: number) {
        const markerDiv = document.getElementById(`player-table-${this.playerId}-meeple-marker`);

        const coordinates = this.getPointsCoordinates(points);
        const left = coordinates[0];
        const top = coordinates[1];

        markerDiv.style.transform = `translateX(${left}px) translateY(${top}px)`;
    }
}