<?php

class Building {
    public int $playerId;
    public int $areaPosition;
    public int $floors;
    public bool $roof;
    public /*array|null*/ $buildingFloors;

    public function __construct(int $playerId, int $areaPosition, int $floors, bool $roof, $buildingFloors = null) {
        $this->playerId = $playerId;
        $this->areaPosition = $areaPosition;
        $this->floors = $floors;
        $this->roof = $roof;
        $this->buildingFloors = $buildingFloors;
    } 
}
?>