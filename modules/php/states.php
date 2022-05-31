<?php

require_once(__DIR__.'/objects/secret-mission.php');

trait StateTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stEndAction() {
        $playerId = intval($this->getActivePlayerId());

        $this->setGameStateValue(PLOY_USED, 0);
        $this->incGameStateValue(PLAYED_ACTIONS, 1);
        $remainingActions = $this->getRemainingActions($playerId);

        if ($remainingActions == 0) {
            $this->gamestate->nextState("chooseNextPlayer");
        } else {
            $this->gamestate->nextState("newAction");
        }
    }

    function stChooseNextPlayer() {
        $possibleNextPlayers = $this->argChooseNextPlayer()['possibleNextPlayers'];
        
        if (count($possibleNextPlayers) == 1) {
            $this->applyChooseNextPlayer($possibleNextPlayers[0]);
        } else if (count($possibleNextPlayers) == 0) {
            $this->gamestate->nextState("endRound");
        }
    }

    function stNextPlayer() {
        $players = $this->getPlayers();
        $maxOrder = max(array_map(fn($player) => $player->turnTrack, $players));

        $this->gamestate->changeActivePlayer($this->array_find($players, fn($player) => $player->turnTrack == $maxOrder)->id);

        $this->setGameStateValue(PLAYED_ACTIONS, 0);
        $this->setGameStateValue(PLOY_USED, 0);

        $this->gamestate->nextState("nextPlayer");
    }

    function stEndRound() {
        $lastRound = boolval($this->getGameStateValue(LAST_ROUND));

        $this->scoreTerritoryControl();
        if (!$lastRound) {
            $this->resetPlayerOrder();
        }
            
        $this->gamestate->nextState($lastRound ? 'endScore' : 'newRound');
    }

    function revealAndScoreSecretMission(int $playerId, SecretMission $secretMission, array $map, array $playerBuildings) {
        $playerName = $this->getPlayerName($playerId);

        $this->notifyAllPlayers('revealSecretMission', clienttranslate('${player_name} reveals secret mission ${cardName}'), [
            'playerId' => $playerId,
            'player_name' => $playerName,
            'cardName' => $secretMission->name,
            'secretMission' => $secretMission,
            'i18n' => [ 'cardName' ],
        ]);
        
        $secretMissionScore = 0;

        switch ($secretMission->type) {
            case 1:
                foreach ($playerBuildings as $building) {
                    if ($building->floors >= 2 && $map[$building->areaPosition][0] == $secretMission->subType) {
                        $secretMissionScore += 3;
                    }
                }
                break;
            case 2:
                foreach ($playerBuildings as $building) {
                    if ($map[$building->areaPosition][0] == $secretMission->subType) {
                        $secretMissionScore += $building->floors;
                    }
                }
                break;
            case 3:
                foreach ([1, 2, 3, 4, 5, 6, 7] as $territory) {
                    $minFloors = $secretMission->subType == 2 ? 4 : 3;
                    $points = $secretMission->subType == 2 ? 11 : 7;
                    if ($this->array_some($playerBuildings, fn($building) => floor($building->areaPosition / 10) == $territory && $building->floors >= $minFloors)) {
                        $secretMissionScore += $points;
                    }
                }
                break;
            case 4:
                $dominated = 0;
                foreach ($secretMission->territories as $territory) {
                    $playersIds = $this->getTerritoryControlPlayersIds($territory);
                    if (count($playersIds) == 1 && $playersIds[0] == $playerId) {
                        $dominated++;
                    }
                }
                if ($dominated == 2) {
                    $secretMissionScore = 12;
                } else if ($dominated == 1) {
                    $secretMissionScore = 4;
                }
                break;
        }
        
        $this->incPlayerScore($playerId, $secretMissionScore, clienttranslate('${player_name} gains ${points} victory points with secret mission ${cardName}'), [
            'player_name' => $playerName,
            'points' => $secretMissionScore,
            'cardName' => $secretMission->name,
            'i18n' => [ 'cardName' ],
        ]);
    }

    function stEndScore() {
        $players = $this->getPlayers();
        $map = $this->getMap();
        $buildings = $this->getTerritoryBuildings();

        foreach($players as $player) {
            $playerBuildings = array_values(array_filter($buildings, fn($building) => $building->playerId == $player->id && !$building->roof));
            $secretMissions = $this->getSecretMissionsFromDb($this->secretMissions->getCardsInLocation('hand', $player->id));
            foreach($secretMissions as $secretMission) {
                $this->revealAndScoreSecretMission($player->id,  $secretMission, $map, $playerBuildings);
            }
        }

        foreach($players as $player) {
            $inhabitantsScore = $this->END_INHABITANTS_POINTS[1];
            foreach($this->END_INHABITANTS_POINTS as $min => $points) {
                if ($player->inhabitants >= $min) {
                    $inhabitantsScore = $points;
                } else {
                    break;
                }
            }
            
            $this->incPlayerScore($player->id, $inhabitantsScore, clienttranslate('${player_name} gains ${points} victory points for having ${inhabitants} inhabitants'), [
                'player_name' => $player->name,
                'points' => $inhabitantsScore,
                'inhabitants' => $player->inhabitants,
            ]);
        }

        $this->gamestate->nextState('endGame');
    }
}
