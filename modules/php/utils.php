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
        return self::getUniqueValueFromDB("SELECT player_name FROM player WHERE player_id = $playerId");
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
        
        foreach ($playersIds as $playerId) {
            $this->buildingFloors->createCards([[ 'type' => 0, 'type_arg' => $playerId, 'nbr' => $count ]], 'table', $playerId);
        }

        $this->buildingFloors->createCards([[ 'type' => 1, 'type_arg' => 0, 'nbr' => 19 ]], 'table');
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

        $this->setGameStateValue(TORTICRANE_POSITION, $areaPositionUnrotated);
        
        self::notifyAllPlayers('moveTorticrane', '', [
            'torticranePosition' => $areaPositionUnrotated,
        ]);
    }
}
