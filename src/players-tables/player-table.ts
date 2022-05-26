class PlayerTable {
    public playerId: number;

    constructor(
        private game: GardenNationGame, 
        player: GardenNationPlayer) {

        this.playerId = Number(player.id);  

        let html = `
        <div id="player-table-${this.playerId}" class="player-table whiteblock">
            <div id="player-table-${this.playerId}-name" class="player-name" style="color: #${player.color};">${player.name}</div>
            <div id="player-table-${this.playerId}-score-board" class="player-score-board" data-color="${player.color}"></div>
        </div>`;

        dojo.place(html, 'playerstables');
    
    }
}