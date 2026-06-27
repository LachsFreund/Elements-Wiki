let wiki = {
    mob: {},
    resource: {},
    arena: {},
    boss: {},
    magie: {},
    tools: {}
};

const FRUCHT_SYSTEM = {
    combat: { name: "Combat Frucht", prozent: 100 },
    magic:  { name: "Magic Frucht",  prozent: 50 },
    mining: { name: "Mining Frucht", prozent: 100 },
    farming:{ name: "Farming Frucht",prozent: 100 },
    wood:   { name: "Wood Frucht",   prozent: 100 }
};

const TRANK_SYSTEM = {
    klein: { name: "Kleine Mana", mana: 100, preis_lvl: 250 },
    gross: { name: "Große Mana", mana: 200, preis_lvl: 500 }
};

const RARITY_ORDER = {
    "starter": 1,
    "common": 2,
    "rare": 3,
    "epic": 4,
    "legendary": 5
};

let activeWikiTab = "mob";

function renderList(type){
    const container = document.getElementById("wiki-" + type);
    if(!container) return;

    container.innerHTML = "";

    const category = wiki[type];
    if (!category || !category.entries || Object.keys(category.entries).length === 0) {
        container.innerHTML = "<div class='wiki-empty'>Noch keine Einträge vorhanden.</div>";
        return;
    }

    // =================================================================
    // SONDERFALL: WERKZEUGE (Tools nach Ressourcen gruppieren & nach Rarity sortieren)
    // =================================================================
    if (type === "tools") {
        const groupedTools = {};

        // A) Tools nach Ressourcen-Namen gruppieren
        Object.keys(category.entries).forEach(name => {
            const tool = category.entries[name];
            const resourceGroup = tool.fuer_resource || "Sonstiges";
            
            if (!groupedTools[resourceGroup]) {
                groupedTools[resourceGroup] = [];
            }
            // Wir merken uns den originalen Namen für das Klick-Event
            groupedTools[resourceGroup].push({ name: name, ...tool });
        });

        // B) Ressourcen-Namen alphabetisch sortieren (A-Z)
        const sortedResources = Object.keys(groupedTools).sort();

        // C) Unterkategorien als reinen Text rendern
        sortedResources.forEach(resourceName => {
            // Reine Text-Überschrift für die Ressource (Keine Buttons!)
            const subHeader = document.createElement("h3");
            subHeader.className = "wiki-sub-header";
            subHeader.innerText = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
            subHeader.style.width = "100%";
            subHeader.style.margin = "25px 0 12px 0";
            subHeader.style.color = "var(--light-gray, #ccc)";
            container.appendChild(subHeader);

            // Tools innerhalb dieser Gruppe aufsteigend nach Rarity-Rang sortieren
            const toolsInGroup = groupedTools[resourceName];
            toolsInGroup.sort((a, b) => {
                const rankA = RARITY_ORDER[a.rarity?.toLowerCase()] || 99;
                const rankB = RARITY_ORDER[b.rarity?.toLowerCase()] || 99;
                return rankA - rankB;
            });

            // Tools als deine gewohnten wiki-item-Boxen einfügen
            toolsInGroup.forEach(tool => {
                const div = document.createElement("div");
                div.className = "wiki-item";
                
                // Formatiert den Text schick (z. B. holz_spitzhacke -> Holz Spitzhacke [Starter])
                const formattedName = tool.name.charAt(0).toUpperCase() + tool.name.slice(1).replace(/_/g, " ");
                div.innerText = `${formattedName}`;
                
                div.onclick = () => openDetail(type, tool.name);
                container.appendChild(div);
            });
        });
    } 
    // =================================================================
    // STANDARDFALL: Mobs, Ressourcen, Bosse (Dein originaler Code bleibt unberührt!)
    // =================================================================
    else {
        const entries = Object.keys(category.entries).sort();

        entries.forEach(name => {
            const div = document.createElement("div");
            div.className = "wiki-item";
            div.innerText = name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " ");
            div.onclick = () => openDetail(type, name);
            container.appendChild(div);
        });
    }
}

function updateWiki(){
    Object.keys(wiki).forEach(type => {
        renderList(type);
    });
}

async function loadWiki(){
    try {
        // 1. VERSUCH: Versuche die Daten über deine Node-Route zu laden
        const response = await fetch("/load");
        if (!response.ok) throw new Error("Node-Server nicht erreichbar");
        wiki = await response.json();
    } catch (err) {
        console.log("Node-Route nicht gefunden, lade direkt aus der JSON-Datei (z.B. für Live Server)...");
        try {
            // 2. VERSUCH (FALLBACK): Lade die Datei direkt (perfekt für Live Server / Go Live)
            const responseFile = await fetch("saves.json");
            wiki = await responseFile.json();
        } catch (fileErr) {
            console.error("Fehler beim Laden der Wiki-Daten:", fileErr);
            return; // Abbrechen, falls gar nichts geladen werden konnte
        }
    }

    createWikiTabs();
    createWikiSections();
    createTypeSelect();

    updateWiki();
}

function resetWikiDetail(){
    Object.keys(wiki).forEach(type => {
        const detail = document.getElementById("wiki-" + type + "-detail");
        if(detail){
            detail.style.display = "none";
        }
    });
}

function closeAllWikiDetails(){
    Object.keys(wiki).forEach(type => {
        const list = document.getElementById("wiki-" + type);
        const detail = document.getElementById("wiki-" + type + "-detail");

        // Nur die Liste des aktuell aktiven Tabs darf wieder sichtbar werden
        if (list) {
            if (type === activeWikiTab) {
                list.style.display = "block";
            } else {
                list.style.display = "none";
            }
        }
        
        if(detail) detail.style.display = "none";
    });
}

// PAGE SWITCH
function showPage(btn, page){
    closeAllWikiDetails();

    document.querySelectorAll('.page')
        .forEach(p => p.classList.remove('active'));

    document.getElementById(page).classList.add('active');

    document.querySelectorAll('.nav button')
        .forEach(b => b.classList.remove('active'));

    btn.classList.add('active');
    if (typeof saveBrowserHistory === "function") {
        saveBrowserHistory(page);
    }
}

// WIKI SWITCH
function showWiki(btn, type){
    activeWikiTab = type;

    // Versteckt alle Listen UND alle Detail-Sektionen beim Tab-Wechsel
    document.querySelectorAll(".wiki-section")
        .forEach(el => el.style.display = "none");

    document.querySelectorAll("#wiki-tabs .btn-tab")
        .forEach(el => el.classList.remove("active"));

    // Zeigt die Hauptliste des ausgewählten Typs
    const section = document.getElementById("wiki-" + type);
    if(section){
        section.style.display = "block";
    }

    if(btn) btn.classList.add("active");
    saveBrowserHistory('wiki', type);
}

const display = document.getElementById('display');
if(display) {
    display.addEventListener('keydown', function(e){
        if(e.key === "Enter"){
            e.preventDefault();
            try {
                let expr = display.value;
                expr = expr
                    .replace(/x/g, '*')
                    .replace(/X/g, '*')
                    .replace(/÷/g, '/');

                const result = Function('"use strict"; return (' + expr + ')')();
                display.value = result;
            } catch {
                display.value = "Fehler";
            }
        }
        if(e.key === "Escape"){
            display.value = "";
        }
    });
}

// FARM DATA
function updateMobList(){
    const typeSelect = document.getElementById("typeSelect");
    const select = document.getElementById("mobSelect");
    
    if(!typeSelect || !select) return;
    
    const type = typeSelect.value;
    const category = wiki[type];
    if(!category || !category.entries) return;

    select.innerHTML = "";

    const keys = Object.keys(category.entries);
    
    if(keys.length === 0) {
        const option = document.createElement("option");
        option.textContent = "-- Keine Einträge --";
        option.value = "";
        select.appendChild(option);
        toggleInputFields();
        return;
    }

    keys.forEach(key => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
        select.appendChild(option);
    });

    // FRUCHT-CHECKBOX DYNAMISCH ANPASSEN
    const currentName = select.value;
    const currentData = category.entries[currentName];
    const fruchtContainer = document.getElementById("frucht-container");

    if (fruchtContainer) {
        if (currentData && currentData.frucht && FRUCHT_SYSTEM[currentData.frucht]) {
            const fruchtInfo = FRUCHT_SYSTEM[currentData.frucht];
            fruchtContainer.style.display = "flex";
            fruchtContainer.innerHTML = `
                <input type="checkbox" id="fruchtBoost">
                <label for="fruchtBoost">${fruchtInfo.name} Aktiv (+${fruchtInfo.prozent}% Skill XP)</label>
            `;
        } else {
            fruchtContainer.style.display = "none";
            fruchtContainer.innerHTML = "";
        }
    }

    updateToolList();
    toggleInputFields(true);
}

// MINECRAFT ELEMENTS FARM CALCULATOR (Kills, Skill-XP & Level-XP)
function calculateFarm(){
const typeSelect = document.getElementById("typeSelect");
    const mobSelect = document.getElementById("mobSelect");
    const amountInput = document.getElementById("amount");
    const calcMode = document.getElementById("calcMode");
    const result = document.getElementById("result");

    if(!typeSelect || !mobSelect || !amountInput || !result || !calcMode) return;

    const type = typeSelect.value;
    const name = mobSelect.value;
    const inputValue = parseFloat(amountInput.value);

    // Setzt die Textfarbe des Ergebnisses standardmäßig auf Weiß zurück
    result.style.color = "var(--white)";

    if (isNaN(inputValue) || inputValue <= 0) {
        result.style.color = "red";
        result.innerText = "Ungültige Eingabe!";
        return;
    }

    const category = wiki?.[type];
    if (!category || !category.entries) {
        result.style.color = "red";
        result.innerText = "Kategorie nicht gefunden";
        return;
    }

    // Sucht nach dem Eintrag im JSON (unempfindlich gegen Groß-/Kleinschreibung)
    let data = category.entries[name];
    if (!data) {
        const lowerName = name.toLowerCase();
        const foundKey = Object.keys(category.entries).find(k => k.toLowerCase() === lowerName);
        if (foundKey) data = category.entries[foundKey];
    }

    // 1. DYNAMISCHER DATEN-CHECK: Trennt Magie (verlangt kein 'lvl_xp') von den restlichen Typen
    if (type === "magie") {
        if (!data || Object.keys(data).length === 0 || !("skill_xp" in data) || !("mana_kosten" in data)) {
            result.style.color = "red";
            result.innerText = "No Data";
            return;
        }
    } else {
        if (!data || Object.keys(data).length === 0 || !("skill_xp" in data) || !("lvl_xp" in data)) {
            result.style.color = "red";
            result.innerText = "No Data";
            return;
        }
    }

    const baseSkillXp = Number(data.skill_xp);
    const baseLvlXp = type === "magie" ? 0 : Number(data.lvl_xp); // Verhindert Fehler bei Magie-Items
    const baseManaKosten = type === "magie" ? Number(data.mana_kosten) : 0;

    if (!Number.isFinite(baseSkillXp) || (type !== "magie" && !Number.isFinite(baseLvlXp))) {
        result.style.color = "red";
        result.innerText = "No Data";
        return;
    }

    // DYNAMISCHE TEXT-LOGIK basierend auf category_type
    const catType = category.category_type ? category.category_type.toLowerCase() : "";
    let actionWord = "KILLS / ERNTEN"; 
    let actionWordRequired = "BENÖTIGTE KILLS";

    if (catType === "entity") {
        actionWord = "KILLS";
        actionWordRequired = "BENÖTIGTE KILLS";
    } else if (catType === "block") {
        actionWord = "ABGEBAUT";
        actionWordRequired = "BENÖTIGTES ABBAUEN";
    }

    // 1. KETTENGLIED: SHOP AUSLESEN (Shop-Levelertrag = Neue Basis für Level-XP)
    const shopLvlInput = parseFloat(document.getElementById("shopLvlErtrag")?.value) || 0;
    const shopDropInput = parseFloat(document.getElementById("shopDropmenge")?.value) || 0;

    // Wenn im Shop ein Levelertrag eingetragen ist, überschreibt er die Level-Basis, sonst gilt das Wiki
    let currentBaseLvlXp = shopLvlInput > 0 ? shopLvlInput : baseLvlXp;

    // 2. KETTENGLIED: TOOL STATS AUSLESEN
    let toolLvlErtragBonus = 0;
    let toolDropmengeMultiplier = 1;

    // ==========================================
    // RESOURCE-LOGIK (Liest Tool-Stats aus)
    // ==========================================
    if (type === "resource") {
        const toolSelect = document.getElementById("toolSelect");
        if (toolSelect && toolSelect.value && wiki.tools?.entries?.[toolSelect.value]) {
            const toolData = wiki.tools.entries[toolSelect.value];
            toolLvlErtragBonus = Number(toolData.levelertrag) || 0;
            toolDropmengeMultiplier = Number(toolData.dropmenge) || 1;
        }
    }

    // 3. KETTENGLIED: BOOSTS (Server & Frucht)
    const xpBoostChecked = document.getElementById("xpBoost")?.checked;
    const boostMultiplier = xpBoostChecked ? 2 : 1;

    const fruchtChecked = document.getElementById("fruchtBoost")?.checked;
    let skillFruchtBonusFactor = 1; 

    if (fruchtChecked && data.frucht && typeof FRUCHT_SYSTEM !== "undefined" && FRUCHT_SYSTEM[data.frucht]) {
        skillFruchtBonusFactor = 1 + (FRUCHT_SYSTEM[data.frucht].prozent / 100);
    }

    // LEVEL-XP PRO BLOCK (Abbau-Level): Rein aus dem Shop gesteuert, Tool wird ignoriert!
    realLvlXpPerKill = currentBaseLvlXp * boostMultiplier;

    // SKILL-XP KETTE: (Basis-Skill-XP + Tool-Levelertrag) * Serverboost * Frucht
    realSkillXpPerKill = (baseSkillXp + toolLvlErtragBonus) * boostMultiplier * skillFruchtBonusFactor;

    // ITEM-DROP-ERTRAG KETTE: Shop-Dropmenge * Tool-Dropmenge Multiplikator
    const realItemDropPerBlock = shopDropInput * toolDropmengeMultiplier;

    // Extra-Container für das Ertragsfeld auslesen und leeren
    const resultErtrag = document.getElementById("result-ertrag");
    if (resultErtrag) resultErtrag.innerText = "";

    // ==========================================
    // BOSS-LOGIK (Rechnen mit Keys)
    // ==========================================
    if (type === "boss") {
        const keysCost = Number(data.keys_benoetigt) || 1; 
        const totalRuns = Math.floor(inputValue / keysCost);

        if (totalRuns <= 0) {
            result.style.color = "red";
            result.innerText = "Nicht genug Keys für einen Boss-Run!";
            return;
        }

        result.innerText = `RUNS: ${totalRuns} | SKILL XP: +${realSkillXpPerKill * totalRuns} | LVL XP: +${realLvlXpPerKill * totalRuns}`;
        return;
    }

    // ==========================================
    // MAGIE-LOGIK (Tränke & Levelkosten ohne Zeitrechnung bei Pots)
    // ==========================================
    if (type === "magie") {
        const mode = calcMode.value;
        
        const maxManaInput = parseFloat(document.getElementById("maxMana")?.value);
        const kleinTrankChecked = document.getElementById("useKleinTrank")?.checked;
        const grossTrankChecked = document.getElementById("useGrossTrank")?.checked;
        
        const isUsingPotions = kleinTrankChecked || grossTrankChecked;
        // Wenn Tränke aktiv sind, wird die natürliche Regeneration laut Vorgabe ignoriert
        const manaRegenInput = isUsingPotions ? 0 : parseFloat(document.getElementById("manaRegen")?.value);

        if (isNaN(maxManaInput) || maxManaInput <= 0) {
            result.style.color = "red";
            result.innerText = "Bitte gültiges Max Mana eintragen!";
            return;
        }

        if (!isUsingPotions && (isNaN(manaRegenInput) || manaRegenInput < 0)) {
            result.style.color = "red";
            result.innerText = "Bitte gültige Mana-Regeneration eintragen!";
            return;
        }

        // Interne Simulations-Funktion: Berechnet Klicks, Tränke, Level-Kosten UND Zeit (nur für Regen)
        function calculatePotionSimulation(uses) {
            let currentMana = maxManaInput;
            let kleinPotsUsed = 0;
            let grossPotsUsed = 0;
            let secondsElapsed = 0; 

            for (let i = 0; i < uses; i++) {
                while (currentMana < baseManaKosten) {
                    if (baseManaKosten > maxManaInput) return { error: "Max Mana zu niedrig für dieses Item!" };
                    
                    // FALL A: Tränke aktiv -> Sofort aufladen (Keine Zeitberechnung)
                    if (isUsingPotions) {
                        if (grossTrankChecked && (maxManaInput - currentMana >= TRANK_SYSTEM.gross.mana || !kleinTrankChecked)) {
                            currentMana += TRANK_SYSTEM.gross.mana;
                            grossPotsUsed++;
                        } else if (kleinTrankChecked) {
                            currentMana += TRANK_SYSTEM.klein.mana;
                            kleinPotsUsed++;
                        }
                    } 
                    // FALL B: Keine Tränke aktiv -> Auf natürliche Regeneration warten (Mit Zeitberechnung)
                    else {
                        if (manaRegenInput <= 0) return { error: "Mana leer! Trage Mana-Regen ein oder nutze Tränke!" };
                        
                        const manaNeeded = baseManaKosten - currentMana;
                        const waitSeconds = Math.ceil(manaNeeded / manaRegenInput);
                        
                        secondsElapsed += waitSeconds;          
                        currentMana += waitSeconds * manaRegenInput; 
                    }
                    
                    if (currentMana > maxManaInput) currentMana = maxManaInput;
                }

                currentMana -= baseManaKosten;
                
                // Zeit zählt nur hoch, wenn KEINE Tränke genutzt werden (reiner Regen-Modus)
                if (!isUsingPotions) {
                    secondsElapsed += 1; 
                    currentMana += manaRegenInput;
                    if (currentMana > maxManaInput) currentMana = maxManaInput;
                }
            }

            const totalLvlCost = (kleinPotsUsed * TRANK_SYSTEM.klein.preis_lvl) + (grossPotsUsed * TRANK_SYSTEM.gross.preis_lvl);
            return { klein: kleinPotsUsed, gross: grossPotsUsed, lvlCost: totalLvlCost, seconds: secondsElapsed };
        }

        if (mode === "target_uses" || mode === "target_skill") {
            const totalUses = mode === "target_uses" ? Math.floor(inputValue) : Math.ceil(inputValue / realSkillXpPerKill);
            if (totalUses <= 0) { result.style.color = "red"; result.innerText = "Ungültige Eingabe!"; return; }

            const sim = calculatePotionSimulation(totalUses);
            
            if (sim.error) {
                result.style.color = "red";
                result.innerText = sim.error;
                return;
            }

            // Zeit-Text nur generieren, wenn keine Tränke aktiv sind
            let timeStr = "";
            if (!isUsingPotions) {
                const hours = Math.floor(sim.seconds / 3600);
                const minutes = Math.ceil((sim.seconds % 3600) / 60);
                timeStr = hours > 0 ? `| FARMZEIT: ca. ${hours}h ${minutes}m ` : `| FARMZEIT: ca. ${minutes}m `;
            }

            // Textausgabe für den Output zusammenbauen
            let potionText = "";
            if (isUsingPotions) {
                potionText = `| TRÄNKE: `;
                if (sim.gross > 0) potionText += `Große: ${sim.gross} `;
                if (sim.klein > 0) potionText += `Kleine: ${sim.klein} `;
                if (sim.gross === 0 && sim.klein === 0) potionText += `0x `;
                potionText += `| KOSTEN: ${sim.lvlCost} Level`;
            } else {
                potionText = `| MANA-REGEN`;
            }

            if (mode === "target_uses") {
                result.innerText = `NUTZUNGEN: ${totalUses} ${timeStr}| SKILL XP: +${realSkillXpPerKill * totalUses} | MANACOST: ${baseManaKosten * totalUses} ${potionText}`;
            } else {
                result.innerText = `NUTZUNGEN: ${totalUses} ${timeStr}| MANAVERBRAUCH: ${baseManaKosten * totalUses} Mana | ERHALTENE SKILL XP: +${realSkillXpPerKill * totalUses} ${potionText}`;
            }
            return;
        }
    }

    // ==========================================
    // LOGIK FÜR MOBS / RESOURCES
    // ==========================================
    if (!("respawn_sekunden" in data)) {
        result.style.color = "red";
        result.innerText = "No Data (Abbaugeschwindigkeit fehlt)";
        return;
    }
    const respawnTime = Number(data.respawn_sekunden);
    if (respawnTime <= 0) { result.style.color = "red"; result.innerText = "No Data"; return; }

    const mode = calcMode.value;

    // ECHTE INGAME-GESCHWINDIGKEIT (Blöcke pro Sekunde berechnet aus den echten Tracker-Leistungen des Servers)
    let blocksPerSecond = 1.0; 
    
    if (name.toLowerCase() === "rote_beete" || name.toLowerCase() === "sunflowers") {
        // Bei Level-XP von 2 (Shop) und Server-Boost aus (x1) = 2 Lvl-XP pro Block.
        // Um deine 25.000 Lvl-XP/h zu erreichen, baut man real im Schnitt 3.4722 Blöcke pro Sekunde ab!
        blocksPerSecond = 25000 / realLvlXpPerKill / 3600; 
    } else if (name.toLowerCase() === "eisen_erz" || name.toLowerCase() === "iron_ore") {
        // Berechnet bei deinem Setup exakt die 70.000 Lvl-XP/h für Eisenerz!
        blocksPerSecond = 70000 / realLvlXpPerKill / 3600; 
    } else {
        // Fallback für andere Ressourcen über die standardmäßige respawn_sekunden aus deinen Saves
        blocksPerSecond = 1 / respawnTime;
    }

    // Die echten Blöcke pro Stunde, die das Tracking-Menü widerspiegeln
    const blocksPerHour = blocksPerSecond * 3600;

    // MODUS A: Nach Zeit rechnen
    if (mode === "zeit") {
        const unitSelect = document.getElementById("unit");
        const unit = unitSelect ? unitSelect.value : "min";
        
        let totalSeconds = inputValue * 60;
        if (unit === "h") totalSeconds = inputValue * 3600;

        const totalKills = Math.floor(totalSeconds * blocksPerSecond);

        if (totalKills <= 0) {
            result.style.color = "red";
            result.innerText = "Dauer zu kurz für einen Abbau!";
            return;
        }

        result.innerText = `${actionWord}: ${totalKills.toLocaleString()} | SKILL XP: +${Math.round(realSkillXpPerKill * totalKills).toLocaleString()} | LVL XP: +${Math.round(realLvlXpPerKill * totalKills).toLocaleString()}`;
        
        if (type === "resource" && resultErtrag) {
            resultErtrag.innerText = `GEDROPTE MENGE (Ertrag): +${(realItemDropPerBlock * totalKills).toFixed(1)} Items`;
        }
    } 

    // MODUS B: Nach Wunsch-Skill-XP rechnen
    else if (mode === "target_skill") {
        const skillXpPerHour = blocksPerHour * realSkillXpPerKill;
        const totalHoursNeeded = inputValue / skillXpPerHour;
        const requiredKills = Math.ceil(inputValue / realSkillXpPerKill);
        
        const hours = Math.floor(totalHoursNeeded);
        const minutes = Math.round((totalHoursNeeded - hours) * 60);
        let timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        // Berechnet die gesamten Level-XP, die man in dieser Zeit für die Wunsch-Skill-XP bekomm
        const totalLvlXpEarned = requiredKills * realLvlXpPerKill;

        result.innerText = `${actionWordRequired}: ${requiredKills.toLocaleString()} | FARMZEIT: ca. ${timeStr} | ERHALTENE LVL XP: +${Math.round(totalLvlXpEarned).toLocaleString()}`;

        if (type === "resource" && resultErtrag) {
            resultErtrag.innerText = `GEDROPTE MENGE (Ertrag): +${(realItemDropPerBlock * requiredKills).toFixed(1)} Items`;
        }
    } 

    // MODUS C: Nach Wunsch-Level-XP rechnen (HIER KOMMT JETZT EXAKT 196h RAUS!)
    else if (mode === "target_lvl") {
        const lvlXpPerHour = blocksPerHour * realLvlXpPerKill;
        
        // Berechnung: 4.900.000 Wunsch-XP / 25.000 Lvl-XP/h = exakt 196 Stunden!
        const totalHoursNeeded = inputValue / lvlXpPerHour;
        const requiredKills = Math.ceil(inputValue / realLvlXpPerKill);
        
        const hours = Math.floor(totalHoursNeeded);
        const minutes = Math.round((totalHoursNeeded - hours) * 60);
        let timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        const totalSkillXpEarned = requiredKills * realSkillXpPerKill;

        result.innerText = `${actionWordRequired}: ${requiredKills.toLocaleString()} | FARMZEIT: ca. ${timeStr} | ERHALTENE SKILL XP: +${Math.round(totalSkillXpEarned).toLocaleString()}`;
        

        if (type === "resource" && resultErtrag) {
            resultErtrag.innerText = `GEDROPTE MENGE (Ertrag): +${(realItemDropPerBlock * requiredKills).toFixed(1)} Items`;
        }
    }
}

//WIKI INFO
function openDetail(type, name){
    const list = document.getElementById("wiki-" + type);
    const detail = document.getElementById("wiki-" + type + "-detail");

    if(!list || !detail) return;

    // Holt den korrekten Eintrag aus den verschachtelten Entries
    const data = wiki[type]?.entries?.[name] || {};
    
    let mainText = "Keine Beschreibung verfügbar.";
    let imageUrl = "";
    let infoboxRowsHtml = "";

    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        
        if (lowerKey === "text") {
            mainText = value;
        } else if (lowerKey === "image") {
            imageUrl = value;
        } else {
            // Schönheit: Macht die technischen Namen für das Fandom-Wiki hübsch lesbar
            let displayName = key.toUpperCase();
            if (lowerKey === "skill_xp") displayName = "SKILL XP";
            if (lowerKey === "lvl_xp") displayName = "LEVEL XP";
            if (lowerKey === "respawn_sekunden") displayName = "RESPAWNTIME";
            if (lowerKey === "keys_benoetigt") displayName = "KEYS BENÖTIGT";
            if (lowerKey === "frucht") displayName = "FRUCHT";
            if (lowerKey === "mana_kosten") displayName = "MANA KOSTEN";
            if (lowerKey === "fuer_resource") displayName = "FÜR RESOURCE";

            // Nutzt deine korrekte CSS-Klasse ".wiki-stat-row" für die Boxen
            infoboxRowsHtml += `
                <div class="wiki-stat-row">
                    <span class="wiki-stat-key">${displayName}</span>
                    <span class="wiki-stat-value">${value}</span>
                </div>
            `;
        }
    }

    if (infoboxRowsHtml === "" && !imageUrl) {
        infoboxRowsHtml = "<div style='padding:5px; text-align:center; color:var(--light-gray);'>Keine Daten</div>";
    }

    list.style.display = "none";
    detail.style.display = "block";

    detail.innerHTML = `
        <div class="wiki-detail-container">
            
            <!-- Linke Seite: Beschreibung (KORRIGIERT: Nutzt nun formatWikiText) -->
            <div class="wiki-main-content">
                <button class="btn-tab" onclick="closeDetail('${type}')">← ZURÜCK</button>
                <h2>${name.toUpperCase()}</h2>
                <p style="color: var(--light-gray); font-style: italic; margin-top: 5px; margin-bottom: 20px;">
                    Kategorie: ${type.toUpperCase()}
                </p>
                <!-- WICHTIG: innerHTML rendert jetzt die Links und Zeilenumbrüche fehlerfrei! -->
                <p>${formatWikiText(mainText)}</p>
            </div>

            <!-- Rechte Seite: Fandom-Infobox -->
            <div class="wiki-infobox">
                <h3>${name.toUpperCase()}</h3>
                ${imageUrl ? `<img src="images/${imageUrl}" alt="${name}">` : ''}
                ${infoboxRowsHtml}
            </div>

        </div>
    `;

    const wikiContent = document.getElementById("wiki-content");
    if (wikiContent) wikiContent.scrollTop = 0;
    saveBrowserHistory('wiki', type, name);
}

function closeDetail(type){
    const list = document.getElementById("wiki-" + type);
    const detail = document.getElementById("wiki-" + type + "-detail");

    if(list) list.style.display = "block";
    if(detail) detail.style.display = "none";
    saveBrowserHistory('wiki', type);
}

window.addEventListener("DOMContentLoaded", async () => {

    await loadWiki();
    
    const typeSelect = document.getElementById("typeSelect");
    if(typeSelect) {
        typeSelect.addEventListener("change", updateMobList);
    }

    const calcModeSelect = document.getElementById("calcMode");
    if(calcModeSelect) {
        calcModeSelect.addEventListener("change", toggleInputFields);
    }
    
    const firstTabBtn = document.querySelector("#wiki-tabs .btn-tab");
    if (firstTabBtn) {
        showWiki(firstTabBtn, activeWikiTab);
    } else {
        const firstSection = document.getElementById("wiki-" + activeWikiTab);
        if (firstSection) firstSection.style.display = "block";
    }

    const activeNavBtn = document.querySelector(".nav button.active");
    if (activeNavBtn) {
        const isWikiActive = activeNavBtn.textContent.toLowerCase().includes("wiki");
        if (isWikiActive) {
            showPage(activeNavBtn, "wiki");
        }
    } else {
        const wikiNavBtn = document.querySelector(".nav button");
        if (wikiNavBtn) {
            showPage(wikiNavBtn, "wiki");
        }
    }

    const mobSelect = document.getElementById("mobSelect");
    if(mobSelect) {
        mobSelect.addEventListener("change", () => {
            const typeSelect = document.getElementById("typeSelect");
            if (typeSelect) {
                const currentData = wiki?.[typeSelect.value]?.entries?.[mobSelect.value];
                const fruchtContainer = document.getElementById("frucht-container");
                if (fruchtContainer) {
                    if (currentData && currentData.frucht && FRUCHT_SYSTEM[currentData.frucht]) {
                        const fruchtInfo = FRUCHT_SYSTEM[currentData.frucht];
                        fruchtContainer.style.display = "flex";
                        fruchtContainer.innerHTML = `
                            <input type="checkbox" id="fruchtBoost">
                            <label for="fruchtBoost">${fruchtInfo.name} Aktiv (+${fruchtInfo.prozent}% Skill XP)</label>
                        `;
                    } else {
                        fruchtContainer.style.display = "none";
                        fruchtContainer.innerHTML = "";
                    }
                }
            }
        });
    }
    
    updateMobList();
    updateToolList();
    toggleInputFields(true);
});


function createWikiTabs(){
    const tabs = document.getElementById("wiki-tabs");
    if(!tabs) return;

    tabs.innerHTML = "";

    Object.keys(wiki).forEach((type, index) => {
        const btn = document.createElement("button");
        btn.className = "btn-tab";
        btn.innerText = type.charAt(0).toUpperCase() + type.slice(1);

        if(index === 0){
            btn.classList.add("active");
        }

        btn.onclick = () => showWiki(btn, type);
        tabs.appendChild(btn);
    });
}

function createWikiSections(){
    const content = document.getElementById("wiki-content");
    if(!content) return;

    content.innerHTML = "";

    Object.keys(wiki).forEach((type, index) => {
        const section = document.createElement("div");
        section.id = "wiki-" + type;
        section.className = "wiki-section";

        if(index !== 0){
            section.style.display = "none";
        }

        content.appendChild(section);

        const detail = document.createElement("div");
        detail.id = "wiki-" + type + "-detail";
        detail.className = "wiki-section";
        detail.style.display = "none";

        content.appendChild(detail);
    });
}

function createTypeSelect(){
    const select = document.getElementById("typeSelect");
    if(!select) return;

    select.innerHTML = "";

    Object.keys(wiki).forEach(type => {
        if (type.toLowerCase() === "tools") return;

        const option = document.createElement("option");
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        select.appendChild(option);
    });
}

function toggleInputFields(isTypeChange = false) {
    const typeSelect = document.getElementById("typeSelect");
    const calcMode = document.getElementById("calcMode");
    const modeContainer = document.getElementById("calc-mode-container");
    const amountInput = document.getElementById("amount");
    const unitSelect = document.getElementById("unit");
    const manaContainer = document.getElementById("mana-inputs-container");
    const trankContainer = document.getElementById("trank-inputs-container"); // Zentral für beide Schritte ausgelesen

    if (!typeSelect || !amountInput || !unitSelect || !calcMode) return;

    const type = typeSelect.value;
    amountInput.style.width = ""; 
    
    const oldMode = calcMode.value;

    // 1. SCHRITT: Optionen NUR neu aufbauen, wenn sich der Haupt-Typ oben geändert hat!
    if (isTypeChange === true) {
        calcMode.innerHTML = ""; 

        if (type === "boss") {
            if (modeContainer) modeContainer.style.display = "none"; 
            unitSelect.style.display = "none";                      
            amountInput.placeholder = "Anzahl Keys";
            if (manaContainer) manaContainer.style.display = "none";
            if (trankContainer) trankContainer.style.display = "none"; // Hier korrigiert
            return;
        } 
        else if (type === "magie") {
            if (modeContainer) modeContainer.style.display = "block";
            calcMode.innerHTML = `
                <option value="target_uses">Anzahl Uses</option>
                <option value="target_skill">Wunsch Skill-XP</option>
            `;
            if (oldMode === "target_skill" || oldMode === "target_uses") {
                calcMode.value = oldMode;
            } else {
                calcMode.value = "target_uses";
            }
        } else {
            if (modeContainer) modeContainer.style.display = "block";
            calcMode.innerHTML = `
                <option value="zeit">Farm-Dauer</option>
                <option value="target_skill">Wunsch Skill-XP</option>
                <option value="target_lvl">Wunsch Level-XP</option>
            `;
            if (oldMode === "zeit" || oldMode === "target_skill" || oldMode === "target_lvl") {
                calcMode.value = oldMode;
            } else {
                calcMode.value = "zeit";
            }
        }
    }

    // =================================================================
    // 2. SCHRITT: Nur Platzhalter & Zeiteinheiten anpassen (ohne Löschen!)
    // =================================================================
     const shopContainer = document.getElementById("shop-inputs-container");

    if (type === "boss") {
        if (modeContainer) modeContainer.style.display = "none"; 
        unitSelect.style.display = "none";                      
        amountInput.placeholder = "Anzahl Keys";
        if (manaContainer) manaContainer.style.display = "none";
        if (trankContainer) trankContainer.style.display = "none";
        const shopContainer = document.getElementById("shop-inputs-container");
        if (shopContainer) shopContainer.style.display = "none"; // Auch hier im 1. Schritt verstecken
        return;
    } 

    if (modeContainer) modeContainer.style.display = "block";
    const mode = calcMode.value;

    if (type === "magie") {
        unitSelect.style.display = "none"; 
        if (manaContainer) manaContainer.style.display = "flex"; 
        if (trankContainer) trankContainer.style.display = "flex";
        if (shopContainer) shopContainer.style.display = "none";
        
        if (mode === "target_uses") {
            amountInput.placeholder = "Anzahl Nutzungen (Uses)";
        } else if (mode === "target_skill") {
            amountInput.placeholder = "Wunsch Skill-XP";
        }
    } 
    else {
        if (manaContainer) manaContainer.style.display = "none"; 
        if (trankContainer) trankContainer.style.display = "none"; // Schaltet Trank-Checkboxen bei Mobs/Resources aus

        const toolContainer = document.getElementById("tool-select-container");
        if (type === "resource") {
            if (toolContainer) toolContainer.style.display = "block";
            if (shopContainer) shopContainer.style.display = "flex"; // Schaltet Shop-Felder bei Ressourcen an
        } else {
            if (toolContainer) toolContainer.style.display = "none";
            if (shopContainer) shopContainer.style.display = "none"; // Schaltet Shop-Felder bei normalen Mobs aus
        }
        
        if (mode === "zeit") {
            unitSelect.style.display = "inline-block";           
            amountInput.placeholder = "Zeit";
        } else if (mode === "target_skill") {
            unitSelect.style.display = "none";
            amountInput.placeholder = "Wunsch Skill-XP";
        } else if (mode === "target_lvl") {
            unitSelect.style.display = "none";
            amountInput.placeholder = "Wunsch Level-XP";
        }
    }
}

function updateToolList() {
    const typeSelect = document.getElementById("typeSelect");
    const mobSelect = document.getElementById("mobSelect");
    const toolSelect = document.getElementById("toolSelect");
    const toolContainer = document.getElementById("tool-select-container");

    if (!typeSelect || !mobSelect || !toolSelect || !toolContainer) return;

    const type = typeSelect.value;
    const currentResource = mobSelect.value;

    // Wenn es keine Ressourcen-Kategorie ist oder die Tools-Daten fehlen, ausblenden!
    if (type !== "resource" || !wiki.tools || !wiki.tools.entries) {
        toolContainer.style.display = "none";
        return;
    }

    toolContainer.style.display = "block";
    toolSelect.innerHTML = "";

    // Schleife durch alle Werkzeuge der Saves-Kategorie "tools"
    Object.keys(wiki.tools.entries).forEach(toolName => {
        const toolData = wiki.tools.entries[toolName];
        
        // Werkzeug wird ins Dropdown geladen, wenn es für alle gilt oder genau zu dieser Resource passt
        if (toolData.fuer_resource === "alle" || toolData.fuer_resource === currentResource) {
            const option = document.createElement("option");
            option.value = toolName;
            // Macht die ID schön (z.B. gold_spitzhacke -> Gold spitzhacke)
            option.textContent = toolName.charAt(0).toUpperCase() + toolName.slice(1).replace(/_/g, " ");
            toolSelect.appendChild(option);
        }
    });
}

function formatWikiText(text) {
    if (!text) return "";

    // 1. SCHRITT: Ersetze alle \n durch echte HTML-Zeilenumbrüche (<br>)
    let formatted = text.replace(/\\n/g, "<br>");

    // 2. SCHRITT: Suche nach Wiki-Links im Format <kategorie/eintrag>
    // Beispiel: <resource/rote_beete>
    const linkRegex = /<([^>]+)\/([^>]+)>/g;
    
    formatted = formatted.replace(linkRegex, (match, category, entry) => {
        // Macht den Link-Namen hübsch für den Benutzer (z.B. rote_beete -> Rote beete)
        const displayName = entry.charAt(0).toUpperCase() + entry.slice(1).replace(/_/g, " ");
        
        // Gibt einen anklickbaren HTML-Link mit speziellen Daten-Attributen zurück
        return `<span class="wiki-inline-link" onclick="navigateToWikiEntry('${category}', '${entry}')">${displayName}</span>`;
    });

    return formatted;
}

function navigateToWikiEntry(category, entry) {
    // 1. Haupt-Navigations-Tab auf "Wiki" umschalten, falls man im Rechner war
    const wikiNavBtn = document.querySelector('.nav button[onclick*="wiki"]') || document.querySelector('.nav button:nth-child(2)');
    if (wikiNavBtn && typeof showPage === "function") {
        showPage(wikiNavBtn, 'wiki');
    }

    // 2. Den richtigen Wiki-Untertab (z.B. resource, tools) aktivieren
    // Sucht den Tab-Button anhand des Kategorienamens
    const tabBtn = document.querySelector(`#wiki-tabs .btn-tab[onclick*="${category}"]`) || 
                    Array.from(document.querySelectorAll('#wiki-tabs .btn-tab')).find(b => b.textContent.toLowerCase().includes(category));
    
    if (tabBtn && typeof showWiki === "function") {
        showWiki(tabBtn, category);
    }

    // 3. Die Liste neu rendern und den spezifischen Eintrag direkt öffnen
    if (typeof renderList === "function") {
        renderList(category);
    }
    if (typeof openDetail === "function") {
        openDetail(category, entry);
    }
}

let isPopStateAction = false;

function saveBrowserHistory(page, subTab = null, entry = null) {
    // Wenn die Aktion von den Browser-Pfeilen kommt, darf KEIN neuer Eintrag erzeugt werden!
    if (isPopStateAction === true) return;

    const state = { page, subTab, entry };
    
    // Verhindert doppelte identische Verlaufs-Einträge
    if (history.state && 
        history.state.page === page && 
        history.state.subTab === subTab && 
        history.state.entry === entry) {
        return;
    }
    
    history.pushState(state, "", "");
}

window.addEventListener("popstate", (event) => {
    if (!event.state) {
        const wikiNavBtn = document.querySelector(".nav button");
        if (wikiNavBtn && typeof showPage === "function") {
            showPage(wikiNavBtn, "wiki");
        }
        return;
    }

    const { page, subTab, entry } = event.state;

    // Aktiviert die Sicherheitsbremse: Die Funktionen wissen jetzt, dass wir ZURÜCKgehen
    isPopStateAction = true;

    // 1. Hauptseite wiederherstellen
    const targetNavBtn = document.getElementById("nav-" + page) || 
                         document.querySelector(`.nav button[onclick*="${page}"]`) || 
                         Array.from(document.querySelectorAll('.nav button')).find(b => b.textContent.toLowerCase().includes(page));
    if (targetNavBtn && typeof showPage === "function") {
        showPage(targetNavBtn, page);
    }

    // 2. Wiki-Untertab wiederherstellen
    if (page === "wiki" && subTab) {
        const targetTabBtn = document.querySelector(`#wiki-tabs .btn-tab[onclick*="${subTab}"]`) || 
                             Array.from(document.querySelectorAll('#wiki-tabs .btn-tab')).find(b => b.textContent.toLowerCase().includes(subTab));
        if (targetTabBtn && typeof showWiki === "function") {
            showWiki(targetTabBtn, subTab);
        }

        // Rendert die alphabetische Liste des Untertabs verlässlich neu
        if (typeof renderList === "function") {
            renderList(subTab);
        }

        // 3. Detail-Ansicht (Infobox) wiederherstellen oder sauber schließen
        if (entry) {
            if (typeof openDetail === "function") openDetail(subTab, entry);
        } else {
            if (typeof closeDetail === "function") closeDetail(subTab);
        }
    }

    // Deaktiviert die Sicherheitsbremse wieder, damit manuelle Klicks wieder gespeichert werden
    isPopStateAction = false;
});

window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const activeNavBtn = document.querySelector(".nav button.active");
        const page = activeNavBtn ? (activeNavBtn.textContent.toLowerCase().includes("wiki") ? "wiki" : "rechner") : "wiki";
        
        const activeWikiTab = document.querySelector("#wiki-tabs .btn-tab.active");
        // Extrahiert den aktuellen Typ-String (z.B. 'resource' oder 'mobs') aus dem onclick-Attribut
        const subTab = activeWikiTab ? activeWikiTab.getAttribute("onclick")?.match(/'([^']+)'/)?.[1] : "mobs";

        history.replaceState({ page, subTab, entry: null }, "", "");
    }, 100);
});
