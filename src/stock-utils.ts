/*declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;*/
declare const g_gamethemeurl;

/*declare const board: HTMLDivElement;*/

const CARD_WIDTH = 129;
const CARD_HEIGHT = 240;

function setupAdventurersCards(adventurerStock: Stock) {
    const cardsurl = `${g_gamethemeurl}img/adventurers.png`;

    for (let i=0; i<=7;i++) {
        adventurerStock.addItemType(
            i, 
            i, 
            cardsurl, 
            i
        );
    }
}

function setupCompanionCards(companionsStock: Stock) {
    companionsStock.image_items_per_row = 10;

    const cardsurl = `${g_gamethemeurl}img/companions.png`;

    for (let subType=1; subType<=46;subType++) {
        companionsStock.addItemType(
            subType, 
            0, 
            cardsurl, 
            subType + (subType > 23 ? 1 : 0)
        );
    }

    companionsStock.addItemType(1001,  0, cardsurl, 0);
    companionsStock.addItemType(1002,  0, cardsurl, 24);
}

function setupSpellCards(spellsStock: Stock) {
    const cardsurl = `${g_gamethemeurl}img/spells.png`;

    for (let type=1; type<=7;type++) {
        spellsStock.addItemType(
            type, 
            type, 
            cardsurl, 
            type
        );
    }

    spellsStock.addItemType(0,  0, cardsurl, 0);
}

function setupSoloTileCards(soloTilesStock: Stock) {
    const cardsurl = `${g_gamethemeurl}img/solo-tiles.png`;

    for (let type=1; type<=8;type++) {
        soloTilesStock.addItemType(
            type, 
            type, 
            cardsurl, 
            type - 1
        );
    }

    soloTilesStock.addItemType(0,  0, cardsurl, 0);
}

function setupAdventurerCard(game: Game, cardDiv: HTMLDivElement, type: number) {
    const adventurer = ((game as any).gamedatas as GardenNationGamedatas).ADVENTURERS[type];
    const tooltip = 'TODO';
    (game as any).addTooltipHtml(cardDiv.id, `<h3>${adventurer.name}</h3>${tooltip || ''}`);
}

function moveToAnotherStock(sourceStock: Stock, destinationStock: Stock, uniqueId: number, cardId: string) {
    if (sourceStock === destinationStock) {
        return;
    }
    
    const sourceStockItemId = `${sourceStock.container_div.id}_item_${cardId}`;    

    if (document.getElementById(sourceStockItemId)) {        
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStockItemId);
        sourceStock.removeFromStockById(cardId);
    } else {
        console.warn(`${sourceStockItemId} not found in `, sourceStock);
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStock.container_div.id);
    }

    const destinationDiv = document.getElementById(`${destinationStock.container_div.id}_item_${cardId}`);
    destinationDiv.style.zIndex = '10';
    setTimeout(() => destinationDiv.style.zIndex = 'unset', 1000);
}

function addToStockWithId(destinationStock: Stock, uniqueId: number, cardId: string, from: string) {  

    destinationStock.addToStockWithId(uniqueId, cardId, from);

    const destinationDiv = document.getElementById(`${destinationStock.container_div.id}_item_${cardId}`);
    destinationDiv.style.zIndex = '10';
    setTimeout(() => destinationDiv.style.zIndex = 'unset', 1000);
}