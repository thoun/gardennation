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
  	
  	// TODO: defines your action entry points there

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

    public function chooseNextPlayer() {
      self::setAjaxMode();

      $playerId = self::getArg("playerId", AT_posint, true);

      $this->game->chooseNextPlayer($playerId);

      self::ajaxResponse();
    }

  }
  

