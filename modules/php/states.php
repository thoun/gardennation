<?php

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

    function stEndScore() {
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
