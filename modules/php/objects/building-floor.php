<?php

class BuildingFloor {
    public int $id;
    public string $location;
    public int $locationArg;
    public int $type; // 0 for building floor, 1 for roof
    public int $playerId; // 0 for roof

    public function __construct($dbCard) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->locationArg = intval($dbCard['location_arg']);
        $this->type = intval($dbCard['type']);
        $this->playerId = intval($dbCard['type_arg']);
    } 
}
?>