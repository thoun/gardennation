<?php

require_once(__DIR__.'/objects/building-floor.php');
require_once(__DIR__.'/objects/player.php');

trait UtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function array_find(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return $value;
            }
        }
        return null;
    }

    function array_find_index(array $array, callable $fn) {
        foreach ($array as $key => $value) {
            if($fn($value)) {
                return $key;
            }
        }
        return null;
    }

    function array_find_key(array $array, callable $fn) {
        foreach ($array as $key => $value) {
            if($fn($value)) {
                return $key;
            }
        }
        return null;
    }

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return true;
            }
        }
        return false;
    }
    
    function array_every(array $array, callable $fn) {
        foreach ($array as $value) {
            if(!$fn($value)) {
                return false;
            }
        }
        return true;
    }

    function array_identical(array $a1, array $a2) {
        if (count($a1) != count($a2)) {
            return false;
        }
        for ($i=0;$i<count($a1);$i++) {
            if ($a1[$i] != $a2[$i]) {
                return false;
            }
        }
        return true;
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getPlayerName(int $playerId) {
        return $this->getUniqueValueFromDB("SELECT player_name FROM player WHERE player_id = $playerId");
    }

    function getPlayer(int $id) {
        $sql = "SELECT * FROM player WHERE player_id = $id";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbResult) => new GardenNationPlayer($dbResult), array_values($dbResults))[0];
    }

    function getPlayers() {
        $sql = "SELECT * FROM player ORDER BY player_no";
        $dbResults = $this->getCollectionFromDb($sql);
        return array_map(fn($dbResult) => new GardenNationPlayer($dbResult), array_values($dbResults));
    }

    function incPlayerScore(int $playerId, int $amount) {
        $this->DbQuery("UPDATE player SET `player_score` = `player_score` + $amount WHERE player_id = $playerId");
            
        self::notifyAllPlayers('score', '', [
            'playerId' => $playerId,
            'newScore' => $this->getPlayer($playerId)->score,
        ]);
    }

    function incPlayerInhabitants(int $playerId, int $amount) {
        $this->DbQuery("UPDATE player SET `player_inhabitants` = `player_inhabitants` + $amount WHERE player_id = $playerId");
            
        self::notifyAllPlayers('inhabitant', '', [
            'playerId' => $playerId,
            'newInhabitants' => $this->getPlayer($playerId)->inhabitants,
        ]);
    }

    function getBuildingFloorFromDb(array $dbCard) {
        if (!$dbCard || !array_key_exists('id', $dbCard)) {
            throw new \Error('card doesn\'t exists '.json_encode($dbCard));
        }
        return new BuildingFloor($dbCard);
    }

    function getBuildingFloorsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getBuildingFloorFromDb($dbCard), array_values($dbCards));
    }

    function setupBuildingFloors(array $playersIds) {
        $count = $this->BUILDING_FLOORS[count($playersIds)];

        $sql = "INSERT INTO `building_floor`(`player_id`) VALUES ";
        $values = [];
        foreach ($playersIds as $playerId) {
            for ($i = 1; $i <= $count; $i++) {
                $values[] = "($playerId)";
            }
        }
        for ($i = 1; $i <= 19; $i++) {
            $values[] = "(0)";
        }
        $sql .= implode(',', $values);
        self::DbQuery($sql);
    }

    function getTerritories() {        
        $territoriesDb = $this->getCollectionFromDb("SELECT * FROM `territory` ORDER BY `position` ASC");
        return array_map(fn($territoryDb) => [intval($territoryDb['number']), intval($territoryDb['rotation'])], $territoriesDb);
    }

    function getMap() {
        $map = $this->MAP;

        $brambleAreasDb = $this->getCollectionFromDb("SELECT * FROM `bramble_area` ORDER BY `position` ASC");
        foreach ($brambleAreasDb as $brambleAreaDb) {
            $map[intval($brambleAreaDb['position'])][0] = intval($brambleAreaDb['type']) + 10;
        }
        
        return $map;
    }

    function getRemainingActions(int $playerId) {
        $player = $this->getPlayer($playerId);

        return ($player->turnTrack == 1 ? 1 : 2) - intval($this->getGameStateValue(PLAYED_ACTIONS));
    }
    
    function moveTorticrane(int $areaPosition) {
        $territories = $this->getTerritories();
        $currentTerritoryPosition = $this->array_find_index($territories, fn($territory) => $territory[0] == floor($areaPosition / 10));
        $currentTerritoryRotation = $territories[$currentTerritoryPosition][1];
        $areaPositionUnrotated = $areaPosition % 10;
        if ($areaPositionUnrotated > 0) {
            $areaPositionUnrotated = ($areaPositionUnrotated + $currentTerritoryRotation - 1) % 6 + 1;
        }

        $this->moveTorticraneToPosition($areaPositionUnrotated);
    }
    
    function moveTorticraneToPosition(int $territoryPosition) {
        if ($territoryPosition != intval($this->getGameStateValue(TORTICRANE_POSITION))) {
            $this->setGameStateValue(TORTICRANE_POSITION, $territoryPosition);
            
            self::notifyAllPlayers('moveTorticrane', '', [
                'torticranePosition' => $territoryPosition,
            ]);
        }
    }

    function canUsePloy(int $playerId) {
        $player = $this->getPlayer($playerId);
        return 4 - array_reduce($player->usedPloy, fn($a, $b) => $a + $b, 0) > 0;
    }

    function applyChooseNextPlayer(int $playerId) {
        $players = $this->getPlayers();
        $maxOrder = max(array_map(fn($player) => $player->turnTrack, $players));
        $order = $maxOrder + 1;

        $this->DbQuery("UPDATE player SET `player_turn_track` = $order WHERE `player_id` = $playerId");

        self::notifyAllPlayers('setPlayerOrder', clienttranslate('${player_name} is the next player'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'order' => $order,
        ]);
        
        $this->gamestate->nextState('nextPlayer');
    }

    function scoreTerritoryControl() {
        // TODO
        self::notifyAllPlayers('log', 'TODO scoreTerritoryControl', []);
    }

    function resetPlayerOrder() {        
        $players = $this->getPlayers();
        $maxOrder = max(array_map(fn($player) => $player->turnTrack, $players));
        $playerId = $this->array_find($players, fn($player) => $player->turnTrack == $maxOrder)->id;

        $this->setGameStateValue(PLAYED_ACTIONS, 0);
        $this->setGameStateValue(PLOY_USED, 0);

        $this->DbQuery("UPDATE player SET `player_turn_track` = 0 WHERE `player_id` <> $playerId");
        $this->DbQuery("UPDATE player SET `player_turn_track` = 1 WHERE `player_id` = $playerId");

        foreach ($players as $player) {
            if ($player->id != $playerId) {
                self::notifyAllPlayers('setPlayerOrder', '', [
                    'playerId' => $player->id,
                    'player_name' => $this->getPlayerName($player->id),
                    'order' => 0,
                ]);
            }
        }
        self::notifyAllPlayers('setPlayerOrder', '', [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'order' => 1,
        ]);
    }

    function getTerritoryPositions() {
        $territories = $this->getTerritories();
        $map = $this->getMap();
        
        $torticranePosition = intval($this->getGameStateValue(TORTICRANE_POSITION));
        $territoryPositions = [];
        foreach ($map as $mapPosition => $area) {
            if ($torticranePosition == -1 || floor($mapPosition / 10) == $territories[$torticranePosition][0]) {
                $territoryPositions[$mapPosition] = $area;
            }
        }

        return $territoryPositions;
    }

    function getTerritoryBuildingByAreaPosition(int $areaPosition) {
        return $this->getTerritoryBuildingsForTerritoryNumber(floor($areaPosition / 10), $areaPosition % 10);
    }

    function getTerritoryBuildingsForTerritoryNumber(int $territoryNumber, $positionInTerritory = null) {
        // TODO Building
        return [];
    }

    function getTerritoryBuildings() {
        $territories = $this->getTerritories();
        
        $torticranePosition = intval($this->getGameStateValue(TORTICRANE_POSITION));
        $territoryBuildings = [];
        if ($torticranePosition == -1) {
            foreach ([1,2,3,4,5,6,7] as $number) {
                $territoryBuildings = array_merge($territoryBuildings, $this->getTerritoryBuildingsForTerritoryNumber($number));
            }
        } else {
            $territoryBuildings = $this->getTerritoryBuildingsForTerritoryNumber($territories[$torticranePosition][0]);
        }
        return $territoryBuildings;
    }

    function getAvailableBuildingsIds(int $playerId) {
        $buildingFloorsIdsDb = $this->getCollectionFromDb("SELECT `id` FROM `building_floor` WHERE player_id = $playerId AND `territory_number` is null");
        return array_values(array_map(fn($buildingFloorsIdDb) => intval($buildingFloorsIdDb['id']), $buildingFloorsIdsDb));
    }

    function placeBuildingsFloor(int $playerId, int $territoryNumber, int $areaPosition, $message = '') {
        $buildingFloorId = $this->getAvailableBuildingsIds($playerId)[0];

        $this->DbQuery("UPDATE `building_floor` SET `territory_number` = $territoryNumber, `area_position` = $areaPosition WHERE `id` = $buildingFloorId");
        
        // TODO notif

        return $buildingFloorId;
    }
}
