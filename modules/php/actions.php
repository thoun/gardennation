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

    private function applyConstructBuilding(int $areaPosition) {        
        $playerId = intval(self::getActivePlayerId());
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
    
        $this->incPlayerInhabitants($playerId, -$cost);

        $message = $building == null ? 
            clienttranslate('${player_name} starts a building on territory ${territoryNumber} and sends ${cost} inhabitant(s)') : 
            clienttranslate('${player_name} adds a floor to existing building on territory ${territoryNumber} and sends ${cost} inhabitants');
        $args = [
            'player_name' => $this->getPlayerName($playerId),
            'territoryNumber' => floor($areaPosition / 10),
            'cost' => $cost,
        ];
        $this->placeBuildingFloor($playerId, floor($areaPosition / 10), $areaPosition % 10, $message, $args);

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
        
        self::notifyAllPlayers('placedRoute', clienttranslate('${player_name} places a route marker to ${elements}'), [
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

        $this->moveTorticrane($areaPosition);

        $this->gamestate->nextState('endAction');
    }

    public function constructBuilding(int $areaPosition) {
        self::checkAction('constructBuilding');

        $this->applyConstructBuilding($areaPosition);
    }
    
    public function cancelConstructBuilding() {
        self::checkAction('cancelConstructBuilding');

        $this->gamestate->nextState('cancel');
    }

    public function abandonBuilding(int $areaPosition) {
        self::checkAction('abandonBuilding');
        
        $playerId = intval(self::getActivePlayerId());

        $building = $this->getBuildingByAreaPosition($areaPosition);
        if ($building == null || $building->playerId != $playerId) {
            throw new BgaUserException("No player building");
        }
        $cost = $this->getBuildingCost($building);
        
        $this->incPlayerInhabitants($playerId, $cost);

        $message = clienttranslate('${player_name} abandons building on territory ${territoryNumber} and inscreases its population by ${cost} inhabitants');
        $args = [
            'player_name' => $this->getPlayerName($playerId),
            'territoryNumber' => floor($areaPosition / 10),
            'cost' => $cost,
        ];
        $this->removeBuilding($building, $message, $args);

        $this->moveTorticrane($areaPosition);

        $this->gamestate->nextState('endAction');
    }
    
    public function cancelAbandonBuilding() {
        self::checkAction('cancelAbandonBuilding');

        $this->gamestate->nextState('cancel');
    }

    public function chooseTypeOfLand(int $typeOfLand) {
        self::checkAction('chooseTypeOfLand');
        
        $playerId = intval(self::getActivePlayerId());
        
        $areaPosition = intval($this->getGameStateValue(BRAMBLE_CHOICE_AREA));
        
        $id = intval($this->getUniqueValueFromDB("SELECT max(`id`) FROM `bramble_area` WHERE `position` IS NULL AND `type` = $typeOfLand"));
        $this->DbQuery("UPDATE `bramble_area` SET `position` = $areaPosition WHERE `id` = $id");

        $territoryNumber = floor($areaPosition / 10);
        self::notifyAllPlayers('setBrambleType', clienttranslate('${player_name} choses bramble ${brambleIcon} for territory ${territoryNumber}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'territoryNumber' => $territoryNumber,
            'areaPosition' => $areaPosition,
            'brambleIcon' => $typeOfLand,
            'type' => $typeOfLand,
            'brambleId' => $id,
        ]);

        $this->applyConstructBuilding($areaPosition);
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

    public function chooseNextPlayer(int $playerId) {
        self::checkAction('chooseNextPlayer');

        if (!in_array($playerId, $this->argChooseNextPlayer()['possibleNextPlayers'])) {
            throw new BgaUserException("Invalid player choice");
        }

        $this->applyChooseNextPlayer($playerId);
    }
}
