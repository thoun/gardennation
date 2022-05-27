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
    
        return [
            'remainingActions' => $this->getRemainingActions($playerId),
        ];
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
   
    function argConstructBuilding() {
        $player = $this->getPlayer($this->getActivePlayerId());

        $territoryPositions = $this->getTerritoryPositions();
        foreach ($territoryPositions as $position => $area) {
            $cost = $area[1];
            if ($cost < $player->inhabitants) {
                $territoryPositions[] = $position;
            }
        }
        /* TODO
        It is possible that a player cannot carry out any action in
the territory occupied by the torticrane. That is, they cannot
construct (because there are no areas on which they can
construct, they have no more floors) AND they cannot or do not
want to abandon a building. In this case, they can play in
the next territory in numerical order. If they cannot play in
this territory either, they can play in the next one, and so on.
Note: If a player cannot play in territory 7, they can play in
territory 1.
*/
    
        return [
            'possiblePositions' => array_keys($territoryPositions),
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
    
}
