/*interface Card {
    id: number;
    type: number;
    location: string;
    location_arg: number;
}*/

interface GardenNationPlayer extends Player {
}

/**
 * Your game interfaces
 */

interface GardenNationGamedatas {
    current_player_id: string;
    decision: {decision_type: string};
    game_result_neutralized: string;
    gamestate: Gamestate;
    gamestates: { [gamestateId: number]: Gamestate };
    neutralized_player_id: string;
    notifications: {last_packet_id: string, move_nbr: string}
    playerorder: (string | number)[];
    players: { [playerId: number]: GardenNationPlayer };
    tablespeed: string;

    // Add here variables you set up in getAllDatas
    territories: number[][]; // index 0 is the number of the territory, index 1 is the rotation
}

interface GardenNationGame extends Game {    
    getPlayerId(): number;
}

/*interface EnteringChooseAdventurerArgs {
    adventurers: Adventurer[];
}

interface NotifFirstPlayerArgs {
    playerId: number;
}*/
