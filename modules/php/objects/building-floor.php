<?php

class BuildingFloor {
    public int $id;
    public int $playerId; // 0 for roof
    public /*int|null*/ $territoryNumber;
    public /*int|null*/ $areaPosition;

    public function __construct($dbObject) {
        $this->id = intval($dbObject['id']);
        $this->playerId = $dbObject['player_id'];
        $this->territoryNumber = $dbObject['territory_number'] ? intval($dbObject['territory_number']) : null;
        $this->areaPosition = $dbObject['area_position'] ? intval($dbObject['area_position']) : null;
    } 
}
?>