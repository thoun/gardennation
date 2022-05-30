<?php

require_once(__DIR__.'/objects/building-floor.php');
require_once(__DIR__.'/objects/building.php');
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
            
        $this->notifyAllPlayers('score', '', [
            'playerId' => $playerId,
            'newScore' => $this->getPlayer($playerId)->score,
        ]);
    }

    function incPlayerInhabitants(int $playerId, int $amount) {
        $this->DbQuery("UPDATE player SET `player_inhabitants` = `player_inhabitants` + $amount WHERE player_id = $playerId");
            
        $this->notifyAllPlayers('inhabitant', '', [
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

        $brambleAreasDb = $this->getCollectionFromDb("SELECT * FROM `bramble_area` WHERE `position` IS NOT NULL ORDER BY `position` ASC");
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
            
            $this->notifyAllPlayers('moveTorticrane', '', [
                'torticranePosition' => $territoryPosition,
            ]);
        }
    }

    function canUsePloy(int $playerId) {
        if (boolval($this->getGameStateValue(PLOY_USED))) {
            return false;
        }

        $player = $this->getPlayer($playerId);
        return 4 - array_reduce($player->usedPloy, fn($a, $b) => $a + $b, 0) > 0;
    }

    function applyChooseNextPlayer(int $playerId) {
        $players = $this->getPlayers();
        $maxOrder = max(array_map(fn($player) => $player->turnTrack, $players));
        $order = $maxOrder + 1;

        $this->DbQuery("UPDATE player SET `player_turn_track` = $order WHERE `player_id` = $playerId");

        $this->notifyAllPlayers('setPlayerOrder', clienttranslate('${player_name} is the next player'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'order' => $order,
        ]);
        
        $this->gamestate->nextState('nextPlayer');
    }

    function scoreTerritoryControl() {
        for ($i=1; $i<=7; $i++) {
            $playersIdsDb = $this->getCollectionFromDb("select player_id from (SELECT player_id, count(*) as `count` FROM `building_floor` where territory_number = $i and player_id <> 0 GROUP BY player_id ORDER BY 2 DESC) tmp WHERE tmp.count = (select max(tmp2.count) from (SELECT player_id, count(*) as `count` FROM `building_floor` where territory_number = $i and player_id <> 0 GROUP BY player_id ORDER BY 2 DESC) tmp2)");
            $playersIds = array_map(fn($playerIdDb) => intval($playerIdDb['player_id']), array_values($playersIdsDb));
            
            if (count($playersIds) > 0) {
                $buildingsToHighlight = $this->getTerritoryBuildings($i);
                $buildingsToHighlight = array_values(array_filter($buildingsToHighlight, fn($building) => in_array($building->playerId, $playersIds)));

                $alone = count($playersIds) == 1;
                $message = $alone ? 
                    clienttranslate('${player_name} controls the territory ${territoryNumber} and gains 2 inhabitants') :
                    clienttranslate('${playersNames} control the territory ${territoryNumber} gains 1 inhabitant');
                $args = [
                    'buildingsToHighlight' => $buildingsToHighlight,
                    'territoryNumber' => $i,
                ];
                if ($alone) {
                    $args['player_name'] = $this->getPlayerName($playersIds[0]);
                } else {
                    $args['playersNames'] = array_map(fn($playerId) => $this->getPlayerName($playerId), $playersIds);
                }
                $this->notifyAllPlayers('territoryControl', $message, $args);

                $inc = $alone ? 2 : 1;
                foreach($playersIds as $playerId) {
                    $this->incPlayerInhabitants($playerId, $inc);
                }
            }
        }
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
                $this->notifyAllPlayers('setPlayerOrder', '', [
                    'playerId' => $player->id,
                    'player_name' => $this->getPlayerName($player->id),
                    'order' => 0,
                ]);
            }
        }
        $this->notifyAllPlayers('setPlayerOrder', '', [
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

    function getBuildingByAreaPosition(int $areaPosition) {
        $buildings = $this->getTerritoryBuildings(floor($areaPosition / 10), $areaPosition % 10);
        return count($buildings) > 0 ? array_values($buildings)[0] : null;
    }

    function getTerritoryBuildings(/*int|null*/ $territoryNumber = null, /*int|null*/ $positionInTerritory = null) {
        $sql = "SELECT * FROM `building_floor` WHERE `territory_number` is not null";
        if ($territoryNumber !== null) {
            $sql .= " AND `territory_number` = $territoryNumber";
        }
        if ($positionInTerritory !== null) {
            $sql .= " AND `area_position` = $positionInTerritory";
        }
        $sql .= " ORDER BY `player_id` DESC";
        $buildingFloorsDb = $this->getCollectionFromDb($sql);
        $buildingFloors = array_map(fn($dbResult) => new BuildingFloor($dbResult), array_values($buildingFloorsDb));

        $buildings = [];

        foreach($buildingFloors as $buildingFloor) {
            $fullAreaPosition = $buildingFloor->territoryNumber * 10 + $buildingFloor->areaPosition;
            if (!array_key_exists($fullAreaPosition, $buildings)) {
                $buildings[$fullAreaPosition] = new Building($buildingFloor->playerId, $fullAreaPosition, 0, false);
            }

            if ($buildingFloor->playerId == 0) {
                $buildings[$fullAreaPosition]->roof = true;
            } else {
                $buildings[$fullAreaPosition]->floors++;
            }

            $buildings[$fullAreaPosition]->buildingFloors[] = $buildingFloor;
        }

        return $buildings;
    }

    function getCurrentTerritoryBuildings() {
        $territories = $this->getTerritories();
        
        $torticranePosition = intval($this->getGameStateValue(TORTICRANE_POSITION));
        $territoryBuildings = [];
        if ($torticranePosition == -1) {
            foreach ([1,2,3,4,5,6,7] as $number) {
                $territoryBuildings = array_merge($territoryBuildings, $this->getTerritoryBuildings($number));
            }
        } else {
            $territoryBuildings = $this->getTerritoryBuildings($territories[$torticranePosition][0]);
        }
        return $territoryBuildings;
    }

    function getAvailableBuildings(int $playerId) {
        $buildingFloorsDb = $this->getCollectionFromDb("SELECT * FROM `building_floor` WHERE player_id = $playerId AND `territory_number` is null");
        return array_values(array_map(fn($buildingFloorDb) => new BuildingFloor($buildingFloorDb), $buildingFloorsDb));
    }

    function placeBuildingFloor(int $playerId, int $territoryNumber, int $areaPosition, $message = '', $args = []) {
        $buildingFloorId = $this->getAvailableBuildings($playerId)[0]->id;

        $this->DbQuery("UPDATE `building_floor` SET `territory_number` = $territoryNumber, `area_position` = $areaPosition WHERE `id` = $buildingFloorId");
        
        $building = $this->getBuildingByAreaPosition($territoryNumber * 10 + $areaPosition);
        $this->notifyAllPlayers('setBuilding', $message, [
            'areaPosition' => $building->areaPosition,
            'building' => $building,
        ] + $args);

        return $buildingFloorId;
    }

    function removeBuilding(Building $building, $message = '', $args = []) {
        $buildingFloorsId = array_map(fn($buildingFloor) => $buildingFloor->id, $building->buildingFloors);
        $this->DbQuery("UPDATE `building_floor` SET `territory_number` = null, `area_position` = null WHERE `id` IN (".implode(',', $buildingFloorsId).")");
        
        $this->notifyAllPlayers('setBuilding', $message, [
            'areaPosition' => $building->areaPosition,
            'building' => null,
        ] + $args);
    }

    function getBuildingCost(Building $building) {
        $areaCost = $this->MAP[$building->areaPosition][1];
        $cost = 0;
        for ($i = 0; $i < $building->floors; $i++) {
            $cost += $areaCost + $i;
        }
        return $cost * 2;
    }
    
    function setPloyTokenUsed(int $playerId, int $type) {
        $player = $this->getPlayer($playerId);
        $player->usedPloy[$type - 1]++;
        $usedPloyStr = json_encode($player->usedPloy);

        $this->DbQuery("UPDATE `player` SET `player_used_ploy` = '$usedPloyStr' WHERE `player_id` = $playerId");

        $this->notifyAllPlayers('ployTokenUsed', '', [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'type' => $type,
        ]);
    }
}
