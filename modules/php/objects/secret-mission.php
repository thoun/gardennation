<?php

class SecretMissionCard {
    public int $nbr;
    public int $type;
    public int $subType;
    public string $name;
    public /*array|null*/ $territories;
  
  
    public function __construct(int $nbr, int $type, int $subType, string $name, /*array|null*/ $territories = null) {
        $this->nbr = $nbr;
        $this->type = $type;
        $this->subType = $subType;
        $this->name = $name;
        $this->territories = $territories;
    } 
}

class SecretMission extends SecretMissionCard {

    public function __construct($dbObject, $SECRET_MISSION) {
        $this->id = intval($dbObject['id']);
        $this->type = intval($dbObject['type']);
        $this->subType = intval($dbObject['type_arg']);

        $secretMissionCard = $SECRET_MISSION;
        $this->name = $secretMissionCard->name;
        $this->territories = $secretMissionCard->territories;
    } 
}
?>