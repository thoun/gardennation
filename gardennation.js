var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var DEFAULT_ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
function throttle(callback, delay) {
    var last;
    var timer;
    return function () {
        var context = this;
        var now = +new Date();
        var args = arguments;
        if (last && now < last + delay) {
            clearTimeout(timer);
            timer = setTimeout(function () {
                last = now;
                callback.apply(context, args);
            }, delay);
        }
        else {
            last = now;
            callback.apply(context, args);
        }
    };
}
var advThrottle = function (func, delay, options) {
    if (options === void 0) { options = { leading: true, trailing: false }; }
    var timer = null, lastRan = null, trailingArgs = null;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (timer) { //called within cooldown period
            lastRan = this; //update context
            trailingArgs = args; //save for later
            return;
        }
        if (options.leading) { // if leading
            func.call.apply(// if leading
            func, __spreadArray([this], args, false)); //call the 1st instance
        }
        else { // else it's trailing
            lastRan = this; //update context
            trailingArgs = args; //save for later
        }
        var coolDownPeriodComplete = function () {
            if (options.trailing && trailingArgs) { // if trailing and the trailing args exist
                func.call.apply(// if trailing and the trailing args exist
                func, __spreadArray([lastRan], trailingArgs, false)); //invoke the instance with stored context "lastRan"
                lastRan = null; //reset the status of lastRan
                trailingArgs = null; //reset trailing arguments
                timer = setTimeout(coolDownPeriodComplete, delay); //clear the timout
            }
            else {
                timer = null; // reset timer
            }
        };
        timer = setTimeout(coolDownPeriodComplete, delay);
    };
};
var ZoomManager = /** @class */ (function () {
    /**
     * Place the settings.element in a zoom wrapper and init zoomControls.
     *
     * @param settings: a `ZoomManagerSettings` object
     */
    function ZoomManager(settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.settings = settings;
        if (!settings.element) {
            throw new DOMException('You need to set the element to wrap in the zoom element');
        }
        this._zoomLevels = (_a = settings.zoomLevels) !== null && _a !== void 0 ? _a : DEFAULT_ZOOM_LEVELS;
        this._zoom = this.settings.defaultZoom || 1;
        if (this.settings.localStorageZoomKey) {
            var zoomStr = localStorage.getItem(this.settings.localStorageZoomKey);
            if (zoomStr) {
                this._zoom = Number(zoomStr);
            }
        }
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'bga-zoom-wrapper';
        this.wrapElement(this.wrapper, settings.element);
        this.wrapper.appendChild(settings.element);
        settings.element.classList.add('bga-zoom-inner');
        if ((_b = settings.smooth) !== null && _b !== void 0 ? _b : true) {
            settings.element.dataset.smooth = 'true';
            settings.element.addEventListener('transitionend', advThrottle(function () { return _this.zoomOrDimensionChanged(); }, this.throttleTime, { leading: true, trailing: true, }));
        }
        if ((_d = (_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.visible) !== null && _d !== void 0 ? _d : true) {
            this.initZoomControls(settings);
        }
        if (this._zoom !== 1) {
            this.setZoom(this._zoom);
        }
        this.throttleTime = (_e = settings.throttleTime) !== null && _e !== void 0 ? _e : 100;
        window.addEventListener('resize', advThrottle(function () {
            var _a;
            _this.zoomOrDimensionChanged();
            if ((_a = _this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth) {
                _this.setAutoZoom();
            }
        }, this.throttleTime, { leading: true, trailing: true, }));
        if (window.ResizeObserver) {
            new ResizeObserver(advThrottle(function () { return _this.zoomOrDimensionChanged(); }, this.throttleTime, { leading: true, trailing: true, })).observe(settings.element);
        }
        if ((_f = this.settings.autoZoom) === null || _f === void 0 ? void 0 : _f.expectedWidth) {
            this.setAutoZoom();
        }
    }
    Object.defineProperty(ZoomManager.prototype, "zoom", {
        /**
         * Returns the zoom level
         */
        get: function () {
            return this._zoom;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ZoomManager.prototype, "zoomLevels", {
        /**
         * Returns the zoom levels
         */
        get: function () {
            return this._zoomLevels;
        },
        enumerable: false,
        configurable: true
    });
    ZoomManager.prototype.setAutoZoom = function () {
        var _this = this;
        var _a, _b, _c;
        var zoomWrapperWidth = document.getElementById('bga-zoom-wrapper').clientWidth;
        if (!zoomWrapperWidth) {
            setTimeout(function () { return _this.setAutoZoom(); }, 200);
            return;
        }
        var expectedWidth = (_a = this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth;
        var newZoom = this.zoom;
        while (newZoom > this._zoomLevels[0] && newZoom > ((_c = (_b = this.settings.autoZoom) === null || _b === void 0 ? void 0 : _b.minZoomLevel) !== null && _c !== void 0 ? _c : 0) && zoomWrapperWidth / newZoom < expectedWidth) {
            newZoom = this._zoomLevels[this._zoomLevels.indexOf(newZoom) - 1];
        }
        if (this._zoom == newZoom) {
            if (this.settings.localStorageZoomKey) {
                localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
            }
        }
        else {
            this.setZoom(newZoom);
        }
    };
    /**
     * Sets the available zoomLevels and new zoom to the provided values.
     * @param zoomLevels the new array of zoomLevels that can be used.
     * @param newZoom if provided the zoom will be set to this value, if not the last element of the zoomLevels array will be set as the new zoom
     */
    ZoomManager.prototype.setZoomLevels = function (zoomLevels, newZoom) {
        if (!zoomLevels || zoomLevels.length <= 0) {
            return;
        }
        this._zoomLevels = zoomLevels;
        var zoomIndex = newZoom && zoomLevels.includes(newZoom) ? this._zoomLevels.indexOf(newZoom) : this._zoomLevels.length - 1;
        this.setZoom(this._zoomLevels[zoomIndex]);
    };
    /**
     * Set the zoom level. Ideally, use a zoom level in the zoomLevels range.
     * @param zoom zool level
     */
    ZoomManager.prototype.setZoom = function (zoom) {
        var _a, _b, _c, _d;
        if (zoom === void 0) { zoom = 1; }
        this._zoom = zoom;
        if (this.settings.localStorageZoomKey) {
            localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
        }
        var newIndex = this._zoomLevels.indexOf(this._zoom);
        (_a = this.zoomInButton) === null || _a === void 0 ? void 0 : _a.classList.toggle('disabled', newIndex === this._zoomLevels.length - 1);
        (_b = this.zoomOutButton) === null || _b === void 0 ? void 0 : _b.classList.toggle('disabled', newIndex === 0);
        this.settings.element.style.transform = zoom === 1 ? '' : "scale(".concat(zoom, ")");
        (_d = (_c = this.settings).onZoomChange) === null || _d === void 0 ? void 0 : _d.call(_c, this._zoom);
        this.zoomOrDimensionChanged();
    };
    /**
     * Call this method for the browsers not supporting ResizeObserver, everytime the table height changes, if you know it.
     * If the browsert is recent enough (>= Safari 13.1) it will just be ignored.
     */
    ZoomManager.prototype.manualHeightUpdate = function () {
        if (!window.ResizeObserver) {
            this.zoomOrDimensionChanged();
        }
    };
    /**
     * Everytime the element dimensions changes, we update the style. And call the optional callback.
     * Unsafe method as this is not protected by throttle. Surround with  `advThrottle(() => this.zoomOrDimensionChanged(), this.throttleTime, { leading: true, trailing: true, })` to avoid spamming recomputation.
     */
    ZoomManager.prototype.zoomOrDimensionChanged = function () {
        var _a, _b;
        this.settings.element.style.width = "".concat(this.wrapper.offsetWidth / this._zoom, "px");
        this.wrapper.style.height = "".concat(this.settings.element.offsetHeight * this._zoom, "px");
        (_b = (_a = this.settings).onDimensionsChange) === null || _b === void 0 ? void 0 : _b.call(_a, this._zoom);
    };
    /**
     * Simulates a click on the Zoom-in button.
     */
    ZoomManager.prototype.zoomIn = function () {
        if (this._zoom === this._zoomLevels[this._zoomLevels.length - 1]) {
            return;
        }
        var newIndex = this._zoomLevels.indexOf(this._zoom) + 1;
        this.setZoom(newIndex === -1 ? 1 : this._zoomLevels[newIndex]);
    };
    /**
     * Simulates a click on the Zoom-out button.
     */
    ZoomManager.prototype.zoomOut = function () {
        if (this._zoom === this._zoomLevels[0]) {
            return;
        }
        var newIndex = this._zoomLevels.indexOf(this._zoom) - 1;
        this.setZoom(newIndex === -1 ? 1 : this._zoomLevels[newIndex]);
    };
    /**
     * Changes the color of the zoom controls.
     */
    ZoomManager.prototype.setZoomControlsColor = function (color) {
        if (this.zoomControls) {
            this.zoomControls.dataset.color = color;
        }
    };
    /**
     * Set-up the zoom controls
     * @param settings a `ZoomManagerSettings` object.
     */
    ZoomManager.prototype.initZoomControls = function (settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.zoomControls = document.createElement('div');
        this.zoomControls.id = 'bga-zoom-controls';
        this.zoomControls.dataset.position = (_b = (_a = settings.zoomControls) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : 'top-right';
        this.zoomOutButton = document.createElement('button');
        this.zoomOutButton.type = 'button';
        this.zoomOutButton.addEventListener('click', function () { return _this.zoomOut(); });
        if ((_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.customZoomOutElement) {
            settings.zoomControls.customZoomOutElement(this.zoomOutButton);
        }
        else {
            this.zoomOutButton.classList.add("bga-zoom-out-icon");
        }
        this.zoomInButton = document.createElement('button');
        this.zoomInButton.type = 'button';
        this.zoomInButton.addEventListener('click', function () { return _this.zoomIn(); });
        if ((_d = settings.zoomControls) === null || _d === void 0 ? void 0 : _d.customZoomInElement) {
            settings.zoomControls.customZoomInElement(this.zoomInButton);
        }
        else {
            this.zoomInButton.classList.add("bga-zoom-in-icon");
        }
        this.zoomControls.appendChild(this.zoomOutButton);
        this.zoomControls.appendChild(this.zoomInButton);
        this.wrapper.appendChild(this.zoomControls);
        this.setZoomControlsColor((_f = (_e = settings.zoomControls) === null || _e === void 0 ? void 0 : _e.color) !== null && _f !== void 0 ? _f : 'black');
    };
    /**
     * Wraps an element around an existing DOM element
     * @param wrapper the wrapper element
     * @param element the existing element
     */
    ZoomManager.prototype.wrapElement = function (wrapper, element) {
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    };
    return ZoomManager;
}());
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
        object.style.zIndex = '30';
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
        object.style.zIndex = '30';
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
var CommonProjectCards = /** @class */ (function () {
    function CommonProjectCards(game) {
        this.game = game;
    }
    // gameui.commonProjectCards.debugSeeAllCards()
    CommonProjectCards.prototype.debugSeeAllCards = function () {
        var _this = this;
        document.querySelectorAll('.card.common-project').forEach(function (card) { return card.remove(); });
        var html = "<div id=\"all-common-project-cards\">";
        html += "</div>";
        dojo.place(html, 'full-table', 'before');
        [1, 2, 3, 4, 5, 6].forEach(function (subType) {
            var card = {
                id: 10 + subType,
                type: 1,
                subType: subType,
                name: _this.getTitle(1, subType)
            };
            _this.createMoveOrUpdateCard(card, "all-common-project-cards");
        });
        [2, 3, 4, 5, 6].forEach(function (type) {
            return [1, 2, 3].forEach(function (subType) {
                var card = {
                    id: 10 * type + subType,
                    type: type,
                    subType: subType,
                    name: _this.getTitle(type, subType)
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
            div.innerHTML = "\n                <div class=\"card-sides\">\n                    <div class=\"card-side front\">\n                        <div id=\"".concat(div.id, "-name\" class=\"name\">").concat(card.type ? this.getTitle(card.type, card.subType) : '', "</div>\n                    </div>\n                    <div class=\"card-side back\">\n                    </div>\n                </div>\n            ");
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
        if (card.name) {
            document.getElementById("".concat(div.id, "-name")).innerHTML = _(card.name);
        }
        div.dataset.type = '' + card.type;
        div.dataset.subType = '' + card.subType;
    };
    CommonProjectCards.prototype.getTitle = function (type, subType) {
        switch (type) {
            case 1:
                switch (subType) {
                    case 1:
                    case 2: return _('Infirmary');
                    case 3:
                    case 4: return _('Sacred Place');
                    case 5:
                    case 6: return _('Fortress');
                }
            case 2:
                switch (subType) {
                    case 1: return _('Herbalist');
                    case 2: return _('House');
                    case 3: return _('Prison');
                }
            case 3:
                switch (subType) {
                    case 1: return _('Forge');
                    case 2: return _('Terraced Houses');
                    case 3: return _('Outpost');
                }
            case 4:
                switch (subType) {
                    case 1: return _('Windmill');
                    case 2: return _('Sanctuary');
                    case 3: return _('Bunker');
                }
            case 5:
                switch (subType) {
                    case 1: return _('Power Station');
                    case 2: return _('Apartments');
                    case 3: return _('Radio Tower');
                }
            case 6:
                switch (subType) {
                    case 1: return _('Water Reservoir');
                    case 2: return _('Temple');
                    case 3: return _('Air Base');
                }
        }
    };
    CommonProjectCards.prototype.getTooltip = function (type, subType) {
        if (!type) {
            return _('Common projects deck');
        }
        return "\n        <h3 class=\"title\">".concat(this.getTitle(type, subType), "</h3>\n        <div>").concat(this.getTooltipDescription(type), "</div>\n        <div class=\"tooltip-important\">").concat(_('Important: A building with a roof can no longer be used for common projects.'), "</div>");
    };
    CommonProjectCards.prototype.getTooltipDescription = function (type) {
        switch (type) {
            case 1: return _('Construct a building with at least 2 floors on an area adjacent to an unoccupied area, respecting the indicated land types (1 copy each).');
            case 2: return _('Construct a building with at least 2 floors on the indicated land type in one of the 6 outside territories (1 copy each).');
            case 3: return _('Construct 2 buildings with at least 1 floor on 2 adjacent areas of the indicated land type (1 copy each).');
            case 4: return _('Construct 2 buildings, 1 with at least 2 floors and 1 with at least 1 floor, on 2 adjacent areas, respecting the indicated land type (1 copy each).');
            case 5: return _('Construct a building with at least 3 floors on the indicated land type in the central territory (1 copy each).');
            case 6: return _('Construct 3 buildings, 1 with at least 2 floors adjacent to 2 buildings with at least 1 floor respecting the indicated land types (1 copy each).');
        }
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
        document.querySelectorAll('.card.secret-mission').forEach(function (card) { return card.remove(); });
        var html = "<div id=\"all-secret-mission-cards\">";
        html += "</div>";
        dojo.place(html, 'full-table', 'before');
        [1, 2].forEach(function (type) {
            return [1, 2, 3].forEach(function (subType) {
                var card = {
                    id: 10 * type + subType,
                    type: type,
                    subType: subType,
                    name: _this.getTitle(type, subType)
                };
                _this.createMoveOrUpdateCard(card, "all-secret-mission-cards");
            });
        });
        [1, 2].forEach(function (subType) {
            var card = {
                id: 10 * 3 + subType,
                type: 3,
                subType: subType,
                name: _this.getTitle(3, subType)
            };
            _this.createMoveOrUpdateCard(card, "all-secret-mission-cards");
        });
        [1, 2, 3, 4, 5, 6, 7].forEach(function (subType) {
            var card = {
                id: 10 * 4 + subType,
                type: 4,
                subType: subType,
                name: _this.getTitle(4, subType)
            };
            _this.createMoveOrUpdateCard(card, "all-secret-mission-cards");
        });
    };
    SecretMissionCards.prototype.createMoveOrUpdateCard = function (card, destinationId, init, from) {
        var _this = this;
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
            existingDiv.classList.remove('selected');
        }
        else {
            var div = document.createElement('div');
            div.id = "secret-mission-".concat(card.id);
            div.classList.add('card', 'secret-mission');
            div.dataset.id = '' + card.id;
            div.dataset.side = '' + side;
            div.dataset.type = '' + card.type;
            div.dataset.subType = '' + card.subType;
            div.innerHTML = "\n                <div class=\"card-sides\">\n                    <div class=\"card-side front\">\n                        <div id=\"".concat(div.id, "-name\" class=\"name\">").concat(card.type ? this.getTitle(card.type, card.subType) : '', "</div>\n                    </div>\n                    <div class=\"card-side back\">\n                    </div>\n                </div>\n            ");
            document.getElementById(destinationId).appendChild(div);
            div.addEventListener('click', function () { return _this.game.onSecretMissionClick(card); });
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
        if (card.name) {
            document.getElementById("".concat(div.id, "-name")).innerHTML = _(card.name);
        }
        div.dataset.type = '' + card.type;
        div.dataset.subType = '' + card.subType;
    };
    SecretMissionCards.prototype.getTitle = function (type, subType) {
        switch (type) {
            case 1:
                switch (subType) {
                    case 1: return _('Market');
                    case 2: return _('Sculpture');
                    case 3: return _('Watchtower');
                }
            case 2:
                switch (subType) {
                    case 1: return _('Post Office');
                    case 2: return _('Cabaret');
                    case 3: return _('Barracks');
                }
            case 3:
                switch (subType) {
                    case 1: return _('Belfry');
                    case 2: return _('Observatory');
                }
            case 4:
                return _('Territory Control');
        }
    };
    SecretMissionCards.prototype.getTooltip = function (type, subType) {
        if (!type) {
            return _('Secret mission');
        }
        return "\n            <h3 class=\"title\">".concat(this.getTitle(type, subType), "</h3>\n            <div>").concat(this.getTooltipDescription(type, subType), "</div>\n            <div class=\"tooltip-important\">").concat(_('Important: A building with a roof cannot be used for any secret mission except for the “Territory Control” mission.'), "</div>\n        ");
    };
    SecretMissionCards.prototype.getTooltipDescription = function (type, subType) {
        switch (type) {
            case 1: return _('At the end of the game, each building the player has with at least 2 floors constructed on the indicated land type awards 3 VP (2 copies each).');
            case 2: return _('At the end of the game, each floor the player has on the indicated type of land awards 1 VP. So, a player who has a building with 3 floors and a building with 2 floors constructed on the indicated land type earns 5 VP (2 copies each).');
            case 3:
                switch (subType) {
                    case 1: return _('At the end of the game, each building the player has with at least 3 floors is worth 7 VP, regardless of the type of land. Only one belfry can be counted per territory (3 copies).');
                    case 2: return _('At the end of the game, each building the player has with at least 4 floors awards 11 VP, regardless of the type of land. Only one observatory can be counted per territory (2 copies).');
                }
                ;
            case 4: return _('At the end of the game, having the most floors in one of the two territories indicated awards the player 4 VP. Having the most floors in both territories awards 12 VP. The majority must not be shared. Buildings with roofs count for the calculation of majorities (7 different copies).');
        }
    };
    return SecretMissionCards;
}());
var POINT_CASE_SIZE = 47.24;
var SCORE_MS = 1500;
/*
[1, 2],
[6, 0, 3],
[4, 5],
*/
var Z_INDEXES = [
    2,
    1,
    1,
    2,
    3,
    3,
    2,
];
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
            dojo.place("\n                <div id=\"territory".concat(territoryPosition, "\" class=\"territory\" data-position=\"").concat(territoryPosition, "\" data-number=\"").concat(territoryNumber, "\" data-rotation=\"").concat(territoryRotation, "\">\n                    <div class=\"shadow\"></div>\n                    <div class=\"territory-number top\">").concat(territoryNumber, "</div>\n                    <div class=\"territory-number left\">").concat(territoryNumber, "</div>\n                    <div class=\"territory-number right\">").concat(territoryNumber, "</div>\n                    <div id=\"torticrane-spot-").concat(territoryPosition, "\" class=\"torticrane-spot\"></div>\n                </div>\n            "), "board");
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
                var zIndex = (Z_INDEXES[territoryPosition] - 1) * 3 + Z_INDEXES[rotation];
                var html = "<div id=\"area".concat(position, "\" class=\"area\" data-position=\"").concat(position, "\" data-type=\"").concat(type, "\" data-cost=\"").concat(cost, "\" data-position=\"").concat(areaPosition, "\" data-rotation=\"").concat(rotation, "\" style=\"z-index: ").concat(zIndex, ";\">");
                html += bramble && type ? "<div class=\"bramble-type-token\" data-type=\"".concat(type, "\"><div class=\"land-number\">").concat(cost, "</div></div>") : "<div class=\"land-number\">".concat(cost, "</div>");
                html += "</div>";
                dojo.place(html, "territory".concat(territoryPosition));
                document.getElementById("area".concat(position)).addEventListener('click', function () { return _this.game.onAreaClick(position); });
                if (mapPosition.building) {
                    _this.setBuilding(position, mapPosition.building);
                }
            });
        });
        dojo.place("<div id=\"torticrane\"></div>", "torticrane-spot-".concat(torticranePosition));
        document.getElementById("board").dataset.torticranePosition = '' + torticranePosition;
    }
    Board.prototype.createRemainingBrambleTokens = function (brambleIds) {
        dojo.place("\n        <div id=\"remaining-bramble-tokens\" class=\"whiteblock\">\n            <div id=\"remaining-bramble-tokens-containers\">\n                <div id=\"remaining-bramble-tokens-container-1\" class=\"bramble-container\"></div>\n                <div id=\"remaining-bramble-tokens-container-2\" class=\"bramble-container\"></div>\n                <div id=\"remaining-bramble-tokens-container-3\" class=\"bramble-container\"></div>\n            </div>\n            <div class=\"title\">".concat(_('Remaining bramble tokens'), "</div>\n            </div>\n        </div>\n        "), "board");
        [1, 2, 3].forEach(function (type) { return brambleIds[type].forEach(function (id) {
            return dojo.place("<div id=\"bramble".concat(id, "\" class=\"bramble-type-token\" data-type=\"").concat(type, "\"><div class=\"land-number\">5</div></div>"), "remaining-bramble-tokens-container-".concat(type));
        }); });
    };
    Board.prototype.getPointsCoordinates = function (points) {
        var cases = points % 70;
        var top = cases >= 48 ? 0 : (24 - Math.max(0, cases - 24)) * POINT_CASE_SIZE;
        var left = cases < 48 ? (24 - Math.min(cases, 24)) * POINT_CASE_SIZE : (cases - 48) * POINT_CASE_SIZE;
        return [8 + left, 8 + top];
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
    Board.prototype.activatePossibleAreasWithCost = function (possibleAreas) {
        var _this = this;
        var playerColor = this.game.getPlayerColor(this.game.getPlayerId());
        Array.from(document.getElementsByClassName('area')).forEach(function (area) {
            var selectable = Object.keys(possibleAreas).includes(area.dataset.position);
            area.classList.toggle('selectable', selectable);
            if (selectable) {
                var cost = possibleAreas[area.dataset.position];
                var costStr = cost > 0 ? '+' + cost : cost;
                dojo.place("<div id=\"cost-tag".concat(area.dataset.position, "\" class=\"cost-tag\"><span>").concat(costStr, "</span> <div class=\"icon inhabitant\" data-color=\"").concat(playerColor, "\"></div></div>"), area);
                _this.game.setTooltip("cost-tag".concat(area.dataset.position), costStr);
            }
        });
    };
    Board.prototype.activatePossibleAreas = function (possibleAreas, selectedPosition) {
        Array.from(document.getElementsByClassName('area')).forEach(function (area) {
            area.classList.toggle('selectable', possibleAreas.includes(Number(area.dataset.position)));
            area.classList.toggle('selected', selectedPosition == Number(area.dataset.position));
        });
    };
    Board.prototype.setBrambleType = function (areaPosition, type, id) {
        var areaDiv = document.getElementById("area".concat(areaPosition));
        areaDiv.dataset.type = '' + type;
        var brambleDiv = document.getElementById("bramble".concat(id));
        slideToObjectAndAttach(this.game, brambleDiv, areaDiv.id);
    };
    Board.prototype.setBuilding = function (areaPosition, building) {
        var _this = this;
        var _a;
        var buildingDiv = document.getElementById("building".concat(areaPosition));
        if (building) {
            if (!buildingDiv) {
                dojo.place("<div id=\"building".concat(areaPosition, "\" class=\"building\"></div>"), "area".concat(areaPosition));
            }
            building.buildingFloors.forEach(function (floor, index) {
                var buildingFloorDiv = document.getElementById("building-floor-".concat(floor.id));
                if (!buildingFloorDiv) {
                    dojo.place("<div id=\"building-floor-".concat(floor.id, "\" class=\"building-floor\" data-player-id=\"").concat(floor.playerId, "\" data-color=\"").concat(floor.playerId ? _this.game.getPlayerColor(floor.playerId) : 0, "\" style=\"z-index: ").concat(10 + index, "\"></div>"), "building".concat(areaPosition));
                }
                else {
                    var currentAreaDiv = buildingFloorDiv.closest('.area');
                    if (!currentAreaDiv || currentAreaDiv.id != "area".concat(areaPosition)) {
                        buildingFloorDiv.style.zIndex = '' + (10 + index);
                        slideToObjectAndAttach(_this.game, buildingFloorDiv, "building".concat(areaPosition));
                    }
                }
            });
        }
        else {
            Array.from(buildingDiv.children).forEach(function (child) {
                return slideToObjectAndAttach(_this.game, child, Number(child.dataset.playerId) ? "player-table-".concat(child.dataset.playerId, "-remaining-building-floors") : "remaining-roofs");
            });
            (_a = buildingDiv === null || buildingDiv === void 0 ? void 0 : buildingDiv.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(buildingDiv);
        }
    };
    Board.prototype.highlightBuilding = function (buildingsToHighlight, inc) {
        var _this = this;
        var playersIds = [];
        buildingsToHighlight.forEach(function (building) {
            var _a;
            (_a = document.getElementById("building".concat(building.areaPosition))) === null || _a === void 0 ? void 0 : _a.classList.add('highlight');
            if (!playersIds.includes(building.playerId)) {
                playersIds.push(building.playerId);
            }
        });
        playersIds.forEach(function (playerId) {
            var playerBuildings = buildingsToHighlight.filter(function (building) { return building.playerId == playerId; });
            var highestBuilding = playerBuildings.reduce(function (a, b) { return b.floors > a.floors ? b : a; });
            _this.game.displayScoring("building".concat(highestBuilding.areaPosition), _this.game.getPlayerColor(playerId), inc, SCORE_MS);
        });
    };
    Board.prototype.moveTorticrane = function (torticranePosition) {
        slideToObjectAndAttach(this.game, document.getElementById('torticrane'), "torticrane-spot-".concat(torticranePosition));
        document.getElementById("board").dataset.torticranePosition = '' + torticranePosition;
    };
    return Board;
}());
var END_INHABITANTS_POINTS = [
    [1, -30],
    [2, -20],
    [4, -10],
    [6, -5],
    [8, -3],
    [10, 0],
    [11, 1],
    [14, 2],
    [17, 3],
    [20, 4],
    [23, 5],
    [26, 6],
    [29, 7],
    [32, 8],
    [35, 9],
    [38, 10],
];
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        var html = "\n        <div id=\"player-table-".concat(this.playerId, "\" class=\"player-table whiteblock\">\n            <div id=\"player-table-").concat(this.playerId, "-score-board\" class=\"player-score-board\" data-color=\"").concat(player.color, "\">\n                <div id=\"player-table-").concat(this.playerId, "-name\" class=\"player-name\" style=\"color: #").concat(player.color, ";\">").concat(player.name, "</div>\n                <div id=\"player-table-").concat(this.playerId, "-meeple-marker\" class=\"meeple-marker\" data-color=\"").concat(player.color, "\"></div>\n                <div id=\"player-table-").concat(this.playerId, "-inhabitant-scores\" class=\"inhabitant-scores\"></div>\n            </div>\n            <div id=\"player-table-").concat(this.playerId, "-remaining-building-floors\" class=\"remaining-building-floors\"></div>\n            <div id=\"player-table-").concat(this.playerId, "-secret-missions-wrapper\" class=\"player-secret-missions-wrapper\">\n                <div id=\"player-table-").concat(this.playerId, "-secret-missions-title\" class=\"title ").concat(player.secretMissions.length ? '' : 'hidden', "\"\">").concat(_('Secret missions'), "</div>\n                <div id=\"player-table-").concat(this.playerId, "-secret-missions\" class=\"player-secret-missions\">\n                </div>\n            </div>\n            <div id=\"player-table-").concat(this.playerId, "-common-projects-wrapper\" class=\"player-common-projects-wrapper\">\n                <div id=\"player-table-").concat(this.playerId, "-common-projects-title\" class=\"title ").concat(player.commonProjects.length ? '' : 'hidden', "\">").concat(_('Completed Common projects'), "</div>\n                <div id=\"player-table-").concat(this.playerId, "-common-projects\" class=\"player-common-projects\">\n                </div>\n            </div>\n        </div>");
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
        player.buildingFloors.forEach(function (floor) { return dojo.place("<div id=\"building-floor-".concat(floor.id, "\" class=\"building-floor\" data-player-id=\"").concat(floor.playerId, "\" data-color=\"").concat(player.color, "\"></div>"), "player-table-".concat(_this.playerId, "-remaining-building-floors")); });
        this.setInhabitants(player.inhabitants);
        this.setCommonProjects(player.commonProjects);
        this.setSecretMissions(player.secretMissions);
    }
    PlayerTable.prototype.getPointsCoordinates = function (points) {
        var cases = Math.min(points, 40);
        var top = points <= 20 ? 0 : 44;
        var left = (points <= 20 ? cases : cases - 20) * 29.5;
        return [-17 + left, 203 + top];
    };
    PlayerTable.prototype.setInhabitants = function (inhabitants) {
        var markerDiv = document.getElementById("player-table-".concat(this.playerId, "-meeple-marker"));
        var coordinates = this.getPointsCoordinates(inhabitants);
        var left = coordinates[0];
        var top = coordinates[1];
        markerDiv.style.transform = "translateX(".concat(left, "px) translateY(").concat(top, "px)");
        var inhabitantScoresTooltip = "<h3>".concat(_('Victory points by final inhabitant count'), "</h3>");
        END_INHABITANTS_POINTS.forEach(function (array, index) {
            var nextArray = END_INHABITANTS_POINTS[index + 1];
            var from = array[0];
            var to = nextArray ? nextArray[0] - 1 : '40+';
            var points = array[1];
            var bold = (!nextArray && inhabitants >= from) || (nextArray && inhabitants >= from && inhabitants <= to);
            var label = from == to ?
                _('${inhabitants} inhabitants').replace('${inhabitants}', from) :
                _('${from} to ${to} inhabitants').replace('${from}', from).replace('${to}', to);
            inhabitantScoresTooltip += "<div>";
            if (bold) {
                inhabitantScoresTooltip += "<strong>";
            }
            inhabitantScoresTooltip += "".concat(label, " = ").concat(_('${points} Victory points').replace('${points}', points));
            if (bold) {
                inhabitantScoresTooltip += "</strong>";
            }
            inhabitantScoresTooltip += "</div>";
        });
        this.game.setTooltip("player-table-".concat(this.playerId, "-inhabitant-scores"), _(inhabitantScoresTooltip));
    };
    PlayerTable.prototype.setPloyTokenUsed = function (type) {
        var token = document.getElementById("player-table-".concat(this.playerId, "-ploy-tokens-container-0")).lastElementChild;
        slideToObjectAndAttach(this.game, token, "player-table-".concat(this.playerId, "-ploy-tokens-container-").concat(type));
    };
    PlayerTable.prototype.setCommonProjects = function (commonProjects) {
        var _this = this;
        if (commonProjects.length) {
            document.getElementById("player-table-".concat(this.playerId, "-common-projects-title")).classList.remove('hidden');
        }
        commonProjects.forEach(function (commonProject) {
            return _this.game.commonProjectCards.createMoveOrUpdateCard(commonProject, "player-table-".concat(_this.playerId, "-common-projects"));
        });
    };
    PlayerTable.prototype.setSecretMissions = function (secretMissions, ignoreReminder) {
        var _this = this;
        if (ignoreReminder === void 0) { ignoreReminder = false; }
        if (secretMissions.length) {
            document.getElementById("player-table-".concat(this.playerId, "-secret-missions-title")).classList.remove('hidden');
        }
        secretMissions.forEach(function (secretMission, index) {
            _this.game.secretMissionCards.createMoveOrUpdateCard(secretMission, "player-table-".concat(_this.playerId, "-secret-missions"));
            if (!ignoreReminder && _this.playerId == _this.game.getPlayerId()) {
                var secretMissionReminderDiv = document.getElementById("secret-mission-reminder-".concat(index));
                if (secretMissionReminderDiv) {
                    secretMissionReminderDiv.dataset.type = '' + secretMission.type;
                    secretMissionReminderDiv.dataset.subType = '' + secretMission.subType;
                }
            }
        });
    };
    return PlayerTable;
}());
var ANIMATION_MS = 500;
var TITLE_COLOR = ['#6b7123', '#ba782e', '#ab3b2b'];
var ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
var LOCAL_STORAGE_ZOOM_KEY = 'GardenNation-zoom';
var isDebug = window.location.host == 'studio.boardgamearena.com';
var log = isDebug ? console.log.bind(window.console) : function () { };
var GardenNation = /** @class */ (function () {
    function GardenNation() {
        this.playersTables = [];
        this.inhabitantCounters = [];
        this.buildingFloorCounters = [];
        this.ployTokenCounters = [];
        this.selectedSecretMissionsIds = [];
        this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
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
        var _a;
        log("Starting game setup");
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        this.commonProjectCards = new CommonProjectCards(this);
        this.secretMissionCards = new SecretMissionCards(this);
        this.createPlayerPanels(gamedatas);
        var players = Object.values(gamedatas.players);
        this.board = new Board(this, players, gamedatas);
        this.createPlayerTables(gamedatas);
        this.createSecondBoard(gamedatas);
        this.createObjectiveReminder(gamedatas);
        if (gamedatas.endTurn) {
            this.notif_lastTurn();
        }
        var stateId = Number(gamedatas.gamestate.id);
        if (stateId >= 20) {
            var selectorDiv = document.getElementById("secret-missions-selector");
            (_a = selectorDiv === null || selectorDiv === void 0 ? void 0 : selectorDiv.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(selectorDiv);
        }
        if (stateId >= 80) { // score or end
            this.onEnteringShowScore(true);
        }
        this.zoomManager = new ZoomManager({
            element: document.getElementById('full-table'),
            smooth: false,
            zoomControls: {
                color: 'black',
            },
            zoomLevels: ZOOM_LEVELS,
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
            onDimensionsChange: function (zoom) {
                //this.setAutoZoom();
                //this.tableHeightChange();
                var fullBoardWrapperDiv = document.getElementById('full-board-wrapper');
                var clientWidth = fullBoardWrapperDiv.clientWidth;
                fullBoardWrapperDiv.style.display = clientWidth < 1181 * zoom ? 'block' : 'flex';
                // set second board placement
                document.getElementById('full-board').classList.toggle('common-projects-side-board', clientWidth > 1464);
            },
        });
        this.addHelp();
        this.setupNotifications();
        this.setupPreferences();
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
            case 'chooseSecretMissions':
                this.onEnteringChooseSecretMissions(args.args);
                break;
            case 'constructBuilding':
            case 'abandonBuilding':
            case 'buildingInvasion':
                this.onEnteringSelectAreaPositionWithCost(args.args);
                break;
            case 'chooseRoofToTransfer':
            case 'chooseRoofDestination':
                this.onEnteringSelectAreaPosition(args.args);
                break;
            case 'chooseTypeOfLand':
                this.onEnteringChooseTypeOfLand(args.args);
                break;
            case 'chooseCompletedCommonProject':
                this.onEnteringChooseCompletedCommonProject(args.args);
                break;
            case 'endRound':
                Array.from(document.querySelectorAll(".building.highlight")).forEach(function (elem) { return elem.classList.remove('highlight'); });
                document.getElementById('board').dataset.shadowOnTorticraneTerritory = 'false';
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
    GardenNation.prototype.onEnteringChooseSecretMissions = function (args) {
        var _this = this;
        var _a, _b;
        this.selectedSecretMissionsIds = [];
        (_b = (_a = args._private) === null || _a === void 0 ? void 0 : _a.secretMissions) === null || _b === void 0 ? void 0 : _b.forEach(function (secretMission) {
            _this.secretMissionCards.createMoveOrUpdateCard(secretMission, "secret-missions-selector", true);
            if (secretMission.location === 'chosen') {
                _this.selectedSecretMissionsIds.push(secretMission.id);
                document.getElementById("secret-mission-".concat(secretMission.id)).classList.add('selected');
            }
        });
        this.checkConfirmSecretMissionsButtonState();
    };
    GardenNation.prototype.onEnteringSelectAreaPositionWithCost = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.board.activatePossibleAreasWithCost(args.possiblePositions);
        }
    };
    GardenNation.prototype.onEnteringSelectAreaPosition = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.board.activatePossibleAreas(args.possiblePositions, args.selectedPosition);
        }
    };
    GardenNation.prototype.onEnteringChooseTypeOfLand = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.board.activatePossibleAreas([], args.selectedPosition);
        }
    };
    GardenNation.prototype.onEnteringChooseCompletedCommonProject = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.board.activatePossibleAreas([], args.selectedPosition);
            args.completedCommonProjects.forEach(function (commonProject) {
                document.getElementById("common-project-".concat(commonProject.id)).classList.add('selectable');
                document.querySelector(".common-project-reminder[data-id=\"".concat(commonProject.id, "\"]")).classList.add('selectable');
            });
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
            case 'endSecretMissions':
                dojo.destroy("secret-missions-selector");
                break;
            case 'constructBuilding':
            case 'abandonBuilding':
            case 'buildingInvasion':
            case 'chooseRoofToTransfer':
            case 'chooseRoofDestination':
            case 'chooseTypeOfLand':
                this.onLeavingSelectAreaPosition();
                break;
            case 'chooseCompletedCommonProject':
                this.onLeavingChooseCompletedCommonProject();
                break;
            case 'endRound':
                document.getElementById('board').dataset.scoreTerritory = '';
                document.getElementById('board').dataset.shadowOnTorticraneTerritory = 'true';
        }
    };
    GardenNation.prototype.onLeavingSelectAreaPosition = function () {
        document.querySelectorAll('.cost-tag').forEach(function (elem) { return elem.parentElement.removeChild(elem); });
        this.board.activatePossibleAreas([], null);
    };
    GardenNation.prototype.onLeavingChooseCompletedCommonProject = function () {
        if (this.isCurrentPlayerActive()) {
            this.board.activatePossibleAreas([], null);
            document.querySelectorAll('.common-project.selectable, .common-project-reminder.selectable').forEach(function (elem) { return elem.classList.remove('selectable'); });
        }
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    GardenNation.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        if (stateName === 'chooseSecretMissions') {
            if (this.isCurrentPlayerActive()) {
                this.addActionButton("chooseSecretMissions-button", _("Confirm selection"), function () { return _this.chooseSecretMissions(_this.selectedSecretMissionsIds); });
                this.checkConfirmSecretMissionsButtonState();
            }
            else if (Object.keys(this.gamedatas.players).includes('' + this.getPlayerId())) { // ignore spectators
                this.addActionButton("cancelChooseSecretMissions-button", _("I changed my mind"), function () { return _this.cancelChooseSecretMissions(); }, null, null, 'gray');
            }
        }
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseAction':
                    var chooseActionArgs_1 = args;
                    this.addActionButton("chooseConstructBuilding-button", _("Construct building"), function () { return _this.chooseConstructBuilding(); });
                    this.addActionButton("chooseAbandonBuilding-button", _("Abandon building"), function () { return _this.chooseAbandonBuilding(); });
                    if (chooseActionArgs_1.canChangeTerritory) {
                        this.addActionButton("changeTerritory-button", _("Move to territory ${number}").replace('${number}', chooseActionArgs_1.canChangeTerritory), function () { return _this.changeTerritory(chooseActionArgs_1.canChangeTerritory); }, null, null, 'red');
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
                case 'chooseCompletedCommonProject':
                    this.addActionButton("skipCompletedCommonProject-button", _("Skip"), function () { return _this.skipCompletedCommonProject(); }, null, null, 'red');
                    break;
                case 'abandonBuilding':
                    this.addActionButton("cancelAbandonBuilding-button", _("Cancel"), function () { return _this.cancelAbandonBuilding(); }, null, null, 'gray');
                    break;
                case 'chooseTypeOfLand':
                    var chooseTypeOfLandArgs = args;
                    chooseTypeOfLandArgs.possibleTypes.forEach(function (type) {
                        return _this.addActionButton("chooseTypeOfLand".concat(type, "-button"), "<div class=\"bramble-type-token\" data-type=\"".concat(type, "\"><div class=\"land-number\">5</div></div>"), function () { return _this.chooseTypeOfLand(type); });
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
                    var labels = [_("Building Invasion"), _("Strategic Movement"), _("Roof Transfer")];
                    labels.forEach(function (label, index) {
                        var type = index + 1;
                        _this.addActionButton("usePloyToken".concat(type, "-button"), "<div class=\"button-ploy-icon\" data-type=\"".concat(type, "\"></div> ").concat(label), function () { return _this.usePloyToken(type); });
                    });
                    this.addActionButton("cancelUsePloyToken-button", _("Cancel"), function () { return _this.cancelUsePloyToken(); }, null, null, 'gray');
                    document.getElementById("usePloyToken1-button").classList.toggle('disabled', !usePloyTokenArgs.canInvade);
                    document.getElementById("usePloyToken2-button").classList.toggle('disabled', !usePloyTokenArgs.canMoveTorticrane);
                    document.getElementById("usePloyToken3-button").classList.toggle('disabled', !usePloyTokenArgs.canTransferRoof);
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
    /**
     * Handle user preferences changes.
     */
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
        var _a;
        switch (prefId) {
            case 201:
                (_a = document.getElementById('objectives-reminder')) === null || _a === void 0 ? void 0 : _a.classList.toggle('hidden', prefValue == 2);
                break;
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
    GardenNation.prototype.updateRemainingFloorsCounter = function (playerId) {
        var div = document.getElementById(playerId == 0 ? 'remaining-roofs' : "player-table-".concat(playerId, "-remaining-building-floors"));
        div.style.setProperty('--number', '' + div.childElementCount);
    };
    GardenNation.prototype.createSecondBoard = function (gamedatas) {
        var _this = this;
        [0, 1, 2, 3, 4].forEach(function (number) {
            dojo.place("\n            <div id=\"common-project-wrapper-".concat(number, "\" class=\"common-project-wrapper\" data-number=\"").concat(number, "\">\n            </div>\n            "), 'common-projects-inner');
        });
        this.commonProjectCards.createMoveOrUpdateCard({}, "common-project-wrapper-0");
        gamedatas.commonProjects.forEach(function (commonProject) { return _this.commonProjectCards.createMoveOrUpdateCard(commonProject, "common-project-wrapper-".concat(commonProject.locationArg)); });
        gamedatas.remainingRoofs.forEach(function (roof) { return dojo.place("<div id=\"building-floor-".concat(roof.id, "\" class=\"building-floor\" data-player-id=\"0\" data-color=\"0\"></div>"), "remaining-roofs"); });
        this.updateRemainingFloorsCounter(0);
    };
    GardenNation.prototype.createObjectiveReminder = function (gamedatas) {
        var _this = this;
        var playerId = '' + this.getPlayerId();
        if (!Object.keys(this.gamedatas.players).includes(playerId)) {
            return;
        }
        dojo.place("<div id=\"objectives-reminder\" class=\"whiteblock\">\n            <div id=\"common-projects-reminder-title\" class=\"title\" title=\"".concat(_("Common projects"), "\">").concat(_("Common projects"), "</div>\n            <div id=\"common-projects-reminder\" class=\"cards\"></div>\n            <div id=\"secret-missions-reminder-title\" class=\"title\" title=\"").concat(_("Secret missions"), "\">").concat(_("Secret missions"), "</div>\n            <div id=\"secret-missions-reminder\" class=\"cards\"></div>\n        </div>"), 'secret-missions-selector', 'after');
        [1, 2, 3, 4].forEach(function (number) {
            var _a;
            var commonProject = _this.gamedatas.commonProjects.find(function (commonProject) { return commonProject.locationArg == number; });
            dojo.place("\n            <div id=\"common-project-reminder-".concat(number, "\" class=\"common-project-reminder card-reminder\" data-id=\"").concat(commonProject === null || commonProject === void 0 ? void 0 : commonProject.id, "\" data-type=\"").concat((_a = commonProject === null || commonProject === void 0 ? void 0 : commonProject.type) !== null && _a !== void 0 ? _a : 0, "\" data-sub-type=\"").concat(commonProject === null || commonProject === void 0 ? void 0 : commonProject.subType, "\">\n            </div>\n            "), 'common-projects-reminder');
            var elem = document.getElementById("common-project-reminder-".concat(number));
            elem.addEventListener('click', function () {
                if (elem.classList.contains('selectable')) {
                    _this.onCommonProjectClick({ id: Number(elem.dataset.id) });
                }
            });
        });
        [0, 1].forEach(function (number) {
            dojo.place("\n            <div id=\"secret-mission-reminder-".concat(number, "\" class=\"secret-mission-reminder card-reminder\" data-type=\"0\">\n            </div>\n            "), 'secret-missions-reminder');
        });
        this.gamedatas.players[playerId].secretMissions.forEach(function (secretMission, index) {
            var secretMissionDiv = document.getElementById("secret-mission-reminder-".concat(index));
            secretMissionDiv.dataset.type = '' + secretMission.type;
            secretMissionDiv.dataset.subType = '' + secretMission.subType;
        });
    };
    GardenNation.prototype.checkConfirmSecretMissionsButtonState = function () {
        var _a;
        var selectorCardsDivs = Array.from(document.getElementById("secret-missions-selector").getElementsByClassName('secret-mission'));
        selectorCardsDivs.forEach(function (card) { return card.classList.remove('disabled'); });
        this.selectedSecretMissionsIds.forEach(function (id) {
            var selectedCard = selectorCardsDivs.find(function (card) { return Number(card.dataset.id) == id; });
            selectorCardsDivs.filter(function (card) { return selectedCard.id != card.id && selectedCard.dataset.type == card.dataset.type && selectedCard.dataset.subType == card.dataset.subType; }).forEach(function (card) { return card.classList.add('disabled'); });
        });
        (_a = document.getElementById("chooseSecretMissions-button")) === null || _a === void 0 ? void 0 : _a.classList.toggle('disabled', this.selectedSecretMissionsIds.length !== 2);
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
    GardenNation.prototype.onSecretMissionClick = function (card) {
        var _a, _b;
        switch (this.gamedatas.gamestate.name) {
            case 'chooseSecretMissions':
                var div = document.getElementById("secret-mission-".concat(card.id));
                if (div.classList.contains('disabled')) {
                    return;
                }
                var args = this.gamedatas.gamestate.args;
                if ((_b = (_a = args._private) === null || _a === void 0 ? void 0 : _a.secretMissions) === null || _b === void 0 ? void 0 : _b.some(function (cp) { return cp.id === card.id; })) {
                    var index = this.selectedSecretMissionsIds.findIndex(function (id) { return id == card.id; });
                    if (index !== -1) {
                        this.selectedSecretMissionsIds.splice(index, 1);
                    }
                    else {
                        this.selectedSecretMissionsIds.push(card.id);
                    }
                    div.classList.toggle('selected', index === -1);
                }
                if (this.isCurrentPlayerActive()) {
                    this.checkConfirmSecretMissionsButtonState();
                }
                else {
                    this.cancelChooseSecretMissions();
                }
                break;
        }
    };
    GardenNation.prototype.chooseSecretMissions = function (ids) {
        if (!this.checkAction('chooseSecretMissions')) {
            return;
        }
        this.takeAction('chooseSecretMissions', {
            ids: ids.join(',')
        });
    };
    GardenNation.prototype.cancelChooseSecretMissions = function () {
        this.takeAction('cancelChooseSecretMissions');
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
    GardenNation.prototype.skipCompletedCommonProject = function () {
        if (!this.checkAction('skipCompletedCommonProject')) {
            return;
        }
        this.takeAction('skipCompletedCommonProject');
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
    GardenNation.prototype.getHelpTripleTitleHtml = function (titles) {
        return titles.map(function (title, index) { return "<span style=\"color: ".concat(TITLE_COLOR[index], ";\">").concat(title, "</span>"); }).join(' | ');
    };
    GardenNation.prototype.showHelp = function () {
        var _this = this;
        var helpDialog = new ebg.popindialog();
        helpDialog.create('gardennationHelpDialog');
        helpDialog.setTitle(_("Objectives in detail").toUpperCase());
        var html = "<div id=\"help-popin\">\n            <h1>".concat(_("Common projects"), "</h1>\n            <div id=\"help-common-projects\" class=\"help-section\">\n                <h2>").concat(this.getHelpTripleTitleHtml([2, 1, 3].map(function (subType) { return _this.commonProjectCards.getTitle(1, subType); })), "</h2>\n                <table>\n                    <tr>\n                        <td id=\"help-common-projects-1\">\n                            <div id=\"help-common-projects-1-row-a\"></div>\n                            <div id=\"help-common-projects-1-row-b\"></div>\n                        </td>\n                    </tr>\n                    <tr>\n                        <td>").concat(this.commonProjectCards.getTooltipDescription(1), "</td>\n                    </tr>\n                </table>");
        [2, 3, 4, 5, 6].forEach(function (type) {
            return html += "\n                <h2>".concat(_this.getHelpTripleTitleHtml([2, 1, 3].map(function (subType) { return _this.commonProjectCards.getTitle(type, subType); })), "</h2>\n                <table>\n                    <tr>\n                        <td id=\"help-common-projects-").concat(type, "\"></td>\n                    </tr>\n                    <tr>\n                        <td>").concat(_this.commonProjectCards.getTooltipDescription(type), "</td>\n                    </tr>\n                </table>");
        });
        html += "\n        <h1>".concat(_("Secret missions"), "</h1>\n        <div id=\"help-secret-missions\" class=\"help-section\">");
        [2, 1].forEach(function (type) {
            return html += "\n                <h2>".concat(_this.getHelpTripleTitleHtml([2, 1, 3].map(function (subType) { return _this.secretMissionCards.getTitle(type, subType); })), "</h2>\n                <table>\n                    <tr>\n                        <td id=\"help-secret-missions-").concat(type, "\"></td>\n                    </tr>\n                    <tr>\n                        <td>").concat(_this.secretMissionCards.getTooltipDescription(type, 0), "</td>\n                    </tr>\n                </table>");
        });
        [[3, 1], [3, 2], [4, 1]].forEach(function (typeAndSubType) {
            return html += "\n                <h2>".concat(_this.secretMissionCards.getTitle(typeAndSubType[0], typeAndSubType[1]), "</h2>\n                <table>\n                    <tr>\n                        <td id=\"help-secret-missions-").concat(typeAndSubType[0], "-").concat(typeAndSubType[1], "\"></td>\n                        <td>").concat(_this.secretMissionCards.getTooltipDescription(typeAndSubType[0], typeAndSubType[1]), "</td>\n                    </tr>\n                </table>");
        });
        html += "     \n            </div>\n        </div>";
        // Show the dialog
        helpDialog.setContent(html);
        helpDialog.show();
        ['a', 'b'].forEach(function (line, lineIndex) {
            return [2, 1, 3].forEach(function (subType) { return _this.commonProjectCards.createMoveOrUpdateCard({ id: 1000 + 1 * 10 + subType + lineIndex * 3, type: 1, subType: subType * 2 + lineIndex - 1 }, "help-common-projects-1-row-".concat(line)); });
        });
        [2, 3, 4, 5, 6].forEach(function (type) {
            return [2, 1, 3].forEach(function (subType) { return _this.commonProjectCards.createMoveOrUpdateCard({ id: 1000 + type * 10 + subType, type: type, subType: subType }, "help-common-projects-".concat(type)); });
        });
        [1, 2].forEach(function (type) {
            return [2, 1, 3].forEach(function (subType) { return _this.secretMissionCards.createMoveOrUpdateCard({ id: 1000 + type * 10 + subType, type: type, subType: subType }, "help-secret-missions-".concat(type)); });
        });
        [[3, 1], [3, 2], [4, 1]].forEach(function (typeAndSubType) {
            return _this.secretMissionCards.createMoveOrUpdateCard({ id: 1000 + typeAndSubType[0] * 10 + typeAndSubType[1], type: typeAndSubType[0], subType: typeAndSubType[1] }, "help-secret-missions-".concat(typeAndSubType[0], "-").concat(typeAndSubType[1]));
        });
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
            ['giveSecretMissions', ANIMATION_MS],
            ['giveSecretMissionsIds', 1],
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
        this.board.moveTorticrane(notif.args.torticranePosition);
    };
    GardenNation.prototype.notif_setPlayerOrder = function (notif) {
        slideToObjectAndAttach(this, document.getElementById("order-token-".concat(notif.args.playerId)), "order-track-".concat(notif.args.order));
    };
    GardenNation.prototype.notif_giveSecretMissions = function (notif) {
        this.getPlayerTable(notif.args.playerId).setSecretMissions(notif.args.secretMissions);
    };
    GardenNation.prototype.notif_giveSecretMissionsIds = function (notif) {
        var _this = this;
        Object.keys(notif.args.secretMissionsIds).map(function (key) { return Number(key); }).filter(function (playerId) { return playerId != _this.getPlayerId(); }).forEach(function (playerId) {
            return _this.getPlayerTable(playerId).setSecretMissions(notif.args.secretMissionsIds[playerId].map(function (id) { return ({ id: id }); }));
        });
    };
    GardenNation.prototype.notif_setBrambleType = function (notif) {
        this.board.setBrambleType(notif.args.areaPosition, notif.args.type, notif.args.brambleId);
    };
    GardenNation.prototype.notif_setBuilding = function (notif) {
        var _this = this;
        this.board.setBuilding(notif.args.areaPosition, notif.args.building);
        Object.values(this.gamedatas.players).forEach(function (player) {
            return _this.buildingFloorCounters[Number(player.id)].toValue(document.getElementById("player-table-".concat(player.id, "-remaining-building-floors")).childElementCount);
        });
        this.updateRemainingFloorsCounter(0);
    };
    GardenNation.prototype.notif_territoryControl = function (notif) {
        document.getElementById('board').dataset.scoreTerritory = '' + notif.args.territoryPosition;
        this.board.highlightBuilding(notif.args.buildingsToHighlight, notif.args.inc);
    };
    GardenNation.prototype.notif_ployTokenUsed = function (notif) {
        var _a, _b;
        (_a = this.ployTokenCounters[notif.args.playerId]) === null || _a === void 0 ? void 0 : _a.incValue(-1);
        (_b = this.getPlayerTable(notif.args.playerId)) === null || _b === void 0 ? void 0 : _b.setPloyTokenUsed(notif.args.type);
    };
    GardenNation.prototype.notif_takeCommonProject = function (notif) {
        var commonProject = notif.args.commonProject;
        this.getPlayerTable(notif.args.playerId).setCommonProjects([commonProject]);
        var commonProjectReminderDiv = document.getElementById("common-project-reminder-".concat(commonProject.locationArg));
        commonProjectReminderDiv.dataset.id = '';
        commonProjectReminderDiv.dataset.type = '0';
        commonProjectReminderDiv.dataset.subType = '0';
        //this.tableHeightChange();
    };
    GardenNation.prototype.notif_newCommonProject = function (notif) {
        var commonProject = notif.args.commonProject;
        // we first create a backflipped card
        this.commonProjectCards.createMoveOrUpdateCard({
            id: commonProject.id
        }, "common-project-wrapper-0");
        // then we reveal it
        this.commonProjectCards.createMoveOrUpdateCard(commonProject, "common-project-wrapper-".concat(commonProject.locationArg));
        var commonProjectReminderDiv = document.getElementById("common-project-reminder-".concat(commonProject.locationArg));
        commonProjectReminderDiv.dataset.id = '' + commonProject.id;
        commonProjectReminderDiv.dataset.type = '' + commonProject.type;
        commonProjectReminderDiv.dataset.subType = '' + commonProject.subType;
    };
    GardenNation.prototype.notif_revealSecretMission = function (notif) {
        this.getPlayerTable(notif.args.playerId).setSecretMissions([notif.args.secretMission], true);
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
                if (args.brambleIcon && args.brambleIcon[0] != '<') {
                    args.brambleIcon = "<div class=\"bramble-type-token\" data-type=\"".concat(args.brambleIcon, "\"></div>");
                }
                for (var property in args) {
                    if (['cardName', 'territoryNumber', 'points', 'cost', 'inhabitants'].includes(property) && args[property][0] != '<') {
                        args[property] = "<strong>".concat(_(args[property]), "</strong>");
                    }
                }
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
