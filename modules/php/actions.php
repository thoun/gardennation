<?php

require_once(__DIR__.'/objects/common-project.php');

trait ActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in nicodemus.action.php)
    */
    

    public function chooseSecretMissions(array $ids) {
        self::checkAction('chooseSecretMissions');

        $playerId = intval($this->getCurrentPlayerId());

        if (count($ids) != 2) {
            throw new BgaUserException("You must choose exactly 2 secret missions");
        }
        
        $choices = $this->argChooseSecretMissions()['_private'][$playerId]['secretMissions'];
        if (!$this->array_some($ids, fn($id) => $this->array_some($choices, fn($choice) => $choice->id == $id))) {
            throw new BgaUserException("You must choose secret missions from the list");
        }

        $this->secretMissions->moveCards($ids, 'chosen', $playerId);

        $this->gamestate->setPlayerNonMultiactive($playerId, 'end');
    }

    public function cancelChooseSecretMissions() {
        $playerId = intval($this->getCurrentPlayerId());

        $this->secretMissions->moveAllCardsInLocation('chosen', 'choose', $playerId, $playerId);

        $this->gamestate->setPlayersMultiactive([$playerId], 'end', false);
    }

    public function chooseConstructBuilding() {
        self::checkAction('chooseConstructBuilding');

        $this->gamestate->nextState('constructBuilding');
    }
  	
    public function chooseAbandonBuilding() {
        self::checkAction('chooseAbandonBuilding');

        $this->gamestate->nextState('abandonBuilding');
    }
  	
    public function chooseUsePloyToken() {
        self::checkAction('chooseUsePloyToken');

        $this->gamestate->nextState('usePloyToken');
    }

    private function applyConstructBuildingFloor(int $areaPosition, bool $forced) {
        $playerId = intval($this->getActivePlayerId());
        $player = $this->getPlayer($playerId);

        $map = $this->getMap();
        $area = $map[$areaPosition];

        $building = $this->getBuildingByAreaPosition($areaPosition);
        if ($building != null && ($building->playerId != $playerId || $building->roof)) {
            throw new BgaUserException("Impossible to build on this building");
        }
        $cost = $area[1] + ($building == null ? 0 : $building->floors);
        if ($cost >= $player->inhabitants) {
            throw new BgaUserException("Not enough inhabitants");
        }

        if ($area[0] == 0) {
            $this->setGameStateValue(SELECTED_AREA_POSITION, $areaPosition);
            $this->gamestate->nextState('chooseTypeOfLand');
            return true;
        }
    
        $this->incPlayerInhabitants($playerId, -($cost * ($forced ? 2 : 1)));

        $message = $forced ? '' : ($building == null ? 
            clienttranslate('${player_name} starts a building on territory ${territoryNumber} and sends ${cost} inhabitant(s)') : 
            clienttranslate('${player_name} adds a floor to existing building on territory ${territoryNumber} and sends ${cost} inhabitants'));
        $args = [
            'player_name' => $this->getPlayerName($playerId),
            'territoryNumber' => floor($areaPosition / 10),
            'cost' => $cost,
        ];
        $this->placeBuildingFloor($playerId, floor($areaPosition / 10), $areaPosition % 10, $message, $args);

        if (!boolval($this->getGameStateValue(LAST_ROUND)) && count($this->getAvailableBuildingFloors($playerId)) == 0) {
            $this->setGameStateValue(LAST_ROUND, 1);
            
            self::notifyAllPlayers('lastTurn', clienttranslate('${player_name} played its last floor, starting last round!'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
            ]);
        }

        return false;

    }

    public function constructBuilding(int $areaPosition) {
        self::checkAction('constructBuilding');
        $playerId = intval($this->getActivePlayerId());

        if (!$this->applyConstructBuildingFloor($areaPosition, false)) { // not redirected to area choice
            $this->incStat(1, 'constructedFloors');
            $this->incStat(1, 'constructedFloors', $playerId);
            $this->incStat(1, 'actionsNumber');
            $this->incStat(1, 'actionsNumber', $playerId);

            $this->moveTorticrane($areaPosition);
                
            if ($this->checkCompletedCommonProjects($playerId, $areaPosition)) {
                // redirected to choose common project
                $this->setGameStateValue(SELECTED_AREA_POSITION, $areaPosition);
                $this->gamestate->nextState('chooseCompletedCommonProject');
                return;
            }

            $this->gamestate->nextState('endAction');
        }
    }
    
    public function cancelConstructBuilding() {
        self::checkAction('cancelConstructBuilding');

        $this->gamestate->nextState('cancel');
    }

    public function applyAbandonBuilding(Building $building, bool $forced) {
        $cost = $this->getBuildingCost($building);
        
        $this->incPlayerInhabitants($building->playerId, $cost);

        $message = $forced ? '' : clienttranslate('${player_name} abandons building on territory ${territoryNumber} and increases its population by ${cost} inhabitants');
        $args = [
            'player_name' => $this->getPlayerName($building->playerId),
            'territoryNumber' => floor($building->areaPosition / 10),
            'cost' => $cost,
        ];
        $this->removeBuilding($building, $message, $args);
    }

    public function abandonBuilding(int $areaPosition) {
        self::checkAction('abandonBuilding');
        
        $playerId = intval($this->getActivePlayerId());

        $building = $this->getBuildingByAreaPosition($areaPosition);
        if ($building == null || $building->playerId != $playerId) {
            throw new BgaUserException("No player building");
        }
        
        $this->applyAbandonBuilding($building, false);
        $this->incStat(1, 'abandonedBuildings');
        $this->incStat(1, 'abandonedBuildings', $playerId);
        $this->incStat(1, 'actionsNumber');
        $this->incStat(1, 'actionsNumber', $playerId);

        $this->moveTorticrane($areaPosition);

        $this->gamestate->nextState('endAction');
    }
    
    public function cancelAbandonBuilding() {
        self::checkAction('cancelAbandonBuilding');

        $this->gamestate->nextState('cancel');
    }

    public function chooseTypeOfLand(int $typeOfLand) {
        self::checkAction('chooseTypeOfLand');
        
        $playerId = intval($this->getActivePlayerId());
        
        $areaPosition = intval($this->getGameStateValue(SELECTED_AREA_POSITION));
        
        $id = intval($this->getUniqueValueFromDB("SELECT max(`id`) FROM `bramble_area` WHERE `position` IS NULL AND `type` = $typeOfLand"));
        $this->DbQuery("UPDATE `bramble_area` SET `position` = $areaPosition WHERE `id` = $id");

        $territoryNumber = floor($areaPosition / 10);
        $this->notifyAllPlayers('setBrambleType', clienttranslate('${player_name} chooses bramble ${brambleIcon} for territory ${territoryNumber}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'territoryNumber' => $territoryNumber,
            'areaPosition' => $areaPosition,
            'brambleIcon' => $typeOfLand,
            'type' => $typeOfLand,
            'brambleId' => $id,
        ]);

        $this->applyConstructBuildingFloor($areaPosition, false);
        $this->incStat(1, 'brambleAreasPlaced');
        $this->incStat(1, 'brambleAreasPlaced', $playerId);

        $this->moveTorticrane($areaPosition);
                
        if ($this->checkCompletedCommonProjects($playerId, $areaPosition)) {
            // redirected to choose common project
            $this->setGameStateValue(SELECTED_AREA_POSITION, $areaPosition);
            $this->gamestate->nextState('chooseCompletedCommonProject');
            return;
        }

        $this->gamestate->nextState('endAction');
    }
    
    public function cancelChooseTypeOfLand() {
        self::checkAction('cancelChooseTypeOfLand');

        $this->gamestate->nextState('cancel');
    }

    public function changeTerritory(int $territoryNumber) {
        self::checkAction('changeTerritory');

        $territories = $this->getTerritories();
        $newTerritoryPosition = $this->array_find_index($territories, fn($territory) => $territory[0] == $territoryNumber);

        $this->moveTorticraneToPosition($newTerritoryPosition);

        $this->gamestate->nextState('changeTerritory');
    }
    
    public function skipTurn() {
        self::checkAction('skipTurn');

        $this->gamestate->nextState('chooseNextPlayer');
    }

    public function chooseNextPlayer(int $playerId) {
        self::checkAction('chooseNextPlayer');

        $this->giveExtraTime($this->getActivePlayerId()); // not $playerId !

        if (!in_array($playerId, $this->argChooseNextPlayer()['possibleNextPlayers'])) {
            throw new BgaUserException("Invalid player choice");
        }

        $this->applyChooseNextPlayer($playerId);
    }

    public function usePloyToken(int $type) {
        self::checkAction('usePloyToken');
        
        switch ($type) {
            case 1:
                $this->gamestate->nextState('buildingInvasion');
                return;
            case 2:
                $this->gamestate->nextState('strategicMovement');
                return;
            case 3:
                $this->gamestate->nextState('roofTransfer');
                return;
        }

        throw new BgaUserException("Invalid action");
    }

    public function cancelUsePloyToken() {
        self::checkAction('cancelUsePloyToken');

        $this->gamestate->nextState('cancel');
    }

    public function strategicMovement(int $territoryNumber) {
        self::checkAction('strategicMovement');
        
        $playerId = intval($this->getActivePlayerId());
        $this->giveExtraTime($playerId);

        $args = $this->argStrategicMovement();
        if (!in_array($territoryNumber, [$args['down'], $args['up']])) {
            throw new BgaUserException("Invalid territory number");
        }

        $territories = $this->getTerritories();
        $newTerritoryPosition = $this->array_find_index($territories, fn($territory) => $territory[0] == $territoryNumber);

        $this->setPloyTokenUsed($playerId, 2);

        $this->incStat(1, 'usedPloys');
        $this->incStat(1, 'usedPloys', $playerId);
        $this->incStat(1, 'usedPloysStrategicMovement');
        $this->incStat(1, 'usedPloysStrategicMovement', $playerId);

        $this->notifyAllPlayers('log', clienttranslate('${player_name} makes a strategic movement to go to territory ${number}'), [
            'player_name' => $this->getPlayerName($playerId),
            'number' => $territoryNumber,
        ]);

        $this->moveTorticraneToPosition($newTerritoryPosition);

        $this->setGameStateValue(PLOY_USED, 1);
        $this->gamestate->nextState('endPloy');
    }

    public function cancelUsePloy() {
        self::checkAction('cancelUsePloy');

        $this->gamestate->nextState('cancel');
    } 

    public function chooseRoofToTransfer(int $areaPosition) {
        self::checkAction('chooseRoofToTransfer');
        
        $this->setGameStateValue(SELECTED_AREA_POSITION, $areaPosition);

        $this->gamestate->nextState('chooseRoofDestination');
    }

    public function chooseRoofDestination(int $areaPosition) {
        self::checkAction('chooseRoofDestination');
        
        $playerId = intval($this->getActivePlayerId());
        $this->giveExtraTime($playerId);
        
        $fromAreaPosition = intval($this->getGameStateValue(SELECTED_AREA_POSITION));

        $map = $this->getMap();
        if ($map[$fromAreaPosition][0] != $map[$areaPosition][0]) {
            throw new BgaUserException("Invalid land color");
        }
        
        $fromBuilding = $this->getBuildingByAreaPosition($fromAreaPosition);
        $toBuilding = $this->getBuildingByAreaPosition($areaPosition);

        if ($fromBuilding->playerId != $toBuilding->playerId) {
            throw new BgaUserException("Invalid building color");
        }

        $this->moveRoof($playerId, $fromBuilding, $toBuilding);

        $this->setPloyTokenUsed($this->getActivePlayerId(), 3);

        $this->incStat(1, 'usedPloys');
        $this->incStat(1, 'usedPloys', $playerId);
        $this->incStat(1, 'usedPloysRoofTransfer');
        $this->incStat(1, 'usedPloysRoofTransfer', $playerId);

        $this->setGameStateValue(PLOY_USED, 1);
        $this->gamestate->nextState('endPloy');
    }

    public function buildingInvasion(int $areaPosition) {
        self::checkAction('buildingInvasion');
        
        $playerId = intval($this->getActivePlayerId());

        $building = $this->getBuildingByAreaPosition($areaPosition);
        $cost = $this->getBuildingCost($building);
        if ($building == null || $building->playerId == $playerId) {
            throw new BgaUserException("No opponent building");
        }
        $remainingBuildingFloors = count($this->getAvailableBuildingFloors($playerId));
        if ($building->floors > $remainingBuildingFloors) {
            throw new BgaUserException("Not enough floors available");
        }
        
        $this->applyAbandonBuilding($building, true);
        for ($i = 0; $i < $building->floors; $i++) {
            $this->applyConstructBuildingFloor($areaPosition, true);
        }

        $this->setPloyTokenUsed($this->getActivePlayerId(), 1);

        $this->incStat(1, 'actionsNumber');
        $this->incStat(1, 'actionsNumber', $playerId);
        $this->incStat(1, 'usedPloys');
        $this->incStat(1, 'usedPloys', $playerId);
        $this->incStat(1, 'usedPloysBuildingInvasion');
        $this->incStat(1, 'usedPloysBuildingInvasion', $playerId);

        $this->notifyAllPlayers('log', clienttranslate('${player_name} invades a ${player_name2} ${floors}-floor(s) building and sends ${cost} inhabitants'), [
            'player_name' => $this->getPlayerName($playerId),
            'player_name2' => $this->getPlayerName($building->playerId),
            'floors' => $building->floors,
            'cost' => $cost,
        ]);

        $this->moveTorticrane($areaPosition);
                
        if ($this->checkCompletedCommonProjects($playerId, $areaPosition)) {
            // redirected to choose common project
            $this->setGameStateValue(SELECTED_AREA_POSITION, $areaPosition);
            $this->gamestate->nextState('chooseCompletedCommonProject');
            return;
        }

        $this->gamestate->nextState('endAction');
    }

    public function cancelBuildingInvasion() {
        self::checkAction('cancelBuildingInvasion');

        $this->gamestate->nextState('cancel');
    }

    public function chooseCompletedCommonProject(int $id) {
        self::checkAction('chooseCompletedCommonProject');
        
        $playerId = intval($this->getActivePlayerId());
        $this->giveExtraTime($playerId);
    
        $areaPosition = intval($this->getGameStateValue(SELECTED_AREA_POSITION));
        $completedCommonProjects = $this->getCompletedCommonProjects($playerId, $areaPosition);
    
        $commonProject = $this->array_find($completedCommonProjects, fn($completedCommonProject) => $completedCommonProject->id == $id);
        if ($commonProject == null) {
            throw new BgaUserException("Invalid common project");
        }

        $this->takeCompletedCommonProject($commonProject, $playerId, $areaPosition);

        $this->gamestate->nextState('endAction');
    }

    public function skipCompletedCommonProject() {
        self::checkAction('skipCompletedCommonProject');

        $this->gamestate->nextState('endAction');
    }
}
