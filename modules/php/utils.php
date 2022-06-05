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
        foreach ($array as $key => $value) {
            if($fn($value, $key)) {
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

    function incPlayerScore(int $playerId, int $amount, $message = '', $args = []) {
        $this->DbQuery("UPDATE player SET `player_score` = `player_score` + $amount WHERE player_id = $playerId");
            
        $this->notifyAllPlayers('score', $message, [
            'playerId' => $playerId,
            'newScore' => $this->getPlayer($playerId)->score,
        ] + $args);
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

    function getCommonProjectFromDb(array $dbCard) {
        if (!$dbCard || !array_key_exists('id', $dbCard)) {
            throw new \Error('card doesn\'t exists '.json_encode($dbCard));
        }
        $commonProjectCard = $this->array_find($this->COMMON_PROJECTS, fn($commonProject) => $commonProject->type == intval($dbCard['type']) && $commonProject->subType == intval($dbCard['type_arg']));
        return new CommonProject($dbCard, $commonProjectCard);
    }

    function getCommonProjectsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getCommonProjectFromDb($dbCard), array_values($dbCards));
    }

    function getSecretMissionFromDb(array $dbCard) {
        if (!$dbCard || !array_key_exists('id', $dbCard)) {
            throw new \Error('card doesn\'t exists '.json_encode($dbCard));
        }
        $secretMissionCard = $this->array_find($this->SECRET_MISSIONS, fn($secretMission) => $secretMission->type == intval($dbCard['type']) && $secretMission->subType == intval($dbCard['type_arg']));
        return new SecretMission($dbCard, $secretMissionCard);
    }

    function getSecretMissionsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getSecretMissionFromDb($dbCard), array_values($dbCards));
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
        if (boolval($this->getGameStateValue(PLOY_USED)) || intval($this->getGameStateValue(TORTICRANE_POSITION)) < 0) {
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

    function getTerritoryControlPlayersIds(int $territory) {
        $playersIdsDb = $this->getCollectionFromDb("select player_id from (SELECT player_id, count(*) as `count` FROM `building_floor` where territory_number = $territory and player_id <> 0 GROUP BY player_id ORDER BY 2 DESC) tmp WHERE tmp.count = (select max(tmp2.count) from (SELECT player_id, count(*) as `count` FROM `building_floor` where territory_number = $territory and player_id <> 0 GROUP BY player_id ORDER BY 2 DESC) tmp2)");
        return array_map(fn($playerIdDb) => intval($playerIdDb['player_id']), array_values($playersIdsDb));
    }

    function scoreTerritoryControl() {
        $territories = $this->getTerritories();

        for ($i=1; $i<=7; $i++) {
            $playersIds = $this->getTerritoryControlPlayersIds($i);
            
            if (count($playersIds) > 0) {
                $buildingsToHighlight = $this->getBuildings($i);
                $buildingsToHighlight = array_values(array_filter($buildingsToHighlight, fn($building) => in_array($building->playerId, $playersIds)));

                $alone = count($playersIds) == 1;
                $message = $alone ? 
                    clienttranslate('${player_name} controls the territory ${territoryNumber} and gains ${inhabitants} inhabitants') :
                    clienttranslate('${playersNames} control the territory ${territoryNumber} gains ${inhabitants} inhabitant');
                $args = [
                    'buildingsToHighlight' => $buildingsToHighlight,
                    'territoryNumber' => $i,
                    'territoryPosition' => $this->array_find_index($territories, fn($territory) => $territory[0] == $i),
                    'inhabitants' => $alone ? 2 : 1,
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

                    $this->incStat($inc, 'inhabitantsGainedWithTerritoryControl');
                    $this->incStat($inc, 'inhabitantsGainedWithTerritoryControl', $playerId);
                    $this->incStat(1, 'territoryControlWin');
                    $this->incStat(1, 'territoryControlWin', $playerId);
                    $this->incStat(1, $alone ? 'territoryControlWinAlone' : 'territoryControlWinShared');
                    $this->incStat(1, $alone ? 'territoryControlWinAlone' : 'territoryControlWinShared', $playerId);
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
        $buildings = $this->getBuildings(floor($areaPosition / 10), $areaPosition % 10);
        return count($buildings) > 0 ? array_values($buildings)[0] : null;
    }

    function getBuildings(/*int|null*/ $territoryNumber = null, /*int|null*/ $positionInTerritory = null) {
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
                $territoryBuildings = array_merge($territoryBuildings, $this->getBuildings($number));
            }
        } else {
            $territoryBuildings = $this->getBuildings($territories[$torticranePosition][0]);
        }
        return $territoryBuildings;
    }

    function getAvailableBuildingFloors(int $playerId) {
        $buildingFloorsDb = $this->getCollectionFromDb("SELECT * FROM `building_floor` WHERE player_id = $playerId AND `territory_number` is null");
        return array_values(array_map(fn($buildingFloorDb) => new BuildingFloor($buildingFloorDb), $buildingFloorsDb));
    }

    function placeBuildingFloor(int $playerId, int $territoryNumber, int $areaPosition, $message = '', $args = []) {
        $buildingFloorId = $this->getAvailableBuildingFloors($playerId)[0]->id;

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

    function moveRoof(int $playerId, Building $from, Building $to) {
        $buildingFloorId = $this->array_find($from->buildingFloors, fn($buildingFloor) => $buildingFloor->playerId == 0)->id;


        $territoryNumber = floor($to->areaPosition / 10);
        $areaPosition = $to->areaPosition % 10;

        $this->DbQuery("UPDATE `building_floor` SET `territory_number` = $territoryNumber, `area_position` = $areaPosition WHERE `id` = $buildingFloorId");
        
        $building = $this->getBuildingByAreaPosition($to->areaPosition);

        $this->notifyAllPlayers('setBuilding', clienttranslate('${player_name} moved a roof to another building'), [
            'player_name' => $this->getPlayerName($playerId),
            'areaPosition' => $building->areaPosition,
            'building' => $building,
        ]);
    }

    function addRoof(int $playerId, Building $building, CommonProject $commonProject) {
        $areaPosition = $building->areaPosition;
        $message = clienttranslate('${player_name} adds a roof to a building with common project ${cardName}');
        $args = [
            'player_name' => $this->getPlayerName($playerId),
            'cardName' => $commonProject->name,
            'i18n' => [ 'cardName' ],
        ];
        $this->placeBuildingFloor(0, floor($areaPosition / 10), $areaPosition % 10, $message, $args);
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

    function initCommonProjects() {
        $cards = [];
        foreach ($this->COMMON_PROJECTS as $commonProjectCard) {
            $cards[] = [ 'type' => $commonProjectCard->type , 'type_arg' => $commonProjectCard->subType, 'nbr' => 1 ];
        }
        $this->commonProjects->createCards($cards, 'deck');
        $this->commonProjects->shuffle('deck');
    }

    function initSecretMissions() {
        $cards = [];
        foreach ($this->SECRET_MISSIONS as $secretMissionCard) {
            $cards[] = [ 'type' => $secretMissionCard->type , 'type_arg' => $secretMissionCard->subType, 'nbr' => $secretMissionCard->nbr ];
        }
        $this->secretMissions->createCards($cards, 'deck');
        $this->secretMissions->shuffle('deck');
    }
    
    function setInitialCommonProjects() {
        for ($i = 1; $i <= 4; $i++) {
            $this->commonProjects->pickCardForLocation('deck', 'table', $i);
        }
    }
    
    function setInitialSecretMissions(array $playersIds) {
        foreach ($playersIds as $playerId) {
            $this->secretMissions->pickCards(2, 'deck', $playerId);
        }
    }

    function getAdjacentAreas(array $territories, array $map, int $areaPosition) {
        $territoryNumber = floor($areaPosition / 10);
        $areaNumber = $areaPosition % 10;
        if ($areaNumber % 10 == 0) {
            return array_values(array_filter(array_keys($map), fn($key) => $key != $areaPosition && floor($key / 10) == $territoryNumber));
        } else {            
            $adjacentCenter = $territoryNumber * 10;
            $before = $areaNumber == 1 ? $territoryNumber * 10 + 6 : $areaPosition - 1;
            $after = $areaNumber == 6 ? $territoryNumber * 10 + 1 : $areaPosition + 1;
            $adjacentAreas = [$before, $after, $adjacentCenter];

            $currentTerritoryIndex = $this->array_find_index($territories, fn($territory) => $territory[0] == $territoryNumber);
            $currentTerritoryRotation = $territories[$currentTerritoryIndex][1];
            $areaPositionUnrotated = ($areaNumber + $currentTerritoryRotation - 1) % 6 + 1;
            
            $mappingTerritoryUnrotated = $this->TERRITORY_AREA_INDEX_ADJACENT[$currentTerritoryIndex];
            if (array_key_exists($areaPositionUnrotated, $mappingTerritoryUnrotated)) {
                $mappingAreaUnrotated = $mappingTerritoryUnrotated[$areaPositionUnrotated];
                $adjacentTerritoryIndex = $mappingAreaUnrotated[0];
                $adjacentTerritoryRotation = $territories[$adjacentTerritoryIndex][1];
                $adjacentAreaFromAdjacentTerritory = 10 * $territories[$adjacentTerritoryIndex][0] + ($mappingAreaUnrotated[1] - $adjacentTerritoryRotation + 5) % 6 + 1;
                $adjacentAreas[] = $adjacentAreaFromAdjacentTerritory;
            }

            return $adjacentAreas;
        }
        
    }

    function isAssociatedBuildingsCommonProjectCompleted(array $territories, array $map, int $areaPosition, array $buildingsToMatch /* key 0 is min height, key 1 is area type*/, array $playerBuildings) {
        if (count($buildingsToMatch) == 0) {
            return true;
        }

        return $this->array_some($buildingsToMatch, function(array $buildingToMatch, int $index) use ($territories, $map, $areaPosition, $buildingsToMatch, $playerBuildings) {
            $minHeight = $buildingToMatch[0];
            $areaType = $buildingToMatch[1];
            if ($this->array_some($playerBuildings, fn($playerBuilding) => $playerBuilding->areaPosition == $areaPosition && $playerBuilding->floors >= $minHeight && $map[$playerBuilding->areaPosition][0] == $areaType)) {
                $remainingBuildingsToMatch = $buildingsToMatch; // copy
                array_splice($remainingBuildingsToMatch, $index, 1);
                $adjacentAreas = $this->getAdjacentAreas($territories, $map, $areaPosition);
                return $this->array_some($adjacentAreas, fn($adjacentArea) => $this->isAssociatedBuildingsCommonProjectCompleted($territories, $map, $adjacentArea, $remainingBuildingsToMatch, $playerBuildings));
            }
            return false;
        });
    }

    function isCommonProjectCompleted(CommonProject $commonProject, int $playerId, array $territories, array $map, Building $building, array $playerBuildings) {
        // no need to check roof on current building, as it was just constructed it can't have one
        switch ($commonProject->type) {
            case 1:
                if ($building->floors < 2 || $map[$building->areaPosition][0] != $commonProject->primaryColor) {
                    return false;
                }
                $adjacentAreas = $this->getAdjacentAreas($territories, $map, $building->areaPosition);
                return $this->array_some($adjacentAreas, fn($adjacentArea) => $map[$adjacentArea][0] == $commonProject->secondaryColor && $this->getBuildingByAreaPosition($adjacentArea) == null);
            case 2:
            case 5:
                $minLevel = $commonProject->type == 5 ? 3 : 2;
                if ($building->floors < $minLevel || $map[$building->areaPosition][0] != $commonProject->subType) {
                    return false;
                }
                $territoryIndex = $this->array_find_index($territories, fn($territory) => $territory[0] == floor($building->areaPosition / 10));
                return $commonProject->type == 5 ? $territoryIndex == 0 : $territoryIndex != 0;
            case 3:
                $buildingsToMatch = [[1, $commonProject->subType], [1, $commonProject->subType]];
                return $this->isAssociatedBuildingsCommonProjectCompleted($territories, $map, $building->areaPosition, $buildingsToMatch, $playerBuildings);
            case 4:
                $buildingsToMatch = [[2, $commonProject->subType], [1, $commonProject->subType]];
                //$this->debug([$buildingsToMatch, $this->isAssociatedBuildingsCommonProjectCompleted($territories, $map, $building->areaPosition, $buildingsToMatch, $playerBuildings)]);
                return $this->isAssociatedBuildingsCommonProjectCompleted($territories, $map, $building->areaPosition, $buildingsToMatch, $playerBuildings);
            case 6:
                $otherColors = array_values(array_filter([1, 2, 3], fn($color) => $color != $commonProject->subType));  
                foreach($otherColors as $otherColor) {
                    $buildingsToMatch = [[2, $commonProject->subType], [1, $otherColor]];
                    if ($this->isAssociatedBuildingsCommonProjectCompleted($territories, $map, $building->areaPosition, $buildingsToMatch, $playerBuildings)) {
                        $areasWithSubTypeColor = null;
                        if ($map[$building->areaPosition][0] == $commonProject->subType) {
                            $areasWithSubTypeColor = [$building->areaPosition];
                        } else {
                            //  if the main building of the objective is not at $building->areaPosition, we search the other lower building from the other areaPosition
                            $adjacentAreas = $this->getAdjacentAreas($territories, $map, $building->areaPosition);
                            foreach($adjacentAreas as $adjacentArea) {
                                if ($this->array_some($playerBuildings, fn($playerBuilding) => $playerBuilding->areaPosition == $adjacentArea && $playerBuilding->floors >= 2 && $map[$adjacentArea][0] == $commonProject->subType)) {
                                    $areasWithSubTypeColor[] = $adjacentArea;
                                }
                            }
                        }

                        $lastColor = array_values(array_filter([1, 2, 3], fn($color) => $color != $commonProject->subType && $color != $otherColor))[0];
                        $buildingsToMatch = [[2, $commonProject->subType], [1, $lastColor]];
                        foreach($areasWithSubTypeColor as $areaWithSubTypeColor) {
                            if ($this->isAssociatedBuildingsCommonProjectCompleted($territories, $map, $areaWithSubTypeColor, $buildingsToMatch, $playerBuildings)) {
                                return true;
                            }
                        }
                    }
                }
                return false;
        }
        
        return false;
    }

    function getCompletedCommonProjects(int $playerId, int $areaPosition) {
        $territories = $this->getTerritories();
        $map = $this->getMap();
        $buildings = $this->getBuildings();
        $playerBuildings = array_values(array_filter($buildings, fn($building) => $building->playerId == $playerId));
        $building = $this->array_find($playerBuildings, fn($building) => $building->areaPosition == $areaPosition);

        $commonProjects = $this->getCommonProjectsFromDb($this->commonProjects->getCardsInLocation('table', null, 'location_arg'));
        return array_values(array_filter($commonProjects, fn($commonProject) => $this->isCommonProjectCompleted($commonProject, $playerId, $territories, $map, $building, $playerBuildings)));
    }

    function checkCompletedCommonProjects(int $playerId, int $areaPosition) {
        // check objectives if there is at least 1 remaining roof
        if (count($this->getAvailableBuildingFloors(0)) == 0) {
            return false;
        }

        $completedCommonProjects = $this->getCompletedCommonProjects($playerId, $areaPosition);

        if (count($completedCommonProjects) > 0) {
            if (count($completedCommonProjects) > 1) {
                return true;
            }
            
            $this->takeCompletedCommonProject($completedCommonProjects[0], $playerId, $areaPosition);
        }

        return false;
    }

    function takeCompletedCommonProject(CommonProject $commonProject, int $playerId, int $areaPosition) {
        $building = $this->getBuildingByAreaPosition($areaPosition);

        $playerName = $this->getPlayerName($playerId);

        $this->commonProjects->moveCard($commonProject->id, 'hand', $playerId);
        $this->notifyAllPlayers('takeCommonProject', clienttranslate('${player_name} completes common project ${cardName}'), [
            'playerId' => $playerId,
            'player_name' => $playerName,
            'cardName' => $commonProject->name,
            'commonProject' => $commonProject,
            'i18n' => [ 'cardName' ],
        ]);

        $this->addRoof($playerId, $building, $commonProject);

        $this->incPlayerScore($playerId, $commonProject->points, clienttranslate('${player_name} gains ${points} victory points with common project ${cardName}'), [
            'player_name' => $playerName,
            'points' => $commonProject->points,
            'cardName' => $commonProject->name,
            'i18n' => [ 'cardName' ],
        ]);

        $newCommonProject = $this->getCommonProjectFromDb($this->commonProjects->pickCardForLocation('deck', 'table', $commonProject->locationArg));

        $this->notifyAllPlayers('newCommonProject', clienttranslate('A new common project is revealed: ${cardName}'), [
            'cardName' => $newCommonProject->name,
            'commonProject' => $newCommonProject,
            'i18n' => [ 'cardName' ],
        ]);

        $this->incStat(1, 'completedCommonProjects');
        $this->incStat(1, 'completedCommonProjects', $playerId);
        $this->incStat($commonProject->points, 'pointsWithCommonProjects');
        $this->incStat($commonProject->points, 'pointsWithCommonProjects', $playerId);
    }
}
