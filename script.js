let wiki = {
    mob: {},
    resource: {},
    arena: {}
};

const FRUCHT_SYSTEM = {
    combat: { name: "Combat Frucht", prozent: 100 },
    magic:  { name: "Magic Frucht",  prozent: 50 },
    mining: { name: "Mining Frucht", prozent: 100 },
    farming:{ name: "Farming Frucht",prozent: 100 },
    wood:   { name: "Wood Frucht",   prozent: 100 }
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

    const entries = Object.keys(category.entries).sort();

    entries.forEach(name => {
        const div = document.createElement("div");
        div.className = "wiki-item";
        div.innerText = name.charAt(0).toUpperCase() + name.slice(1);
        div.onclick = () => openDetail(type, name);
        container.appendChild(div);
    });
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

    toggleInputFields();
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

    // Setzt die Textfarbe des Ergebnisses standardmäßig auf Weiß zurück, damit es nicht rot bleibt
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

    // FIX: Macht die Mobs-Suche unempfindlich gegen Groß-/Kleinschreibung (sucht z.B. nach "höhlenspinne")
    let data = category.entries[name];
    if (!data) {
        const lowerName = name.toLowerCase();
        const foundKey = Object.keys(category.entries).find(k => k.toLowerCase() === lowerName);
        if (foundKey) data = category.entries[foundKey];
    }

    if (!data || Object.keys(data).length === 0 || !("skill_xp" in data) || !("lvl_xp" in data)) {
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

    const baseSkillXp = Number(data.skill_xp);
    const baseLvlXp = Number(data.lvl_xp);

    if (!Number.isFinite(baseSkillXp) || !Number.isFinite(baseLvlXp)) {
        result.style.color = "red";
        result.innerText = "No Data";
        return;
    }

    // 1. Server-Boost berechnen (x2 bei Boost, sonst x1)
    const xpBoostChecked = document.getElementById("xpBoost")?.checked;
    const boostMultiplier = xpBoostChecked ? 2 : 1;

    // 2. Frucht-Boost über das zentrale System auslesen
    const fruchtChecked = document.getElementById("fruchtBoost")?.checked;
    let skillFruchtBonusFactor = 1; 

    if (fruchtChecked && data.frucht && typeof FRUCHT_SYSTEM !== "undefined" && FRUCHT_SYSTEM[data.frucht]) {
        skillFruchtBonusFactor = 1 + (FRUCHT_SYSTEM[data.frucht].prozent / 100);
    }

    // 3. Multiplikatoren zusammenführen
    const finalSkillMultiplier = boostMultiplier * skillFruchtBonusFactor;
    const finalLvlMultiplier = boostMultiplier; 

    const realSkillXpPerKill = baseSkillXp * finalSkillMultiplier;
    const realLvlXpPerKill = baseLvlXp * finalLvlMultiplier;

    // ==========================================
    // ARENA-LOGIK (Rechnen mit Keys)
    // ==========================================
    if (type === "arena") {
        const keysCost = Number(data.keys_benoetigt) || 1; 
        const totalRuns = Math.floor(inputValue / keysCost);

        if (totalRuns <= 0) {
            result.style.color = "red";
            result.innerText = "Nicht genug Keys für einen Arena-Run!";
            return;
        }

        result.innerText = `RUNS: ${totalRuns} | SKILL XP: +${realSkillXpPerKill * totalRuns} | LVL XP: +${realLvlXpPerKill * totalRuns}`;
        return;
    }

    // ==========================================
    // LOGIK FÜR MOBS / RESOURCES
    // ==========================================
    if (!("respawn_sekunden" in data)) {
        result.style.color = "red";
        result.innerText = "No Data (Respawnzeit fehlt)";
        return;
    }
    const respawnTime = Number(data.respawn_sekunden);
    if (respawnTime <= 0) { result.style.color = "red"; result.innerText = "No Data"; return; }

    const mode = calcMode.value;

    // MODUS A: Nach Zeit rechnen
    if (mode === "zeit") {
        const unitSelect = document.getElementById("unit");
        const unit = unitSelect ? unitSelect.value : "min";
        
        let totalSeconds = inputValue * 60;
        if (unit === "h") totalSeconds = inputValue * 3600;

        const totalKills = Math.floor(totalSeconds / respawnTime);

        if (totalKills <= 0) {
            result.style.color = "red";
            result.innerText = "Farmdauer zu kurz für einen Respawn!";
            return;
        }

        result.innerText = `${actionWord}: ${totalKills} | SKILL XP: +${realSkillXpPerKill * totalKills} | LVL XP: +${realLvlXpPerKill * totalKills}`;
    } 
    // MODUS B: Nach Wunsch-Skill-XP rechnen
    else if (mode === "target_skill") {
        const requiredKills = Math.ceil(inputValue / realSkillXpPerKill);
        
        const totalSecondsNeeded = requiredKills * respawnTime;
        const hours = Math.floor(totalSecondsNeeded / 3600);
        const minutes = Math.ceil((totalSecondsNeeded % 3600) / 60);

        let timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        result.innerText = `${actionWordRequired}: ${requiredKills} | FARMZEIT: ca. ${timeStr} | ERHALTENE LVL XP: +${requiredKills * realLvlXpPerKill}`;
    } 
    // MODUS C: Nach Wunsch-Level-XP rechnen
    else if (mode === "target_lvl") {
        const requiredKills = Math.ceil(inputValue / realLvlXpPerKill);
        
        const totalSecondsNeeded = requiredKills * respawnTime;
        const hours = Math.floor(totalSecondsNeeded / 3600);
        const minutes = Math.ceil((totalSecondsNeeded % 3600) / 60);

        let timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        result.innerText = `${actionWordRequired}: ${requiredKills} | FARMZEIT: ca. ${timeStr} | ERHALTENE SKILL XP: +${requiredKills * realSkillXpPerKill}`;
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

            // FIX: Nutzt jetzt wieder deine korrekte CSS-Klasse ".wiki-stat-row" für die Boxen!
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
            
            <!-- Linke Seite: Beschreibung -->
            <div class="wiki-main-content">
                <button class="btn-tab" onclick="closeDetail('${type}')">← ZURÜCK</button>
                <h2>${name.toUpperCase()}</h2>
                <p style="color: var(--light-gray); font-style: italic; margin-top: 5px; margin-bottom: 20px;">
                    Kategorie: ${type.toUpperCase()}
                </p>
                <p>${mainText}</p>
            </div>

            <!-- Rechte Seite: Fandom-Infobox (FIX: Klassen korrigiert) -->
            <div class="wiki-infobox">
                <h3>${name.toUpperCase()}</h3>
                ${imageUrl ? `<img src="images/${imageUrl}" alt="${name}">` : ''}
                ${infoboxRowsHtml}
            </div>

        </div>
    `;

    const wikiContent = document.getElementById("wiki-content");
    if (wikiContent) wikiContent.scrollTop = 0;
}



function closeDetail(type){
    const list = document.getElementById("wiki-" + type);
    const detail = document.getElementById("wiki-" + type + "-detail");

    if(list) list.style.display = "block";
    if(detail) detail.style.display = "none";
}

window.addEventListener("DOMContentLoaded", async () => {

    await loadWiki();
    
    const typeSelect = document.getElementById("typeSelect");
    if(typeSelect) {
        typeSelect.addEventListener("change", updateMobList);
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
                const currentData = wiki?.[typeSelect.value]?.[mobSelect.value];
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
    toggleInputFields();
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
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        select.appendChild(option);
    });
}

function toggleInputFields() {
    const typeSelect = document.getElementById("typeSelect");
    const calcMode = document.getElementById("calcMode");
    const modeContainer = document.getElementById("calc-mode-container");
    const amountInput = document.getElementById("amount");
    const unitSelect = document.getElementById("unit");

    if (!typeSelect || !amountInput || !unitSelect || !calcMode) return;

    const type = typeSelect.value;
    amountInput.style.width = ""; 

    if (type === "arena") {
        if (modeContainer) modeContainer.style.display = "none"; 
        unitSelect.style.display = "none";                      
        amountInput.placeholder = "Anzahl Keys";
    } else {
        if (modeContainer) modeContainer.style.display = "block"; 
        const mode = calcMode.value;

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