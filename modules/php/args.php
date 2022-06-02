<?php

trait ArgsTrait {
    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */
   
    function argChooseAction() {
        $playerId = intval($this->getActivePlayerId());

        $remainingFloors = count($this->getAvailableBuildingFloors($playerId));
        $canConstructBuilding = $remainingFloors > 0 && count($this->argConstructBuilding()['possiblePositions']) > 0;
        $canAbandonBuilding = count($this->argAbandonBuilding()['possiblePositions']) > 0;
        $canUsePloy = $this->canUsePloy($playerId);

        $canChangeTerritory = null;
        if (!$canConstructBuilding) {
            $territories = $this->getTerritories();
            $currentTerritoryNumber = $territories[intval($this->getGameStateValue(TORTICRANE_POSITION))][0];
            $canChangeTerritory = ($currentTerritoryNumber + 4) % 6 + 1;
        }
    
        return [
            'remainingActions' => $this->getRemainingActions($playerId),
            'canConstructBuilding' => $canConstructBuilding,
            'canChangeTerritory' => $canChangeTerritory,
            'canAbandonBuilding' => $canAbandonBuilding,
            'canUsePloy' => $canUsePloy,
            'canSkipTurn' => $remainingFloors == 0,
        ];
    }
   
    function argConstructBuilding() {
        $playerId = intval($this->getActivePlayerId());
        $player = $this->getPlayer($playerId);

        $territoryPositions = $this->getTerritoryPositions();
        $possiblePositions = [];
        foreach ($territoryPositions as $position => $area) {
            $building = $this->getBuildingByAreaPosition($position);
            if ($building == null || ($building->playerId == $playerId && !$building->roof)) {
                $cost = $area[1] + ($building == null ? 0 : $building->floors);

                if ($cost < $player->inhabitants) {
                    $possiblePositions[$position] = -$cost;
                }
            }
        }
    
        return [
            'possiblePositions' => $possiblePositions,
        ];
    }
   
    function argAbandonBuilding() {
        $playerId = intval($this->getActivePlayerId());

        $territoryPositions = $this->getTerritoryPositions();
        $territoryBuildings = $this->getCurrentTerritoryBuildings();

        $possiblePositions = [];
        foreach ($territoryPositions as $areaPosition => $area) { 
            $existingBuilding = $this->array_find($territoryBuildings, fn($building) => $building->areaPosition == $areaPosition && $building->playerId == $playerId);
            if ($existingBuilding !== null) {
                $possiblePositions[$areaPosition] = $this->getBuildingCost($existingBuilding);
            }
        }
    
        return [
            'possiblePositions' => $possiblePositions,
        ];
    }

    function argChooseTypeOfLand() {
        $areaPosition = intval($this->getGameStateValue(SELECTED_AREA_POSITION));

        $brambleAreasDb = $this->getCollectionFromDb("SELECT `type`, count(*) as `count` FROM `bramble_area` WHERE `position` IS NULL GROUP BY `type`");
        $possibleTypes = [];
        foreach([1, 2, 3] as $type) {
            $brambleAreaDb = $this->array_find($brambleAreasDb, fn($brambleAreaDb) => intval($brambleAreaDb['type']) == $type);
            if ($brambleAreaDb != null && intval($brambleAreaDb['count']) > 0) {
                $possibleTypes[] = $type;
            }
        }
    
        return [
            'selectedPosition' => $areaPosition,
            'possibleTypes' => $possibleTypes,
        ];
    }

    function argChooseCompletedCommonProject() {
        $playerId = intval($this->getActivePlayerId());

        $areaPosition = intval($this->getGameStateValue(SELECTED_AREA_POSITION));
        $completedCommonProjects = $this->getCompletedCommonProjects($playerId, $areaPosition);

        return [
            'selectedPosition' => $areaPosition,
            'completedCommonProjects' => $completedCommonProjects,
        ];
    }

    function argChooseNextPlayer() {
        $players = $this->getPlayers();
        $playersAtOrderZero = array_values(array_filter($players, fn($player) => $player->turnTrack == 0));

        if (count($players) == 2 && count($playersAtOrderZero) == 0 && !$this->array_some($players, fn($player) => $player->turnTrack == 4)) {
            $playerId = intval($this->getActivePlayerId());

            return [
                'possibleNextPlayers' => [$this->array_find($players, fn($player) => $player->id != $playerId)->id],
            ];
        }

        return [
            'possibleNextPlayers' => array_map(fn($player) => $player->id, $playersAtOrderZero),
        ];
    }

    function argUsePloyToken() {
        $playerId = intval($this->getActivePlayerId());
        $buildings = $this->getTerritoryBuildings();

        $canInvade = $this->array_some($buildings, fn($building) => $building->playerId != $playerId);

        $canMoveTorticrane = intval($this->getGameStateValue(TORTICRANE_POSITION)) >= 0;

        $canTransferRoof = $this->array_some($buildings, fn($building) => $building->playerId == $playerId && $building->roof) && 
            $this->array_some($buildings, fn($building) => $building->playerId == $playerId && !$building->roof);

        return [
            'canInvade' => $canInvade,
            'canMoveTorticrane' => $canMoveTorticrane,
            'canTransferRoof' => $canTransferRoof,
        ];
    }

    function argStrategicMovement() {
        $territories = $this->getTerritories();
        $currentTerritoryNumber = $territories[intval($this->getGameStateValue(TORTICRANE_POSITION))][0];

        return [
            'down' => $currentTerritoryNumber == 1 ? 7 : $currentTerritoryNumber - 1,
            'up' => $currentTerritoryNumber == 7 ? 1 : $currentTerritoryNumber + 1,
        ];
    }
    
    function argChooseRoofToTransfer() {
        $playerId = intval($this->getActivePlayerId());
        $buildings = $this->getTerritoryBuildings();

        $possibleBuildings = array_values(array_filter($buildings, fn($building) => $building->playerId == $playerId && $building->roof));

        return [
            'possiblePositions' => array_map(fn($building) => $building->areaPosition, $possibleBuildings),
        ];
    }
    
    function argChooseRoofDestination() {
        $playerId = intval($this->getActivePlayerId());
        $buildings = $this->getTerritoryBuildings();

        $possibleBuildings = array_values(array_filter($buildings, fn($building) => $building->playerId == $playerId && !$building->roof));

        return [
            'possiblePositions' => array_map(fn($building) => $building->areaPosition, $possibleBuildings),
            'selectedPosition' => intval($this->getGameStateValue(SELECTED_AREA_POSITION)),
        ];
    }
    
    function argBuildingInvasion() {
        $playerId = intval($this->getActivePlayerId());
        $player = $this->getPlayer($playerId);
        $buildings = $this->getTerritoryBuildings();

        $remainingBuildingFloors = $this->getAvailableBuildingFloors($playerId);
        $possibleBuildings = array_values(array_filter($buildings, fn($building) => $building->playerId != $playerId && $this->getBuildingCost($building) < $player->inhabitants && $remainingBuildingFloors >= $building->floors));
        $possiblePositions = [];

        foreach ($possibleBuildings as $building) {
            $possiblePositions[$building->areaPosition] = -$this->getBuildingCost($building);
        }

        return [
            'possiblePositions' => $possiblePositions,
        ];
    }
    
}
