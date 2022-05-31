<?php

trait ActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in nicodemus.action.php)
    */
    
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
            $this->setGameStateValue(BRAMBLE_CHOICE_AREA, $areaPosition);
            $this->gamestate->nextState('chooseTypeOfLand');
            return;
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

        if (!boolval($this->getGameStateValue(LAST_ROUND)) && count($this->getAvailableBuildings($playerId)) == 0) {
            $this->setGameStateValue(LAST_ROUND, 1);
            
            self::notifyAllPlayers('lastTurn', clienttranslate('${player_name} played its last floor, starting last round!'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
            ]);
        }

        /*$allPlacedRoutes = $this->getPlacedRoutes();
        $playerPlacedRoutes = array_filter($allPlacedRoutes, fn($placedRoute) => $placedRoute->playerId === $playerId);
        $currentPosition = $this->getCurrentPosition($playerId, $playerPlacedRoutes);
        $from = $currentPosition == $routeFrom ? $routeFrom : $routeTo;
        $to = $currentPosition == $routeFrom ? $routeTo : $routeFrom;
        $turnShape = $this->getPlayerTurnShape($playerId);
        $possibleRoutes = $this->getPossibleRoutes($playerId, $this->getMap(), $turnShape, $currentPosition, $allPlacedRoutes);
        $possibleRoute = $this->array_find($possibleRoutes, fn($route) => $this->isSameRoute($route, $from, $to));

        if ($possibleRoute == null) {
            throw new BgaUserException("Invalid route");
        }

        $round = $this->getRoundNumber();
        $useTurnZone = $possibleRoute->useTurnZone ? 1 : 0;
        $this->DbQuery("INSERT INTO placed_routes(`player_id`, `from`, `to`, `round`, `use_turn_zone`, `traffic_jam`) VALUES ($playerId, $from, $to, $round, $useTurnZone, $possibleRoute->trafficJam)");

        $mapElements = $this->MAP_POSITIONS[$this->getMap()][$to];
        $zones = array_map(fn($element) => floor($element / 10), $mapElements);
        $zones = array_unique(array_filter($zones, fn($zone) => $zone >=2 && $zone <= 5));
        if ($useTurnZone) {            
            $zones[] = 6;
        }
        if ($possibleRoute->trafficJam > 0) {            
            $zones[] = 7;
        }

        $logElements = array_values(array_filter($mapElements, fn($element) => in_array($element, [0, 20, 30, 32, 40, 41, 42, 50, 51])));
        
        $this->notifyAllPlayers('placedRoute', clienttranslate('${player_name} places a route marker to ${elements}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'marker' => PlacedRoute::forNotif($from, $to, false),
            'zones' => $zones,
            'position' => $to,
            'elements' => $logElements,
        ]);

        if ($possibleRoute->isElimination) {
            $this->setGameStateValue(ELIMINATE_PLAYER, $playerId);
            $this->applyConfirmTurn($playerId);
        }

        $this->notifUpdateScoreSheet($playerId);

        //self::incStat(1, 'placedRoutes');
        //self::incStat(1, 'placedRoutes', $playerId);*/
    }

    public function constructBuilding(int $areaPosition) {
        self::checkAction('constructBuilding');

        $this->applyConstructBuildingFloor($areaPosition, false);

        $this->moveTorticrane($areaPosition);

        $this->gamestate->nextState('endAction');
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
        
        $areaPosition = intval($this->getGameStateValue(BRAMBLE_CHOICE_AREA));
        
        $id = intval($this->getUniqueValueFromDB("SELECT max(`id`) FROM `bramble_area` WHERE `position` IS NULL AND `type` = $typeOfLand"));
        $this->DbQuery("UPDATE `bramble_area` SET `position` = $areaPosition WHERE `id` = $id");

        $territoryNumber = floor($areaPosition / 10);
        $this->notifyAllPlayers('setBrambleType', clienttranslate('${player_name} choses bramble ${brambleIcon} for territory ${territoryNumber}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'territoryNumber' => $territoryNumber,
            'areaPosition' => $areaPosition,
            'brambleIcon' => $typeOfLand,
            'type' => $typeOfLand,
            'brambleId' => $id,
        ]);

        $this->applyConstructBuildingFloor($areaPosition, false);

        $this->moveTorticrane($areaPosition);

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

        if (!in_array($playerId, $this->argChooseNextPlayer()['possibleNextPlayers'])) {
            throw new BgaUserException("Invalid player choice");
        }

        $this->applyChooseNextPlayer($playerId);
    }

    public function usePloyToken(int $type) {
        self::checkAction('usePloyToken');
        
        switch ($type) {
            case 1:
                $this->gamestate->nextState('strategicMovement');
                return;
            case 2:
                $this->gamestate->nextState('roofTransfer');
                return;
            case 3:
                $this->gamestate->nextState('buildingInvasion');
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

        $args = $this->argStrategicMovement();
        if (!in_array($territoryNumber, [$args['down'], $args['up']])) {
            throw new BgaUserException("Invalid territory number");
        }

        $territories = $this->getTerritories();
        $newTerritoryPosition = $this->array_find_index($territories, fn($territory) => $territory[0] == $territoryNumber);

        $this->setPloyTokenUsed($this->getActivePlayerId(), 1);

        $this->notifyAllPlayers('log', clienttranslate('${player_name} makes a strategic movement to go to territory ${number}'), [
            'player_name' => $this->getPlayerName($this->getActivePlayerId()),
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
        
        $this->setGameStateValue(ROOF_AREA_POSITION, $areaPosition);

        $this->gamestate->nextState('chooseRoofDestination');
    }

    public function chooseRoofDestination(int $areaPosition) {
        self::checkAction('chooseRoofDestination');
        
        $playerId = intval($this->getActivePlayerId());
        
        $originBuilding = $this->getBuildingByAreaPosition($this->getGameStateValue(ROOF_AREA_POSITION));
        $this->removeRoof($originBuilding);
        
        $building = $this->getBuildingByAreaPosition($areaPosition);
        $this->addRoof($building);

        $this->setPloyTokenUsed($this->getActivePlayerId(), 2);

        $this->notifyAllPlayers('log', clienttranslate('${player_name} moved a roof to another building'), [
            'player_name' => $this->getPlayerName($playerId),
        ]);

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
        
        $this->applyAbandonBuilding($building, true);
        for ($i = 0; $i < $building->floors; $i++) {
            $this->applyConstructBuildingFloor($areaPosition, true);
        }

        $this->setPloyTokenUsed($this->getActivePlayerId(), 3);

        $this->notifyAllPlayers('log', clienttranslate('${player_name} invades a ${player_name2} ${floors}-floor(s) building and sends ${cost} inhabitants'), [
            'player_name' => $this->getPlayerName($playerId),
            'player_name2' => $this->getPlayerName($building->playerId),
            'floors' => $building->floors,
            'cost' => $cost,
        ]);

        $this->gamestate->nextState('endAction');
    }

    public function cancelBuildingInvasion() {
        self::checkAction('cancelBuildingInvasion');

        $this->gamestate->nextState('cancel');
    }
}
