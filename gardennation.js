function slideToObjectAndAttach(game, object, destinationId) {
    var destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return;
    }
    var originBR = object.getBoundingClientRect();
    destination.appendChild(object);
    if (document.visibilityState !== 'hidden' && !game.instantaneousMode) {
        var destinationBR = object.getBoundingClientRect();
        var deltaX = destinationBR.left - originBR.left;
        var deltaY = destinationBR.top - originBR.top;
        object.style.zIndex = '10';
        object.style.transform = "translate(".concat(-deltaX, "px, ").concat(-deltaY, "px)");
        setTimeout(function () {
            object.style.transition = "transform 0.5s linear";
            object.style.transform = null;
        });
        setTimeout(function () {
            object.style.zIndex = null;
            object.style.transition = null;
        }, 600);
    }
}
function slideFromObject(game, object, fromId) {
    var from = document.getElementById(fromId);
    var originBR = from.getBoundingClientRect();
    if (document.visibilityState !== 'hidden' && !game.instantaneousMode) {
        var destinationBR = object.getBoundingClientRect();
        var deltaX = destinationBR.left - originBR.left;
        var deltaY = destinationBR.top - originBR.top;
        object.style.zIndex = '10';
        object.style.transform = "translate(".concat(-deltaX, "px, ").concat(-deltaY, "px)");
        setTimeout(function () {
            object.style.transition = "transform 0.5s linear";
            object.style.transform = null;
        });
        setTimeout(function () {
            object.style.zIndex = null;
            object.style.transition = null;
        }, 600);
    }
}
/*declare const board: HTMLDivElement;*/
var CARD_WIDTH = 129;
var CARD_HEIGHT = 240;
function setupAdventurersCards(adventurerStock) {
    var cardsurl = "".concat(g_gamethemeurl, "img/adventurers.png");
    for (var i = 0; i <= 7; i++) {
        adventurerStock.addItemType(i, i, cardsurl, i);
    }
}
function setupCompanionCards(companionsStock) {
    companionsStock.image_items_per_row = 10;
    var cardsurl = "".concat(g_gamethemeurl, "img/companions.png");
    for (var subType = 1; subType <= 46; subType++) {
        companionsStock.addItemType(subType, 0, cardsurl, subType + (subType > 23 ? 1 : 0));
    }
    companionsStock.addItemType(1001, 0, cardsurl, 0);
    companionsStock.addItemType(1002, 0, cardsurl, 24);
}
function setupSpellCards(spellsStock) {
    var cardsurl = "".concat(g_gamethemeurl, "img/spells.png");
    for (var type = 1; type <= 7; type++) {
        spellsStock.addItemType(type, type, cardsurl, type);
    }
    spellsStock.addItemType(0, 0, cardsurl, 0);
}
function setupSoloTileCards(soloTilesStock) {
    var cardsurl = "".concat(g_gamethemeurl, "img/solo-tiles.png");
    for (var type = 1; type <= 8; type++) {
        soloTilesStock.addItemType(type, type, cardsurl, type - 1);
    }
    soloTilesStock.addItemType(0, 0, cardsurl, 0);
}
function setupAdventurerCard(game, cardDiv, type) {
    var adventurer = game.gamedatas.ADVENTURERS[type];
    var tooltip = 'TODO';
    game.addTooltipHtml(cardDiv.id, "<h3>".concat(adventurer.name, "</h3>").concat(tooltip || ''));
}
function moveToAnotherStock(sourceStock, destinationStock, uniqueId, cardId) {
    if (sourceStock === destinationStock) {
        return;
    }
    var sourceStockItemId = "".concat(sourceStock.container_div.id, "_item_").concat(cardId);
    if (document.getElementById(sourceStockItemId)) {
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStockItemId);
        sourceStock.removeFromStockById(cardId);
    }
    else {
        console.warn("".concat(sourceStockItemId, " not found in "), sourceStock);
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStock.container_div.id);
    }
    var destinationDiv = document.getElementById("".concat(destinationStock.container_div.id, "_item_").concat(cardId));
    destinationDiv.style.zIndex = '10';
    setTimeout(function () { return destinationDiv.style.zIndex = 'unset'; }, 1000);
}
function addToStockWithId(destinationStock, uniqueId, cardId, from) {
    destinationStock.addToStockWithId(uniqueId, cardId, from);
    var destinationDiv = document.getElementById("".concat(destinationStock.container_div.id, "_item_").concat(cardId));
    destinationDiv.style.zIndex = '10';
    setTimeout(function () { return destinationDiv.style.zIndex = 'unset'; }, 1000);
}
function formatTextIcons(rawText) {
    return rawText
        .replace(/\[reroll\]/ig, '<span class="icon reroll"></span>')
        .replace(/\[point\]/ig, '<span class="icon point"></span>')
        .replace(/\[symbol(\d)\]/ig, '<span class="icon symbol$1"></span>')
        .replace(/\[die:(\d):(\d)\]/ig, '<span class="die-icon" data-color="$1" data-face="$2"></span>');
}
var Board = /** @class */ (function () {
    function Board(game, players, territories, map, torticranePosition) {
        var _this = this;
        this.game = game;
        this.players = players;
        this.territories = territories;
        this.map = map;
        document.getElementById("order-track").dataset.playerNumber = '' + players.length;
        players.forEach(function (player) { return dojo.place("\n            <div id=\"order-token-".concat(player.id, "\" class=\"token\" data-color=\"").concat(player.color, "\"></div>\n        "), "order-track-".concat(player.turnTrack)); });
        dojo.place("<div id=\"torticrane-spot--1\" class=\"torticrane-spot\"></div>", "board");
        [0, 1, 2, 3, 4, 5, 6].forEach(function (territoryPosition) {
            var territoryNumber = territories[territoryPosition][0];
            var territoryRotation = territories[territoryPosition][1];
            dojo.place("\n                <div id=\"territory".concat(territoryPosition, "\" class=\"territory\" data-position=\"").concat(territoryPosition, "\" data-number=\"").concat(territoryNumber, "\" data-rotation=\"").concat(territoryRotation, "\">\n                    <div id=\"torticrane-spot-").concat(territoryPosition, "\" class=\"torticrane-spot\"></div>\n                </div>\n            "), "board");
            [0, 1, 2, 3, 4, 5, 6].forEach(function (areaPosition) {
                var position = territoryNumber * 10 + areaPosition;
                var mapPosition = map[position];
                var type = mapPosition[0] % 10;
                var bramble = type > 10;
                var rotation = areaPosition;
                if (areaPosition > 0) {
                    rotation = (areaPosition + territoryRotation - 1) % 6 + 1;
                }
                dojo.place("\n                    <div id=\"area".concat(position, "\" class=\"area\" data-position=\"").concat(position, "\" data-type=\"").concat(type, "\" data-bramble=\"").concat(bramble.toString(), "\" data-cost=\"").concat(mapPosition[1], "\" data-position=\"").concat(areaPosition, "\" data-rotation=\"").concat(rotation, "\">").concat(position, "<br>type ").concat(mapPosition[0], "<br>cost ").concat(mapPosition[1], "</div>\n                "), "territory".concat(territoryPosition));
                document.getElementById("area".concat(position)).addEventListener('click', function () { return _this.game.onAreaClick(position); });
            });
        });
        dojo.place("<div id=\"torticrane\"></div>", "torticrane-spot-".concat(torticranePosition));
    }
    Board.prototype.setPoints = function (playerId, points) {
        // TODO
    };
    Board.prototype.activatePossibleAreas = function (possibleAreas) {
        Array.from(document.getElementsByClassName('area')).forEach(function (area) { return area.classList.toggle('selectable', possibleAreas.includes(Number(area.dataset.position))); });
    };
    return Board;
}());
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        this.game = game;
        this.playerId = Number(player.id);
        var html = "\n        <div id=\"player-table-".concat(this.playerId, "\" class=\"player-table whiteblock\">\n            <div id=\"player-table-").concat(this.playerId, "-name\" class=\"player-name\" style=\"color: #").concat(player.color, ";\">").concat(player.name, "</div>\n            <div id=\"player-table-").concat(this.playerId, "-score-board\" class=\"player-score-board\" data-color=\"").concat(player.color, "\"></div>\n        </div>");
        dojo.place(html, 'playerstables');
    }
    return PlayerTable;
}());
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var ANIMATION_MS = 500;
var SCORE_MS = 1500;
var ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5];
var ZOOM_LEVELS_MARGIN = [-300, -166, -100, -60, -33, -14, 0, 20, 33.34];
var LOCAL_STORAGE_ZOOM_KEY = 'GardenNation-zoom';
var isDebug = window.location.host == 'studio.boardgamearena.com';
var log = isDebug ? console.log.bind(window.console) : function () { };
var GardenNation = /** @class */ (function () {
    function GardenNation() {
        this.playersTables = [];
        this.inhabitantCounters = [];
        this.buildingFloorCounters = [];
        this.ployTokenCounters = [];
        this.zoom = 1;
        var zoomStr = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
        if (zoomStr) {
            this.zoom = Number(zoomStr);
        }
    }
    /*
        setup:

        This method must set up the game user interface according to current game situation specified
        in parameters.

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)

        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */
    GardenNation.prototype.setup = function (gamedatas) {
        log("Starting game setup");
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        this.createPlayerPanels(gamedatas);
        var players = Object.values(gamedatas.players);
        this.board = new Board(this, players, gamedatas.territories, gamedatas.map, gamedatas.torticranePosition);
        this.createPlayerTables(gamedatas);
        if (gamedatas.endTurn) {
            this.notif_lastTurn();
        }
        if (Number(gamedatas.gamestate.id) >= 80) { // score or end
            this.onEnteringShowScore(true);
        }
        this.addHelp();
        this.setupNotifications();
        this.setupPreferences();
        /*document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        if (this.zoom !== 1) {
            this.setZoom(this.zoom);
        }
        (this as any).onScreenWidthChange = () => {
            this.setAutoZoom();
        }*/
        log("Ending game setup");
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    GardenNation.prototype.onEnteringState = function (stateName, args) {
        log('Entering state: ' + stateName, args.args);
        switch (stateName) {
            case 'constructBuilding':
            case 'abandonBuilding':
                this.onEnteringConstructBuilding(args.args);
                break;
            case 'endScore':
                this.onEnteringShowScore();
                break;
            case 'gameEnd':
                var lastTurnBar = document.getElementById('last-round');
                if (lastTurnBar) {
                    lastTurnBar.style.display = 'none';
                }
                break;
        }
    };
    GardenNation.prototype.onEnteringConstructBuilding = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.board.activatePossibleAreas(args.possiblePositions);
        }
    };
    GardenNation.prototype.onEnteringShowScore = function (fromReload) {
        if (fromReload === void 0) { fromReload = false; }
        var lastTurnBar = document.getElementById('last-round');
        if (lastTurnBar) {
            lastTurnBar.style.display = 'none';
        }
        /*document.getElementById('score').style.display = 'flex';

        const headers = document.getElementById('scoretr');
        if (!headers.childElementCount) {
            dojo.place(`
                <th></th>
                <th id="th-before-end-score" class="before-end-score">${_("Score at last day")}</th>
                <th id="th-cards-score" class="cards-score">${_("Adventurer and companions")}</th>
                <th id="th-board-score" class="board-score">${_("Journey board")}</th>
                <th id="th-fireflies-score" class="fireflies-score">${_("Fireflies")}</th>
                <th id="th-footprints-score" class="footprints-score">${_("Footprint tokens")}</th>
                <th id="th-after-end-score" class="after-end-score">${_("Final score")}</th>
            `, headers);
        }

        const players = Object.values(this.gamedatas.players);
        if (players.length == 1) {
            players.push(this.gamedatas.tom);
        }

        players.forEach(player => {
            //if we are a reload of end state, we display values, else we wait for notifications
            const playerScore = fromReload ? (player as any) : null;

            const firefliesScore = fromReload && Number(player.id) > 0 ? (this.fireflyCounters[player.id].getValue() >= this.companionCounters[player.id].getValue() ? 10 : 0) : undefined;
            const footprintsScore = fromReload ? this.footprintCounters[player.id].getValue() : undefined;

            dojo.place(`<tr id="score${player.id}">
                <td class="player-name" style="color: #${player.color}">${Number(player.id) == 0 ? 'Tom' : player.name}</td>
                <td id="before-end-score${player.id}" class="score-number before-end-score">${playerScore?.scoreBeforeEnd !== undefined ? playerScore.scoreBeforeEnd : ''}</td>
                <td id="cards-score${player.id}" class="score-number cards-score">${playerScore?.scoreCards !== undefined ? playerScore.scoreCards : ''}</td>
                <td id="board-score${player.id}" class="score-number board-score">${playerScore?.scoreBoard !== undefined ? playerScore.scoreBoard : ''}</td>
                <td id="fireflies-score${player.id}" class="score-number fireflies-score">${firefliesScore !== undefined ? firefliesScore : ''}</td>
                <td id="footprints-score${player.id}" class="score-number footprints-score">${footprintsScore !== undefined ? footprintsScore : ''}</td>
                <td id="after-end-score${player.id}" class="score-number after-end-score total">${playerScore?.scoreAfterEnd !== undefined ? playerScore.scoreAfterEnd : ''}</td>
            </tr>`, 'score-table-body');
        });

        (this as any).addTooltipHtmlToClass('before-end-score', _("Score before the final count."));
        (this as any).addTooltipHtmlToClass('cards-score', _("Total number of bursts of light on adventurer and companions."));
        (this as any).addTooltipHtmlToClass('board-score', this.gamedatas.side == 1 ?
            _("Number of bursts of light indicated on the village where encampment is situated.") :
            _("Number of bursts of light indicated on the islands on which players have placed their boats."));
        (this as any).addTooltipHtmlToClass('fireflies-score', _("Total number of fireflies in player possession, represented on companions and tokens. If there is many or more fireflies than companions, player score an additional 10 bursts of light."));
        (this as any).addTooltipHtmlToClass('footprints-score', _("1 burst of light per footprint in player possession."));
        */
    };
    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    GardenNation.prototype.onLeavingState = function (stateName) {
        log('Leaving state: ' + stateName);
        switch (stateName) {
            case 'constructBuilding':
            case 'abandonBuilding':
                this.onLeavingConstructBuilding();
                break;
        }
    };
    GardenNation.prototype.onLeavingConstructBuilding = function () {
        this.board.activatePossibleAreas([]);
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    GardenNation.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseAction':
                    var chooseActionArgs_1 = args;
                    this.addActionButton("chooseConstructBuilding-button", _("Construct building"), function () { return _this.chooseConstructBuilding(); });
                    this.addActionButton("chooseAbandonBuilding-button", _("Abandon building"), function () { return _this.chooseAbandonBuilding(); });
                    if (chooseActionArgs_1.canChangeTerritory) {
                        this.addActionButton("changeTerritory-button", _("Go to territory ${number}").replace('${number}', chooseActionArgs_1.canChangeTerritory), function () { return _this.changeTerritory(chooseActionArgs_1.canChangeTerritory); }, null, null, 'red');
                    }
                    this.addActionButton("chooseUsePloyToken-button", _("Use ploy token"), function () { return _this.chooseUsePloyToken(); }, null, null, 'red');
                    document.getElementById("chooseConstructBuilding-button").classList.toggle('disabled', !chooseActionArgs_1.canConstructBuilding);
                    document.getElementById("chooseAbandonBuilding-button").classList.toggle('disabled', !chooseActionArgs_1.canAbandonBuilding);
                    document.getElementById("chooseUsePloyToken-button").classList.toggle('disabled', !chooseActionArgs_1.canUsePloy);
                    break;
                case 'constructBuilding':
                    this.addActionButton("cancelConstructBuilding-button", _("Cancel"), function () { return _this.cancelConstructBuilding(); }, null, null, 'gray');
                    break;
                case 'abandonBuilding':
                    this.addActionButton("cancelAbandonBuilding-button", _("Cancel"), function () { return _this.cancelAbandonBuilding(); }, null, null, 'gray');
                    break;
                case 'chooseTypeOfLand':
                    var chooseTypeOfLandArgs = args;
                    chooseTypeOfLandArgs.possibleTypes.forEach(function (type) {
                        _this.addActionButton("chooseTypeOfLand".concat(type, "-button"), '', function () { return _this.chooseTypeOfLand(type); });
                        document.getElementById("chooseTypeOfLand".concat(type, "-button")).innerHTML =
                            "<div class=\"button-bramble-type\" data-type=\"".concat(type, "\"></div>");
                    });
                    this.addActionButton("cancelChooseTypeOfLand-button", _("Cancel"), function () { return _this.cancelChooseTypeOfLand(); }, null, null, 'gray');
                    break;
                case 'chooseNextPlayer':
                    var chooseNextPlayerArgs = args;
                    if (chooseNextPlayerArgs.possibleNextPlayers.length > 1) {
                        chooseNextPlayerArgs.possibleNextPlayers.forEach(function (playerId) {
                            var player = _this.getPlayer(playerId);
                            _this.addActionButton("choosePlayer".concat(playerId, "-button"), player.name, function () { return _this.chooseNextPlayer(playerId); });
                            document.getElementById("choosePlayer".concat(playerId, "-button")).style.border = "3px solid #".concat(player.color);
                        });
                    }
                    break;
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    GardenNation.prototype.setZoom = function (zoom) {
        if (zoom === void 0) { zoom = 1; }
        this.zoom = zoom;
        localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, '' + this.zoom);
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom);
        dojo.toggleClass('zoom-in', 'disabled', newIndex === ZOOM_LEVELS.length - 1);
        dojo.toggleClass('zoom-out', 'disabled', newIndex === 0);
        var div = document.getElementById('full-table');
        div.style.transform = zoom === 1 ? '' : "scale(".concat(zoom, ")");
        div.style.marginRight = "".concat(ZOOM_LEVELS_MARGIN[newIndex], "%");
        this.tableHeightChange();
        document.getElementById('board').classList.toggle('hd', this.zoom > 1);
        var stocks = this.playersTables.map(function (pt) { return pt.companionsStock; });
        /*if (this.adventurersStock) {
            stocks.push(this.adventurersStock);
        }*/
        stocks.forEach(function (stock) { return stock.updateDisplay(); });
        document.getElementById('zoom-wrapper').style.height = "".concat(div.getBoundingClientRect().height, "px");
        var fullBoardWrapperDiv = document.getElementById('full-board-wrapper');
        fullBoardWrapperDiv.style.display = fullBoardWrapperDiv.clientWidth < 916 * zoom ? 'block' : 'flex';
    };
    GardenNation.prototype.zoomIn = function () {
        if (this.zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]) {
            return;
        }
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom) + 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    };
    GardenNation.prototype.zoomOut = function () {
        if (this.zoom === ZOOM_LEVELS[0]) {
            return;
        }
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom) - 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    };
    GardenNation.prototype.setAutoZoom = function () {
        var _this = this;
        var zoomWrapperWidth = document.getElementById('zoom-wrapper').clientWidth;
        if (!zoomWrapperWidth) {
            setTimeout(function () { return _this.setAutoZoom(); }, 200);
            return;
        }
        var newZoom = this.zoom;
        while (newZoom > ZOOM_LEVELS[0] && zoomWrapperWidth / newZoom < 916 /* board width */) {
            newZoom = ZOOM_LEVELS[ZOOM_LEVELS.indexOf(newZoom) - 1];
        }
        this.setZoom(newZoom);
    };
    GardenNation.prototype.setupPreferences = function () {
        var _this = this;
        // Extract the ID and value from the UI control
        var onchange = function (e) {
            var match = e.target.id.match(/^preference_control_(\d+)$/);
            if (!match) {
                return;
            }
            var prefId = +match[1];
            var prefValue = +e.target.value;
            _this.prefs[prefId].value = prefValue;
            _this.onPreferenceChange(prefId, prefValue);
        };
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        // Call onPreferenceChange() now
        dojo.forEach(dojo.query("#ingame_menu_content .preference_control"), function (el) { return onchange({ target: el }); });
    };
    GardenNation.prototype.onPreferenceChange = function (prefId, prefValue) {
        switch (prefId) {
            // KEEP
            /*case 202:
                document.getElementById('full-table').dataset.highContrastPoints = '' + prefValue;
                break;*/
        }
    };
    GardenNation.prototype.getPlayerId = function () {
        return Number(this.player_id);
    };
    GardenNation.prototype.getPlayerScore = function (playerId) {
        var _a, _b;
        return (_b = (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.getValue()) !== null && _b !== void 0 ? _b : Number(this.gamedatas.players[playerId].score);
    };
    GardenNation.prototype.getPlayer = function (playerId) {
        return Object.values(this.gamedatas.players).find(function (player) { return Number(player.id) == playerId; });
    };
    GardenNation.prototype.getPlayerTable = function (playerId) {
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === playerId; });
    };
    GardenNation.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        Object.values(gamedatas.players).forEach(function (player) {
            var playerId = Number(player.id);
            // counters
            dojo.place("\n            <div class=\"counters\">\n                <div id=\"inhabitant-counter-wrapper-".concat(player.id, "\" class=\"counter\">\n                    <div class=\"icon inhabitant\" data-color=\"").concat(player.color, "\"></div> \n                    <span id=\"inhabitant-counter-").concat(player.id, "\"></span>\n                </div>\n                <div id=\"building-floor-counter-wrapper-").concat(player.id, "\" class=\"counter\">\n                    <div class=\"icon building-floor\" data-color=\"").concat(player.color, "\"></div> \n                    <span id=\"building-floor-counter-").concat(player.id, "\"></span>\n                </div>\n                <div id=\"ploy-token-counter-wrapper-").concat(player.id, "\" class=\"counter\">\n                    <div class=\"icon ploy-token\" data-color=\"").concat(player.color, "\"></div> \n                    <span id=\"ploy-token-counter-").concat(player.id, "\"></span>\n                </div>\n            </div>\n            "), "player_board_".concat(player.id));
            var inhabitantCounter = new ebg.counter();
            inhabitantCounter.create("inhabitant-counter-".concat(playerId));
            inhabitantCounter.setValue(player.inhabitants);
            _this.inhabitantCounters[playerId] = inhabitantCounter;
            var buildingFloorCounter = new ebg.counter();
            buildingFloorCounter.create("building-floor-counter-".concat(playerId));
            buildingFloorCounter.setValue(player.buildingFloors.length);
            _this.buildingFloorCounters[playerId] = buildingFloorCounter;
            var ployTokenCounter = new ebg.counter();
            ployTokenCounter.create("ploy-token-counter-".concat(playerId));
            ployTokenCounter.setValue(4 - player.usedPloy.reduce(function (a, b) { return a + b; }, 0));
            _this.ployTokenCounters[playerId] = ployTokenCounter;
        });
        /*(this as any).addTooltipHtmlToClass('reroll-counter', _("Rerolls tokens"));
        (this as any).addTooltipHtmlToClass('footprint-counter', _("Footprints tokens"));
        (this as any).addTooltipHtmlToClass('firefly-counter', _("Fireflies (tokens + companion fireflies) / number of companions"));*/
    };
    GardenNation.prototype.createPlayerTables = function (gamedatas) {
        var _this = this;
        var players = Object.values(gamedatas.players).sort(function (a, b) { return a.playerNo - b.playerNo; });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex), true), players.slice(0, playerIndex), true) : players;
        orderedPlayers.forEach(function (player) { return _this.createPlayerTable(gamedatas, Number(player.id)); });
    };
    GardenNation.prototype.createPlayerTable = function (gamedatas, playerId) {
        var playerTable = new PlayerTable(this, gamedatas.players[playerId]);
        this.playersTables.push(playerTable);
    };
    GardenNation.prototype.onAreaClick = function (areaPosition) {
        switch (this.gamedatas.gamestate.name) {
            case 'constructBuilding':
                this.constructBuilding(areaPosition);
                break;
            case 'abandonBuilding':
                this.abandonBuilding(areaPosition);
                break;
        }
    };
    GardenNation.prototype.chooseConstructBuilding = function () {
        if (!this.checkAction('chooseConstructBuilding')) {
            return;
        }
        this.takeAction('chooseConstructBuilding');
    };
    GardenNation.prototype.chooseAbandonBuilding = function () {
        if (!this.checkAction('chooseAbandonBuilding')) {
            return;
        }
        this.takeAction('chooseAbandonBuilding');
    };
    GardenNation.prototype.chooseUsePloyToken = function () {
        if (!this.checkAction('chooseUsePloyToken')) {
            return;
        }
        this.takeAction('chooseUsePloyToken');
    };
    GardenNation.prototype.constructBuilding = function (areaPosition) {
        if (!this.checkAction('constructBuilding')) {
            return;
        }
        this.takeAction('constructBuilding', {
            areaPosition: areaPosition
        });
    };
    GardenNation.prototype.cancelConstructBuilding = function () {
        if (!this.checkAction('cancelConstructBuilding')) {
            return;
        }
        this.takeAction('cancelConstructBuilding');
    };
    GardenNation.prototype.abandonBuilding = function (areaPosition) {
        if (!this.checkAction('abandonBuilding')) {
            return;
        }
        this.takeAction('abandonBuilding', {
            areaPosition: areaPosition
        });
    };
    GardenNation.prototype.cancelAbandonBuilding = function () {
        if (!this.checkAction('cancelAbandonBuilding')) {
            return;
        }
        this.takeAction('cancelAbandonBuilding');
    };
    GardenNation.prototype.chooseTypeOfLand = function (typeOfLand) {
        if (!this.checkAction('chooseTypeOfLand')) {
            return;
        }
        this.takeAction('chooseTypeOfLand', {
            typeOfLand: typeOfLand
        });
    };
    GardenNation.prototype.cancelChooseTypeOfLand = function () {
        if (!this.checkAction('cancelChooseTypeOfLand')) {
            return;
        }
        this.takeAction('cancelChooseTypeOfLand');
    };
    GardenNation.prototype.changeTerritory = function (territoryNumber) {
        if (!this.checkAction('changeTerritory')) {
            return;
        }
        this.takeAction('changeTerritory', {
            territoryNumber: territoryNumber
        });
    };
    GardenNation.prototype.chooseNextPlayer = function (playerId) {
        if (!this.checkAction('chooseNextPlayer')) {
            return;
        }
        this.takeAction('chooseNextPlayer', {
            playerId: playerId
        });
    };
    GardenNation.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        this.ajaxcall("/gardennation/gardennation/".concat(action, ".html"), data, this, function () { });
    };
    GardenNation.prototype.setPoints = function (playerId, points) {
        var _a;
        (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.toValue(points);
        this.board.setPoints(playerId, points);
    };
    GardenNation.prototype.addHelp = function () {
        var _this = this;
        dojo.place("<button id=\"gardennation-help-button\">?</button>", 'left-side');
        dojo.connect($('gardennation-help-button'), 'onclick', this, function () { return _this.showHelp(); });
    };
    GardenNation.prototype.showHelp = function () {
        var helpDialog = new ebg.popindialog();
        helpDialog.create('gardennationHelpDialog');
        helpDialog.setTitle(_("Cards help"));
        var html = "<div id=\"help-popin\">\n            <h1>".concat(_("Specific companions"), "</h1>\n            <div id=\"help-companions\" class=\"help-section\">\n                <h2>").concat(_('The Sketals'), "</h2>\n                <table><tr>\n                <td><div id=\"companion44\" class=\"companion\"></div></td>\n                    <td>").concat(getCompanionTooltip(44), "</td>\n                </tr></table>\n                <h2>Xar\u2019gok</h2>\n                <table><tr>\n                    <td><div id=\"companion10\" class=\"companion\"></div></td>\n                    <td>").concat(getCompanionTooltip(10), "</td>\n                </tr></table>\n                <h2>").concat(_('Kaar and the curse of the black die'), "</h2>\n                <table><tr>\n                    <td><div id=\"companion20\" class=\"companion\"></div></td>\n                    <td>").concat(getCompanionTooltip(20), "</td>\n                </tr></table>\n                <h2>Cromaug</h2>\n                <table><tr>\n                    <td><div id=\"companion41\" class=\"companion\"></div></td>\n                    <td>").concat(getCompanionTooltip(41), "</td>\n                </tr></table>\n            </div>\n        </div>");
        // Show the dialog
        helpDialog.setContent(html);
        helpDialog.show();
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your gardennation.game.php file.

    */
    GardenNation.prototype.setupNotifications = function () {
        //log( 'notifications subscriptions setup' );
        var _this = this;
        var notifs = [
            ['moveTorticrane', ANIMATION_MS],
            ['setPlayerOrder', ANIMATION_MS],
            /*['scoreBeforeEnd', SCORE_MS],
            ['scoreCards', SCORE_MS],
            ['scoreBoard', SCORE_MS],
            ['scoreFireflies', SCORE_MS],
            ['scoreFootprints', SCORE_MS],
            ['scoreAfterEnd', SCORE_MS],*/
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_".concat(notif[0]));
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    GardenNation.prototype.notif_moveTorticrane = function (notif) {
        slideToObjectAndAttach(this, document.getElementById('torticrane'), "torticrane-spot-".concat(notif.args.torticranePosition));
    };
    GardenNation.prototype.notif_setPlayerOrder = function (notif) {
        slideToObjectAndAttach(this, document.getElementById("order-token-".concat(notif.args.playerId)), "order-track-".concat(notif.args.order));
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    GardenNation.prototype.format_string_recursive = function (log, args) {
        try {
            if (log && args && !args.processed) {
                /*if (typeof args.adventurerName == 'string' && args.adventurerName[0] != '<') {
                    args.adventurerName = `<strong style="color: ${this.getColor(args.adventurer?.color)};">${args.adventurerName}</strong>`;
                }
                if (typeof args.companionName == 'string' && args.companionName[0] != '<') {
                    args.companionName = `<strong>${args.companionName}</strong>`;
                }

                if (typeof args.effectOrigin == 'string' && args.effectOrigin[0] != '<') {
                    if (args.adventurer) {
                        args.effectOrigin = `<strong style="color: ${this.getColor(args.adventurer?.color)};">${args.adventurer.name}</strong>`;
                    }
                    if (args.companion) {
                        args.effectOrigin = `<strong>${args.companion.name}</strong>`;
                    }
                }

                for (const property in args) {
                    if (args[property]?.indexOf?.(']') > 0) {
                        args[property] = formatTextIcons(_(args[property]));
                    }
                }

                log = formatTextIcons(_(log));*/
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return this.inherited(arguments);
    };
    return GardenNation;
}());
define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
], function (dojo, declare) {
    return declare("bgagame.gardennation", ebg.core.gamegui, new GardenNation());
});
