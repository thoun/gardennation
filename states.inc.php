<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * GardenNation implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 * 
 * states.inc.php
 *
 * GardenNation game states description
 *
 */

/*
   Game state machine is a tool used to facilitate game developpement by doing common stuff that can be set up
   in a very easy way from this configuration file.

   Please check the BGA Studio presentation about game state to understand this, and associated documentation.

   Summary:

   States types:
   _ activeplayer: in this type of state, we expect some action from the active player.
   _ multipleactiveplayer: in this type of state, we expect some action from multiple players (the active players)
   _ game: this is an intermediary state where we don't expect any actions from players. Your game logic must decide what is the next game state.
   _ manager: special type for initial and final state

   Arguments of game states:
   _ name: the name of the GameState, in order you can recognize it on your own code.
   _ description: the description of the current game state is always displayed in the action status bar on
                  the top of the game. Most of the time this is useless for game state with "game" type.
   _ descriptionmyturn: the description of the current game state when it's your turn.
   _ type: defines the type of game states (activeplayer / multipleactiveplayer / game / manager)
   _ action: name of the method to call when this game state become the current game state. Usually, the
             action method is prefixed by "st" (ex: "stMyGameStateName").
   _ possibleactions: array that specify possible player actions on this step. It allows you to use "checkAction"
                      method on both client side (Javacript: this.checkAction) and server side (PHP: self::checkAction).
   _ transitions: the transitions are the possible paths to go from a game state to another. You must name
                  transitions in order to use transition names in "nextState" PHP method, and use IDs to
                  specify the next game state for each transition.
   _ args: name of the method to call to retrieve arguments for this gamestate. Arguments are sent to the
           client side to be used on "onEnteringState" or to set arguments in the gamestate description.
   _ updateGameProgression: when specified, the game progression is updated (=> call to your getGameProgression
                            method).
*/

//    !! It is not a good idea to modify this file when a game is running !!

require_once('modules/php/constants.inc.php');

$basicGameStates = [

    // The initial state. Please do not modify.
    ST_BGA_GAME_SETUP => [
        "name" => "gameSetup",
        "description" => clienttranslate("Game setup"),
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => [ "" => ST_PLAYER_CHOOSE_ACTION ]
    ],
   
    // Final state.
    // Please do not modify.
    ST_END_GAME => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd",
    ],
];


$playerActionsGameStates = [

    ST_PLAYER_CHOOSE_ACTION => [
        "name" => "chooseAction",
        "description" => clienttranslate('${actplayer} must choose an action'),
        "descriptionmyturn" => clienttranslate('${you} must choose an action'),
        "type" => "activeplayer",
        //"args" => "argChooseAction",
        "possibleactions" => [ 
            "chooseConstructBuilding",
            "chooseAbandonBuilding",
            "chooseUsePloyToken",
        ],
        "transitions" => [
            "constructBuilding" => ST_PLAYER_CONSTRUCT_BUILDING,
            "abandonBuilding" => ST_PLAYER_ABANDON_BUILDING,
            "usePloyToken" => ST_PLAYER_USE_PLOY_TOKEN,
        ]
    ],

    ST_PLAYER_CONSTRUCT_BUILDING => [
        "name" => "constructBuilding",
        "description" => clienttranslate('${actplayer} must construct a building'),
        "descriptionmyturn" => clienttranslate('${you} must construct a building'),
        "type" => "activeplayer",
        //"args" => "argConstructBuilding",
        "possibleactions" => [ 
            "constructBuilding",
            "cancelConstructBuilding",
        ],
        "transitions" => [
            "endAction" => ST_END_ACTION,
            "cancel" => ST_PLAYER_CHOOSE_ACTION,
        ]
    ],

    ST_PLAYER_ABANDON_BUILDING => [
        "name" => "abandonBuilding",
        "description" => clienttranslate('${actplayer} must abandon a building'),
        "descriptionmyturn" => clienttranslate('${you} must abandon a building'),
        "type" => "activeplayer",
        //"args" => "argAbandonBuilding",
        "possibleactions" => [ 
            "abandonBuilding",
            "cancelAbandonBuilding",
        ],
        "transitions" => [
            "endAction" => ST_END_ACTION,
            "cancel" => ST_PLAYER_CHOOSE_ACTION,
        ]
    ],

    ST_PLAYER_USE_PLOY_TOKEN => [
        "name" => "usePloyToken",
        "description" => clienttranslate('${actplayer} must choose a ploy'),
        "descriptionmyturn" => clienttranslate('${you} must choose a ploy'),
        "type" => "activeplayer",
        //"args" => "argUsePloyToken",
        "possibleactions" => [ 
            "usePloyToken",
            "cancelUsePloyToken",
        ],
        "transitions" => [
            // TODO
            "cancel" => ST_PLAYER_CHOOSE_ACTION,
        ]
    ],

    ST_PLAYER_CHOOSE_NEXT_PLAYER => [
        "name" => "chooseNextPlayer",
        "description" => clienttranslate('${actplayer} must choose the next player'),
        "descriptionmyturn" => clienttranslate('${you} must choose the next player'),
        "type" => "activeplayer",
        //"args" => "argChooseNextPlayer",
        "possibleactions" => [ 
            "chooseNextPlayer",
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER,
        ]
    ],
];


$gameGameStates = [

    ST_END_ACTION => [
        "name" => "endAction",
        "description" => "",
        "type" => "game",
        "action" => "stEndAction",
        "transitions" => [
            "newAction" => ST_PLAYER_CHOOSE_ACTION,
            "chooseNextPlayer" => ST_PLAYER_CHOOSE_NEXT_PLAYER,
            "endTurn" => ST_NEXT_PLAYER,
        ],
    ],

    ST_NEXT_PLAYER => [
        "name" => "nextPlayer",
        "description" => "",
        "type" => "game",
        "action" => "stNextPlayer",
        "updateGameProgression" => true,
        "transitions" => [
            "nextPlayer" => ST_PLAYER_CHOOSE_ACTION, 
            "endRound" => ST_END_ROUND,
        ],
    ],

    ST_END_ROUND => [
        "name" => "endRound",
        "description" => "",
        "type" => "game",
        "action" => "stEndRound",
        "transitions" => [
            "newRound" => ST_PLAYER_CHOOSE_ACTION,
            "endScore" => ST_END_SCORE,
        ],
    ],

    ST_END_SCORE => [
        "name" => "endScore",
        "description" => "",
        "type" => "game",
        "action" => "stEndScore",
        "updateGameProgression" => true,
        "transitions" => [
            "endGame" => ST_END_GAME,
        ],
    ],
];
 
$machinestates = $basicGameStates + $playerActionsGameStates + $gameGameStates;

