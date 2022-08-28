const END_INHABITANTS_POINTS = [
    [1, -30],
    [2, -20],
    [4, -10],
    [6, -5],
    [8, -3],
    [10, 0],
    [11, 1],
    [15, 2],
    [17, 3],
    [20, 4],
    [23, 5],
    [26, 6],
    [29, 7],
    [32, 8],
    [35, 9],
    [38, 10],
  ];

class PlayerTable {
    public playerId: number;

    constructor(
        private game: GardenNationGame, 
        player: GardenNationPlayer) {

        this.playerId = Number(player.id);  

        let html = `
        <div id="player-table-${this.playerId}" class="player-table whiteblock">
            <div id="player-table-${this.playerId}-score-board" class="player-score-board" data-color="${player.color}">
                <div id="player-table-${this.playerId}-name" class="player-name" style="color: #${player.color};">${player.name}</div>
                <div id="player-table-${this.playerId}-meeple-marker" class="meeple-marker" data-color="${player.color}"></div>
                <div id="player-table-${this.playerId}-inhabitant-scores" class="inhabitant-scores"></div>
            </div>
            <div id="player-table-${this.playerId}-remaining-building-floors" class="remaining-building-floors"></div>
            <div id="player-table-${this.playerId}-secret-missions-wrapper" class="player-secret-missions-wrapper">
                <div id="player-table-${this.playerId}-secret-missions-title" class="title ${player.secretMissions.length ? '' : 'hidden'}"">${_('Secret missions')}</div>
                <div id="player-table-${this.playerId}-secret-missions" class="player-secret-missions">
                </div>
            </div>
            <div id="player-table-${this.playerId}-common-projects-wrapper" class="player-common-projects-wrapper">
                <div id="player-table-${this.playerId}-common-projects-title" class="title ${player.commonProjects.length ? '' : 'hidden'}">${_('Completed Common projects')}</div>
                <div id="player-table-${this.playerId}-common-projects" class="player-common-projects">
                </div>
            </div>
        </div>`;

        dojo.place(html, 'playerstables');

        [0,1,2,3].forEach(type => {
            let html = `
            <div id="player-table-${this.playerId}-ploy-tokens-container-${type}" class="ploy-tokens-container" data-type="${type}">`;
            if (type == 0) {
                for (let i=0; i<4; i++) {
                    html += `<div id="player-table-${this.playerId}-ploy-token${i}" class="ploy-token" data-color="${player.color}"></div>`;
                }
            }
            html += `</div>
            `;
            dojo.place(html, `player-table-${this.playerId}-score-board`);
        });
        [1,2,3].forEach(type => {
            for (let i=0; i<player.usedPloy[type - 1]; i++) {
                this.setPloyTokenUsed(type);
            }
        });

        player.buildingFloors.forEach(floor => dojo.place(`<div id="building-floor-${floor.id}" class="building-floor" data-player-id="${floor.playerId}" data-color="${player.color}"></div>`, `player-table-${this.playerId}-remaining-building-floors`));
    
        this.setInhabitants(player.inhabitants);

        this.setCommonProjects(player.commonProjects);
        this.setSecretMissions(player.secretMissions);
    }

    private getPointsCoordinates(points: number) {
        const cases = Math.min(points, 40);

        const top = points <= 20 ? 0 : 44;
        const left = (points <= 20 ? cases : cases - 20) * 29.5;

        return [-17 + left, 203 + top];
    }

    public setInhabitants(inhabitants: number) {
        const markerDiv = document.getElementById(`player-table-${this.playerId}-meeple-marker`);

        const coordinates = this.getPointsCoordinates(inhabitants);
        const left = coordinates[0];
        const top = coordinates[1];

        markerDiv.style.transform = `translateX(${left}px) translateY(${top}px)`;

        let inhabitantScoresTooltip = `<h3>${_('Victory points by final inhabitant count')}</h3>`;
        END_INHABITANTS_POINTS.forEach((array, index) => {
            const nextArray = END_INHABITANTS_POINTS[index+1];
            const from = array[0];
            const to = nextArray ? nextArray[0] - 1 : '40+';
            const points = array[1];
            const bold = (!nextArray && inhabitants >= from) || (nextArray && inhabitants >= from && inhabitants <= to);
            const label = from == to ? 
                _('${inhabitants} inhabitants').replace('${inhabitants}', from) : 
                _('${from} to ${to} inhabitants').replace('${from}', from).replace('${to}', to);

            inhabitantScoresTooltip += `<div>`;
            if (bold) {
                inhabitantScoresTooltip += `<strong>`;
            }
            inhabitantScoresTooltip += `${label} = ${_('${points} Victory points').replace('${points}', points)}`;
            if (bold) {
                inhabitantScoresTooltip += `</strong>`;
            }
            inhabitantScoresTooltip += `</div>`;
        })
        this.game.setTooltip(`player-table-${this.playerId}-inhabitant-scores`, _(inhabitantScoresTooltip));
    }

    public setPloyTokenUsed(type: number) {
        const token = document.getElementById(`player-table-${this.playerId}-ploy-tokens-container-0`).lastElementChild as HTMLElement;
        slideToObjectAndAttach(this.game, token, `player-table-${this.playerId}-ploy-tokens-container-${type}`);
    }

    public setCommonProjects(commonProjects: CommonProject[]) {
        if (commonProjects.length) {
            document.getElementById(`player-table-${this.playerId}-common-projects-title`).classList.remove('hidden');
        }

        commonProjects.forEach(commonProject => 
            this.game.commonProjectCards.createMoveOrUpdateCard(commonProject, `player-table-${this.playerId}-common-projects`)
        );
    }

    public setSecretMissions(secretMissions: SecretMission[], ignoreReminder: boolean = false) {
        if (secretMissions.length) {
            document.getElementById(`player-table-${this.playerId}-secret-missions-title`).classList.remove('hidden');
        }

        secretMissions.forEach((secretMission: SecretMission, index: number) => {
            this.game.secretMissionCards.createMoveOrUpdateCard(secretMission, `player-table-${this.playerId}-secret-missions`);

            if (!ignoreReminder && this.playerId == this.game.getPlayerId()) {
                const secretMissionReminderDiv = document.getElementById(`secret-mission-reminder-${index}`);
                if (secretMissionReminderDiv) {
                    secretMissionReminderDiv.dataset.type = ''+secretMission.type;
                    secretMissionReminderDiv.dataset.subType = ''+secretMission.subType;
                }
            }
        });
    }
}