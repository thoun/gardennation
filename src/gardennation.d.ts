/*interface Card {
    id: number;
    type: number;
    type_arg: number;
    location: string;
    location_arg: number;
}*/

interface BuildingFloor {
    id: number;
    playerId: number; // 0 for roof

}

interface Building {
    playerId: number;
    areaPosition: number;
    floors: number;
    roof: boolean;
    buildingFloors: BuildingFloor[];
}

interface AreaSpot {        
    type: number;
    bramble: boolean;
    building: Building;
}

interface GardenNationPlayer extends Player {
    playerNo: number;
    inhabitants: number;
    turnTrack: number;
    buildingFloors: BuildingFloor[];
    usedPloy: number[];
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
    map: { [position: number]: AreaSpot };
    torticranePosition: number;
}

interface GardenNationGame extends Game {
    onAreaClick(position: number): void;    
    getPlayerId(): number;
}

interface EnteringChooseActionArgs {
    canConstructBuilding: boolean;
    canAbandonBuilding: boolean;
    canUsePloy: boolean;
    canChangeTerritory: number | null;
}

interface EnteringConstructBuildingArgs {
    possiblePositions: number[];
}

interface EnteringChooseTypeOfLandArgs {
    possibleTypes: number[];
}

interface EnteringChooseNextPlayerArgs {
    possibleNextPlayers: number[];
}

interface NotifMoveTorticraneArgs {
    torticranePosition: number;
}

interface NotifSetPlayerOrderArgs {
    playerId: number;
    order: number;
}

interface NotifScoreArgs {
    playerId: number;
    newScore: number;
}

interface NotifInhabitantsArgs {
    playerId: number;
    newInhabitants: number;
}

interface NotifSetBrambleTypeArgs {
    areaPosition: number;
    type: number;
}
