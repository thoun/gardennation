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

        $canAbandonBuilding = count($this->argAbandonBuilding()['possiblePositions']) > 0;
        $canUsePloy = $this->canUsePloy($playerId);
    
        return [
            'remainingActions' => $this->getRemainingActions($playerId),
            'canAbandonBuilding' => $canAbandonBuilding,
            'canUsePloy' => $canUsePloy,
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
        $possiblePositions = [];
        foreach ($territoryPositions as $position => $area) {
            $cost = $area[1];
            if ($cost < $player->inhabitants) {
                $possiblePositions[] = $position;
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
            'possiblePositions' => $possiblePositions,
        ];
    }
   
    function argAbandonBuilding() {
        $player = $this->getPlayer($this->getActivePlayerId());

        $territoryPositions = $this->getTerritoryPositions();
        foreach ($territoryPositions as $position => $area) {   
            // TODO only existing player buildings
        }
    
        return [
            'possiblePositions' => array_keys($territoryPositions),
        ];
    }

    function argChooseTypeOfLand() {
        $brambleAreasDb = $this->getCollectionFromDb("SELECT `type`, count(*) as `count` FROM `bramble_area` GROUP BY `type`");
        $possibleTypes = [];
        foreach([1, 2, 3] as $type) {
            $brambleAreaDb = $this->array_find($brambleAreasDb, fn($brambleAreaDb) => intval($brambleAreaDb['type']) == $type);
            if ($brambleAreaDb == null || intval($brambleAreaDb['count']) < 3) {
                $possibleTypes[] = $type;
            }
        }
    
        return [
            'possibleTypes' => $possibleTypes,
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
