function slideToObjectAndAttach(game, object, destinationId, posX, posY) {
    var destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return Promise.resolve(true);
    }
    return new Promise(function (resolve) {
        var originalZIndex = Number(object.style.zIndex);
        object.style.zIndex = '10';
        var objectCR = object.getBoundingClientRect();
        var destinationCR = destination.getBoundingClientRect();
        var deltaX = destinationCR.left - objectCR.left + (posX !== null && posX !== void 0 ? posX : 0);
        var deltaY = destinationCR.top - objectCR.top + (posY !== null && posY !== void 0 ? posY : 0);
        var attachToNewParent = function () {
            if (posX !== undefined) {
                object.style.left = "".concat(posX, "px");
            }
            else {
                object.style.removeProperty('left');
            }
            if (posY !== undefined) {
                object.style.top = "".concat(posY, "px");
            }
            else {
                object.style.removeProperty('top');
            }
            object.style.position = (posX !== undefined || posY !== undefined) ? 'absolute' : 'relative';
            if (originalZIndex) {
                object.style.zIndex = '' + originalZIndex;
            }
            else {
                object.style.removeProperty('zIndex');
            }
            object.style.removeProperty('transform');
            object.style.removeProperty('transition');
            destination.appendChild(object);
        };
        if (document.visibilityState === 'hidden' || game.instantaneousMode) {
            // if tab is not visible, we skip animation (else they could be delayed or cancelled by browser)
            attachToNewParent();
        }
        else {
            object.style.transition = "transform 0.5s ease-in";
            object.style.transform = "translate(".concat(deltaX, "px, ").concat(deltaY, "px)");
            var securityTimeoutId_1 = null;
            var transitionend_1 = function () {
                attachToNewParent();
                object.removeEventListener('transitionend', transitionend_1);
                resolve(true);
                if (securityTimeoutId_1) {
                    clearTimeout(securityTimeoutId_1);
                }
            };
            object.addEventListener('transitionend', transitionend_1);
            // security check : if transition fails, we force tile to destination
            securityTimeoutId_1 = setTimeout(function () {
                if (!destination.contains(object)) {
                    attachToNewParent();
                    object.removeEventListener('transitionend', transitionend_1);
                    resolve(true);
                }
            }, 700);
        }
    });
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
    function Board(game, players, territories) {
        this.game = game;
        this.players = players;
        this.territories = territories;
        document.getElementById("order-track").dataset.playerNumber = '' + players.length;
        [0, 1, 2, 3, 4, 5, 6].forEach(function (position) { return dojo.place("\n            <div class=\"territory\" data-position=\"".concat(position, "\" data-number=\"").concat(territories[position][0], "\" data-rotation=\"").concat(territories[position][1], "\"></div>\n        "), "board"); });
    }
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
        this.board = new Board(this, players, gamedatas.territories);
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
            case 'chooseAction':
                this.onEnteringChooseAction(args.args);
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
    GardenNation.prototype.onEnteringChooseAction = function (args /*: EnteringChooseAdventurerArgs*/) {
        /*const adventurers = args.adventurers;
        if (!document.getElementById('adventurers-stock')) {
            dojo.place(`<div id="adventurers-stock"></div>`, 'full-table', 'before');
            
            this.adventurersStock = new ebg.stock() as Stock;
            this.adventurersStock.create(this, $('adventurers-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.adventurersStock.setSelectionMode(0);
            this.adventurersStock.setSelectionAppearance('class');
            this.adventurersStock.selectionClass = 'nothing';
            this.adventurersStock.centerItems = true;
            this.adventurersStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupAdventurerCard(this, cardDiv, type);
            dojo.connect(this.adventurersStock, 'onChangeSelection', this, () => this.onAdventurerSelection(this.adventurersStock.getSelectedItems()));

            setupAdventurersCards(this.adventurersStock);

            adventurers.forEach(adventurer => this.adventurersStock.addToStockWithId(adventurer.color, ''+adventurer.id));
        } else {
            this.adventurersStock.items.filter(item => !adventurers.some(adventurer => adventurer.color == item.type)).forEach(item => this.adventurersStock.removeFromStockById(item.id));
        }

        
        if((this as any).isCurrentPlayerActive()) {
            this.adventurersStock.setSelectionMode(1);
        }*/
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
            case 'chooseAction':
                this.onLeavingChooseAction();
                break;
        }
    };
    GardenNation.prototype.onLeavingChooseAction = function () {
        //this.adventurersStock.setSelectionMode(0);
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    GardenNation.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseAction':
                    this.addActionButton("chooseConstructBuilding-button", _("Construct building"), function () { return _this.chooseConstructBuilding(); });
                    this.addActionButton("chooseAbandonBuilding-button", _("Abandon building"), function () { return _this.chooseAbandonBuilding(); });
                    this.addActionButton("chooseUsePloyToken-button", _("Use ploy token"), function () { return _this.chooseUsePloyToken(); }, null, null, 'red');
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
    GardenNation.prototype.getPlayerTable = function (playerId) {
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === playerId; });
    };
    GardenNation.prototype.createPlayerPanels = function (gamedatas) {
        Object.values(gamedatas.players).forEach(function (player) {
            var playerId = Number(player.id);
            // counters
            dojo.place("\n            <div class=\"counters\">\n                <div id=\"reroll-counter-wrapper-".concat(player.id, "\" class=\"reroll-counter\">\n                    <div class=\"icon reroll\"></div> \n                    <span id=\"reroll-counter-").concat(player.id, "\"></span>\n                </div>\n                <div id=\"footprint-counter-wrapper-").concat(player.id, "\" class=\"footprint-counter\">\n                    <div class=\"icon footprint\"></div> \n                    <span id=\"footprint-counter-").concat(player.id, "\"></span>\n                </div>\n                <div id=\"firefly-counter-wrapper-").concat(player.id, "\" class=\"firefly-counter\">\n                </div>\n            </div>\n            "), "player_board_".concat(player.id));
            /*const rerollCounter = new ebg.counter();
            rerollCounter.create(`reroll-counter-${playerId}`);
            rerollCounter.setValue(player.rerolls);
            this.rerollCounters[playerId] = rerollCounter;

            const footprintCounter = new ebg.counter();
            footprintCounter.create(`footprint-counter-${playerId}`);
            footprintCounter.setValue(player.footprints);
            this.footprintCounters[playerId] = footprintCounter;

            if (playerId != 0) {
                dojo.place(`
                    <div id="firefly-counter-icon-${player.id}" class="icon firefly"></div>
                    <span id="firefly-counter-${player.id}"></span>&nbsp;/&nbsp;<span id="companion-counter-${player.id}"></span>
                `, `firefly-counter-wrapper-${player.id}`);

                const fireflyCounter = new ebg.counter();
                fireflyCounter.create(`firefly-counter-${playerId}`);
                const allFireflies = player.fireflies + player.companions.map(companion => companion.fireflies).reduce((a, b) => a + b, 0);
                fireflyCounter.setValue(allFireflies);
                this.fireflyCounters[playerId] = fireflyCounter;
                this.fireflyTokenCounters[playerId] = player.fireflies;

                const companionCounter = new ebg.counter();
                companionCounter.create(`companion-counter-${playerId}`);
                companionCounter.setValue(player.companions.length);
                this.companionCounters[playerId] = companionCounter;

                this.updateFireflyCounterIcon(playerId);
            }
            
            if (!solo) {
                // first player token
                dojo.place(`<div id="player_board_${player.id}_firstPlayerWrapper"></div>`, `player_board_${player.id}`);

                if (gamedatas.firstPlayer === playerId) {
                    this.placeFirstPlayerToken(gamedatas.firstPlayer);
                }

            } else if (playerId == 0) {
                dojo.place(`<div id="tomDiceWrapper"></div>`, `player_board_${player.id}`);
                if (gamedatas.tom.dice) {
                    this.setTomDice(gamedatas.tom.dice);
                }
            }
            
            if (this.isColorBlindMode() && playerId != 0) {
            dojo.place(`
            <div class="token meeple${this.gamedatas.side == 2 ? 0 : 1} color-blind meeple-player-${player.id}" data-player-no="${player.playerNo}" style="background-color: #${player.color};"></div>
            `, `player_board_${player.id}`);
            }*/
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
    /*public chooseConstructBuilding(id: number) {
        if(!(this as any).checkAction('chooseConstructBuilding')) {
            return;
        }

        this.takeAction('chooseConstructBuilding', {
            id
        });
    }*/
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
        if (!this.helpDialog) {
            this.helpDialog = new ebg.popindialog();
            this.helpDialog.create('gardennationHelpDialog');
            this.helpDialog.setTitle(_("Cards help"));
            var html = "<div id=\"help-popin\">\n                <h1>".concat(_("Specific companions"), "</h1>\n                <div id=\"help-companions\" class=\"help-section\">\n                    <h2>").concat(_('The Sketals'), "</h2>\n                    <table><tr>\n                    <td><div id=\"companion44\" class=\"companion\"></div></td>\n                        <td>").concat(getCompanionTooltip(44), "</td>\n                    </tr></table>\n                    <h2>Xar\u2019gok</h2>\n                    <table><tr>\n                        <td><div id=\"companion10\" class=\"companion\"></div></td>\n                        <td>").concat(getCompanionTooltip(10), "</td>\n                    </tr></table>\n                    <h2>").concat(_('Kaar and the curse of the black die'), "</h2>\n                    <table><tr>\n                        <td><div id=\"companion20\" class=\"companion\"></div></td>\n                        <td>").concat(getCompanionTooltip(20), "</td>\n                    </tr></table>\n                    <h2>Cromaug</h2>\n                    <table><tr>\n                        <td><div id=\"companion41\" class=\"companion\"></div></td>\n                        <td>").concat(getCompanionTooltip(41), "</td>\n                    </tr></table>\n                </div>\n            </div>");
            // Show the dialog
            this.helpDialog.setContent(html);
        }
        this.helpDialog.show();
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
        /*['chosenAdventurer', ANIMATION_MS],
        ['scoreBeforeEnd', SCORE_MS],
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
    /*notif_chosenAdventurer(notif: Notif<NotifChosenAdventurerArgs>) {
        const playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.setAdventurer(notif.args.adventurer);
        playerTable.addDice(notif.args.dice);

        const newPlayerColor = notif.args.newPlayerColor;
        const nameLink = document.getElementById(`player_name_${notif.args.playerId}`).getElementsByTagName('a')[0];
        if (nameLink) {
            nameLink.style.color = `#${newPlayerColor}`;
        }
        this.board.setColor(notif.args.playerId, newPlayerColor);
        playerTable.setColor(newPlayerColor);
        this.gamedatas.players[notif.args.playerId].color = newPlayerColor;
        
        setTimeout(() => playerTable.sortDice(), ANIMATION_MS);
    }*/
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
