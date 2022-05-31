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

    function revealAndScoreSecretMission(int $playerId, SecretMission $secretMission, array $buildings) {
        // TODO
    }

    function stEndScore() {
        $players = $this->getPlayers();
        $buildings = $this->getBuildings();

        foreach($players as $player) {
            $secretMissions = []; /*,  TODO*/
            foreach($secretMissions as $secretMission) {
                $this->revealAndScoreSecretMission($player->id,  $secretMission, $buildings);
            }
        }

        foreach($players as $player) {
            foreach($this->END_INHABITANTS_POINTS as $min => $points) {
                $inhabitantsScore = $this->END_INHABITANTS_POINTS[1];
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

        /* TODO
        The game ends when a player places their last floor, even if they
retrieve another one before the end of their turn. The players finish
the current round (Player Actions + Territory Control).
The players then move forward on the score track according to the
victory points (VP) they earn from:
• their secret missions;
*/
        /* TODO $playersIds = $this->getPlayersIds();
        $map = $this->getMap();
        foreach ($playersIds as $playerId) {
            if (!$this->isEliminated($playerId)) {
                $scoreSheets = $this->notifUpdateScoreSheet($playerId, true);
                $score = $scoreSheets->validated->total;
                $this->DbQuery("UPDATE player SET `player_score` = $score WHERE `player_id` = $playerId");
            }

            $personalObjective = intval($this->getUniqueValueFromDB("SELECT player_personal_objective FROM `player` where `player_id` = $playerId"));

            $personalObjectiveLetters = array_map(fn($code) => chr($code), $this->getPersonalObjectiveLetters($playerId));
            $this->notifyAllPlayers('revealPersonalObjective', clienttranslate('${player_name} personal objective was ${objectiveLetters}'), [
                'playerId' => $playerId,
                'player_name' => self::getActivePlayerName(),
                'objectiveLetters' => implode(' ', $personalObjectiveLetters),
                'personalObjective' => $personalObjective,
                'personalObjectiveLetters' => $personalObjectiveLetters,
                'personalObjectivePositions' => $this->getPersonalObjectivePositions($personalObjective, $map),
            ]);
        }*/

        $this->gamestate->nextState('endGame');
    }
}
