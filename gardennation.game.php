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
  * gardennation.game.php
  *
  * This is the main file for your game logic.
  *
  * In this PHP file, you are going to defines the rules of the game.
  *
  */

use Bga\GameFramework\Components\Deck;
use Bga\GameFramework\Table;

require_once('modules/php/constants.inc.php');
require_once('modules/php/utils.php');
require_once('modules/php/actions.php');
require_once('modules/php/states.php');
require_once('modules/php/args.php');
require_once('modules/php/debug-util.php');

class GardenNation extends Table {
    use UtilTrait;
    use ActionTrait;
    use StateTrait;
    use ArgsTrait;
    use DebugUtilTrait;

    public Deck $commonProjects;
    public Deck $secretMissions;

    public array $BUILDING_FLOORS;
    public array $MAP;
    public array $END_INHABITANTS_POINTS;
    public array $COMMON_PROJECTS;
    public array $SECRET_MISSIONS;
    public array $TERRITORY_AREA_INDEX_ADJACENT;

	function __construct() {
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        $this->initGameStateLabels([
            LAST_ROUND => 10,
            PLAYED_ACTIONS => 11,
            PLOY_USED => 12,
            TORTICRANE_POSITION => 13,
            SELECTED_AREA_POSITION => 14,
        ]);
		
        $this->commonProjects = $this->deckFactory->createDeck("common_project");
        $this->commonProjects->autoreshuffle = true;
		
        $this->secretMissions = $this->deckFactory->createDeck("secret_mission");
	}

    /*
        setupNewGame:
        
        This method is called only once, when a new game is launched.
        In this method, you must setup the game according to the game rules, so that
        the game is ready to be played.
    */
    protected function setupNewGame($players, $options = []) {    
        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar, player_inhabitants, player_turn_track, `player_used_ploy`) VALUES ";
        $values = [];
        $firstPlayer = true;
        foreach ($players as $player_id => $player) {
            $color = array_splice($default_colors, bga_rand(0, count($default_colors) - 1), 1)[0];
            $inhabitants = $firstPlayer ? 38 : 35;
            $playerTurnTrack = $firstPlayer ? 1 : 0;
            $values[] = "('".$player_id."','$color','".$player['player_canal']."','".addslashes( $player['player_name'] )."','".addslashes( $player['player_avatar'] )."', $inhabitants, $playerTurnTrack, '[0,0,0]')";

            $firstPlayer = false;
        }
        $sql .= implode(',', $values);
        $this->DbQuery($sql);
        $this->reattributeColorsBasedOnPreferences($players, $gameinfos['player_colors']);
        $this->reloadPlayersBasicInfos();
        
        /************ Start the game initialization *****/

        // Init global values with their initial values
        $this->setGameStateInitialValue(TORTICRANE_POSITION, -1);
        $this->setGameStateInitialValue(LAST_ROUND, 0);
        $this->setGameStateInitialValue(PLAYED_ACTIONS, 0);
        $this->setGameStateInitialValue(PLOY_USED, 0);
        
        // Init game statistics
        // (note: statistics used in this file must be defined in your stats.inc.php file)
        $this->initStat('table', 'roundNumber', 0);
        foreach(['table', 'player'] as $statType) {
            $this->initStat($statType, 'actionsNumber', 0);
            $this->initStat($statType, 'turnsNumber', 0);
            $this->initStat($statType, 'constructedFloors', 0);
            $this->initStat($statType, 'abandonedBuildings', 0);
            $this->initStat($statType, 'usedPloys', 0);
            $this->initStat($statType, 'usedPloysBuildingInvasion', 0);
            $this->initStat($statType, 'usedPloysStrategicMovement', 0);
            $this->initStat($statType, 'usedPloysRoofTransfer', 0);
            $this->initStat($statType, 'territoryControlWin', 0);
            $this->initStat($statType, 'inhabitantsGainedWithTerritoryControl', 0);
            $this->initStat($statType, 'territoryControlWinAlone', 0);
            $this->initStat($statType, 'territoryControlWinShared', 0);
            $this->initStat($statType, 'completedCommonProjects', 0);
            $this->initStat($statType, 'pointsWithCommonProjects', 0);
            $this->initStat($statType, 'completedSecretMissions', 0);
            $this->initStat($statType, 'pointsWithSecretMissions', 0);
            $this->initStat($statType, 'brambleAreasPlaced', 0);
        }

        // setup the initial game situation

        // init territories
        $territories = [1,2,3,4,5,6,7];        
        $sql = "INSERT INTO `territory` (`position`, `number`, `rotation`) VALUES ";
        $values = [];
        $affectedTerritories = [];
        foreach ([0,1,2,3,4,5,6] as $position) {
            $number = $territories[bga_rand(1, count($territories)) - 1];
            while (in_array($number, $affectedTerritories)) {
                $number = $territories[bga_rand(1, count($territories)) - 1];
            }
            $rotation = bga_rand(0, 5);
            $affectedTerritories[$position] = $number;
            $values[] = "($position, $number, $rotation)";
        }
        $sql .= implode(',', $values);
        $this->DbQuery($sql);

        // bramble areas
        $this->DbQuery("INSERT INTO `bramble_area` (`type`) VALUES (1), (1), (1), (2), (2), (2), (3), (3), (3)");

        // building floors
        $this->setupBuildingFloors(array_keys($players));

        // cards
        $this->initCommonProjects();
		$this->initSecretMissions();
        
        $this->setInitialCommonProjects();
        $this->setInitialSecretMissions(array_keys($players));

        // Activate first player (which is in general a good idea :) )
        $this->activeNextPlayer();

        return \ST_MULTIPLAYER_CHOOSE_SECRET_MISSIONS;
    }

    /*
        getAllDatas: 
        
        Gather all informations about current game situation (visible by the current player).
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
    */
    protected function getAllDatas(): array {
        $result = [];
    
        $currentPlayerId = $this->getCurrentPlayerId();    // !! We must only return informations visible by this player !!
    
        // Get information about players
        // Note: you can retrieve some extra field you added for "player" table in "dbmodel.sql" if you need it.
        $sql = "SELECT player_id id, player_score score, player_no playerNo, player_inhabitants as inhabitants, player_turn_track as turnTrack, `player_used_ploy` as usedPloy FROM player ";
        $result['players'] = $this->getCollectionFromDb($sql);
  
        // Gather all information about current game situation (visible by player $currentPlayerId).
        
        foreach($result['players'] as $playerId => &$player) {
            $player['playerNo'] = intval($player['playerNo']);
            $player['inhabitants'] = intval($player['inhabitants']);
            $player['turnTrack'] = intval($player['turnTrack']);
            $player['usedPloy'] = json_decode($player['usedPloy']);

            $player['buildingFloors'] = $this->getAvailableBuildingFloors($playerId);

            $player['commonProjects'] = $this->getCommonProjectsFromDb($this->commonProjects->getCardsInLocation('hand', $playerId));

            $secretMissions = $this->getSecretMissionsFromDb($this->secretMissions->getCardsInLocation('hand', $playerId));
            $player['secretMissions'] = $currentPlayerId == $playerId ? $secretMissions : array_map(function($secretMission) {
                $secretMissionIdOnly = new stdClass();
                $secretMissionIdOnly->id = $secretMission->id;
                return $secretMissionIdOnly;
            }, $secretMissions);
        }

        $result['territories'] = $this->getTerritories();
        $map = $this->getMap();
        //$this->debug($map);
        $buildings = $this->getBuildings();
        $result['map'] = [];
        
        foreach ($map as $position => $area) {
            $areaSpot = new stdClass();
            $areaSpot->type = $area[0];
            $areaSpot->cost = $area[1];
            $areaSpot->bramble = $area[2];
            $areaSpot->building = array_key_exists($position, $buildings) ? $buildings[$position] : null;
            $result['map'][$position] = $areaSpot;
        }

        $brambleTokensDb = $this->getCollectionFromDb("SELECT `id`, `type` FROM `bramble_area` WHERE `position` IS NULL");
        $brambleIds = [];
        foreach([1, 2, 3] as $type) {
            $brambleTokensDbForType = array_filter($brambleTokensDb, fn($brambleTokenDb) => $brambleTokenDb['type'] == $type);
            $brambleIds[$type] = array_values(array_map(fn($brambleToken) => intval($brambleToken['id']), $brambleTokensDbForType));
        }
        $result['brambleIds'] = $brambleIds;

        $result['remainingRoofs'] = $this->getAvailableBuildingFloors(0);
        
        $result['torticranePosition'] = $this->getGameStateValue(TORTICRANE_POSITION);

        $result['commonProjects'] = $this->getCommonProjectsFromDb($this->commonProjects->getCardsInLocation('table', null, 'location_arg'));

        $isEndScore = intval($this->gamestate->state_id()) >= ST_END_SCORE;
        if (!$isEndScore) {
            $result['endTurn'] = boolval($this->getGameStateValue(LAST_ROUND));
            
        }
  
        return $result;
    }

    /*
        getGameProgression:
        
        Compute and return the current game progression.
        The number returned must be an integer beween 0 (=the game just started) and
        100 (= the game is finished or almost finished).
    
        This method is called each time we are in a game state with the "updateGameProgression" property set to true 
        (see states.inc.php)
    */
    function getGameProgression() {
        $stateName = $this->gamestate->state()['name']; 
        if ($stateName === 'gameEnd') {
            return 100;
        }

        $minPlayerBuildings = intval($this->getUniqueValueFromDB("SELECT min(`count`) FROM (SELECT player.player_id, count(*) as `count` FROM player left join `building_floor` ON player.player_id = building_floor.player_id WHERE `territory_number` is null group by player.player_id) tmp"));
        $maxPlayerBuildings = $this->BUILDING_FLOORS[count($this->getPlayersIds())];

        return 100 * ($maxPlayerBuildings - $minPlayerBuildings) / $maxPlayerBuildings;
    }

//////////////////////////////////////////////////////////////////////////////
//////////// Zombie
////////////

    /*
        zombieTurn:
        
        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).
        
        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message. 
    */

    function zombieTurn($state, $active_player) {
    	$statename = $state['name'];
    	
        if ($state['type'] === "activeplayer") {
            switch ($statename) {
                case 'chooseNextPlayer':
                    $players = $this->getPlayers();
                    $playerId = $players[bga_rand(0, count($players) - 1)]->id;
                    $this->applyChooseNextPlayer($playerId);
                    break;
                default:
                    // be sure zombie player is not last on the turn track
                    
                    $players = $this->getPlayers();
                    $maxOrder = max(array_map(fn($player) => $player->turnTrack, $players));
                    if ($active_player == $this->array_find($players, fn($player) => $player->turnTrack == $maxOrder)->id) {
                        $playersAtOrderZero = $this->argChooseNextPlayer()['possibleNextPlayers'];
                        if (count($playersAtOrderZero) == 0) {
                            $this->gamestate->jumpToState(ST_END_ROUND);
                            break;
                        }
                        $order = $maxOrder + 1;
                        $playerId = $playersAtOrderZero[bga_rand(0, count($playersAtOrderZero) - 1)];
                        $this->DbQuery("UPDATE player SET `player_turn_track` = $order WHERE `player_id` = $playerId");

                        $this->notify->all('setPlayerOrder', clienttranslate('${player_name} is the next player'), [
                            'playerId' => $playerId,
                            'player_name' => $this->getPlayerName($playerId),
                            'order' => $order,
                        ]);
                    }

                    $this->gamestate->jumpToState(ST_NEXT_PLAYER);
                	break;
            }
            return;
        } else if ($state['type'] == "multipleactiveplayer") {
            // Make sure player is in a non blocking status for role turn
            $sql = "
                UPDATE  player
                SET     player_is_multiactive = 0
                WHERE   player_id = $active_player
            ";
            $this->DbQuery($sql);

            $this->gamestate->updateMultiactiveOrNextState('end');
            return;
        }

        throw new feException("Zombie mode not supported at this game state: ".$statename);
    }
    
///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:
        
        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.
    
    */
    
    function upgradeTableDb($from_version) {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
        
        // Example:
//        if( $from_version <= 1404301345 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//        }
//        if( $from_version <= 1405061421 )
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            $this->applyDbUpgradeToAllDB( $sql );
//        }
//        // Please add your future database scheme changes here
//
//


    }    
}
