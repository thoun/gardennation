<?php

/*
 * State constants
 */
define('ST_BGA_GAME_SETUP', 1);

define('ST_PLAYER_CHOOSE_ACTION', 20);

define('ST_PLAYER_CONSTRUCT_BUILDING', 30);
define('ST_PLAYER_CHOOSE_TYPE_OF_LAND', 31);

define('ST_PLAYER_ABANDON_BUILDING', 40);

define('ST_PLAYER_USE_PLOY_TOKEN', 50);
define('ST_PLAYER_STRATEGIC_MOVEMENT', 52);
define('ST_PLAYER_CHOOSE_ROOF_TO_TRANSFER', 54);
define('ST_PLAYER_CHOOSE_ROOF_DESTINATION', 55);
define('ST_PLAYER_BUILDING_INVASION', 56);

define('ST_END_ACTION', 70);

define('ST_PLAYER_CHOOSE_NEXT_PLAYER', 70);

define('ST_NEXT_PLAYER', 75);

define('ST_END_ROUND', 80); // Territory Control

define('ST_END_SCORE', 90);

define('ST_END_GAME', 99);
define('END_SCORE', 100);

/*
 * Variables
 */
define('LAST_ROUND', 'LAST_ROUND');
define('PLOY_USED', 'PLOY_USED');
define('PLAYED_ACTIONS', 'PLAYED_ACTIONS');
?>
