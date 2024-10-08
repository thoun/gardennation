declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
//declare const g_gamethemeurl;

declare const board: HTMLDivElement;

const ANIMATION_MS = 500;

const TITLE_COLOR = ['#6b7123', '#ba782e', '#ab3b2b'];

const ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
const LOCAL_STORAGE_ZOOM_KEY = 'GardenNation-zoom';

const isDebug = window.location.host == 'studio.boardgamearena.com';
const log = isDebug ? console.log.bind(window.console) : function () { };

class GardenNation implements GardenNationGame {
    private zoomManager: ZoomManager;
    public commonProjectCards: CommonProjectCards;
    public secretMissionCards: SecretMissionCards;

    private gamedatas: GardenNationGamedatas;
    
    private board: Board;
    private playersTables: PlayerTable[] = [];
    private inhabitantCounters: Counter[] = [];
    private buildingFloorCounters: Counter[] = [];
    private ployTokenCounters: Counter[] = [];

    private selectedSecretMissionsIds: number[] = [];
    
    private TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;

    constructor() { }
    
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
        this.createSecondBoard(gamedatas);
        this.createObjectiveReminder(gamedatas);

        if (gamedatas.endTurn) {
            this.notif_lastTurn();
        }

        const stateId = Number(gamedatas.gamestate.id);
        if (stateId >= 20) {
            const selectorDiv = document.getElementById(`secret-missions-selector`);
            selectorDiv?.parentElement?.removeChild(selectorDiv);
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
            onDimensionsChange: (zoom) => {
                //this.setAutoZoom();
                //this.tableHeightChange();

                const fullBoardWrapperDiv = document.getElementById('full-board-wrapper');
                const clientWidth = fullBoardWrapperDiv.clientWidth;
                fullBoardWrapperDiv.style.display = clientWidth < 1181*zoom ? 'block' : 'flex';

                // set second board placement
                document.getElementById('full-board').classList.toggle('common-projects-side-board', clientWidth > 1464);

            },
        });

        this.addHelp();
        this.setupNotifications();

        this.setupPreferences();

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
                Array.from(document.querySelectorAll(`.building.highlight`)).forEach(elem => elem.classList.remove('highlight'));
                document.getElementById('board').dataset.shadowOnTorticraneTerritory = 'false';
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

    private onEnteringChooseSecretMissions(args: EnteringChooseSecretMissionsArgs) {
        this.selectedSecretMissionsIds = [];
        args._private?.secretMissions?.forEach(secretMission => {
            this.secretMissionCards.createMoveOrUpdateCard(secretMission, `secret-missions-selector`, true);
            if (secretMission.location === 'chosen') {
                this.selectedSecretMissionsIds.push(secretMission.id);
                document.getElementById(`secret-mission-${secretMission.id}`).classList.add('selected');
            }
        });
        this.checkConfirmSecretMissionsButtonState();
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

            args.completedCommonProjects.forEach(commonProject => {
                document.getElementById(`common-project-${commonProject.id}`).classList.add('selectable');
                document.querySelector(`.common-project-reminder[data-id="${commonProject.id}"]`).classList.add('selectable');
            });
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
            case 'endSecretMissions':
                dojo.destroy(`secret-missions-selector`);
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
    }

    private onLeavingSelectAreaPosition() {
        document.querySelectorAll('.cost-tag').forEach(elem => elem.parentElement.removeChild(elem));
        this.board.activatePossibleAreas([], null);
    }

    private onLeavingChooseCompletedCommonProject() {
        if ((this as any).isCurrentPlayerActive()) {
            this.board.activatePossibleAreas([], null);

            document.querySelectorAll('.common-project.selectable, .common-project-reminder.selectable').forEach(elem => elem.classList.remove('selectable'));
        }
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        if (stateName === 'chooseSecretMissions') {
            if ((this as any).isCurrentPlayerActive()) {
                (this as any).addActionButton(`chooseSecretMissions-button`, _("Confirm selection"), () => this.chooseSecretMissions(this.selectedSecretMissionsIds));
                this.checkConfirmSecretMissionsButtonState();
            } else if (Object.keys(this.gamedatas.players).includes(''+this.getPlayerId())) { // ignore spectators
                (this as any).addActionButton(`cancelChooseSecretMissions-button`, _("I changed my mind"), () => this.cancelChooseSecretMissions(), null, null, 'gray');
            }
        }

        if ((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseAction':
                    const chooseActionArgs = args as EnteringChooseActionArgs;   
                    (this as any).addActionButton(`chooseConstructBuilding-button`, _("Construct building"), () => this.chooseConstructBuilding());
                    (this as any).addActionButton(`chooseAbandonBuilding-button`, _("Abandon building"), () => this.chooseAbandonBuilding());
                    if (chooseActionArgs.canChangeTerritory) {
                        (this as any).addActionButton(`changeTerritory-button`, _("Move to territory ${number}").replace('${number}', chooseActionArgs.canChangeTerritory), () => this.changeTerritory(chooseActionArgs.canChangeTerritory), null, null, 'red');
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
                case 'chooseCompletedCommonProject':
                    (this as any).addActionButton(`skipCompletedCommonProject-button`, _("Skip"), () => this.skipCompletedCommonProject(), null, null, 'red');
                    break;
                case 'abandonBuilding':
                    (this as any).addActionButton(`cancelAbandonBuilding-button`, _("Cancel"), () => this.cancelAbandonBuilding(), null, null, 'gray');
                    break;
                case 'chooseTypeOfLand':
                    const chooseTypeOfLandArgs = args as EnteringChooseTypeOfLandArgs;
                    chooseTypeOfLandArgs.possibleTypes.forEach(type => 
                        (this as any).addActionButton(`chooseTypeOfLand${type}-button`,  `<div class="bramble-type-token" data-type="${type}"><div class="land-number">5</div></div>`, () => this.chooseTypeOfLand(type))
                    );
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
                    const labels = [_("Building Invasion"), _("Strategic Movement"), _("Roof Transfer")];
                    labels.forEach((label, index) => {
                        const type = index + 1;
                        (this as any).addActionButton(`usePloyToken${type}-button`, `<div class="button-ploy-icon" data-type="${type}"></div> ${label}`, () => this.usePloyToken(type));
                    });
                    (this as any).addActionButton(`cancelUsePloyToken-button`, _("Cancel"), () => this.cancelUsePloyToken(), null, null, 'gray');
                    document.getElementById(`usePloyToken1-button`).classList.toggle('disabled', !usePloyTokenArgs.canInvade);
                    document.getElementById(`usePloyToken2-button`).classList.toggle('disabled', !usePloyTokenArgs.canMoveTorticrane);
                    document.getElementById(`usePloyToken3-button`).classList.toggle('disabled', !usePloyTokenArgs.canTransferRoof);
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

    /**
     * Handle user preferences changes.
     */
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
            case 201: 
                document.getElementById('objectives-reminder')?.classList.toggle('hidden', prefValue == 2);
                break;
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

    private updateRemainingFloorsCounter(playerId: number) {
        const div = document.getElementById(playerId == 0 ? 'remaining-roofs' : `player-table-${playerId}-remaining-building-floors`);
        div.style.setProperty('--number', ''+div.childElementCount);
    }

    private createSecondBoard(gamedatas: GardenNationGamedatas) {
        [0, 1, 2, 3, 4].forEach(number => {
            dojo.place(`
            <div id="common-project-wrapper-${number}" class="common-project-wrapper" data-number="${number}">
            </div>
            `, 'common-projects-inner');
        });        
        this.commonProjectCards.createMoveOrUpdateCard({} as any, `common-project-wrapper-0`);
        gamedatas.commonProjects.forEach(commonProject => this.commonProjectCards.createMoveOrUpdateCard(commonProject, `common-project-wrapper-${commonProject.locationArg}`));

        gamedatas.remainingRoofs.forEach(roof => dojo.place(`<div id="building-floor-${roof.id}" class="building-floor" data-player-id="0" data-color="0"></div>`, `remaining-roofs`));
        this.updateRemainingFloorsCounter(0);
    }

    private createObjectiveReminder(gamedatas: GardenNationGamedatas) {
        const playerId = ''+this.getPlayerId();
        if (!Object.keys(this.gamedatas.players).includes(playerId)) {
            return;
        }

        dojo.place(`<div id="objectives-reminder" class="whiteblock">
            <div id="common-projects-reminder-title" class="title" title="${_("Common projects")}">${_("Common projects")}</div>
            <div id="common-projects-reminder" class="cards"></div>
            <div id="secret-missions-reminder-title" class="title" title="${_("Secret missions")}">${_("Secret missions")}</div>
            <div id="secret-missions-reminder" class="cards"></div>
        </div>`, 'secret-missions-selector', 'after');
        [1, 2, 3, 4].forEach(number => {
            const commonProject = this.gamedatas.commonProjects.find(commonProject => commonProject.locationArg == number);
            dojo.place(`
            <div id="common-project-reminder-${number}" class="common-project-reminder card-reminder" data-id="${commonProject?.id}" data-type="${commonProject?.type ?? 0}" data-sub-type="${commonProject?.subType}">
            </div>
            `, 'common-projects-reminder');

            const elem = document.getElementById(`common-project-reminder-${number}`);
            elem.addEventListener('click', () => {
                if (elem.classList.contains('selectable')) {
                    this.onCommonProjectClick({ id: Number(elem.dataset.id) } as any);
                }
            });
        });
        [0, 1].forEach(number => {
            dojo.place(`
            <div id="secret-mission-reminder-${number}" class="secret-mission-reminder card-reminder" data-type="0">
            </div>
            `, 'secret-missions-reminder');
        });

        this.gamedatas.players[playerId].secretMissions.forEach((secretMission: SecretMission, index: number) => {
            const secretMissionDiv = document.getElementById(`secret-mission-reminder-${index}`);
            secretMissionDiv.dataset.type = ''+secretMission.type;
            secretMissionDiv.dataset.subType = ''+secretMission.subType;
        });
    }
    
    private checkConfirmSecretMissionsButtonState() {
        const selectorCardsDivs = Array.from(document.getElementById(`secret-missions-selector`).getElementsByClassName('secret-mission')) as HTMLDivElement[];
        selectorCardsDivs.forEach(card => card.classList.remove('disabled'));
        
        this.selectedSecretMissionsIds.forEach(id => {
            const selectedCard = selectorCardsDivs.find(card => Number(card.dataset.id) == id);
            selectorCardsDivs.filter(
                card => selectedCard.id != card.id && selectedCard.dataset.type == card.dataset.type && selectedCard.dataset.subType == card.dataset.subType
            ).forEach(card => card.classList.add('disabled'));
        });

        document.getElementById(`chooseSecretMissions-button`)?.classList.toggle('disabled', this.selectedSecretMissionsIds.length !== 2);
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
    
    public onSecretMissionClick(card: SecretMission): void {
        switch (this.gamedatas.gamestate.name) {
            case 'chooseSecretMissions':
                const div = document.getElementById(`secret-mission-${card.id}`);
                if (div.classList.contains('disabled')) {
                    return;
                }

                const args = this.gamedatas.gamestate.args as EnteringChooseSecretMissionsArgs;
                if (args._private?.secretMissions?.some(cp => cp.id === card.id)) {
                    const index = this.selectedSecretMissionsIds.findIndex(id => id == card.id);
                    if (index !== -1) {
                        this.selectedSecretMissionsIds.splice(index, 1);
                    } else {
                        this.selectedSecretMissionsIds.push(card.id);
                    }
                    div.classList.toggle('selected', index === -1);
                }

                if ((this as any).isCurrentPlayerActive()) {
                    this.checkConfirmSecretMissionsButtonState();
                } else {
                    this.cancelChooseSecretMissions();
                }
                break;
        }
    }

    public chooseSecretMissions(ids: number[]) {
        if (!(this as any).checkAction('chooseSecretMissions')) {
            return;
        }

        this.takeAction('chooseSecretMissions', {
            ids: ids.join(',')
        });
    }

    public cancelChooseSecretMissions() {
        this.takeAction('cancelChooseSecretMissions');
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

    public skipCompletedCommonProject() {
        if (!(this as any).checkAction('skipCompletedCommonProject')) {
            return;
        }

        this.takeAction('skipCompletedCommonProject');
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
        this.board.moveTorticrane(notif.args.torticranePosition);
    }

    notif_setPlayerOrder(notif: Notif<NotifSetPlayerOrderArgs>) {
        slideToObjectAndAttach(this, document.getElementById(`order-token-${notif.args.playerId}`), `order-track-${notif.args.order}`);
    }

    notif_giveSecretMissions(notif: Notif<NotifGiveSecretMissionsArgs>) {
        this.getPlayerTable(notif.args.playerId).setSecretMissions(notif.args.secretMissions);
    }

    notif_giveSecretMissionsIds(notif: Notif<NotifGiveSecretMissionsIdsArgs>) {
        Object.keys(notif.args.secretMissionsIds).map(key => Number(key)).filter(playerId => playerId != this.getPlayerId()).forEach(playerId => 
        this.getPlayerTable(playerId).setSecretMissions(notif.args.secretMissionsIds[playerId].map(id => ({ id } as SecretMission))));
    }

    notif_setBrambleType(notif: Notif<NotifSetBrambleTypeArgs>) {
        this.board.setBrambleType(notif.args.areaPosition, notif.args.type, notif.args.brambleId);
    }

    notif_setBuilding(notif: Notif<NotifSetBuildingArgs>) {
        this.board.setBuilding(notif.args.areaPosition, notif.args.building);
        Object.values(this.gamedatas.players).forEach(player => 
            this.buildingFloorCounters[Number(player.id)].toValue(
                document.getElementById(`player-table-${player.id}-remaining-building-floors`).childElementCount
            )
        );
        this.updateRemainingFloorsCounter(0);
    }

    notif_territoryControl(notif: Notif<NotifTerritoryControlArgs>) {
        document.getElementById('board').dataset.scoreTerritory = ''+notif.args.territoryPosition;
        this.board.highlightBuilding(notif.args.buildingsToHighlight, notif.args.inc);
    }

    notif_ployTokenUsed(notif: Notif<NotifPloyTokenUsedArgs>) {
        this.ployTokenCounters[notif.args.playerId]?.incValue(-1);
        this.getPlayerTable(notif.args.playerId)?.setPloyTokenUsed(notif.args.type);
    }

    notif_takeCommonProject(notif: Notif<NotifTakeCommonProjectArgs>) {
        const commonProject = notif.args.commonProject;

        this.getPlayerTable(notif.args.playerId).setCommonProjects([commonProject]);
        

        const commonProjectReminderDiv = document.getElementById(`common-project-reminder-${commonProject.locationArg}`);
        commonProjectReminderDiv.dataset.id = '';
        commonProjectReminderDiv.dataset.type = '0';
        commonProjectReminderDiv.dataset.subType = '0';

        //this.tableHeightChange();
    }

    notif_newCommonProject(notif: Notif<NotifTakeCommonProjectArgs>) {
        const commonProject = notif.args.commonProject;
        // we first create a backflipped card
        this.commonProjectCards.createMoveOrUpdateCard({
            id: commonProject.id
        } as any, `common-project-wrapper-0`);
        // then we reveal it
        this.commonProjectCards.createMoveOrUpdateCard(commonProject, `common-project-wrapper-${commonProject.locationArg}`);

        const commonProjectReminderDiv = document.getElementById(`common-project-reminder-${commonProject.locationArg}`);
        commonProjectReminderDiv.dataset.id = ''+commonProject.id;
        commonProjectReminderDiv.dataset.type = ''+commonProject.type;
        commonProjectReminderDiv.dataset.subType = ''+commonProject.subType;
    }

    notif_revealSecretMission(notif: Notif<NotifRevealSecretMissionArgs>) {
        this.getPlayerTable(notif.args.playerId).setSecretMissions([notif.args.secretMission], true);
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

                if (args.brambleIcon && args.brambleIcon[0] != '<') {
                    args.brambleIcon = `<div class="bramble-type-token" data-type="${args.brambleIcon}"></div>`;
                }
                
                for (const property in args) {
                    if (['cardName', 'territoryNumber', 'points', 'cost', 'inhabitants'].includes(property) && args[property][0] != '<') {
                        args[property] = `<strong>${_(args[property])}</strong>`;
                    }
                }
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}