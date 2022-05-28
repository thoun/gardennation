<?php

class GardenNationPlayer {
    public int $id;
    public string $name;
    public string $color;
    public int $no;
    public int $score;
    public int $inhabitants;
    public int $turnTrack;
    public array $usedPloy;

    public function __construct($dbPlayer) {
        $this->id = intval($dbPlayer['player_id']);
        $this->name = $dbPlayer['player_name'];
        $this->color = $dbPlayer['player_color'];
        $this->no = intval($dbPlayer['player_no']);
        $this->score = intval($dbPlayer['player_score']);
        $this->inhabitants = intval($dbPlayer['player_inhabitants']);
        $this->turnTrack = intval($dbPlayer['player_turn_track']);
        $this->usedPloy = json_decode($dbPlayer['player_used_ploy']);
    } 
}
?>