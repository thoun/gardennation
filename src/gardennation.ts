declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
//declare const g_gamethemeurl;

declare const board: HTMLDivElement;

const ANIMATION_MS = 500;
const SCORE_MS = 1500;

const TITLE_COLOR = ['#6b7123', '#ba782e', '#ab3b2b'];

const ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
const ZOOM_LEVELS_MARGIN = [-300, -166, -100, -60, -33, -14, 0];
const LOCAL_STORAGE_ZOOM_KEY = 'GardenNation-zoom';

const isDebug = window.location.host == 'studio.boardgamearena.com';
const log = isDebug ? console.log.bind(window.console) : function () { };

class GardenNation implements GardenNationGame {
    public zoom: number = 1;
    public commonProjectCards: CommonProjectCards;
    public secretMissionCards: SecretMissionCards;

    private gamedatas: GardenNationGamedatas;
    
    private board: Board;
    private playersTables: PlayerTable[] = [];
    private inhabitantCounters: Counter[] = [];
    private buildingFloorCounters: Counter[] = [];
    private ployTokenCounters: Counter[] = [];
    
    private TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;

    constructor() {    
        const zoomStr = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
        if (zoomStr) {
            this.zoom = Number(zoomStr);
            document.getElementById('zoom-out').classList.toggle('disabled', this.zoom === ZOOM_LEVELS[0]);
            document.getElementById('zoom-in').classList.toggle('disabled', this.zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]);
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

        this.commonProjectCards = new CommonProjectCards(this);
        this.secretMissionCards = new SecretMissionCards(this);
        this.createPlayerPanels(gamedatas);
        const players = Object.values(gamedatas.players);
        this.board = new Board(this, players, gamedatas);
        this.createPlayerTables(gamedatas);

        [0, 1, 2, 3, 4].forEach(number => {
            dojo.place(`
            <div id="common-project-wrapper-${number}" class="common-project-wrapper" data-number="${number}">
            </div>
            `, 'common-projects');
        });        
        this.commonProjectCards.createMoveOrUpdateCard({} as any, `common-project-wrapper-0`);
        gamedatas.commonProjects.forEach(commonProject => this.commonProjectCards.createMoveOrUpdateCard(commonProject, `common-project-wrapper-${commonProject.locationArg}`));

        gamedatas.remainingRoofs.forEach(roof => dojo.place(`<div id="building-floor-${roof.id}" class="building-floor" data-color="0"></div>`, `remaining-roofs`));

        if (gamedatas.endTurn) {
            this.notif_lastTurn();
        }

        if (Number(gamedatas.gamestate.id) >= 80) { // score or end
            this.onEnteringShowScore(true);
        }

        this.addHelp();
        this.setupNotifications();

        this.setupPreferences();

        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        if (this.zoom !== 1) {
            this.setZoom(this.zoom);
        }
        (this as any).onScreenWidthChange = () => {
            this.setAutoZoom();
        }

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
                Array.from(document.querySelectorAll(`.building.highlight`)).forEach(elem => elem.classList.remove('highlight'));
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

    private onEnteringSelectAreaPositionWithCost(args: EnteringSelectAreaPositionWithCostArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.board.activatePossibleAreasWithCost(args.possiblePositions);
        }
    }

    private onEnteringSelectAreaPosition(args: EnteringSelectAreaPositionArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.board.activatePossibleAreas(args.possiblePositions, args.selectedPosition);
        }
    }

    private onEnteringChooseTypeOfLand(args: EnteringSelectAreaPositionArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.board.activatePossibleAreas([], args.selectedPosition);
        }
    }

    private onEnteringChooseCompletedCommonProject(args: EnteringChooseCompletedCommonProjectArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.board.activatePossibleAreas([], args.selectedPosition);

            args.completedCommonProjects.forEach(commonProject => document.getElementById(`common-project-${commonProject.id}`).classList.add('selectable'));
        }
    }

    onEnteringShowScore(fromReload: boolean = false) {
        const lastTurnBar = document.getElementById('last-round');
        if (lastTurnBar) {
            lastTurnBar.style.display = 'none';
        }
    }

    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

        switch (stateName) {
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
        }
    }

    private onLeavingSelectAreaPosition() {
        document.querySelectorAll('.cost-tag').forEach(elem => elem.parentElement.removeChild(elem));
        this.board.activatePossibleAreas([], null);
    }

    private onLeavingChooseCompletedCommonProject() {
        if ((this as any).isCurrentPlayerActive()) {
            this.board.activatePossibleAreas([], null);

            document.querySelectorAll('.common-project.selectable').forEach(elem => elem.classList.remove('selectable'));
        }
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        if ((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseAction':
                    const chooseActionArgs = args as EnteringChooseActionArgs;   
                    (this as any).addActionButton(`chooseConstructBuilding-button`, _("Construct building"), () => this.chooseConstructBuilding());
                    (this as any).addActionButton(`chooseAbandonBuilding-button`, _("Abandon building"), () => this.chooseAbandonBuilding());
                    if (chooseActionArgs.canChangeTerritory) {
                        (this as any).addActionButton(`changeTerritory-button`, _("Go to territory ${number}").replace('${number}', chooseActionArgs.canChangeTerritory), () => this.changeTerritory(chooseActionArgs.canChangeTerritory), null, null, 'red');
                    }
                    (this as any).addActionButton(`chooseUsePloyToken-button`, _("Use ploy token"), () => this.chooseUsePloyToken(), null, null, 'red');
                    document.getElementById(`chooseConstructBuilding-button`).classList.toggle('disabled', !chooseActionArgs.canConstructBuilding);
                    document.getElementById(`chooseAbandonBuilding-button`).classList.toggle('disabled', !chooseActionArgs.canAbandonBuilding);
                    document.getElementById(`chooseUsePloyToken-button`).classList.toggle('disabled', !chooseActionArgs.canUsePloy);
                    if (chooseActionArgs.canSkipTurn) {
                        (this as any).addActionButton(`skipTurn-button`, _("Skip turn"), () => this.skipTurn(), null, null, 'red');
                    }
                    break;
                case 'constructBuilding':
                    (this as any).addActionButton(`cancelConstructBuilding-button`, _("Cancel"), () => this.cancelConstructBuilding(), null, null, 'gray');
                    break;
                case 'abandonBuilding':
                    (this as any).addActionButton(`cancelAbandonBuilding-button`, _("Cancel"), () => this.cancelAbandonBuilding(), null, null, 'gray');
                    break;
                case 'chooseTypeOfLand':
                    const chooseTypeOfLandArgs = args as EnteringChooseTypeOfLandArgs;
                    chooseTypeOfLandArgs.possibleTypes.forEach(type => {
                        (this as any).addActionButton(`chooseTypeOfLand${type}-button`, '', () => this.chooseTypeOfLand(type));
                        document.getElementById(`chooseTypeOfLand${type}-button`).innerHTML = 
                            `<div class="button-bramble-type" data-type="${type}"><div class="land-number">5</div></div>`;
                    });
                    (this as any).addActionButton(`cancelChooseTypeOfLand-button`, _("Cancel"), () => this.cancelChooseTypeOfLand(), null, null, 'gray');
                    break;
                case 'chooseNextPlayer':
                    const chooseNextPlayerArgs = args as EnteringChooseNextPlayerArgs;
                    if (chooseNextPlayerArgs.possibleNextPlayers.length > 1) {          
                        chooseNextPlayerArgs.possibleNextPlayers.forEach(playerId => {
                            const player = this.getPlayer(playerId);
                            (this as any).addActionButton(`choosePlayer${playerId}-button`, player.name, () => this.chooseNextPlayer(playerId));
                            document.getElementById(`choosePlayer${playerId}-button`).style.border = `3px solid #${player.color}`;
                        });
                    }
                    break;
                case 'usePloyToken':
                    const usePloyTokenArgs = args as EnteringUsePloyTokenArgs;
                    (this as any).addActionButton(`strategicMovement-button`, _("Strategic Movement"), () => this.usePloyToken(1));
                    (this as any).addActionButton(`roofTransfer-button`, _("Roof Transfer"), () => this.usePloyToken(2));
                    (this as any).addActionButton(`buildingInvasion-button`, _("Building Invasion"), () => this.usePloyToken(3));
                    (this as any).addActionButton(`cancelUsePloyToken-button`, _("Cancel"), () => this.cancelUsePloyToken(), null, null, 'gray');
                    document.getElementById(`roofTransfer-button`).classList.toggle('disabled', !usePloyTokenArgs.canTransferRoof);
                    document.getElementById(`buildingInvasion-button`).classList.toggle('disabled', !usePloyTokenArgs.canInvade);
                    break;
                case 'strategicMovement':
                    const strategicMovementArgs = args as EnteringStrategicMovementArgs;
                    (this as any).addActionButton(`strategicMovementDown-button`, _("Move to territory ${number}").replace('${number}', strategicMovementArgs.down), () => this.strategicMovement(strategicMovementArgs.down));
                    (this as any).addActionButton(`strategicMovementUp-button`, _("Move to territory ${number}").replace('${number}', strategicMovementArgs.up), () => this.strategicMovement(strategicMovementArgs.up));
                    (this as any).addActionButton(`cancelUsePloy-button`, _("Cancel"), () => this.cancelUsePloy(), null, null, 'gray');
                    break;
                case 'chooseRoofToTransfer':
                case 'chooseRoofDestination':
                case 'buildingInvasion':
                    (this as any).addActionButton(`cancelUsePloy-button`, _("Cancel"), () => this.cancelUsePloy(), null, null, 'gray');
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

        document.getElementById('zoom-wrapper').style.height = `${div.getBoundingClientRect().height}px`;

        const fullBoardWrapperDiv = document.getElementById('full-board-wrapper');
        fullBoardWrapperDiv.style.display = fullBoardWrapperDiv.clientWidth < 1181*zoom ? 'block' : 'flex';
    }

    public tableHeightChange() {
        setTimeout(() => {
            const div = document.getElementById('full-table');
            document.getElementById('zoom-wrapper').style.height = `${div.getBoundingClientRect().height}px`;
        }, 500);
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
        while (newZoom > ZOOM_LEVELS[0] && zoomWrapperWidth/newZoom < 1181 /* board width */) {
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

    public setTooltip(id: string, html: string) {
        (this as any).addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    }

    public getPlayerId(): number {
        return Number((this as any).player_id);
    }

    public getPlayerColor(playerId: number): string {
        return this.gamedatas.players[playerId].color;
    }

    public getPlayerScore(playerId: number): number {
        return (this as any).scoreCtrl[playerId]?.getValue() ?? Number(this.gamedatas.players[playerId].score);
    }

    private getPlayer(playerId: number): GardenNationPlayer {
        return Object.values(this.gamedatas.players).find(player => Number(player.id) == playerId);
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
                <div id="inhabitant-counter-wrapper-${player.id}" class="counter">
                    <div class="icon inhabitant" data-color="${player.color}"></div> 
                    <span id="inhabitant-counter-${player.id}"></span>
                </div>
                <div id="building-floor-counter-wrapper-${player.id}" class="counter">
                    <div class="icon building-floor-counter" data-color="${player.color}"></div> 
                    <span id="building-floor-counter-${player.id}"></span>
                </div>
                <div id="ploy-token-counter-wrapper-${player.id}" class="counter">
                    <div class="icon ploy-token" data-color="${player.color}"></div> 
                    <span id="ploy-token-counter-${player.id}"></span>
                </div>
            </div>
            `, `player_board_${player.id}`);

            const inhabitantCounter = new ebg.counter();
            inhabitantCounter.create(`inhabitant-counter-${playerId}`);
            inhabitantCounter.setValue(player.inhabitants);
            this.inhabitantCounters[playerId] = inhabitantCounter;

            const buildingFloorCounter = new ebg.counter();
            buildingFloorCounter.create(`building-floor-counter-${playerId}`);
            buildingFloorCounter.setValue(player.buildingFloors.length);
            this.buildingFloorCounters[playerId] = buildingFloorCounter;

            const ployTokenCounter = new ebg.counter();
            ployTokenCounter.create(`ploy-token-counter-${playerId}`);
            ployTokenCounter.setValue(4 - player.usedPloy.reduce((a, b) => a + b, 0));
            this.ployTokenCounters[playerId] = ployTokenCounter;
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

    public onAreaClick(areaPosition: number): void {
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
    }
    
    public onCommonProjectClick(card: CommonProject): void {
        switch (this.gamedatas.gamestate.name) {
            case 'chooseCompletedCommonProject':
                const args = this.gamedatas.gamestate.args as EnteringChooseCompletedCommonProjectArgs;
                if (args.completedCommonProjects.some(cp => cp.id === card.id)) {
                    this.chooseCompletedCommonProject(card.id);
                }
                break;
        }
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

    public constructBuilding(areaPosition: number) {
        if(!(this as any).checkAction('constructBuilding')) {
            return;
        }

        this.takeAction('constructBuilding', {
            areaPosition
        });
    }

    public cancelConstructBuilding() {
        if (!(this as any).checkAction('cancelConstructBuilding')) {
            return;
        }

        this.takeAction('cancelConstructBuilding');
    }

    public abandonBuilding(areaPosition: number) {
        if(!(this as any).checkAction('abandonBuilding')) {
            return;
        }

        this.takeAction('abandonBuilding', {
            areaPosition
        });
    }

    public cancelAbandonBuilding() {
        if (!(this as any).checkAction('cancelAbandonBuilding')) {
            return;
        }

        this.takeAction('cancelAbandonBuilding');
    }

    public chooseTypeOfLand(typeOfLand: number) {
        if(!(this as any).checkAction('chooseTypeOfLand')) {
            return;
        }

        this.takeAction('chooseTypeOfLand', {
            typeOfLand
        });
    }

    public cancelChooseTypeOfLand() {
        if (!(this as any).checkAction('cancelChooseTypeOfLand')) {
            return;
        }

        this.takeAction('cancelChooseTypeOfLand');
    }

    public changeTerritory(territoryNumber: number) {
        if(!(this as any).checkAction('changeTerritory')) {
            return;
        }

        this.takeAction('changeTerritory', {
            territoryNumber
        });
    }

    public skipTurn() {
        if (!(this as any).checkAction('skipTurn')) {
            return;
        }

        this.takeAction('skipTurn');
    }

    public chooseNextPlayer(playerId: number) {
        if(!(this as any).checkAction('chooseNextPlayer')) {
            return;
        }

        this.takeAction('chooseNextPlayer', {
            playerId
        });
    }

    public usePloyToken(type: number) {
        if(!(this as any).checkAction('usePloyToken')) {
            return;
        }

        this.takeAction('usePloyToken', {
            type
        });
    }

    public cancelUsePloyToken() {
        if(!(this as any).checkAction('cancelUsePloyToken')) {
            return;
        }

        this.takeAction('cancelUsePloyToken');
    }

    public strategicMovement(territory: number) {
        if(!(this as any).checkAction('strategicMovement')) {
            return;
        }

        this.takeAction('strategicMovement', {
            territory
        });
    }

    public cancelUsePloy() {
        if(!(this as any).checkAction('cancelUsePloy')) {
            return;
        }

        this.takeAction('cancelUsePloy');
    }

    public chooseRoofToTransfer(areaPosition: number) {
        if(!(this as any).checkAction('chooseRoofToTransfer')) {
            return;
        }

        this.takeAction('chooseRoofToTransfer', {
            areaPosition
        });
    }

    public chooseRoofDestination(areaPosition: number) {
        if(!(this as any).checkAction('chooseRoofDestination')) {
            return;
        }

        this.takeAction('chooseRoofDestination', {
            areaPosition
        });
    }

    public buildingInvasion(areaPosition: number) {
        if(!(this as any).checkAction('buildingInvasion')) {
            return;
        }

        this.takeAction('buildingInvasion', {
            areaPosition
        });
    }

    public chooseCompletedCommonProject(id: number) {
        if(!(this as any).checkAction('chooseCompletedCommonProject')) {
            return;
        }

        this.takeAction('chooseCompletedCommonProject', {
            id
        });
    }
    
    public takeAction(action: string, data?: any) {
        data = data || {};
        data.lock = true;
        (this as any).ajaxcall(`/gardennation/gardennation/${action}.html`, data, this, () => {});
    }
    
    private setPoints(playerId: number, points: number) {
        (this as any).scoreCtrl[playerId]?.toValue(points);
        this.board.setPoints(playerId, points);
    }
    
    private setInhabitants(playerId: number, inhabitants: number) {
        this.inhabitantCounters[playerId]?.toValue(inhabitants);
        this.getPlayerTable(playerId)?.setInhabitants(inhabitants);
    }

    private addHelp() {
        dojo.place(`<button id="gardennation-help-button">?</button>`, 'left-side');
        dojo.connect( $('gardennation-help-button'), 'onclick', this, () => this.showHelp());
    }

    private getHelpTripleTitleHtml(titles: string[]) {
        return titles.map((title, index) => `<span style="color: ${TITLE_COLOR[index]};">${title}</span>`).join(' | ');
    }

    private showHelp() {
        const helpDialog = new ebg.popindialog();
        helpDialog.create('gardennationHelpDialog');
        helpDialog.setTitle(_("Objectives in detail").toUpperCase());
        
        let html = `<div id="help-popin">
            <h1>${_("Common projects")}</h1>
            <div id="help-common-projects" class="help-section">
                <h2>${this.getHelpTripleTitleHtml([2, 1, 3].map(subType => this.commonProjectCards.getTitle(1, subType)))}</h2>
                <table>
                    <tr>
                        <td id="help-common-projects-1">
                            <div id="help-common-projects-1-row-a"></div>
                            <div id="help-common-projects-1-row-b"></div>
                        </td>
                    </tr>
                    <tr>
                        <td>${this.commonProjectCards.getTooltipDescription(1)}</td>
                    </tr>
                </table>`;                    

        [2, 3, 4, 5, 6].forEach(type => 
            html += `
                <h2>${this.getHelpTripleTitleHtml([2, 1, 3].map(subType => this.commonProjectCards.getTitle(type, subType)))}</h2>
                <table>
                    <tr>
                        <td id="help-common-projects-${type}"></td>
                    </tr>
                    <tr>
                        <td>${this.commonProjectCards.getTooltipDescription(type)}</td>
                    </tr>
                </table>`
        );

        html += `
        <h1>${_("Secret missions")}</h1>
        <div id="help-secret-missions" class="help-section">`;            

        [2, 1].forEach(type => 
            html += `
                <h2>${this.getHelpTripleTitleHtml([2, 1, 3].map(subType => this.secretMissionCards.getTitle(type, subType)))}</h2>
                <table>
                    <tr>
                        <td id="help-secret-missions-${type}"></td>
                    </tr>
                    <tr>
                        <td>${this.secretMissionCards.getTooltipDescription(type, 0)}</td>
                    </tr>
                </table>`
        );   
        [[3, 1], [3, 2], [4, 1]].forEach(typeAndSubType => 
            html += `
                <h2>${this.secretMissionCards.getTitle(typeAndSubType[0], typeAndSubType[1])}</h2>
                <table>
                    <tr>
                        <td id="help-secret-missions-${typeAndSubType[0]}-${typeAndSubType[1]}"></td>
                        <td>${this.secretMissionCards.getTooltipDescription(typeAndSubType[0], typeAndSubType[1])}</td>
                    </tr>
                </table>`
        );

        html += `     
            </div>
        </div>`;
        
        // Show the dialog
        helpDialog.setContent(html);

        helpDialog.show();
        
        ['a', 'b'].forEach((line, lineIndex) => 
            [2, 1, 3].forEach(subType => this.commonProjectCards.createMoveOrUpdateCard({id: 1000 + 1 * 10 + subType + lineIndex * 3, type: 1, subType: subType * 2 + lineIndex - 1} as any, `help-common-projects-1-row-${line}`))
         );
        [2, 3, 4, 5, 6].forEach(type => 
           [2, 1, 3].forEach(subType => this.commonProjectCards.createMoveOrUpdateCard({id: 1000 + type * 10 + subType, type, subType } as any, `help-common-projects-${type}`))
        );
        
        [1, 2].forEach(type => 
            [2, 1, 3].forEach(subType => this.secretMissionCards.createMoveOrUpdateCard({id: 1000 + type * 10 + subType, type, subType } as any, `help-secret-missions-${type}`))
         );
        [[3, 1], [3, 2], [4, 1]].forEach(typeAndSubType => 
            this.secretMissionCards.createMoveOrUpdateCard({id: 1000 + typeAndSubType[0] * 10 + typeAndSubType[1], type: typeAndSubType[0], subType: typeAndSubType[1] } as any, `help-secret-missions-${typeAndSubType[0]}-${typeAndSubType[1]}`)
        );
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

        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });
    }

    notif_score(notif: Notif<NotifScoreArgs>) {
        this.setPoints(notif.args.playerId, notif.args.newScore);
    }

    notif_inhabitant(notif: Notif<NotifInhabitantsArgs>) {
        this.setInhabitants(notif.args.playerId, notif.args.newInhabitants);
    }

    notif_moveTorticrane(notif: Notif<NotifMoveTorticraneArgs>) {
        slideToObjectAndAttach(this, document.getElementById('torticrane'), `torticrane-spot-${notif.args.torticranePosition}`);
    }

    notif_setPlayerOrder(notif: Notif<NotifSetPlayerOrderArgs>) {
        slideToObjectAndAttach(this, document.getElementById(`order-token-${notif.args.playerId}`), `order-track-${notif.args.order}`);
    }

    notif_setBrambleType(notif: Notif<NotifSetBrambleTypeArgs>) {
        this.board.setBrambleType(notif.args.areaPosition, notif.args.type, notif.args.brambleId);
    }

    notif_setBuilding(notif: Notif<NotifSetBuildingArgs>) {
        this.board.setBuilding(notif.args.areaPosition, notif.args.building);
    }

    notif_territoryControl(notif: Notif<NotifTerritoryControlArgs>) {
        this.board.highlightBuilding(notif.args.buildingsToHighlight);
    }

    notif_ployTokenUsed(notif: Notif<NotifPloyTokenUsedArgs>) {
        this.ployTokenCounters[notif.args.playerId]?.incValue(-1);
        this.getPlayerTable(notif.args.playerId)?.setPloyTokenUsed(notif.args.type);
    }

    notif_takeCommonProject(notif: Notif<NotifTakeCommonProjectArgs>) {
        this.getPlayerTable(notif.args.playerId).setCommonProjects([notif.args.commonProject]);
    }

    notif_newCommonProject(notif: Notif<NotifTakeCommonProjectArgs>) {
        // we first create a backflipped card
        this.commonProjectCards.createMoveOrUpdateCard({
            id: notif.args.commonProject.id
        } as any, `common-project-wrapper-0`);
        // then we reveal it
        this.commonProjectCards.createMoveOrUpdateCard(notif.args.commonProject, `common-project-wrapper-${notif.args.commonProject.locationArg}`);
    }

    notif_revealSecretMission(notif: Notif<NotifRevealSecretMissionArgs>) {
        this.getPlayerTable(notif.args.playerId).setSecretMissions([notif.args.secretMission]);
    }

    notif_lastTurn() {
        dojo.place(`<div id="last-round">
            ${_("This is the last round of the game!")}
        </div>`, 'page-title');
    }

    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                if (args.playersNames && (typeof args.playersNames != 'string' || args.playersNames[0] != '<')) {
                    const namesColored = args.playersNames.map(playerName => {
                        const color = Object.values(this.gamedatas.players).find(player => player.name == playerName)?.color;
                        return `<strong ${color ? `style="color: #${color};"` : ''}>${playerName}</strong>`;
                    });
                    let namesConcat = '';
                    namesColored.forEach((name, index) => {
                        namesConcat += name;
                        if (index < namesColored.length - 2) {
                            namesConcat += ', ';
                        } else if (index < namesColored.length - 1) {
                            namesConcat += _(' and ');
                        }
                    });
                    args.playersNames = namesConcat;
                }

                if (args.cardName && args.cardName[0] != '<') {
                    args.cardName = `<strong>${_(args.cardName)}</strong>`;
                }
                /*
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