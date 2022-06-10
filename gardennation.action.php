<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * GardenNation implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 * 
 * gardennation.action.php
 *
 * GardenNation main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *       
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/gardennation/gardennation/myAction.html", ...)
 *
 */
  
  
  class action_gardennation extends APP_GameAction { 
    // Constructor: please do not modify
   	public function __default() {
  	    if (self::isArg( 'notifwindow')) {
            $this->view = "common_notifwindow";
  	        $this->viewArgs['table'] = self::getArg("table", AT_posint, true);
  	    } else {
            $this->view = "gardennation_gardennation";
            self::trace( "Complete reinitialization of board game" );
      }
  	}

    public function chooseConstructBuilding() {
      self::setAjaxMode();

      $this->game->chooseConstructBuilding();

      self::ajaxResponse();
    }

    public function chooseAbandonBuilding() {
      self::setAjaxMode();

      $this->game->chooseAbandonBuilding();

      self::ajaxResponse();
    }

    public function chooseUsePloyToken() {
      self::setAjaxMode();

      $this->game->chooseUsePloyToken();

      self::ajaxResponse();
    }

    public function constructBuilding() {
      self::setAjaxMode();

      $areaPosition = self::getArg("areaPosition", AT_posint, true);

      $this->game->constructBuilding($areaPosition);

      self::ajaxResponse();
    }

    public function cancelConstructBuilding() {
      self::setAjaxMode();

      $this->game->cancelConstructBuilding();

      self::ajaxResponse();
    }

    public function abandonBuilding() {
      self::setAjaxMode();

      $areaPosition = self::getArg("areaPosition", AT_posint, true);

      $this->game->abandonBuilding($areaPosition);

      self::ajaxResponse();
    }

    public function cancelAbandonBuilding() {
      self::setAjaxMode();

      $this->game->cancelAbandonBuilding();

      self::ajaxResponse();
    }

    public function chooseTypeOfLand() {
      self::setAjaxMode();

      $typeOfLand = self::getArg("typeOfLand", AT_posint, true);

      $this->game->chooseTypeOfLand($typeOfLand);

      self::ajaxResponse();
    }

    public function cancelChooseTypeOfLand() {
      self::setAjaxMode();

      $this->game->cancelChooseTypeOfLand();

      self::ajaxResponse();
    }

    public function changeTerritory() {
      self::setAjaxMode();

      $territoryNumber = self::getArg("territoryNumber", AT_posint, true);

      $this->game->changeTerritory($territoryNumber);

      self::ajaxResponse();
    }

    public function skipTurn() {
      self::setAjaxMode();

      $this->game->skipTurn();

      self::ajaxResponse();
    }

    public function chooseNextPlayer() {
      self::setAjaxMode();

      $playerId = self::getArg("playerId", AT_posint, true);

      $this->game->chooseNextPlayer($playerId);

      self::ajaxResponse();
    }

    public function usePloyToken() {
      self::setAjaxMode();

      $type = self::getArg("type", AT_posint, true);

      $this->game->usePloyToken($type);

      self::ajaxResponse();
    }

    public function cancelUsePloyToken() {
      self::setAjaxMode();

      $this->game->cancelUsePloyToken();

      self::ajaxResponse();
    }

    public function strategicMovement() {
      self::setAjaxMode();

      $territory = self::getArg("territory", AT_posint, true);

      $this->game->strategicMovement($territory);

      self::ajaxResponse();
    }

    public function cancelUsePloy() {
      self::setAjaxMode();

      $this->game->cancelUsePloy();

      self::ajaxResponse();
    }

    public function chooseRoofToTransfer() {
      self::setAjaxMode();

      $areaPosition = self::getArg("areaPosition", AT_posint, true);

      $this->game->chooseRoofToTransfer($areaPosition);

      self::ajaxResponse();
    }

    public function chooseRoofDestination() {
      self::setAjaxMode();

      $areaPosition = self::getArg("areaPosition", AT_posint, true);

      $this->game->chooseRoofDestination($areaPosition);

      self::ajaxResponse();
    }

    public function buildingInvasion() {
      self::setAjaxMode();

      $areaPosition = self::getArg("areaPosition", AT_posint, true);

      $this->game->buildingInvasion($areaPosition);

      self::ajaxResponse();
    }

    public function cancelBuildingInvasion() {
      self::setAjaxMode();

      $this->game->cancelBuildingInvasion();

      self::ajaxResponse();
    }

    public function chooseCompletedCommonProject() {
      self::setAjaxMode();

      $id = self::getArg("id", AT_posint, true);

      $this->game->chooseCompletedCommonProject($id);

      self::ajaxResponse();
    }

    public function skipCompletedCommonProject() {
      self::setAjaxMode();

      $this->game->skipCompletedCommonProject();

      self::ajaxResponse();
    }

  }
  

