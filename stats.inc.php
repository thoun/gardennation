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
 * stats.inc.php
 *
 * GardenNation game statistics description
 *
 */

/*
    In this file, you are describing game statistics, that will be displayed at the end of the
    game.
    
    !! After modifying this file, you must use "Reload  statistics configuration" in BGA Studio backoffice
    ("Control Panel" / "Manage Game" / "Your Game")
    
    There are 2 types of statistics:
    _ table statistics, that are not associated to a specific player (ie: 1 value for each game).
    _ player statistics, that are associated to each players (ie: 1 value for each player in the game).

    Statistics types can be "int" for integer, "float" for floating point values, and "bool" for boolean
    
    Once you defined your statistics there, you can start using "initStat", "setStat" and "incStat" method
    in your game logic, using statistics names defined below.
    
    !! It is not a good idea to modify this file when a game is running !!

    If your game is already public on BGA, please read the following before any change:
    http://en.doc.boardgamearena.com/Post-release_phase#Changes_that_breaks_the_games_in_progress
    
    Notes:
    * Statistic index is the reference used in setStat/incStat/initStat PHP method
    * Statistic index must contains alphanumerical characters and no space. Example: 'turn_played'
    * Statistics IDs must be >=10
    * Two table statistics can't share the same ID, two player statistics can't share the same ID
    * A table statistic can have the same ID than a player statistics
    * Statistics ID is the reference used by BGA website. If you change the ID, you lost all historical statistic data. Do NOT re-use an ID of a deleted statistic
    * Statistic name is the English description of the statistic as shown to players
    
*/


$commonStats = [
    "actionsNumber" => [
        "id" => 10,
        "name" => totranslate("Number of actions"),
        "type" => "int" 
    ],
    "turnsNumber" => [
        "id" => 11,
        "name" => totranslate("Number of turns"),
        "type" => "int" 
    ],
    "constructedFloors" => [
        "id" => 12,
        "name" => totranslate("Contructed building floors"),
        "type" => "int"
    ],
    "abandonedBuildings" => [
        "id" => 13,
        "name" => totranslate("Abandoned buildings"),
        "type" => "int"
    ],
    "usedPloys" => [
        "id" => 14,
        "name" => totranslate("Used ploys"),
        "type" => "int"
    ],
    "usedPloysBuildingInvasion" => [
        "id" => 15,
        "name" => totranslate("Used ploys (Building invasion)"),
        "type" => "int"
    ],
    "usedPloysStrategicMovement" => [
        "id" => 16,
        "name" => totranslate("Used ploys (Srategic movement)"),
        "type" => "int"
    ],
    "usedPloysRoofTransfer" => [
        "id" => 17,
        "name" => totranslate("Used ploys (Roof transfer)"),
        "type" => "int"
    ],
    "territoryControlWin" => [
        "id" => 18,
        "name" => totranslate("Majority on territory control"),
        "type" => "int"
    ],
    "inhabitantsGainedWithTerritoryControl" => [
        "id" => 19,
        "name" => totranslate("Inhabitants gained with territory control"),
        "type" => "int"
    ],
    "territoryControlWinAlone" => [
        "id" => 20,
        "name" => totranslate("Majority on territory control (alone)"),
        "type" => "int"
    ],
    "territoryControlWinShared" => [
        "id" => 21,
        "name" => totranslate("Majority on territory control (shared)"),
        "type" => "int"
    ],
    "completedCommonProjects" => [
        "id" => 22,
        "name" => totranslate("Completed Common projects"),
        "type" => "int"
    ],
    "pointsWithCommonProjects" => [
        "id" => 23,
        "name" => totranslate("Points gained with Common projects"),
        "type" => "int"
    ],
    "completedSecretMissions" => [
        "id" => 24,
        "name" => totranslate("Completed Secret missions"),
        "type" => "int"
    ],
    "pointsWithSecretMissions" => [
        "id" => 25,
        "name" => totranslate("Points gained with Secret missions"),
        "type" => "int"
    ],
    "endGameBuildingCount" => [
        "id" => 26,
        "name" => totranslate("End game buildings count"),
        "type" => "int"
    ],
    "endGameBuildingWithRoofCount" => [
        "id" => 27,
        "name" => totranslate("End game buildings with roofs count"),
        "type" => "int"
    ],
    "brambleAreasPlaced" => [
        "id" => 28,
        "name" => totranslate("Number of bramble areas placed"),
        "type" => "int"
    ],
];

$stats_type = [

    // Statistics global to table
    "table" => $commonStats + [
        "roundNumber" => [
            "id" => 50,
            "name" => totranslate("Round number"),
            "type" => "int"
        ], 
    ],
    
    // Statistics existing for each player
    "player" => $commonStats + [
    ]
];
