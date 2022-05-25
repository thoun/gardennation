<?php

/*require_once(__DIR__.'/objects/ticket.php');
require_once(__DIR__.'/objects/placed-route.php');
require_once(__DIR__.'/objects/possible-route.php');
require_once(__DIR__.'/objects/common-objective.php');*/

trait UtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function array_find(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return $value;
            }
        }
        return null;
    }

    function array_find_key(array $array, callable $fn) {
        foreach ($array as $key => $value) {
            if($fn($value)) {
                return $key;
            }
        }
        return null;
    }

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return true;
            }
        }
        return false;
    }
    
    function array_every(array $array, callable $fn) {
        foreach ($array as $value) {
            if(!$fn($value)) {
                return false;
            }
        }
        return true;
    }

    function array_identical(array $a1, array $a2) {
        if (count($a1) != count($a2)) {
            return false;
        }
        for ($i=0;$i<count($a1);$i++) {
            if ($a1[$i] != $a2[$i]) {
                return false;
            }
        }
        return true;
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getPlayerName(int $playerId) {
        return self::getUniqueValueFromDB("SELECT player_name FROM player WHERE player_id = $playerId");
    }

    /*function getCardFromDb(array $dbCard) {
        if (!$dbCard || !array_key_exists('id', $dbCard)) {
            throw new \Error('card doesn\'t exists '.json_encode($dbCard));
        }
        if (!$dbCard || !array_key_exists('location', $dbCard)) {
            throw new \Error('location doesn\'t exists '.json_encode($dbCard));
        }
        return new Card($dbCard);
    }

    function getCardsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbCards));
    }

    function setupTickets(int $playerNumber) {
        // 12 bus ticket cards
        $tickets = [];
        for ($i = 1; $i <= 6; $i++) {
            $tickets[] = [ 'type' => $i, 'type_arg' => null, 'nbr' => 1 ];
        }
        $this->tickets->createCards($tickets, 'deck');
        $tickets = [];
        for ($i = 7; $i <= 12; $i++) {
            $tickets[] = [ 'type' => $i, 'type_arg' => null, 'nbr' => 1 ];
        }
        $this->tickets->createCards($tickets, $playerNumber > 3 ? 'deck' : 'discard');
        $this->tickets->shuffle('deck');
    }*/
}
