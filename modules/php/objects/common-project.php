<?php

class CommonProjectCard {
    public int $type;
    public int $subType;
    public string $name;
    public /*int|null*/ $primaryColor;
    public /*int|null*/ $secondaryColor;
  
  
    public function __construct(int $type, $subType, string $name, /*int|null*/ $primaryColor = null, /*int|null*/ $secondaryColor = null) {
        $this->type = $type;
        $this->subType = $subType;
        $this->name = $name;
        $this->primaryColor = $primaryColor;
        $this->secondaryColor = $secondaryColor;
    }
}

class CommonProject extends CommonProjectCard {
    public string $location;
    public int $locationArg;

    public function __construct($dbObject, $COMMON_PROJECT) {
        $this->id = intval($dbObject['id']);
        $this->type = intval($dbObject['type']);
        $this->subType = intval($dbObject['type_arg']);
        $this->location = $dbObject['location'];
        $this->locationArg = intval($dbObject['location_arg']);

        $secretMissionCard = $COMMON_PROJECT;
        $this->name = $secretMissionCard->name;
        $this->primaryColor = $secretMissionCard->primaryColor;
        $this->secondaryColor = $secretMissionCard->secondaryColor;
    } 
}
?>