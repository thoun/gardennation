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
    cost: number;
    bramble: boolean;
    building: Building;
}

interface CommonProject {
    id: number;
    type: number;
    subType: number;
    location: string;
    locationArg: number;
    name: string;
}

interface SecretMission {
    id: number;
    type: number;
    subType: number;
    name: string;
    territories?: number[];
    location: string;
}

interface GardenNationPlayer extends Player {
    playerNo: number;
    inhabitants: number;
    turnTrack: number;
    buildingFloors: BuildingFloor[];
    usedPloy: number[];
    commonProjects: CommonProject[];
    secretMissions: SecretMission[];
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
    brambleIds: number[][];
    remainingRoofs: BuildingFloor[];
    torticranePosition: number;
    commonProjects: CommonProject[];
    endTurn: boolean;
}

interface GardenNationGame extends Game {
    commonProjectCards: CommonProjectCards;
    secretMissionCards: SecretMissionCards;
    
    onAreaClick(position: number): void;
    getPlayerId(): number;
    getPlayerColor(playerId: number): string;
    setTooltip(id: string, html: string): void;
    onCommonProjectClick(card: CommonProject): void;
    onSecretMissionClick(card: SecretMission): void;
    //tableHeightChange();
}

interface EnteringChooseSecretMissionsArgs {
    _private: {
        secretMissions: SecretMission[];
    };
}

interface EnteringChooseActionArgs {
    canConstructBuilding: boolean;
    canAbandonBuilding: boolean;
    canUsePloy: boolean;
    canChangeTerritory: number | null;
    canSkipTurn: boolean;
}

interface EnteringSelectAreaPositionWithCostArgs {
    possiblePositions: {[position: number]: number /* cost */};
    selectedPosition?: number;
}

interface EnteringSelectAreaPositionArgs {
    possiblePositions: number[];
    selectedPosition?: number;
}

interface EnteringChooseTypeOfLandArgs {
    possibleTypes: number[];
}

interface EnteringChooseCompletedCommonProjectArgs extends EnteringSelectAreaPositionArgs {
    completedCommonProjects: CommonProject[];
}

interface EnteringChooseNextPlayerArgs {
    possibleNextPlayers: number[];
}

interface EnteringUsePloyTokenArgs {
    canInvade: boolean;
    canMoveTorticrane: boolean;
    canTransferRoof: boolean;
}

interface EnteringStrategicMovementArgs {
    down: number;
    up: number;
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

interface NotifGiveSecretMissionsArgs {
    playerId: number;
    secretMissions: SecretMission[];
}
interface NotifGiveSecretMissionsIdsArgs {
    secretMissionsIds: {[playerId: number]: number[]};
}

interface NotifSetBrambleTypeArgs {
    areaPosition: number;
    type: number;
    brambleId: number;
}

interface NotifSetBuildingArgs {
    areaPosition: number;
    building: Building | null;
}

interface NotifTerritoryControlArgs {
    territoryNumber: number | string;
    territoryPosition: number;
    buildingsToHighlight: Building[];
    inc: number;
}

interface NotifPloyTokenUsedArgs {
    playerId: number;
    type: number;
}

interface NotifTakeCommonProjectArgs {
    playerId: number;
    commonProject: CommonProject;
}

interface NotifRevealSecretMissionArgs {
    playerId: number;
    secretMission: SecretMission;
}