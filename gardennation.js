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
        var previousZIndex_1 = object.style.zIndex;
        object.style.zIndex = '10';
        object.style.transform = "translate(".concat(-deltaX, "px, ").concat(-deltaY, "px)");
        setTimeout(function () {
            object.style.transition = "transform 0.5s linear";
            object.style.transform = null;
        });
        setTimeout(function () {
            object.style.zIndex = previousZIndex_1 !== null && previousZIndex_1 !== void 0 ? previousZIndex_1 : null;
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
var CommonProjectCards = /** @class */ (function () {
    function CommonProjectCards(game) {
        this.game = game;
    }
    // gameui.commonProjectCards.debugSeeAllCards()
    CommonProjectCards.prototype.debugSeeAllCards = function () {
        var _this = this;
        var html = "<div id=\"all-common-project-cards\">";
        html += "</div>";
        dojo.place(html, 'full-table', 'before');
        [1, 2, 3, 4, 5, 6].forEach(function (subType) {
            var card = {
                id: 10 + subType,
                side: 0,
                type: 1,
                subType: subType,
                name: '[name]'
            };
            _this.createMoveOrUpdateCard(card, "all-common-project-cards");
        });
        [2, 3, 4, 5, 6].forEach(function (type) {
            return [1, 2, 3].forEach(function (subType) {
                var card = {
                    id: 10 * type + subType,
                    side: 0,
                    type: type,
                    subType: subType,
                    name: '[name]'
                };
                _this.createMoveOrUpdateCard(card, "all-common-project-cards");
            });
        });
    };
    CommonProjectCards.prototype.createMoveOrUpdateCard = function (card, destinationId, init, from) {
        var _this = this;
        if (init === void 0) { init = false; }
        if (from === void 0) { from = null; }
        var existingDiv = document.getElementById("common-project-".concat(card.id));
        var side = (card.type ? 0 : 1);
        if (existingDiv) {
            this.game.removeTooltip("common-project-".concat(card.id));
            var oldType = Number(existingDiv.dataset.type);
            if (init) {
                document.getElementById(destinationId).appendChild(existingDiv);
            }
            else {
                slideToObjectAndAttach(this.game, existingDiv, destinationId);
            }
            existingDiv.dataset.side = '' + side;
            if (!oldType && card.type) {
                this.setVisibleInformations(existingDiv, card);
            }
            this.game.setTooltip(existingDiv.id, this.getTooltip(card.type, card.subType));
        }
        else {
            var div = document.createElement('div');
            div.id = "common-project-".concat(card.id);
            div.classList.add('card', 'common-project');
            div.dataset.side = '' + side;
            div.dataset.type = '' + card.type;
            div.dataset.subType = '' + card.subType;
            div.innerHTML = "\n                <div class=\"card-sides\">\n                    <div class=\"card-side front\">\n                        <div id=\"".concat(div.id, "-name\" class=\"name\"></div>\n                    </div>\n                    <div class=\"card-side back\">\n                    </div>\n                </div>\n            ");
            document.getElementById(destinationId).appendChild(div);
            div.addEventListener('click', function () { return _this.game.onCommonProjectClick(card); });
            if (from) {
                var fromCardId = document.getElementById(from).children[0].id;
                slideFromObject(this.game, div, fromCardId);
            }
            if (card.type) {
                this.setVisibleInformations(div, card);
            }
            this.game.setTooltip(div.id, this.getTooltip(card.type, card.subType));
        }
    };
    CommonProjectCards.prototype.setVisibleInformations = function (div, card) {
        document.getElementById("".concat(div.id, "-name")).innerHTML = _(card.name);
        div.dataset.type = '' + card.type;
        div.dataset.subType = '' + card.subType;
    };
    CommonProjectCards.prototype.getTooltip = function (type, subType) {
        if (!type) {
            return _('Common projects deck');
        }
        return 'TODO';
    };
    return CommonProjectCards;
}());
var SecretMissionCards = /** @class */ (function () {
    function SecretMissionCards(game) {
        this.game = game;
    }
    // gameui.secretMissionCards.debugSeeAllCards()
    SecretMissionCards.prototype.debugSeeAllCards = function () {
        var _this = this;
        var html = "<div id=\"all-secret-mission-cards\">";
        html += "</div>";
        dojo.place(html, 'full-table', 'before');
        [1, 2].forEach(function (type) {
            return [1, 2, 3].forEach(function (subType) {
                var card = {
                    id: 10 * type + subType,
                    side: 0,
                    type: type,
                    subType: subType,
                    name: '[name]'
                };
                _this.createMoveOrUpdateCard(card, "all-secret-mission-cards");
            });
        });
        [1, 2].forEach(function (subType) {
            var card = {
                id: 10 * 3 + subType,
                side: 0,
                type: 3,
                subType: subType,
                name: '[name]'
            };
            _this.createMoveOrUpdateCard(card, "all-secret-mission-cards");
        });
        [1, 2, 3, 4, 5, 6, 7].forEach(function (subType) {
            var card = {
                id: 10 * 4 + subType,
                side: 0,
                type: 4,
                subType: subType,
                name: '[name]'
            };
            _this.createMoveOrUpdateCard(card, "all-secret-mission-cards");
        });
    };
    SecretMissionCards.prototype.createMoveOrUpdateCard = function (card, destinationId, init, from) {
        if (init === void 0) { init = false; }
        if (from === void 0) { from = null; }
        var existingDiv = document.getElementById("secret-mission-".concat(card.id));
        var side = (card.type ? 0 : 1);
        if (existingDiv) {
            this.game.removeTooltip("secret-mission-".concat(card.id));
            var oldType = Number(existingDiv.dataset.type);
            if (init) {
                document.getElementById(destinationId).appendChild(existingDiv);
            }
            else {
                slideToObjectAndAttach(this.game, existingDiv, destinationId);
            }
            existingDiv.dataset.side = '' + side;
            if (!oldType && card.type) {
                this.setVisibleInformations(existingDiv, card);
            }
            this.game.setTooltip(existingDiv.id, this.getTooltip(card.type, card.subType));
        }
        else {
            var div = document.createElement('div');
            div.id = "secret-mission-".concat(card.id);
            div.classList.add('card', 'secret-mission');
            div.dataset.side = '' + side;
            div.dataset.type = '' + card.type;
            div.dataset.subType = '' + card.subType;
            div.innerHTML = "\n                <div class=\"card-sides\">\n                    <div class=\"card-side front\">\n                        <div id=\"".concat(div.id, "-name\" class=\"name\"></div>\n                    </div>\n                    <div class=\"card-side back\">\n                    </div>\n                </div>\n            ");
            document.getElementById(destinationId).appendChild(div);
            if (from) {
                var fromCardId = document.getElementById(from).children[0].id;
                slideFromObject(this.game, div, fromCardId);
            }
            if (card.type) {
                this.setVisibleInformations(div, card);
            }
            this.game.setTooltip(div.id, this.getTooltip(card.type, card.subType));
        }
    };
    SecretMissionCards.prototype.setVisibleInformations = function (div, card) {
        document.getElementById("".concat(div.id, "-name")).innerHTML = _(card.name);
        div.dataset.type = '' + card.type;
        div.dataset.subType = '' + card.subType;
    };
    SecretMissionCards.prototype.getTooltip = function (type, subType) {
        if (!type) {
            return _('Secret mission');
        }
        return 'TODO';
    };
    return SecretMissionCards;
}());
var POINT_CASE_SIZE = 47.24;
var Board = /** @class */ (function () {
    function Board(game, players, gamedatas) {
        var _this = this;
        this.game = game;
        this.players = players;
        this.points = new Map();
        var territories = gamedatas.territories;
        var map = gamedatas.map;
        var torticranePosition = gamedatas.torticranePosition;
        document.getElementById("order-track").dataset.playerNumber = '' + players.length;
        this.createRemainingBrambleTokens(gamedatas.brambleIds);
        players.forEach(function (player) { return dojo.place("\n            <div id=\"order-token-".concat(player.id, "\" class=\"token\" data-color=\"").concat(player.color, "\"></div>\n        "), "order-track-".concat(player.turnTrack)); });
        var html = '';
        // points
        players.forEach(function (player) {
            return html += "<div id=\"player-".concat(player.id, "-point-marker\" class=\"point-marker ").concat(/*this.game.isColorBlindMode() ? 'color-blind' : */ '', "\" data-player-no=\"").concat(player.playerNo, "\" style=\"background: #").concat(player.color, ";\"></div>");
        });
        dojo.place(html, 'board');
        players.forEach(function (player) {
            _this.points.set(Number(player.id), Number(player.score));
        });
        this.movePoints();
        dojo.place("<div id=\"torticrane-spot--1\" class=\"torticrane-spot\"></div>", "board");
        [0, 1, 2, 3, 4, 5, 6].forEach(function (territoryPosition) {
            var territoryNumber = territories[territoryPosition][0];
            var territoryRotation = territories[territoryPosition][1];
            dojo.place("\n                <div id=\"territory".concat(territoryPosition, "\" class=\"territory\" data-position=\"").concat(territoryPosition, "\" data-number=\"").concat(territoryNumber, "\" data-rotation=\"").concat(territoryRotation, "\">\n                    <div class=\"territory-number top\">").concat(territoryNumber, "</div>\n                    <div class=\"territory-number left\">").concat(territoryNumber, "</div>\n                    <div class=\"territory-number right\">").concat(territoryNumber, "</div>\n                    <div id=\"torticrane-spot-").concat(territoryPosition, "\" class=\"torticrane-spot\"></div>\n                </div>\n            "), "board");
            [0, 1, 2, 3, 4, 5, 6].forEach(function (areaPosition) {
                var position = territoryNumber * 10 + areaPosition;
                var mapPosition = map[position];
                var type = mapPosition.type;
                var bramble = mapPosition.bramble;
                var cost = mapPosition.cost;
                var rotation = areaPosition;
                if (areaPosition > 0) {
                    rotation = (areaPosition + territoryRotation - 1) % 6 + 1;
                }
                dojo.place("\n                    <div id=\"area".concat(position, "\" class=\"area\" data-position=\"").concat(position, "\" data-type=\"").concat(type, "\" data-bramble=\"").concat(bramble.toString(), "\" data-cost=\"").concat(cost, "\" data-position=\"").concat(areaPosition, "\" data-rotation=\"").concat(rotation, "\">\n                        <div class=\"land-number\">").concat(cost, "</div>\n                    </div>\n                "), "territory".concat(territoryPosition));
                document.getElementById("area".concat(position)).addEventListener('click', function () { return _this.game.onAreaClick(position); });
                if (mapPosition.building) {
                    _this.setBuilding(position, mapPosition.building);
                }
            });
        });
        dojo.place("<div id=\"torticrane\"></div>", "torticrane-spot-".concat(torticranePosition));
    }
    Board.prototype.createRemainingBrambleTokens = function (brambleIds) {
        dojo.place("\n        <div id=\"remaining-bramble-tokens\" class=\"whiteblock\">\n            <div class=\"title\">".concat(_('Remaining bramble tokens'), "</div>\n            <div id=\"remaining-bramble-tokens-container-1\" class=\"container\"></div>\n            <div id=\"remaining-bramble-tokens-container-2\" class=\"container\"></div>\n            <div id=\"remaining-bramble-tokens-container-3\" class=\"container\"></div>\n            </div>\n        </div>\n        "), "board");
        [1, 2, 3].forEach(function (type) { return brambleIds[type].forEach(function (id) {
            return dojo.place("<div id=\"bramble".concat(id, "\" class=\"bramble-type-token\" data-type=\"").concat(type, "\"><div class=\"land-number\">5</div></div>"), "remaining-bramble-tokens-container-".concat(type));
        }); });
    };
    Board.prototype.getPointsCoordinates = function (points) {
        var cases = points % 70;
        var top = cases >= 48 ? 0 : (24 - Math.max(0, cases - 24)) * POINT_CASE_SIZE;
        var left = cases < 48 ? (24 - Math.min(cases, 24)) * POINT_CASE_SIZE : (cases - 48) * POINT_CASE_SIZE;
        return [10 + left, 10 + top];
    };
    Board.prototype.movePoints = function () {
        var _this = this;
        this.points.forEach(function (points, playerId) {
            var markerDiv = document.getElementById("player-".concat(playerId, "-point-marker"));
            var coordinates = _this.getPointsCoordinates(points);
            var left = coordinates[0];
            var top = coordinates[1];
            var topShift = 0;
            var leftShift = 0;
            _this.points.forEach(function (iPoints, iPlayerId) {
                if (iPoints % 70 === points % 70 && iPlayerId < playerId) {
                    topShift += 5;
                    leftShift += 5;
                }
            });
            markerDiv.style.transform = "translateX(".concat(left + leftShift, "px) translateY(").concat(top + topShift, "px)");
        });
    };
    Board.prototype.setPoints = function (playerId, points) {
        this.points.set(playerId, points);
        this.movePoints();
    };
    Board.prototype.activatePossibleAreas = function (possibleAreas, selectedPosition) {
        Array.from(document.getElementsByClassName('area')).forEach(function (area) {
            area.classList.toggle('selectable', possibleAreas.includes(Number(area.dataset.position)));
            area.classList.toggle('selected', selectedPosition == Number(area.dataset.position));
        });
    };
    Board.prototype.setBrambleType = function (areaPosition, type, id) {
        var _a;
        var areaDiv = document.getElementById("area".concat(areaPosition));
        areaDiv.dataset.type = '' + type;
        // TODO slide with id
        var brambleDiv = document.getElementById("bramble".concat(id));
        (_a = brambleDiv === null || brambleDiv === void 0 ? void 0 : brambleDiv.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(brambleDiv);
    };
    Board.prototype.setBuilding = function (areaPosition, building) {
        var _this = this;
        var _a;
        var buildingDiv = document.getElementById("building".concat(areaPosition));
        if (building) {
            if (!buildingDiv) {
                dojo.place("<div id=\"building".concat(areaPosition, "\" class=\"building\"></div>"), "area".concat(areaPosition));
            }
            console.log(building);
            building.buildingFloors.forEach(function (floor, index) {
                var buildingFloorDiv = document.getElementById("building-floor-".concat(floor.id));
                if (!buildingFloorDiv) {
                    dojo.place("<div id=\"building-floor-".concat(floor.id, "\" class=\"building-floor\" data-color=\"").concat(floor.playerId ? _this.game.getPlayerColor(floor.playerId) : 0, "\" style=\"z-index: ").concat(index, "\"></div>"), "building".concat(areaPosition));
                }
                else {
                    var currentAreaDiv = buildingFloorDiv.closest('.area');
                    if (!currentAreaDiv || currentAreaDiv.id != "area".concat(areaPosition)) {
                        buildingFloorDiv.style.zIndex = '' + index;
                        slideToObjectAndAttach(_this.game, buildingFloorDiv, "building".concat(areaPosition));
                    }
                }
            });
        }
        else {
            (_a = buildingDiv === null || buildingDiv === void 0 ? void 0 : buildingDiv.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(buildingDiv);
        }
    };
    Board.prototype.highlightBuilding = function (buildingsToHighlight) {
        buildingsToHighlight.forEach(function (building) { var _a; return (_a = document.getElementById("building".concat(building.areaPosition))) === null || _a === void 0 ? void 0 : _a.classList.add('highlight'); });
    };
    return Board;
}());
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        var html = "\n        <div id=\"player-table-".concat(this.playerId, "\" class=\"player-table whiteblock\">\n            <div id=\"player-table-").concat(this.playerId, "-name\" class=\"player-name\" style=\"color: #").concat(player.color, ";\">").concat(player.name, "</div>\n            <div id=\"player-table-").concat(this.playerId, "-score-board\" class=\"player-score-board\" data-color=\"").concat(player.color, "\">\n                <div id=\"player-table-").concat(this.playerId, "-meeple-marker\" class=\"meeple-marker\" data-color=\"").concat(player.color, "\"></div>\n            </div>\n            <div id=\"player-table-").concat(this.playerId, "-secret-missions-wrapper\" class=\"player-secret-missions-wrapper\">\n                <div class=\"title\">").concat(_('Secret missions'), "</div>\n                <div id=\"player-table-").concat(this.playerId, "-secret-missions\" class=\"player-secret-missions\">\n                </div>\n            </div>\n            <div id=\"player-table-").concat(this.playerId, "-common-projects-wrapper\" class=\"player-common-projects-wrapper\">\n                <div class=\"title\">").concat(_('Completed common projects'), "</div>\n                <div id=\"player-table-").concat(this.playerId, "-common-projects\" class=\"player-common-projects\">\n                </div>\n            </div>\n        </div>");
        dojo.place(html, 'playerstables');
        [0, 1, 2, 3].forEach(function (type) {
            var html = "\n            <div id=\"player-table-".concat(_this.playerId, "-ploy-tokens-container-").concat(type, "\" class=\"ploy-tokens-container\" data-type=\"").concat(type, "\">");
            if (type == 0) {
                for (var i = 0; i < 4; i++) {
                    html += "<div id=\"player-table-".concat(_this.playerId, "-ploy-token").concat(i, "\" class=\"ploy-token\" data-color=\"").concat(player.color, "\"></div>");
                }
            }
            html += "</div>\n            ";
            dojo.place(html, "player-table-".concat(_this.playerId, "-score-board"));
        });
        [1, 2, 3].forEach(function (type) {
            for (var i = 0; i < player.usedPloy[type - 1]; i++) {
                _this.setPloyTokenUsed(type);
            }
        });
        this.setInhabitants(player.inhabitants);
        this.setCommonProjects(player.commonProjects);
        this.setSecretMissions(player.secretMissions);
    }
    PlayerTable.prototype.getPointsCoordinates = function (points) {
        var cases = Math.min(points, 40);
        var top = points <= 20 ? 0 : 44;
        var left = (cases % 20) * 29.5;
        return [-17 + left, 203 + top];
    };
    PlayerTable.prototype.setInhabitants = function (points) {
        var markerDiv = document.getElementById("player-table-".concat(this.playerId, "-meeple-marker"));
        var coordinates = this.getPointsCoordinates(points);
        var left = coordinates[0];
        var top = coordinates[1];
        markerDiv.style.transform = "translateX(".concat(left, "px) translateY(").concat(top, "px)");
    };
    PlayerTable.prototype.setPloyTokenUsed = function (type) {
        var token = document.getElementById("player-table-".concat(this.playerId, "-ploy-tokens-container-0")).lastElementChild;
        slideToObjectAndAttach(this.game, token, "player-table-".concat(this.playerId, "-ploy-tokens-container-").concat(type));
    };
    PlayerTable.prototype.setCommonProjects = function (commonProjects) {
        var _this = this;
        commonProjects.forEach(function (commonProject) {
            return _this.game.commonProjectCards.createMoveOrUpdateCard(commonProject, "player-table-".concat(_this.playerId, "-common-projects"));
        });
    };
    PlayerTable.prototype.setSecretMissions = function (secretMissions) {
        var _this = this;
        secretMissions.forEach(function (secretMission) {
            return _this.game.secretMissionCards.createMoveOrUpdateCard(secretMission, "player-table-".concat(_this.playerId, "-secret-missions"));
        });
    };
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
        this.zoom = 1;
        this.playersTables = [];
        this.inhabitantCounters = [];
        this.buildingFloorCounters = [];
        this.ployTokenCounters = [];
        this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
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
        var _this = this;
        log("Starting game setup");
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        this.commonProjectCards = new CommonProjectCards(this);
        this.secretMissionCards = new SecretMissionCards(this);
        this.createPlayerPanels(gamedatas);
        var players = Object.values(gamedatas.players);
        this.board = new Board(this, players, gamedatas);
        this.createPlayerTables(gamedatas);
        [0, 1, 2, 3, 4].forEach(function (number) {
            dojo.place("\n            <div id=\"common-project-wrapper-".concat(number, "\" class=\"common-project-wrapper\" data-number=\"").concat(number, "\">\n            </div>\n            "), 'common-projects');
        });
        this.commonProjectCards.createMoveOrUpdateCard({}, "common-project-wrapper-0");
        gamedatas.commonProjects.forEach(function (commonProject) { return _this.commonProjectCards.createMoveOrUpdateCard(commonProject, "common-project-wrapper-".concat(commonProject.locationArg)); });
        gamedatas.remainingRoofs.forEach(function (roof) { return dojo.place("<div id=\"building-floor-".concat(roof.id, "\" class=\"building-floor\" data-color=\"0\"></div>"), "remaining-roofs"); });
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
            case 'buildingInvasion':
            case 'chooseRoofToTransfer':
            case 'chooseRoofDestination':
                this.onEnteringSelectAreaPosition(args.args);
                break;
            case 'chooseCompletedCommonProject':
                this.onEnteringChooseCompletedCommonProject(args.args);
                break;
            case 'endRound':
                Array.from(document.querySelectorAll(".building.highlight")).forEach(function (elem) { return elem.classList.remove('highlight'); });
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
    GardenNation.prototype.onEnteringSelectAreaPosition = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.board.activatePossibleAreas(args.possiblePositions, args.selectedPosition);
        }
    };
    GardenNation.prototype.onEnteringChooseCompletedCommonProject = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.board.activatePossibleAreas([], args.selectedPosition);
            args.completedCommonProjects.forEach(function (commonProject) { return document.getElementById("common-project-".concat(commonProject.id)).classList.add('selectable'); });
        }
    };
    GardenNation.prototype.onEnteringShowScore = function (fromReload) {
        if (fromReload === void 0) { fromReload = false; }
        var lastTurnBar = document.getElementById('last-round');
        if (lastTurnBar) {
            lastTurnBar.style.display = 'none';
        }
    };
    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    GardenNation.prototype.onLeavingState = function (stateName) {
        log('Leaving state: ' + stateName);
        switch (stateName) {
            case 'constructBuilding':
            case 'abandonBuilding':
            case 'buildingInvasion':
            case 'chooseRoofToTransfer':
            case 'chooseRoofDestination':
                this.onLeavingSelectAreaPosition();
                break;
            case 'chooseCompletedCommonProject':
                this.onLeavingChooseCompletedCommonProject();
                break;
        }
    };
    GardenNation.prototype.onLeavingSelectAreaPosition = function () {
        this.board.activatePossibleAreas([], null);
    };
    GardenNation.prototype.onLeavingChooseCompletedCommonProject = function () {
        if (this.isCurrentPlayerActive()) {
            this.board.activatePossibleAreas([], null);
            document.querySelectorAll('.common-project.selectable').forEach(function (elem) { return elem.classList.remove('selectable'); });
        }
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
                    if (chooseActionArgs_1.canSkipTurn) {
                        this.addActionButton("skipTurn-button", _("Skip turn"), function () { return _this.skipTurn(); }, null, null, 'red');
                    }
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
                            "<div class=\"button-bramble-type\" data-type=\"".concat(type, "\"><div class=\"land-number\">5</div></div>");
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
                case 'usePloyToken':
                    var usePloyTokenArgs = args;
                    this.addActionButton("strategicMovement-button", _("Strategic Movement"), function () { return _this.usePloyToken(1); });
                    this.addActionButton("roofTransfer-button", _("Roof Transfer"), function () { return _this.usePloyToken(2); });
                    this.addActionButton("buildingInvasion-button", _("Building Invasion"), function () { return _this.usePloyToken(3); });
                    this.addActionButton("cancelUsePloyToken-button", _("Cancel"), function () { return _this.cancelUsePloyToken(); }, null, null, 'gray');
                    document.getElementById("roofTransfer-button").classList.toggle('disabled', !usePloyTokenArgs.canTransferRoof);
                    document.getElementById("buildingInvasion-button").classList.toggle('disabled', !usePloyTokenArgs.canInvade);
                    break;
                case 'strategicMovement':
                    var strategicMovementArgs_1 = args;
                    this.addActionButton("strategicMovementDown-button", _("Move to territory ${number}").replace('${number}', strategicMovementArgs_1.down), function () { return _this.strategicMovement(strategicMovementArgs_1.down); });
                    this.addActionButton("strategicMovementUp-button", _("Move to territory ${number}").replace('${number}', strategicMovementArgs_1.up), function () { return _this.strategicMovement(strategicMovementArgs_1.up); });
                    this.addActionButton("cancelUsePloy-button", _("Cancel"), function () { return _this.cancelUsePloy(); }, null, null, 'gray');
                    break;
                case 'chooseRoofToTransfer':
                case 'chooseRoofDestination':
                case 'buildingInvasion':
                    this.addActionButton("cancelUsePloy-button", _("Cancel"), function () { return _this.cancelUsePloy(); }, null, null, 'gray');
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
    GardenNation.prototype.setTooltip = function (id, html) {
        this.addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    };
    GardenNation.prototype.getPlayerId = function () {
        return Number(this.player_id);
    };
    GardenNation.prototype.getPlayerColor = function (playerId) {
        return this.gamedatas.players[playerId].color;
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
            dojo.place("\n            <div class=\"counters\">\n                <div id=\"inhabitant-counter-wrapper-".concat(player.id, "\" class=\"counter\">\n                    <div class=\"icon inhabitant\" data-color=\"").concat(player.color, "\"></div> \n                    <span id=\"inhabitant-counter-").concat(player.id, "\"></span>\n                </div>\n                <div id=\"building-floor-counter-wrapper-").concat(player.id, "\" class=\"counter\">\n                    <div class=\"icon building-floor-counter\" data-color=\"").concat(player.color, "\"></div> \n                    <span id=\"building-floor-counter-").concat(player.id, "\"></span>\n                </div>\n                <div id=\"ploy-token-counter-wrapper-").concat(player.id, "\" class=\"counter\">\n                    <div class=\"icon ploy-token\" data-color=\"").concat(player.color, "\"></div> \n                    <span id=\"ploy-token-counter-").concat(player.id, "\"></span>\n                </div>\n            </div>\n            "), "player_board_".concat(player.id));
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
            case 'chooseRoofToTransfer':
                this.chooseRoofToTransfer(areaPosition);
                break;
            case 'chooseRoofDestination':
                this.chooseRoofDestination(areaPosition);
                break;
            case 'buildingInvasion':
                this.buildingInvasion(areaPosition);
                break;
        }
    };
    GardenNation.prototype.onCommonProjectClick = function (card) {
        switch (this.gamedatas.gamestate.name) {
            case 'chooseCompletedCommonProject':
                var args = this.gamedatas.gamestate.args;
                if (args.completedCommonProjects.some(function (cp) { return cp.id === card.id; })) {
                    this.chooseCompletedCommonProject(card.id);
                }
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
    GardenNation.prototype.skipTurn = function () {
        if (!this.checkAction('skipTurn')) {
            return;
        }
        this.takeAction('skipTurn');
    };
    GardenNation.prototype.chooseNextPlayer = function (playerId) {
        if (!this.checkAction('chooseNextPlayer')) {
            return;
        }
        this.takeAction('chooseNextPlayer', {
            playerId: playerId
        });
    };
    GardenNation.prototype.usePloyToken = function (type) {
        if (!this.checkAction('usePloyToken')) {
            return;
        }
        this.takeAction('usePloyToken', {
            type: type
        });
    };
    GardenNation.prototype.cancelUsePloyToken = function () {
        if (!this.checkAction('cancelUsePloyToken')) {
            return;
        }
        this.takeAction('cancelUsePloyToken');
    };
    GardenNation.prototype.strategicMovement = function (territory) {
        if (!this.checkAction('strategicMovement')) {
            return;
        }
        this.takeAction('strategicMovement', {
            territory: territory
        });
    };
    GardenNation.prototype.cancelUsePloy = function () {
        if (!this.checkAction('cancelUsePloy')) {
            return;
        }
        this.takeAction('cancelUsePloy');
    };
    GardenNation.prototype.chooseRoofToTransfer = function (areaPosition) {
        if (!this.checkAction('chooseRoofToTransfer')) {
            return;
        }
        this.takeAction('chooseRoofToTransfer', {
            areaPosition: areaPosition
        });
    };
    GardenNation.prototype.chooseRoofDestination = function (areaPosition) {
        if (!this.checkAction('chooseRoofDestination')) {
            return;
        }
        this.takeAction('chooseRoofDestination', {
            areaPosition: areaPosition
        });
    };
    GardenNation.prototype.buildingInvasion = function (areaPosition) {
        if (!this.checkAction('buildingInvasion')) {
            return;
        }
        this.takeAction('buildingInvasion', {
            areaPosition: areaPosition
        });
    };
    GardenNation.prototype.chooseCompletedCommonProject = function (id) {
        if (!this.checkAction('chooseCompletedCommonProject')) {
            return;
        }
        this.takeAction('chooseCompletedCommonProject', {
            id: id
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
    GardenNation.prototype.setInhabitants = function (playerId, inhabitants) {
        var _a, _b;
        (_a = this.inhabitantCounters[playerId]) === null || _a === void 0 ? void 0 : _a.toValue(inhabitants);
        (_b = this.getPlayerTable(playerId)) === null || _b === void 0 ? void 0 : _b.setInhabitants(inhabitants);
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
            ['setBuilding', ANIMATION_MS],
            ['takeCommonProject', ANIMATION_MS],
            ['newCommonProject', ANIMATION_MS],
            ['score', 1],
            ['inhabitant', 1],
            ['setBrambleType', 1],
            ['ployTokenUsed', 1],
            ['lastTurn', 1],
            ['territoryControl', SCORE_MS],
            ['revealSecretMission', SCORE_MS],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_".concat(notif[0]));
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    GardenNation.prototype.notif_score = function (notif) {
        this.setPoints(notif.args.playerId, notif.args.newScore);
    };
    GardenNation.prototype.notif_inhabitant = function (notif) {
        this.setInhabitants(notif.args.playerId, notif.args.newInhabitants);
    };
    GardenNation.prototype.notif_moveTorticrane = function (notif) {
        slideToObjectAndAttach(this, document.getElementById('torticrane'), "torticrane-spot-".concat(notif.args.torticranePosition));
    };
    GardenNation.prototype.notif_setPlayerOrder = function (notif) {
        slideToObjectAndAttach(this, document.getElementById("order-token-".concat(notif.args.playerId)), "order-track-".concat(notif.args.order));
    };
    GardenNation.prototype.notif_setBrambleType = function (notif) {
        this.board.setBrambleType(notif.args.areaPosition, notif.args.type, notif.args.brambleId);
    };
    GardenNation.prototype.notif_setBuilding = function (notif) {
        this.board.setBuilding(notif.args.areaPosition, notif.args.building);
    };
    GardenNation.prototype.notif_territoryControl = function (notif) {
        this.board.highlightBuilding(notif.args.buildingsToHighlight);
    };
    GardenNation.prototype.notif_ployTokenUsed = function (notif) {
        var _a, _b;
        (_a = this.ployTokenCounters[notif.args.playerId]) === null || _a === void 0 ? void 0 : _a.incValue(-1);
        (_b = this.getPlayerTable(notif.args.playerId)) === null || _b === void 0 ? void 0 : _b.setPloyTokenUsed(notif.args.type);
    };
    GardenNation.prototype.notif_takeCommonProject = function (notif) {
        this.getPlayerTable(notif.args.playerId).setCommonProjects([notif.args.commonProject]);
    };
    GardenNation.prototype.notif_newCommonProject = function (notif) {
        // we first create a backflipped card
        this.commonProjectCards.createMoveOrUpdateCard({
            id: notif.args.commonProject.id
        }, "common-project-wrapper-0");
        // then we reveal it
        this.commonProjectCards.createMoveOrUpdateCard(notif.args.commonProject, "common-project-wrapper-".concat(notif.args.commonProject.locationArg));
    };
    GardenNation.prototype.notif_revealSecretMission = function (notif) {
        this.getPlayerTable(notif.args.playerId).setSecretMissions([notif.args.secretMission]);
    };
    GardenNation.prototype.notif_lastTurn = function () {
        dojo.place("<div id=\"last-round\">\n            ".concat(_("This is the last round of the game!"), "\n        </div>"), 'page-title');
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    GardenNation.prototype.format_string_recursive = function (log, args) {
        var _this = this;
        try {
            if (log && args && !args.processed) {
                if (args.playersNames && (typeof args.playersNames != 'string' || args.playersNames[0] != '<')) {
                    var namesColored_1 = args.playersNames.map(function (playerName) {
                        var _a;
                        var color = (_a = Object.values(_this.gamedatas.players).find(function (player) { return player.name == playerName; })) === null || _a === void 0 ? void 0 : _a.color;
                        return "<strong ".concat(color ? "style=\"color: #".concat(color, ";\"") : '', ">").concat(playerName, "</strong>");
                    });
                    var namesConcat_1 = '';
                    namesColored_1.forEach(function (name, index) {
                        namesConcat_1 += name;
                        if (index < namesColored_1.length - 2) {
                            namesConcat_1 += ', ';
                        }
                        else if (index < namesColored_1.length - 1) {
                            namesConcat_1 += _(' and ');
                        }
                    });
                    args.playersNames = namesConcat_1;
                }
                if (args.cardName && args.cardName[0] != '<') {
                    args.cardName = "<strong>".concat(_(args.cardName), "</strong>");
                }
                /*
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
