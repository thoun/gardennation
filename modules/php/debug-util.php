<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup(array $playersIds) {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

        $this->placeRandomBuildings($playersIds, 5, 0);
        //$this->debugSetSecretMissionInHand(4, 7, 2343492);
        
        
        //$cards = $this->getSecretMissionsFromDb(array_values($this->secretMissions->getCardsOfType(2, 2)));
        //foreach ($cards as $card) $this->secretMissions->moveCard($card->id, 'choose', 2343492);
    }

    function debugEndGame() {
        $this->setGameStateValue(LAST_ROUND, 1);
        /*$playerId = 2343492;

        while (count($this->getAvailableBuildingFloors($playerId)) > 0) {
            $buildingFloorId = $this->getAvailableBuildingFloors($playerId)[0]->id;
            $this->DbQuery("UPDATE `building_floor` SET `territory_number` = 1, `area_position` = 1 WHERE `id` = $buildingFloorId");
        }*/
    }

    function debugSetSecretMissionInHand($cardType, $cardSubType, $playerId, $index = 0) {
        $card = $this->getSecretMissionFromDb(array_values($this->secretMissions->getCardsOfType($cardType, $cardSubType))[$index]);
        $this->secretMissions->moveCard($card->id, 'hand', $playerId);
        return $card;
    }

    function placeRandomBuildings(array $playersIds, int $maxHeight = 5, int $remaining = 5) {
        foreach($playersIds as $playerId) {
            $this->placeRandomBuildingsForPlayer($playerId, $maxHeight, $remaining);
        }
    }

    function placeRandomBuildingsForPlayer(int $playerId, int $maxHeight = 5, int $remaining = 5) {
        $playerBuildingFloors = $this->getAvailableBuildingFloors($playerId);

        while (count($playerBuildingFloors) > $remaining) {
            $height = min(bga_rand(1, $maxHeight), count($playerBuildingFloors));

            $territory = bga_rand(1, 7);
            $areaPosition = bga_rand(0, 6);
            while ($this->getBuildingByAreaPosition($territory * 10 + $areaPosition) != null) {
                $territory = bga_rand(1, 7);
                $areaPosition = bga_rand(0, 6);
            }

            for ($i=0; $i<$height; $i++) {
                $this->placeBuildingFloor($playerId, $territory, $areaPosition);
            }

            if (bga_rand(1, 2) == 2) {
                $this->placeBuildingFloor(0, $territory, $areaPosition);
            }

            $playerBuildingFloors = $this->getAvailableBuildingFloors($playerId);
        }
    }

    function debug($debugData) {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }die('debug data : '.json_encode($debugData));
    }
}
