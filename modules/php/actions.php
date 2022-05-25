<?php

trait ActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in nicodemus.action.php)
    */
  	
    public function placeRoute(int $routeFrom, int $routeTo) {
        self::checkAction('placeRoute'); 
        
        /*$playerId = intval(self::getActivePlayerId());

        $allPlacedRoutes = $this->getPlacedRoutes();
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
        //self::incStat(1, 'placedRoutes', $playerId);

        $this->gamestate->nextState('placeNext');*/
    }
}
