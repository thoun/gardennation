class PlayerTable {
    public playerId: number;

    constructor(
        private game: GardenNationGame, 
        player: GardenNationPlayer) {

        this.playerId = Number(player.id);      
    }
}