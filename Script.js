document.addEventListener('DOMContentLoaded', function() {
    const nyOppgaveInput = document.getElementById('nyOppgaveInput');
    const kategoriVelger = document.getElementById('kategoriVelger');
    const typeVelger = document.getElementById('typeVelger'); 
    const leggTilKnapp = document.getElementById('leggTilKnapp');
    const oppgaveListe = document.getElementById('oppgaveListe');
    const visningsFilter = document.getElementById('visningsFilter');
    const typeFilterVelger = document.getElementById('typeFilterVelger'); 
    const avhukAlleKnapp = document.getElementById('avhukAlleKnapp');
    const oppgaveTellerDisplay = document.getElementById('oppgaveTeller');
    const fetKnapp = document.getElementById('fetKnapp'); 

    const UTFORTE_OVERSKRIFT_ID = 'utforte-oppgaver-overskrift-li'; // Korrekt variabelnavn
    const LOCAL_STORAGE_KEY = 'minGjoremalslisteData_v2_debug'; 
    let draggedItem = null; 

    const blyantIkonSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168z"/></svg>`;
    const lagreIkonSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z"/></svg>`;

    function sanitizeTaskHTML(htmlString) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString; 
        const cleanDiv = document.createElement('div');
        function processNode(node, parentCleanNode) {
            if (node.nodeType === Node.TEXT_NODE) {
                parentCleanNode.appendChild(document.createTextNode(node.textContent));
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                if (tagName === 'strong' || tagName === 'b') {
                    const newNode = document.createElement(tagName);
                    for (const child of node.childNodes) { 
                        processNode(child, newNode);
                    }
                    parentCleanNode.appendChild(newNode);
                } else if (tagName === 'br') { 
                    parentCleanNode.appendChild(document.createElement('br'));
                } else { 
                    for (const child of node.childNodes) {
                        processNode(child, parentCleanNode);
                    }
                }
            }
        }
        for (const child of tempDiv.childNodes) {
            processNode(child, cleanDiv);
        }
        return cleanDiv.innerHTML;
    }

    function oppdaterFetKnappStatus() {
        const aktivEditor = document.activeElement;
        if (aktivEditor && aktivEditor.isContentEditable && 
            (aktivEditor.id === 'nyOppgaveInput' || (aktivEditor.classList.contains('oppgave-tekst') && aktivEditor.closest('li')?.classList.contains('redigerer-oppgave')))) {
            try {
                if (document.queryCommandState('bold')) {
                    fetKnapp.classList.add('format-knapp-aktiv');
                } else {
                    fetKnapp.classList.remove('format-knapp-aktiv');
                }
            } catch (e) {
                fetKnapp.classList.remove('format-knapp-aktiv');
            }
        } else {
            fetKnapp.classList.remove('format-knapp-aktiv'); 
        }
    }

    function saveTasksToLocalStorage() {
        console.log("--- Kaller saveTasksToLocalStorage ---"); 
        const tasks = [];
        oppgaveListe.querySelectorAll(`li:not(#${UTFORTE_OVERSKRIFT_ID})`).forEach(li => {
            const tekstSpan = li.querySelector('.oppgave-tekst');
            if (tekstSpan) {
                tasks.push({
                    id: li.id,
                    html: tekstSpan.innerHTML,
                    kategori: li.dataset.kategori,
                    oppgaveType: li.dataset.oppgaveType,
                    fullfort: li.classList.contains('fullfort')
                });
            } else {
                console.warn("SAVE: Fant ikke .oppgave-tekst for li med ID:", li.id); 
            }
        });
        const dataToSave = JSON.stringify(tasks);
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
            console.log("SAVE: Oppgaver lagret. Antall:", tasks.length); 
            const verifySaved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (verifySaved === dataToSave) {
                console.log("SAVE: VERIFISERT - Data i localStorage matcher.");
            } else {
                console.warn("SAVE: VERIFISERING FEILET - Data i localStorage er annerledes eller ikke satt!");
            }
        } catch (e) {
            console.error("SAVE: Feil ved lagring til localStorage:", e); 
        }
    }

    function loadTasksFromLocalStorage() {
        console.log("--- Kaller loadTasksFromLocalStorage ---"); 
        const savedTasksJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedTasksJSON) {
            console.log("LOAD: Fant data i localStorage. Lengde:", savedTasksJSON.length); 
            try {
                const taskDataArray = JSON.parse(savedTasksJSON);
                 console.log("LOAD: Data parset. Antall:", taskDataArray.length, taskDataArray); 
                taskDataArray.sort((a, b) => a.fullfort - b.fullfort); 
                
                taskDataArray.forEach(taskData => {
                    const li = createTaskElement(taskData); 
                    oppgaveListe.appendChild(li); 
                });
            } catch (e) {
                console.error("LOAD: Feil ved parsing av data fra localStorage:", e); 
                localStorage.removeItem(LOCAL_STORAGE_KEY); 
            }
        } else {
            console.log("LOAD: Ingen data funnet i localStorage for nøkkel:", LOCAL_STORAGE_KEY); 
        }
    }

    function oppdaterOppgaveTeller() {
        const alleOppgaverNoder = oppgaveListe.querySelectorAll(`li:not(#${UTFORTE_OVERSKRIFT_ID})`);
        let antallSynligeTotalt = 0;
        let antallSynligeFullfort = 0;
        alleOppgaverNoder.forEach(oppgaveNode => {
            if (oppgaveNode.style.display !== 'none') {
                antallSynligeTotalt++;
                if (oppgaveNode.classList.contains('fullfort')) {
                    antallSynligeFullfort++;
                }
            }
        });
        oppgaveTellerDisplay.textContent = `${antallSynligeFullfort}/${antallSynligeTotalt}`;
    }
    
    function oppdaterUtforteOverskrift() {
        let eksisterendeOverskrift = document.getElementById(UTFORTE_OVERSKRIFT_ID);
        if (eksisterendeOverskrift) {
            eksisterendeOverskrift.remove();
        }
        const forsteFullforte = oppgaveListe.querySelector('li.fullfort');
        if (forsteFullforte) {
            const nyOverskrift = document.createElement('li');
            nyOverskrift.id = UTFORTE_OVERSKRIFT_ID;
            nyOverskrift.className = 'utforte-oppgaver-overskrift';
            nyOverskrift.textContent = 'Utførte oppgaver';
            nyOverskrift.draggable = false; 
            nyOverskrift.addEventListener('dragover', e => {e.preventDefault(); e.stopPropagation();}); 
            nyOverskrift.addEventListener('drop', e => {e.preventDefault(); e.stopPropagation();});     
            oppgaveListe.insertBefore(nyOverskrift, forsteFullforte);
        }
    }

    function oppdaterSynligeOppgaver() {
        const aktivtLokasjonsFilter = visningsFilter.value;
        const aktivtTypeFilter = typeFilterVelger.value; 
        const alleOppgaverIListe = oppgaveListe.querySelectorAll('li');
        
        alleOppgaverIListe.forEach(oppgaveElement => {
            if (oppgaveElement.id === UTFORTE_OVERSKRIFT_ID) {
                const harFullforte = oppgaveListe.querySelector('li.fullfort');
                oppgaveElement.style.display = harFullforte ? 'flex' : 'none';
                return;
            }
            const oppgaveKategori = oppgaveElement.dataset.kategori;
            const oppgaveType = oppgaveElement.dataset.oppgaveType; 
            let lokasjonMatch = false;
            let typeMatch = false;
            if (aktivtLokasjonsFilter === 'alle') {
                lokasjonMatch = true;
            } else if (aktivtLokasjonsFilter === 'brygga_kontekst') {
                if (oppgaveKategori === 'Brygga' || oppgaveKategori === 'Felles') {
                    lokasjonMatch = true;
                }
            } else if (aktivtLokasjonsFilter === 'markens_kontekst') {
                if (oppgaveKategori === 'Markens' || oppgaveKategori === 'Felles') {
                    lokasjonMatch = true;
                }
            }
            if (aktivtTypeFilter === 'begge') {
                typeMatch = true;
            } else if (oppgaveType === aktivtTypeFilter) {
                typeMatch = true;
            }
            oppgaveElement.style.display = (lokasjonMatch && typeMatch) ? 'flex' : 'none';
        });
        oppdaterUtforteOverskrift(); 
        oppdaterOppgaveTeller();
    }

    function reposisjonerOppgave(liElement, erFullfort) {
        if (erFullfort) {
            liElement.draggable = false;
            liElement.style.cursor = 'default';
            oppgaveListe.appendChild(liElement); 
        } else {
            liElement.draggable = true;
            liElement.style.cursor = 'grab';
            let referanseNode = document.getElementById(UTFORTE_OVERSKRIFT_ID) || oppgaveListe.querySelector('li.fullfort');
            if (referanseNode) {
                oppgaveListe.insertBefore(liElement, referanseNode);
            } else {
                oppgaveListe.appendChild(liElement); 
            }
        }
    }

    function createTaskElement(taskData) {
        const li = document.createElement('li');
        li.id = taskData.id;
        li.dataset.kategori = taskData.kategori;
        li.dataset.oppgaveType = taskData.oppgaveType;
        
        if (taskData.fullfort) {
            li.classList.add('fullfort');
        }
        li.draggable = !taskData.fullfort;
        li.style.cursor = taskData.fullfort ? 'default' : 'grab';

        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragend', handleDragEnd);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = taskData.fullfort;
        checkbox.addEventListener('change', function() {
            if (li.classList.contains('redigerer-oppgave')) { 
                this.checked = !this.checked; 
                return;
            }
            const erFullfortNa = this.checked;
            if (erFullfortNa) {
                li.classList.add('fullfort');
            } else {
                li.classList.remove('fullfort');
            }
            reposisjonerOppgave(li, erFullfortNa); 
            oppdaterUtforteOverskrift();          
            oppdaterOppgaveTeller();              
            saveTasksToLocalStorage();            
        });

        const tekstContainer = document.createElement('div');
        tekstContainer.className = 'oppgave-tekst-container';
        const tekstSpan = document.createElement('span');
        tekstSpan.className = 'oppgave-tekst';
        tekstSpan.innerHTML = taskData.html; 
        tekstContainer.appendChild(tekstSpan);
        
        const kategoriSpan = document.createElement('span');
        kategoriSpan.className = 'kategori-tekst-display';
        kategoriSpan.textContent = `(${taskData.kategori}`; 
        const typeSpan = document.createElement('span'); 
        typeSpan.className = 'type-tekst-display';
        typeSpan.textContent = ` / ${taskData.oppgaveType})`; 
        const metaInfoContainer = document.createElement('div'); 
        metaInfoContainer.style.display = 'flex';
        metaInfoContainer.appendChild(kategoriSpan);
        metaInfoContainer.appendChild(typeSpan);
        tekstContainer.appendChild(metaInfoContainer);

        const kontrollerDiv = document.createElement('div');
        kontrollerDiv.className = 'oppgave-kontroller';
        const redigerKnapp = document.createElement('button');
        redigerKnapp.className = 'rediger-knapp';
        redigerKnapp.innerHTML = blyantIkonSvg;
        redigerKnapp.title = "Rediger oppgave";
        redigerKnapp.type = "button";
        redigerKnapp.addEventListener('click', function() {
            toggleRedigeringsmodus(li, tekstSpan, redigerKnapp);
        });

        const fjernKnapp = document.createElement('button');
        fjernKnapp.className = 'fjern-knapp';
        fjernKnapp.textContent = 'Fjern';
        fjernKnapp.type = "button";
        fjernKnapp.addEventListener('click', function() {
            if (li.classList.contains('redigerer-oppgave')) return; 
            oppgaveListe.removeChild(li);
            oppdaterSynligeOppgaver(); 
            saveTasksToLocalStorage();
        });

        kontrollerDiv.appendChild(redigerKnapp);
        kontrollerDiv.appendChild(fjernKnapp);

        li.appendChild(checkbox);
        li.appendChild(tekstContainer);
        li.appendChild(kontrollerDiv);
        
        return li;
    }

    function toggleRedigeringsmodus(li, tekstSpan, redigerKnapp) {
        const erIredigeringsmodus = li.classList.contains('redigerer-oppgave');
        const checkbox = li.querySelector('input[type="checkbox"]');
        const fjernKnappElem = li.querySelector('.fjern-knapp');

        if (erIredigeringsmodus) { 
            const nyHtml = tekstSpan.innerHTML.trim();
            const sanertLagretHtml = sanitizeTaskHTML(nyHtml);
            tekstSpan.innerHTML = sanertLagretHtml; 
            
            tekstSpan.contentEditable = 'false';
            li.classList.remove('redigerer-oppgave');
            redigerKnapp.innerHTML = blyantIkonSvg; 
            redigerKnapp.title = "Rediger oppgave";

            if(checkbox) checkbox.disabled = false;
            if(fjernKnappElem) fjernKnappElem.disabled = false; 
            li.draggable = !li.classList.contains('fullfort'); 
            li.style.cursor = li.classList.contains('fullfort') ? 'default' : 'grab';

            tekstSpan.onkeydown = null;
            tekstSpan.onblur = null; 
            oppdaterFetKnappStatus(); 
            console.log("Redigering lagret, kaller saveTasksToLocalStorage."); 
            saveTasksToLocalStorage(); 
        } else { 
            const annenRedigerendeOppgave = oppgaveListe.querySelector('li.redigerer-oppgave');
            if (annenRedigerendeOppgave && annenRedigerendeOppgave !== li) {
                const annenTekstSpan = annenRedigerendeOppgave.querySelector('.oppgave-tekst');
                const annenRedigerKnapp = annenRedigerendeOppgave.querySelector('.rediger-knapp');
                if (annenTekstSpan && annenRedigerKnapp) {
                    toggleRedigeringsmodus(annenRedigerendeOppgave, annenTekstSpan, annenRedigerKnapp); 
                }
            }

            tekstSpan.dataset.originalHtml = tekstSpan.innerHTML; 
            tekstSpan.contentEditable = 'true';
            li.classList.add('redigerer-oppgave');
            redigerKnapp.innerHTML = lagreIkonSvg; 
            redigerKnapp.title = "Lagre endringer";
            li.draggable = false; 
            li.style.cursor = 'text';
            
            if(checkbox) checkbox.disabled = true;
            if(fjernKnappElem) fjernKnappElem.disabled = true; 

            tekstSpan.focus();
            try {
                document.execCommand('selectAll', false, null);
            } catch(e) { 
                const range = document.createRange();
                range.selectNodeContents(tekstSpan);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
             }

            tekstSpan.onkeydown = function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    toggleRedigeringsmodus(li, tekstSpan, redigerKnapp); 
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    tekstSpan.innerHTML = tekstSpan.dataset.originalHtml; 
                    toggleRedigeringsmodus(li, tekstSpan, redigerKnapp); 
                }
            };
            tekstSpan.onblur = function(e) {
                if (e.relatedTarget === redigerKnapp || e.relatedTarget === fetKnapp) return; 
                
                setTimeout(() => {
                    if (li.classList.contains('redigerer-oppgave')) {
                         toggleRedigeringsmodus(li, tekstSpan, redigerKnapp); 
                    }
                }, 150); 
            };
            oppdaterFetKnappStatus(); 
        }
    }

    function leggTilOppgave() {
        const oppgaveHtmlInput = nyOppgaveInput.innerHTML.trim();
        const valgtKategoriForNyOppgave = kategoriVelger.value;
        const valgtTypeForNyOppgave = typeVelger.value; 
        if (oppgaveHtmlInput === "" || oppgaveHtmlInput === "<br>" || nyOppgaveInput.textContent.trim() === "") {
            alert("Du må skrive inn en oppgave!");
            nyOppgaveInput.focus();
            return;
        }
        const sanertHtml = sanitizeTaskHTML(oppgaveHtmlInput);

        const taskData = {
            id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            html: sanertHtml, 
            kategori: valgtKategoriForNyOppgave,
            oppgaveType: valgtTypeForNyOppgave,
            fullfort: false
        };
        
        const li = createTaskElement(taskData);
        
        let referanseNode = document.getElementById(UTFORTE_OVERSKRIFT_ID) || oppgaveListe.querySelector('li.fullfort');
        if (referanseNode) {
            oppgaveListe.insertBefore(li, referanseNode);
        } else {
            oppgaveListe.appendChild(li);
        }
        
        const aktivtLokasjonsFilter = visningsFilter.value;
        const aktivtTypeFilter = typeFilterVelger.value;
        let lokasjonMatch = false;
        if (aktivtLokasjonsFilter === 'alle' || 
            (aktivtLokasjonsFilter === 'brygga_kontekst' && (valgtKategoriForNyOppgave === 'Brygga' || valgtKategoriForNyOppgave === 'Felles')) ||
            (aktivtLokasjonsFilter === 'markens_kontekst' && (valgtKategoriForNyOppgave === 'Markens' || valgtKategoriForNyOppgave === 'Felles'))) {
            lokasjonMatch = true;
        }
        let typeMatch = false;
        if (aktivtTypeFilter === 'begge' || valgtTypeForNyOppgave === aktivtTypeFilter) {
            typeMatch = true;
        }
        li.style.display = (lokasjonMatch && typeMatch) ? 'flex' : 'none';

        nyOppgaveInput.innerHTML = ""; 
        oppdaterFetKnappStatus(); 
        nyOppgaveInput.focus();
        
        oppdaterUtforteOverskrift(); 
        oppdaterOppgaveTeller(); 
        console.log("Ny oppgave lagt til, kaller saveTasksToLocalStorage."); 
        saveTasksToLocalStorage();
    }

    function handleDragStart(e) {
        if (e.target.classList.contains('fullfort') || e.target.id === UTFORTE_OVERSKRIFT_ID || e.target.classList.contains('redigerer-oppgave')) {
            e.preventDefault(); 
            return;
        }
        draggedItem = e.target;
        setTimeout(() => { if(draggedItem) draggedItem.classList.add('dragging'); }, 0);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.id); 
    }

    function handleDragEnd(e) {
        if(draggedItem) {
            draggedItem.classList.remove('dragging');
        }
        draggedItem = null;
        console.log("Dra-og-slipp ferdig, kaller saveTasksToLocalStorage."); 
        saveTasksToLocalStorage(); 
    }

    oppgaveListe.addEventListener('dragover', function(e) {
        e.preventDefault(); 
        const targetLi = e.target.closest('li');
        if (draggedItem && !draggedItem.classList.contains('fullfort')) {
            if (targetLi && (targetLi.classList.contains('fullfort') || targetLi.id === UTFORTE_OVERSKRIFT_ID || targetLi.classList.contains('redigerer-oppgave'))) {
                e.dataTransfer.dropEffect = 'none'; 
                return;
            }
        }
        e.dataTransfer.dropEffect = 'move';
    });
    
    oppgaveListe.addEventListener('drop', function(e) {
        e.preventDefault();
        if (!draggedItem || draggedItem.classList.contains('fullfort') || draggedItem.classList.contains('redigerer-oppgave')) {
            return;
        }
        const afterElement = getDragAfterElement(oppgaveListe, e.clientY);
        let innsettingsPunkt = null;
        if (afterElement) {
             if (!afterElement.classList.contains('fullfort') && afterElement.id !== UTFORTE_OVERSKRIFT_ID && !afterElement.classList.contains('redigerer-oppgave')) {
                innsettingsPunkt = afterElement;
            }
        }
        if (!innsettingsPunkt) { 
            innsettingsPunkt = document.getElementById(UTFORTE_OVERSKRIFT_ID) || oppgaveListe.querySelector('li.fullfort');
        }
        if (innsettingsPunkt) {
            if (draggedItem !== innsettingsPunkt) { 
                 oppgaveListe.insertBefore(draggedItem, innsettingsPunkt);
            }
        } else {
            oppgaveListe.appendChild(draggedItem); 
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll(`li:not(.fullfort):not(.dragging):not(#${UTFORTE_OVERSKRIFT_ID}):not(.redigerer-oppgave)`)]
            .filter(li => li.style.display !== 'none' && li !== draggedItem);
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    avhukAlleKnapp.addEventListener('click', function() {
        const alleOppgaverNoder = Array.from(oppgaveListe.querySelectorAll('li'));
        let noeEndret = false;
        alleOppgaverNoder.forEach(oppgaveElement => {
            if (oppgaveElement.id === UTFORTE_OVERSKRIFT_ID || oppgaveElement.classList.contains('redigerer-oppgave')) return; 
            const checkbox = oppgaveElement.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) { 
                checkbox.checked = false;
                oppgaveElement.classList.remove('fullfort');
                reposisjonerOppgave(oppgaveElement, false); 
                noeEndret = true;
            }
        });
        if (noeEndret) { 
            oppdaterUtforteOverskrift(); 
            oppdaterOppgaveTeller();
            console.log("AvhukAlle endret oppgaver, kaller saveTasksToLocalStorage."); 
            saveTasksToLocalStorage();
        }
    });

    fetKnapp.addEventListener('click', function() {
        const aktivEditor = document.activeElement;
        if (aktivEditor && aktivEditor.isContentEditable &&
            (aktivEditor.id === 'nyOppgaveInput' || (aktivEditor.classList.contains('oppgave-tekst') && aktivEditor.closest('li')?.classList.contains('redigerer-oppgave')))) {
            aktivEditor.focus(); 
            document.execCommand('bold', false, null);
            oppdaterFetKnappStatus(); 
        }
    });
    
    nyOppgaveInput.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault(); 
            document.execCommand('bold', false, null);
            oppdaterFetKnappStatus(); 
        }
        if (e.key === 'Enter' && !e.shiftKey) { 
             e.preventDefault();
             leggTilKnapp.click(); 
        }
    });

    nyOppgaveInput.addEventListener('focus', oppdaterFetKnappStatus);
    document.addEventListener('selectionchange', () => {
        if (document.activeElement && document.activeElement.isContentEditable &&
            (document.activeElement.id === 'nyOppgaveInput' || (document.activeElement.classList.contains('oppgave-tekst') && document.activeElement.closest('li')?.classList.contains('redigerer-oppgave')))) {
            oppdaterFetKnappStatus();
        }
    });
    
    leggTilKnapp.addEventListener('click', leggTilOppgave);
    visningsFilter.addEventListener('change', oppdaterSynligeOppgaver);
    typeFilterVelger.addEventListener('change', oppdaterSynligeOppgaver);

    console.log("Initialiserer applikasjonen..."); // DEBUG
    loadTasksFromLocalStorage(); 
    oppdaterSynligeOppgaver();  
    nyOppgaveInput.focus();
    oppdaterFetKnappStatus();
    console.log("Applikasjon initialisert."); // DEBUG
});