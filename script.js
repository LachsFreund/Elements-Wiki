let wiki = {
    mob: {},
    resource: {}
};

let activeWikiTab = "mob";

function renderList(type){
    const container = document.getElementById("wiki-" + type);
    if(!container) return;

    container.innerHTML = "";

    // Absicherung: Falls die Kategorie leer ist oder nicht existiert
    if (!wiki[type] || Object.keys(wiki[type]).length === 0) {
        container.innerHTML = "<div class='wiki-empty'>Noch keine Einträge vorhanden.</div>";
        return;
    }

    const entries = Object.keys(wiki[type]).sort();

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
    if(!wiki[type]) return;

    select.innerHTML = "";

    const keys = Object.keys(wiki[type]);
    
    if(keys.length === 0) {
        const option = document.createElement("option");
        option.textContent = "-- Keine Einträge --";
        option.value = "";
        select.appendChild(option);
        return;
    }

    keys.forEach(key => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
        select.appendChild(option);
    });
}

// MINECRAFT ELEMENTS FARM CALCULATOR (Kills, Skill-XP & Level-XP)
function calculateFarm(){
    const typeSelect = document.getElementById("typeSelect");
    const mobSelect = document.getElementById("mobSelect");
    const amountInput = document.getElementById("amount");
    const unitSelect = document.getElementById("unit");
    const result = document.getElementById("result");

    if(!typeSelect || !mobSelect || !amountInput || !unitSelect || !result) return;

    const type = typeSelect.value;
    const name = mobSelect.value;
    const unit = unitSelect.value;

    let duration = parseFloat(amountInput.value);

    if (isNaN(duration) || duration <= 0) {
        result.innerText = "Ungültige Dauer";
        return;
    }

    const data = wiki?.[type]?.[name];

    if (!data || Object.keys(data).length === 0 || 
        !("skill_xp" in data) || !("lvl_xp" in data) || !("respawn_sekunden" in data)) {
        result.innerText = "No Data";
        return;
    }

    const baseSkillXp = Number(data.skill_xp);
    const baseLvlXp = Number(data.lvl_xp);
    const respawnTime = Number(data.respawn_sekunden);

    if (!Number.isFinite(baseSkillXp) || !Number.isFinite(baseLvlXp) || !Number.isFinite(respawnTime) || respawnTime <= 0) {
        result.innerText = "No Data";
        return;
    }

    let totalSeconds = duration * 60;
    if (unit === "h") {
        totalSeconds = duration * 3600;
    }

    const totalKills = Math.floor(totalSeconds / respawnTime);

    if (totalKills <= 0) {
        result.innerText = "Farmdauer zu kurz für einen Respawn!";
        return;
    }

    const totalSkillXp = baseSkillXp * totalKills;
    const totalLvlXpGained = baseLvlXp * totalKills; 

    result.innerText = `ANZAHL KILLS: ${totalKills} | SKILL XP: +${totalSkillXp} | LVL XP: +${totalLvlXpGained}`;
}

//WIKI INFO
function openDetail(type, name){
    const list = document.getElementById("wiki-" + type);
    const detail = document.getElementById("wiki-" + type + "-detail");

    if(!list || !detail) return;

    const data = wiki[type]?.[name] || {};
    
    let mainText = "Keine Beschreibung verfügbar.";
    let imageUrl = "";
    let infoboxRowsHtml = "";

    // Schleife durch alle Keys des Objekts
    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        
        if (lowerKey === "text") {
            mainText = value;
        } else if (lowerKey === "image") {
            imageUrl = value;
        } else {
            infoboxRowsHtml += `
                <div class="wiki-stat-row">
                    <span class="wiki-stat-key">${key.toUpperCase()}</span>
                    <span class="wiki-stat-value">${value}</span>
                </div>
            `;
        }
    }

    // Falls gar keine Stats vorhanden sind, nutze dein Design-System für den Text
    if (infoboxRowsHtml === "" && !imageUrl) {
        infoboxRowsHtml = "<div style='padding:5px; text-align:center; color:var(--light-gray);'>Keine Daten</div>";
    }

    list.style.display = "none";
    detail.style.display = "block";

    detail.innerHTML = `
        <div class="wiki-detail-container">
            
            <!-- Linke Seite: Steuerung und Beschreibung -->
            <div class="wiki-main-content">
                <!-- Der Zurück-Button sitzt jetzt hier, wodurch die Box rechts nach ganz oben rutscht -->
                <button class="btn-tab" onclick="closeDetail('${type}')">← ZURÜCK</button>
                
                <h2>${name.toUpperCase()}</h2>
                <p style="color: var(--light-gray); font-style: italic; margin-top: -5px; margin-bottom: 20px;">
                    Kategorie: ${type.toUpperCase()}
                </p>

                <p>${mainText}</p>
            </div>

            <!-- Rechte Seite: Fandom-Infobox (schiebt sich jetzt ganz nach oben) -->
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
    
    // Event-Listener für das Dropdown im Rechner hinzufügen
    const typeSelect = document.getElementById("typeSelect");
    if(typeSelect) {
        typeSelect.addEventListener("change", updateMobList);
    }
    
    // 1. FIX: Simuliere den Klick auf den ersten Wiki-Tab-Button direkt nach dem Laden
    const firstTabBtn = document.querySelector("#wiki-tabs .btn-tab");
    if (firstTabBtn) {
        showWiki(firstTabBtn, activeWikiTab);
    }

    // 2. FIX: Finde heraus, welcher Haupt-Navigations-Button aktuell '.active' im HTML ist
    const activeNavBtn = document.querySelector(".nav button.active");
    if (activeNavBtn) {
        // Falls ein Button (z.B. Rechner oder Wiki) aktiv ist, lade dessen zugehörige Page
        // Voraussetzung: Dein Button benötigt im HTML z.B. onclick="showPage(this, 'wiki')"
        // Wenn kein Onclick-Attribut ausgelesen werden kann, erzwingen wir die Wiki-Page als Start:
        const isWikiActive = activeNavBtn.textContent.toLowerCase().includes("wiki");
        if (isWikiActive) {
            showPage(activeNavBtn, "wiki");
        }
    } else {
        // Fallback: Falls beim Laden gar kein Button aktiv markiert ist, schalte das Wiki standardmäßig ein
        const wikiNavBtn = document.querySelector(".nav button"); // Nimmt den ersten Nav-Button
        if (wikiNavBtn) {
            showPage(wikiNavBtn, "wiki");
        }
    }
    
    updateMobList();
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