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
        "transitions" => [ "" => ST_MULTIPLAYER_CHOOSE_SECRET_MISSIONS ]
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

    ST_MULTIPLAYER_CHOOSE_SECRET_MISSIONS => [
        "name" => "chooseSecretMissions",
        "description" => clienttranslate('Waiting for other players'),
        "descriptionmyturn" => clienttranslate('${you} must choose 2 Secret missions'),
        "type" => "multipleactiveplayer",
        "action" => "stChooseSecretMissions",
        "args" => "argChooseSecretMissions",
        "possibleactions" => [ 
            "chooseSecretMissions",
            "cancelChooseSecretMissions",
        ],
        "transitions" => [
            "end" => ST_END_CHOOSE_SECRET_MISSIONS,
        ],
    ],

    ST_PLAYER_CHOOSE_ACTION => [
        "name" => "chooseAction",
        "description" => clienttranslate('${actplayer} must choose an action (${remainingActions} remaining action(s))'),
        "descriptionmyturn" => clienttranslate('${you} must choose an action (${remainingActions} remaining action(s))'),
        "type" => "activeplayer",
        "args" => "argChooseAction",
        "possibleactions" => [ 
            "chooseConstructBuilding",
            "chooseAbandonBuilding",
            "changeTerritory",
            "chooseUsePloyToken",
            "skipTurn",
        ],
        "transitions" => [
            "constructBuilding" => ST_PLAYER_CONSTRUCT_BUILDING,
            "abandonBuilding" => ST_PLAYER_ABANDON_BUILDING,
            "changeTerritory" => ST_PLAYER_CHOOSE_ACTION,
            "usePloyToken" => ST_PLAYER_USE_PLOY_TOKEN,
            "chooseNextPlayer" => ST_PLAYER_CHOOSE_NEXT_PLAYER,
        ]
    ],

    ST_PLAYER_CONSTRUCT_BUILDING => [
        "name" => "constructBuilding",
        "description" => clienttranslate('${actplayer} must choose an area to construct a building'),
        "descriptionmyturn" => clienttranslate('${you} must choose an area to construct a building'),
        "type" => "activeplayer",
        "args" => "argConstructBuilding",
        "possibleactions" => [ 
            "constructBuilding",
            "cancelConstructBuilding",
        ],
        "transitions" => [
            "chooseTypeOfLand" => ST_PLAYER_CHOOSE_TYPE_OF_LAND,
            "chooseCompletedCommonProject" => ST_PLAYER_CHOOSE_COMPLETED_COMMON_PROJECT,
            "endAction" => ST_END_ACTION,
            "cancel" => ST_PLAYER_CHOOSE_ACTION,
        ]
    ],

    ST_PLAYER_CHOOSE_TYPE_OF_LAND => [
        "name" => "chooseTypeOfLand",
        "description" => clienttranslate('${actplayer} must choose a type of land'),
        "descriptionmyturn" => clienttranslate('${you} must choose a type of land'),
        "type" => "activeplayer",
        "args" => "argChooseTypeOfLand",
        "possibleactions" => [ 
            "chooseTypeOfLand",
            "cancelChooseTypeOfLand",
        ],
        "transitions" => [
            "chooseCompletedCommonProject" => ST_PLAYER_CHOOSE_COMPLETED_COMMON_PROJECT,
            "endAction" => ST_END_ACTION,
            "cancel" => ST_PLAYER_CONSTRUCT_BUILDING,
        ]
    ],

    ST_PLAYER_CHOOSE_COMPLETED_COMMON_PROJECT => [
        "name" => "chooseCompletedCommonProject",
        "description" => clienttranslate('${actplayer} must choose the common project to complete'),
        "descriptionmyturn" => clienttranslate('${you} must choose the common project to complete'),
        "type" => "activeplayer",
        "args" => "argChooseCompletedCommonProject",
        "possibleactions" => [ 
            "chooseCompletedCommonProject",
            "skipCompletedCommonProject",
        ],
        "transitions" => [
            "endAction" => ST_END_ACTION,
            "endRound" => ST_END_ROUND,
        ]
    ],

    ST_PLAYER_ABANDON_BUILDING => [
        "name" => "abandonBuilding",
        "description" => clienttranslate('${actplayer} must choose a building to abandon'),
        "descriptionmyturn" => clienttranslate('${you} must choose a building to abandon'),
        "type" => "activeplayer",
        "args" => "argAbandonBuilding",
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
        "args" => "argUsePloyToken",
        "possibleactions" => [ 
            "usePloyToken",
            "cancelUsePloyToken",
        ],
        "transitions" => [
            "strategicMovement" => ST_PLAYER_STRATEGIC_MOVEMENT,
            "roofTransfer" => ST_PLAYER_CHOOSE_ROOF_TO_TRANSFER,
            "buildingInvasion" => ST_PLAYER_BUILDING_INVASION,
            "cancel" => ST_PLAYER_CHOOSE_ACTION,
        ]
    ],

    ST_PLAYER_STRATEGIC_MOVEMENT => [
        "name" => "strategicMovement",
        "description" => clienttranslate('${actplayer} must choose a territory for the Torticrane'),
        "descriptionmyturn" => clienttranslate('${you} must choose a territory for the Torticrane'),
        "type" => "activeplayer",
        "args" => "argStrategicMovement",
        "possibleactions" => [ 
            "strategicMovement",
            "cancelUsePloy",
        ],
        "transitions" => [
            "endPloy" => ST_PLAYER_CHOOSE_ACTION,
            "cancel" => ST_PLAYER_USE_PLOY_TOKEN,
        ]
    ],

    ST_PLAYER_CHOOSE_ROOF_TO_TRANSFER => [
        "name" => "chooseRoofToTransfer",
        "description" => clienttranslate('${actplayer} must choose a roof to transfer'),
        "descriptionmyturn" => clienttranslate('${you} must choose a roof to transfer'),
        "type" => "activeplayer",
        "args" => "argChooseRoofToTransfer",
        "possibleactions" => [ 
            "chooseRoofToTransfer",
            "cancelUsePloy",
        ],
        "transitions" => [
            "chooseRoofDestination" => ST_PLAYER_CHOOSE_ROOF_DESTINATION,
            "cancel" => ST_PLAYER_USE_PLOY_TOKEN,
        ]
    ],

    ST_PLAYER_CHOOSE_ROOF_DESTINATION => [
        "name" => "chooseRoofDestination",
        "description" => clienttranslate('${actplayer} must choose a new building for the roof'),
        "descriptionmyturn" => clienttranslate('${you} must choose a new building for the roof'),
        "type" => "activeplayer",
        "args" => "argChooseRoofDestination",
        "possibleactions" => [ 
            "chooseRoofDestination",
            "cancelUsePloy",
        ],
        "transitions" => [
            "endPloy" => ST_PLAYER_CHOOSE_ACTION,
            "cancel" => ST_PLAYER_USE_PLOY_TOKEN,
        ]
    ],

    ST_PLAYER_BUILDING_INVASION => [
        "name" => "buildingInvasion",
        "description" => clienttranslate('${actplayer} must choose a building to invade'),
        "descriptionmyturn" => clienttranslate('${you} must choose a building to invade'),
        "type" => "activeplayer",
        "args" => "argBuildingInvasion",
        "possibleactions" => [ 
            "buildingInvasion",
            "cancelUsePloy",
        ],
        "transitions" => [
            "chooseCompletedCommonProject" => ST_PLAYER_CHOOSE_COMPLETED_COMMON_PROJECT,
            "endAction" => ST_END_ACTION,
            "cancel" => ST_PLAYER_USE_PLOY_TOKEN,
        ]
    ],

    ST_PLAYER_CHOOSE_NEXT_PLAYER => [
        "name" => "chooseNextPlayer",
        "description" => clienttranslate('${actplayer} must choose the next player'),
        "descriptionmyturn" => clienttranslate('${you} must choose the next player'),
        "type" => "activeplayer",
        "action" => "stChooseNextPlayer",
        "args" => "argChooseNextPlayer",
        "possibleactions" => [ 
            "chooseNextPlayer",
        ],
        "transitions" => [
            "nextPlayer" => ST_NEXT_PLAYER,
            "endRound" => ST_END_ROUND,
        ]
    ],
];


$gameGameStates = [

    ST_END_CHOOSE_SECRET_MISSIONS => [
        "name" => "endSecretMissions",
        "description" => "",
        "type" => "game",
        "action" => "stEndSecretMissions",
        "transitions" => [
            "start" => ST_PLAYER_CHOOSE_ACTION,
        ],
    ],

    ST_END_ACTION => [
        "name" => "endAction",
        "description" => "",
        "type" => "game",
        "action" => "stEndAction",
        "transitions" => [
            "newAction" => ST_PLAYER_CHOOSE_ACTION,
            "chooseNextPlayer" => ST_PLAYER_CHOOSE_NEXT_PLAYER,
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

