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
 * material.inc.php
 *
 * GardenNation game material description
 *
 * Here, you can describe the material of your game with PHP variables.
 *   
 * This file is loaded in your game logic class constructor, ie these variables
 * are available everywhere in your game logic code.
 *
 */


$this->BUILDING_FLOORS = [
  2 => 20,
  3 => 17,
  4 => 14,
];

$this->MAP = [
  // center
  40 => [3, 2],
  41 => [1, 4],
  42 => [3, 5],
  43 => [0, 5],
  44 => [2, 1],
  45 => [3, 4],
  46 => [1, 3],
  // top left
  10 => [0, 5],
  11 => [2, 4],
  12 => [2, 4],
  13 => [1, 4],
  14 => [1, 3],
  15 => [3, 5],
  16 => [3, 1],
  // top right
  20 => [1, 3],
  21 => [1, 2],
  22 => [3, 4],
  23 => [2, 4],
  24 => [0, 5],
  25 => [3, 3],
  26 => [2, 5],
  // right
  50 => [2, 4],
  51 => [3, 3],
  52 => [1, 5],
  53 => [3, 2],
  54 => [1, 3],
  55 => [0, 5],
  56 => [2, 2],
  // bottom right
  70 => [1, 5],
  71 => [2, 5],
  72 => [3, 4],
  73 => [2, 3],
  74 => [1, 1],
  75 => [0, 5],
  76 => [3, 3],
  // bottom left
  60 => [3, 5],
  61 => [2, 3],
  62 => [1, 4],
  63 => [1, 4],
  64 => [3, 3],
  65 => [2, 3],
  66 => [0, 5],
  // left
  30 => [3, 3],
  31 => [2, 3],
  32 => [3, 4],
  33 => [1, 4],
  34 => [0, 5],
  35 => [2, 1],
  36 => [1, 3],
];

$this->END_INHABITANTS_POINTS = [
  1 => -30,
  2 => -20,
  4 => -10,
  6 => -5,
  8 => -3,
  10 => 0,
  11 => 1,
  15 => 2,
  17 => 3,
  20 => 4,
  23 => 5,
  26 => 6,
  29 => 7,
  32 => 8,
  35 => 9,
  38 => 10,
];

$this->COMMON_PROJECTS = [
  new CommonProjectCard(1, 1, 4, clienttranslate("Infirmary"), 1, 2),
  new CommonProjectCard(1, 2, 4, clienttranslate("Infirmary"), 1, 3),
  new CommonProjectCard(1, 3, 4, clienttranslate("Sacred Place"), 2, 1),
  new CommonProjectCard(1, 4, 4, clienttranslate("Sacred Place"), 2, 3),
  new CommonProjectCard(1, 5, 4, clienttranslate("Fortress"), 3, 1),
  new CommonProjectCard(1, 6, 4, clienttranslate("Fortress"), 3, 2),
  new CommonProjectCard(2, 1, 3, clienttranslate("Herbalist")),
  new CommonProjectCard(2, 2, 3, clienttranslate("House")),
  new CommonProjectCard(2, 3, 3, clienttranslate("Prison")),
  new CommonProjectCard(3, 1, 3, clienttranslate("Forge")),
  new CommonProjectCard(3, 2, 3, clienttranslate("Terraced Houses")),
  new CommonProjectCard(3, 3, 3, clienttranslate("Outpost")),
  new CommonProjectCard(4, 1, 5, clienttranslate("Windmill")),
  new CommonProjectCard(4, 2, 5, clienttranslate("Sanctuary")),
  new CommonProjectCard(4, 3, 5, clienttranslate("Bunker")),
  new CommonProjectCard(5, 1, 7, clienttranslate("Power Station")),
  new CommonProjectCard(5, 2, 7, clienttranslate("Apartments")),
  new CommonProjectCard(5, 3, 7, clienttranslate("Radio Tower")),
  new CommonProjectCard(6, 1, 11, clienttranslate("Water Reservoir")),
  new CommonProjectCard(6, 2, 11, clienttranslate("Temple")),
  new CommonProjectCard(6, 3, 11, clienttranslate("Air Base")),
];

$this->SECRET_MISSIONS = [
  new SecretMissionCard(2, 1, 1, clienttranslate("Market")),
  new SecretMissionCard(2, 1, 2, clienttranslate("Sculpture")),
  new SecretMissionCard(2, 1, 3, clienttranslate("Watchtower")),
  new SecretMissionCard(2, 2, 1, clienttranslate("Post Office")),
  new SecretMissionCard(2, 2, 2, clienttranslate("Cabaret")),
  new SecretMissionCard(2, 2, 3, clienttranslate("Barracks")),
  new SecretMissionCard(3, 3, 1, clienttranslate("Belfry")),
  new SecretMissionCard(2, 3, 2, clienttranslate("Observatory")),
];
for ($i = 1; $i <= 7; $i++) {
  $this->SECRET_MISSIONS[] = new SecretMissionCard(1, 4, $i, clienttranslate("Territory Control"), [$i, ($i + 1) % 6  + 1]);
}

$this->TERRITORY_AREA_INDEX_ADJACENT = [
  0 => [
    1 => [1, 4],
    2 => [2, 5],
    3 => [3, 6],
    4 => [4, 1],
    5 => [5, 2],
    6 => [6, 3],
  ], 
  1 => [
    3 => [2, 6],
    4 => [0, 1],
    5 => [6, 2],
  ],
  2 => [
    4 => [3, 1],
    5 => [0, 2],
    6 => [1, 3],
  ],
  3 => [
    1 => [2, 4],
    5 => [4, 2],
    6 => [0, 3],
  ],
  4 => [
    1 => [0, 4],
    2 => [3, 5],
    6 => [5, 3],
  ],
  5 => [
    1 => [6, 4],
    2 => [0, 5],
    3 => [4, 6],
  ],
  6 => [
    2 => [1, 5],
    3 => [0, 6],
    4 => [5, 1],
  ],
];
