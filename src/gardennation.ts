declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
//declare const g_gamethemeurl;

declare const board: HTMLDivElement;

const ANIMATION_MS = 500;
const SCORE_MS = 1500;

const ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5];
const ZOOM_LEVELS_MARGIN = [-300, -166, -100, -60, -33, -14, 0, 20, 33.34];
const LOCAL_STORAGE_ZOOM_KEY = 'GardenNation-zoom';

const isDebug = window.location.host == 'studio.boardgamearena.com';
const log = isDebug ? console.log.bind(window.console) : function () { };

class GardenNation implements GardenNationGame {
    private gamedatas: GardenNationGamedatas;
    
    private board: Board;
    private playersTables: PlayerTable[] = [];

    public zoom: number = 1;

    constructor() {    
        const zoomStr = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
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

    public setup(gamedatas: GardenNationGamedatas) {
        log( "Starting game setup" );
        
        this.gamedatas = gamedatas;

        log('gamedatas', gamedatas);

        this.createPlayerPanels(gamedatas);
        const players = Object.values(gamedatas.players);
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

        log( "Ending game setup" );
    }

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    public onEnteringState(stateName: string, args: any) {
        log( 'Entering state: '+stateName , args.args );

        switch (stateName) {
            case 'chooseAction':
                this.onEnteringChooseAction(args.args);
                break;

            case 'endScore':
                this.onEnteringShowScore();
                break;
            case 'gameEnd':
                const lastTurnBar = document.getElementById('last-round');
                if (lastTurnBar) {
                    lastTurnBar.style.display = 'none';
                }
                break;
        }
    }

    private onEnteringChooseAction(args/*: EnteringChooseAdventurerArgs*/) {
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
    }

    onEnteringShowScore(fromReload: boolean = false) {
        const lastTurnBar = document.getElementById('last-round');
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
    }

    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

        switch (stateName) {
            case 'chooseAction':
                this.onLeavingChooseAction();
                break;
        }
    }

    private onLeavingChooseAction() {
        //this.adventurersStock.setSelectionMode(0);
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        if ((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseAction':
                    (this as any).addActionButton(`chooseConstructBuilding-button`, _("Construct building"), () => this.chooseConstructBuilding());
                    (this as any).addActionButton(`chooseAbandonBuilding-button`, _("Abandon building"), () => this.chooseAbandonBuilding());
                    (this as any).addActionButton(`chooseUsePloyToken-button`, _("Use ploy token"), () => this.chooseUsePloyToken(), null, null, 'red');
                    break;
            }
        }
    }  

    ///////////////////////////////////////////////////
    //// Utility methods


    ///////////////////////////////////////////////////

    private setZoom(zoom: number = 1) {
        this.zoom = zoom;
        localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, ''+this.zoom);
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom);
        dojo.toggleClass('zoom-in', 'disabled', newIndex === ZOOM_LEVELS.length - 1);
        dojo.toggleClass('zoom-out', 'disabled', newIndex === 0);

        const div = document.getElementById('full-table');
        div.style.transform = zoom === 1 ? '' : `scale(${zoom})`;
        div.style.marginRight = `${ZOOM_LEVELS_MARGIN[newIndex]}%`;
        this.tableHeightChange();
        document.getElementById('board').classList.toggle('hd', this.zoom > 1);

        const stocks = this.playersTables.map(pt => pt.companionsStock);
        /*if (this.adventurersStock) {
            stocks.push(this.adventurersStock);
        }*/
        stocks.forEach(stock => stock.updateDisplay());

        document.getElementById('zoom-wrapper').style.height = `${div.getBoundingClientRect().height}px`;

        const fullBoardWrapperDiv = document.getElementById('full-board-wrapper');
        fullBoardWrapperDiv.style.display = fullBoardWrapperDiv.clientWidth < 916*zoom ? 'block' : 'flex';
    }

    public zoomIn() {
        if (this.zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]) {
            return;
        }
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom) + 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    }

    public zoomOut() {
        if (this.zoom === ZOOM_LEVELS[0]) {
            return;
        }
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom) - 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    }

    public setAutoZoom() {
        
        const zoomWrapperWidth = document.getElementById('zoom-wrapper').clientWidth;

        if (!zoomWrapperWidth) {
            setTimeout(() => this.setAutoZoom(), 200);
            return;
        }

        let newZoom = this.zoom;
        while (newZoom > ZOOM_LEVELS[0] && zoomWrapperWidth/newZoom < 916 /* board width */) {
            newZoom = ZOOM_LEVELS[ZOOM_LEVELS.indexOf(newZoom) - 1];
        }
        this.setZoom(newZoom);
    }

    private setupPreferences() {
        // Extract the ID and value from the UI control
        const onchange = (e) => {
          var match = e.target.id.match(/^preference_control_(\d+)$/);
          if (!match) {
            return;
          }
          var prefId = +match[1];
          var prefValue = +e.target.value;
          (this as any).prefs[prefId].value = prefValue;
          this.onPreferenceChange(prefId, prefValue);
        }
        
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        
        // Call onPreferenceChange() now
        dojo.forEach(
          dojo.query("#ingame_menu_content .preference_control"),
          el => onchange({ target: el })
        );
    }
      
    private onPreferenceChange(prefId: number, prefValue: number) {
        switch (prefId) {
            // KEEP
            /*case 202: 
                document.getElementById('full-table').dataset.highContrastPoints = '' + prefValue;
                break;*/
        }
    }

    public getPlayerId(): number {
        return Number((this as any).player_id);
    }

    public getPlayerScore(playerId: number): number {
        return (this as any).scoreCtrl[playerId]?.getValue() ?? Number(this.gamedatas.players[playerId].score);
    }

    private getPlayerTable(playerId: number): PlayerTable {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }

    private createPlayerPanels(gamedatas: GardenNationGamedatas) {

        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);     

            // counters
            dojo.place(`
            <div class="counters">
                <div id="reroll-counter-wrapper-${player.id}" class="reroll-counter">
                    <div class="icon reroll"></div> 
                    <span id="reroll-counter-${player.id}"></span>
                </div>
                <div id="footprint-counter-wrapper-${player.id}" class="footprint-counter">
                    <div class="icon footprint"></div> 
                    <span id="footprint-counter-${player.id}"></span>
                </div>
                <div id="firefly-counter-wrapper-${player.id}" class="firefly-counter">
                </div>
            </div>
            `, `player_board_${player.id}`);

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
    }

    private createPlayerTables(gamedatas: GardenNationGamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) === Number((this as any).player_id));
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;

        orderedPlayers.forEach(player => this.createPlayerTable(gamedatas, Number(player.id)) );
    }

    private createPlayerTable(gamedatas: GardenNationGamedatas, playerId: number) {
        const playerTable = new PlayerTable(this, gamedatas.players[playerId]);
        this.playersTables.push(playerTable);
    }

    public chooseConstructBuilding() {
        if (!(this as any).checkAction('chooseConstructBuilding')) {
            return;
        }

        this.takeAction('chooseConstructBuilding');
    }

    public chooseAbandonBuilding() {
        if (!(this as any).checkAction('chooseAbandonBuilding')) {
            return;
        }

        this.takeAction('chooseAbandonBuilding');
    }

    public chooseUsePloyToken() {
        if (!(this as any).checkAction('chooseUsePloyToken')) {
            return;
        }

        this.takeAction('chooseUsePloyToken');
    }

    /*public chooseConstructBuilding(id: number) {
        if(!(this as any).checkAction('chooseConstructBuilding')) {
            return;
        }

        this.takeAction('chooseConstructBuilding', {
            id
        });
    }*/

    public takeAction(action: string, data?: any) {
        data = data || {};
        data.lock = true;
        (this as any).ajaxcall(`/gardennation/gardennation/${action}.html`, data, this, () => {});
    }
    
    private setPoints(playerId: number, points: number) {
        (this as any).scoreCtrl[playerId]?.toValue(points);
        this.board.setPoints(playerId, points);
    }

    private addHelp() {
        dojo.place(`<button id="gardennation-help-button">?</button>`, 'left-side');
        dojo.connect( $('gardennation-help-button'), 'onclick', this, () => this.showHelp());
    }

    private showHelp() {
        if (!this.helpDialog) {
            this.helpDialog = new ebg.popindialog();
            this.helpDialog.create( 'gardennationHelpDialog' );
            this.helpDialog.setTitle( _("Cards help") );
            
            var html = `<div id="help-popin">
                <h1>${_("Specific companions")}</h1>
                <div id="help-companions" class="help-section">
                    <h2>${_('The Sketals')}</h2>
                    <table><tr>
                    <td><div id="companion44" class="companion"></div></td>
                        <td>${getCompanionTooltip(44)}</td>
                    </tr></table>
                    <h2>Xar’gok</h2>
                    <table><tr>
                        <td><div id="companion10" class="companion"></div></td>
                        <td>${getCompanionTooltip(10)}</td>
                    </tr></table>
                    <h2>${_('Kaar and the curse of the black die')}</h2>
                    <table><tr>
                        <td><div id="companion20" class="companion"></div></td>
                        <td>${getCompanionTooltip(20)}</td>
                    </tr></table>
                    <h2>Cromaug</h2>
                    <table><tr>
                        <td><div id="companion41" class="companion"></div></td>
                        <td>${getCompanionTooltip(41)}</td>
                    </tr></table>
                </div>
            </div>`;
            
            // Show the dialog
            this.helpDialog.setContent(html);
        }

        this.helpDialog.show();
    }

    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your gardennation.game.php file.

    */
    setupNotifications() {
        //log( 'notifications subscriptions setup' );

        const notifs = [
            /*['chosenAdventurer', ANIMATION_MS],
            ['scoreBeforeEnd', SCORE_MS],
            ['scoreCards', SCORE_MS],
            ['scoreBoard', SCORE_MS],
            ['scoreFireflies', SCORE_MS],
            ['scoreFootprints', SCORE_MS],
            ['scoreAfterEnd', SCORE_MS],*/
        ];

        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });
    }

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
    public format_string_recursive(log: string, args: any) {
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
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}