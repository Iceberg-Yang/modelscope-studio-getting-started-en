(function () {
  "use strict";

  const storageKey = GAME_DATA.storageKey;
  const evidenceOptions = GAME_DATA.clues
    .filter((clue) => clue.truth === "real")
    .map((clue) => ({
      id: clue.id,
      text: clue.title
    }));

  const defaultState = {
    currentLocationId: "training-room",
    collectedClueIds: [],
    notes: "",
    history: [],
    dialogue: [],
    verdict: null,
    savedAt: null
  };

  let state = loadState();
  let lastAddedClueMessage = "";

  const els = {
    locationMap: document.getElementById("locationMap"),
    sceneTitle: document.getElementById("sceneTitle"),
    sceneDesc: document.getElementById("sceneDesc"),
    sceneEyebrow: document.getElementById("sceneEyebrow"),
    searchBtn: document.getElementById("searchBtn"),
    eventLog: document.getElementById("eventLog"),
    clueList: document.getElementById("clueList"),
    clueCount: document.getElementById("clueCount"),
    suspectList: document.getElementById("suspectList"),
    suspectSelect: document.getElementById("suspectSelect"),
    questionSelect: document.getElementById("questionSelect"),
    askBtn: document.getElementById("askBtn"),
    dialogueBox: document.getElementById("dialogueBox"),
    finalSuspect: document.getElementById("finalSuspect"),
    finalMotive: document.getElementById("finalMotive"),
    finalEvidence: document.getElementById("finalEvidence"),
    submitVerdictBtn: document.getElementById("submitVerdictBtn"),
    verdictResult: document.getElementById("verdictResult"),
    noteInput: document.getElementById("noteInput"),
    saveNoteBtn: document.getElementById("saveNoteBtn"),
    noteStatus: document.getElementById("noteStatus"),
    restartBtn: document.getElementById("restartBtn"),
    saveStatusBtn: document.getElementById("saveStatusBtn")
  };

  init();

  function init() {
    renderLocationMap();
    renderSuspectList();
    populateSelects();
    bindEvents();
    applyStateToUi();
    addHistory("Investigator entered the console. The missing model weights case is open.");
    persist(false);
  }

  function bindEvents() {
    els.searchBtn.addEventListener("click", searchCurrentLocation);
    els.saveNoteBtn.addEventListener("click", saveNotes);
    els.noteInput.addEventListener("input", function () {
      state.notes = els.noteInput.value;
    });
    els.restartBtn.addEventListener("click", restartGame);
    els.askBtn.addEventListener("click", askSelectedQuestion);
    els.submitVerdictBtn.addEventListener("click", submitVerdict);
    els.suspectSelect.addEventListener("change", updateQuestionOptions);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return structuredCloneSafe(defaultState);
      }

      const parsed = JSON.parse(raw);
      return normalizeState(parsed);
    } catch (error) {
      console.warn("Failed to read saved progress. Starting a new case:", error);
      return structuredCloneSafe(defaultState);
    }
  }

  function persist(showStatus) {
    try {
      state.savedAt = new Date().toISOString();
      localStorage.setItem(storageKey, JSON.stringify(state));
      if (showStatus) {
        flashSaveStatus("Saved");
      }
    } catch (error) {
      console.warn("Failed to save progress:", error);
      flashSaveStatus("Save failed");
    }
  }

  function normalizeState(saved) {
    const merged = Object.assign(structuredCloneSafe(defaultState), saved || {});
    if (!GAME_DATA.locations.some((location) => location.id === merged.currentLocationId)) {
      merged.currentLocationId = defaultState.currentLocationId;
    }
    if (!Array.isArray(merged.collectedClueIds)) {
      merged.collectedClueIds = [];
    }
    merged.collectedClueIds = uniqueValidIds(merged.collectedClueIds, GAME_DATA.clues);
    if (typeof merged.notes !== "string") {
      merged.notes = "";
    }
    if (!Array.isArray(merged.history)) {
      merged.history = [];
    }
    if (!Array.isArray(merged.dialogue)) {
      merged.dialogue = [];
    }
    return merged;
  }

  function structuredCloneSafe(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function uniqueValidIds(ids, collection) {
    const validIds = new Set(collection.map((item) => item.id));
    return Array.from(new Set(ids.filter((id) => validIds.has(id))));
  }

  function renderLocationMap() {
    els.locationMap.innerHTML = "";
    GAME_DATA.locations.forEach((location) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "map-btn map-" + location.id + (location.id === state.currentLocationId ? " active" : "");
      button.dataset.locationId = location.id;
      button.innerHTML = "<strong>" + escapeHtml(location.name) + "</strong><span>" + escapeHtml(location.short) + "</span>";
      button.addEventListener("click", function () {
        switchLocation(location.id);
      });
      els.locationMap.appendChild(button);
    });
  }

  function renderSuspectList() {
    els.suspectList.innerHTML = "";
    GAME_DATA.suspects.forEach((suspect) => {
      const card = document.createElement("article");
      card.className = "suspect-card";
      card.innerHTML =
        "<h3>" +
        escapeHtml(suspect.name) +
        "</h3>" +
        "<p><strong>Role: </strong>" +
        escapeHtml(suspect.role) +
        "</p>" +
        "<p>" +
        escapeHtml(suspect.profile) +
        "</p>" +
        "<p><strong>Motive clue: </strong>" +
        escapeHtml(suspect.motive) +
        "</p>" +
        "<p><strong>Alibi: </strong>" +
        escapeHtml(suspect.alibi) +
        "</p>";
      els.suspectList.appendChild(card);
    });
  }

  function populateSelects() {
    fillSelect(els.finalSuspect, GAME_DATA.suspects, "id", "name");
    fillSelect(els.finalMotive, GAME_DATA.motives.map((motive) => ({ id: motive, text: motive })), "id", "text");
    fillSelect(els.finalEvidence, evidenceOptions, "id", "text");
    fillSelect(
      els.suspectSelect,
      GAME_DATA.suspects.map((suspect) => ({ id: suspect.id, text: suspect.name })),
      "id",
      "text"
    );
    updateQuestionOptions();
  }

  function fillSelect(select, items, valueKey, textKey) {
    select.innerHTML = "";
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item[valueKey];
      option.textContent = item[textKey];
      select.appendChild(option);
    });
  }

  function updateQuestionOptions() {
    const suspectId = els.suspectSelect.value;
    const suspect = GAME_DATA.suspects.find((item) => item.id === suspectId);
    if (!suspect) {
      return;
    }

    const questions = getQuestionsForSuspect(suspectId);
    fillSelect(els.questionSelect, questions, "id", "text");
  }

  function getQuestionsForSuspect(suspectId) {
    const questionMap = {
      chief: [
        { id: "release-plan", text: "Why did you ask everyone to leave at 22:30?" },
        { id: "commercial-pressure", text: "Was the open-source plan affected by funding pressure?" },
        { id: "admin-contact", text: "What did you discuss with the data administrator before release night?" }
      ],
      intern: [
        { id: "cluster-restart", text: "Why did the training cluster restart at 22:41?" },
        { id: "script-permission", text: "Can you export model weights?" },
        { id: "night-alibi", text: "Were you in the training room all night?" }
      ],
      admin: [
        { id: "cold-drive", text: "Where was cold drive CM-17 last night?" },
        { id: "door-log", text: "The access log says you entered the model vault. Why?" },
        { id: "backup-gap", text: "Why is the backup index empty from 22:45 to 23:05?" }
      ],
      security: [
        { id: "camera-jump", text: "Why does the model vault hallway footage skip ten minutes?" },
        { id: "door-summary", text: "Can the access summary be manually edited?" },
        { id: "admin-access", text: "Who has maintenance-card access?" }
      ],
      investor: [
        { id: "exclusive-window", text: "Did you want an exclusive commercial window?" },
        { id: "admin-call", text: "Why did you contact the data administrator?" },
        { id: "vault-access", text: "Can you enter the model vault?" }
      ]
    };

    return questionMap[suspectId] || [];
  }

  function applyStateToUi() {
    const location = getCurrentLocation();
    els.sceneEyebrow.textContent = "Current Location";
    els.sceneTitle.textContent = location.name;
    els.sceneDesc.textContent = location.description;
    els.noteInput.value = state.notes || "";
    renderClues();
    renderHistory();
    renderDialogue();
    updateMapActive();
    updateQuestionOptions();
    renderVerdict();
  }

  function switchLocation(locationId) {
    const location = GAME_DATA.locations.find((item) => item.id === locationId);
    if (!location) {
      return;
    }
    state.currentLocationId = locationId;
    addHistory("Moved to location: " + location.name + ".");
    applyStateToUi();
    persist(true);
  }

  function searchCurrentLocation() {
    const location = getCurrentLocation();
    if (!location || !location.search) {
      addHistory("No clue worth recording was found here.");
      persist(true);
      return;
    }

    const clue = GAME_DATA.clues.find((item) => item.id === location.search.clueId);
    if (!clue) {
      addHistory("The scan did not produce a valid clue.");
      persist(true);
      return;
    }

    if (state.collectedClueIds.includes(clue.id)) {
      addHistory("Location already scanned: " + location.name + ". No duplicate clue recorded.");
      lastAddedClueMessage = "This location has already recorded: " + clue.title + ".";
      renderTransientMessage();
      persist(true);
      return;
    }

    state.collectedClueIds.push(clue.id);
    addHistory(location.search.message);
    lastAddedClueMessage = "Clue acquired: " + clue.title + ".";
    renderTransientMessage();
    applyStateToUi();
    persist(true);
  }

  function renderTransientMessage() {
    const oldText = els.eventLog.innerHTML;
    els.eventLog.innerHTML +=
      '<div class="log-entry"><time>NOTE</time>' + escapeHtml(lastAddedClueMessage) + "</div>";
    window.setTimeout(function () {
      renderHistory();
    }, 1800);
    setTimeoutState();
  }

  function setTimeoutState() {
    window.setTimeout(function () {
      if (lastAddedClueMessage) {
        lastAddedClueMessage = "";
      }
    }, 1900);
  }

  function askSelectedQuestion() {
    const suspectId = els.suspectSelect.value;
    const questionId = els.questionSelect.value;
    const suspect = GAME_DATA.suspects.find((item) => item.id === suspectId);
    const question = getQuestionsForSuspect(suspectId).find((item) => item.id === questionId);
    if (!suspect || !question) {
      return;
    }

    const answer = getAnswer(suspectId, questionId, suspect, question);
    state.dialogue.push(answer);
    if (state.dialogue.length > 8) {
      state.dialogue = state.dialogue.slice(-8);
    }
    addHistory("Questioned " + suspect.name + ": " + question.text);
    renderDialogue();
    persist(true);
  }

  function getAnswer(suspectId, questionId, suspect, question) {
    const answers = {
      chief: {
        "release-plan": {
          speaker: suspect.name,
          text: "\"I asked everyone to leave because the media materials were not finalized. But I never touched the vault.\"",
          note: "Her statement conflicts with the delayed-open-source plan written on the whiteboard at 22:36."
        },
        "commercial-pressure": {
          speaker: suspect.name,
          text: "\"The funding pressure is real, but I do not support stealing weights. That would destroy our open-source credibility.\"",
          note: "She has motive, but there is no evidence connecting her to the vault or cold drive."
        },
        "admin-contact": {
          speaker: suspect.name,
          text: "\"The data administrator warned me that maintenance costs would spiral after open source. I thought she was just complaining.\"",
          note: "This testimony connects the data administrator's motive to possible action."
        }
      },
      intern: {
        "cluster-restart": {
          speaker: suspect.name,
          text: "\"I saw the training job stop, but the initiating account was not mine. I only maintain scripts.\"",
          note: "The intern can explain the log anomaly, but not the weight transfer."
        },
        "script-permission": {
          speaker: suspect.name,
          text: "\"I cannot export weights, and I do not have access to model vault cold drives.\"",
          note: "The required technical permissions do not match."
        },
        "night-alibi": {
          speaker: suspect.name,
          text: "\"From 22:35 to 23:15, I was in the training room. The cameras can prove it.\"",
          note: "The timeline lowers his suspicion."
        }
      },
      admin: {
        "cold-drive": {
          speaker: suspect.name,
          text: "\"CM-17 should be in the backup room. I may have remembered incorrectly last night, and yes, the backup index did stop updating for a while.\"",
          note: "She admits the backup index gap and cannot explain the cold drive's location."
        },
        "door-log": {
          speaker: suspect.name,
          text: "\"I went to the vault only to check the cold drive status. I did not export anything.\"",
          note: "The access log matches the cold drive mount trace."
        },
        "backup-gap": {
          speaker: suspect.name,
          text: "\"The indexer gets stuck sometimes. This has happened before.\"",
          note: "The gap exactly covers the time when she left the backup room and exited the vault."
        }
      },
      security: {
        "camera-jump": {
          speaker: suspect.name,
          text: "\"The skipped footage is abnormal, but I did not delete the access summary. That system records independently.\"",
          note: "He can clip footage, but cannot modify the access summary."
        },
        "door-summary": {
          speaker: suspect.name,
          text: "\"The access summary cannot be edited by regular administrators. It is written automatically by the system.\"",
          note: "The access record is relatively trustworthy."
        },
        "admin-access": {
          speaker: suspect.name,
          text: "\"The data administrator has a maintenance card and can enter the model vault.\"",
          note: "The permissions point toward the data administrator."
        }
      },
      investor: {
        "exclusive-window": {
          speaker: suspect.name,
          text: "\"I wanted commercialization before open source. That is a reasonable investor request.\"",
          note: "The motive is obvious, but it is not a complete action chain."
        },
        "admin-call": {
          speaker: suspect.name,
          text: "\"I did contact the data administrator, only to ask whether open source would affect valuation.\"",
          note: "He contacted the data administrator, but has no vault access."
        },
        "vault-access": {
          speaker: suspect.name,
          text: "\"I cannot enter the model vault, and I do not have a cold backup drive.\"",
          note: "He lacks the key operating ability."
        }
      }
    };

    return Object.assign(
      {
        time: formatTime(new Date()),
        speaker: suspect.name,
        text: "No response yet.",
        note: "Keep collecting clues and cross-checking the chain."
      },
      answers[suspectId][questionId],
      { question: question.text }
    );
  }

  function renderClues() {
    const clues = state.collectedClueIds
      .map((id) => GAME_DATA.clues.find((clue) => clue.id === id))
      .filter(Boolean);

    els.clueCount.textContent = clues.length + "/" + GAME_DATA.clues.length;

    if (clues.length === 0) {
      els.clueList.innerHTML = '<div class="clue-card"><p>No clues collected yet. Select a location and click Scan Location.</p></div>';
      return;
    }

    els.clueList.innerHTML = "";
    clues.forEach((clue) => {
      const card = document.createElement("article");
      card.className = "clue-card " + clue.type + " " + clue.truth;
      card.innerHTML =
        "<strong>" +
        escapeHtml(clue.title) +
        "</strong>" +
        "<span class='badge " +
        clue.truth +
        "'>" +
        truthLabel(clue.truth) +
        "</span> " +
        "<span class='badge " +
        clue.type +
        "'>" +
        clue.type +
        "</span>" +
        "<p>" +
        escapeHtml(clue.text) +
        "</p>" +
        "<p><em>" +
        escapeHtml(clue.relevance) +
        "</em></p>";
      els.clueList.appendChild(card);
    });
  }

  function renderHistory() {
    els.eventLog.innerHTML = "";
    state.history.slice(-18).forEach((entry) => {
      const item = document.createElement("div");
      item.className = "log-entry";
      item.innerHTML = "<time>" + escapeHtml(entry.time) + "</time>" + escapeHtml(entry.text);
      els.eventLog.appendChild(item);
    });
  }

  function renderDialogue() {
    if (state.dialogue.length === 0) {
      els.dialogueBox.innerHTML = "<p>Choose a suspect and a question to view testimony and investigator notes.</p>";
      return;
    }

    els.dialogueBox.innerHTML = "";
    state.dialogue.slice(-4).forEach((item) => {
      const block = document.createElement("div");
      block.className = "log-entry";
      block.innerHTML =
        "<time>" +
        escapeHtml(item.time) +
        "</time>" +
        "<p><strong>" +
        escapeHtml(item.speaker) +
        ": </strong>" +
        escapeHtml(item.text) +
        "</p>" +
        "<p><em>Investigator note: " +
        escapeHtml(item.note) +
        "</em></p>";
      els.dialogueBox.appendChild(block);
    });
  }

  function submitVerdict() {
    const suspectId = els.finalSuspect.value;
    const motive = els.finalMotive.value;
    const evidenceId = els.finalEvidence.value;
    const ending = GAME_DATA.ending;
    const scoreParts = calculateScore(suspectId, motive, evidenceId);
    const score = scoreParts.reduce((sum, part) => sum + part.points, 0);

    state.verdict = {
      suspectId: suspectId,
      motive: motive,
      evidenceId: evidenceId,
      score: score,
      scoreParts: scoreParts,
      submittedAt: new Date().toISOString()
    };

    let endingType = "fail";
    let title = "Deduction Failed";
    let message = "The key chain is still incomplete. Review the access log, cold drive, and backup index gap.";

    if (score >= 90) {
      endingType = "success";
      title = "Case Closed";
      message = ending.summary;
    } else if (score >= 45) {
      endingType = "partial";
      title = "Partially Correct";
      message = "You found part of the direction, but the suspect, motive, and key evidence do not fully close the case yet.";
    }

    renderVerdict();
    els.verdictResult.className = "verdict-result " + endingType;
    els.verdictResult.innerHTML =
      "<p><strong>" +
      escapeHtml(title) +
      " (" +
      score +
      "/100)</strong></p>" +
      "<p>" +
      escapeHtml(message) +
      "</p>" +
      renderScoreRows(scoreParts);

    addHistory("Submitted final deduction: " + title + ", score " + score + "/100.");
    persist(true);
  }

  function calculateScore(suspectId, motive, evidenceId) {
    const collected = state.collectedClueIds;
    const keyClues = ["door-log-anomaly", "cold-drive-serial", "admin-index-gap", "admin-message"];
    const keyClueCount = keyClues.filter((id) => collected.includes(id)).length;
    const keyCluePoints = Math.round((keyClueCount / keyClues.length) * 35);

    const parts = [
      {
        label: "Key clues",
        points: keyCluePoints,
        max: 35,
        detail: "Collected key clues " + keyClueCount + "/" + keyClues.length
      },
      {
        label: "Suspect",
        points: suspectId === GAME_DATA.ending.suspect ? 25 : 0,
        max: 25,
        detail: suspectId === GAME_DATA.ending.suspect ? "correct" : "wrong"
      },
      {
        label: "Motive",
        points: motive === GAME_DATA.ending.motive ? 20 : 0,
        max: 20,
        detail: motive === GAME_DATA.ending.motive ? "correct" : "wrong"
      },
      {
        label: "Key evidence",
        points: evidenceId === GAME_DATA.ending.evidenceId ? 20 : 0,
        max: 20,
        detail: evidenceId === GAME_DATA.ending.evidenceId ? "correct" : "wrong"
      }
    ];

    return parts.map((part) => Object.assign({}, part, { points: Math.min(part.points, part.max) }));
  }

  function renderScoreRows(parts) {
    return (
      "<div class='score-row'><span>Criterion</span><span>Score</span></div>" +
      parts
        .map((part) => {
          return (
            "<div class='score-row'><span>" +
            escapeHtml(part.label) +
            " (" +
            escapeHtml(part.detail) +
            ")</span><strong>" +
            part.points +
            "/" +
            part.max +
            "</strong></div>"
          );
        })
        .join("")
    );
  }

  function renderVerdict() {
    if (!state.verdict) {
      els.verdictResult.className = "verdict-result";
      els.verdictResult.innerHTML = "<p>The result and score will appear after submission. Collect at least 8 clues before making a deduction.</p>";
      return;
    }

    const verdict = state.verdict;
    const parts = calculateScore(verdict.suspectId, verdict.motive, verdict.evidenceId);
    const score = parts.reduce((sum, part) => sum + part.points, 0);
    let endingType = "fail";
    let title = "Deduction Failed";

    if (score >= 90) {
      endingType = "success";
      title = "Case Closed";
    } else if (score >= 45) {
      endingType = "partial";
      title = "Partially Correct";
    }

    els.verdictResult.className = "verdict-result " + endingType;
    els.verdictResult.innerHTML =
      "<p><strong>" +
      escapeHtml(title) +
      " (" +
      score +
      "/100)</strong></p>" +
      "<p>Last submitted at: " +
      escapeHtml(formatTime(new Date(verdict.submittedAt))) +
      "</p>" +
      renderScoreRows(parts);
  }

  function addHistory(text) {
    state.history.push({
      time: formatTime(new Date()),
      text: text
    });
    if (state.history.length > 80) {
      state.history = state.history.slice(-80);
    }
  }

  function saveNotes() {
    state.notes = els.noteInput.value;
    addHistory("Saved investigation notes.");
    persist(true);
    els.noteStatus.textContent = "Notes saved";
    window.setTimeout(function () {
      els.noteStatus.textContent = "Notes are saved with your case progress";
    }, 1600);
  }

  function restartGame() {
    const confirmed = window.confirm("Clear current progress and restart the case?");
    if (!confirmed) {
      return;
    }

    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("Failed to clear saved progress:", error);
    }

    state = structuredCloneSafe(defaultState);
    lastAddedClueMessage = "";
    els.verdictResult.innerHTML = "";
    els.dialogueBox.innerHTML = "";
    applyStateToUi();
    addHistory("Restarted: a new case file has been created.");
    persist(true);
    window.alert("Restarted.");
  }

  function getCurrentLocation() {
    return GAME_DATA.locations.find((location) => location.id === state.currentLocationId) || GAME_DATA.locations[0];
  }

  function updateMapActive() {
    const buttons = els.locationMap.querySelectorAll(".map-btn");
    buttons.forEach((button) => {
      button.classList.toggle("active", button.dataset.locationId === state.currentLocationId);
    });
  }

  function flashSaveStatus(text) {
    els.saveStatusBtn.textContent = text;
    window.setTimeout(function () {
      els.saveStatusBtn.textContent = "Saved";
    }, 1400);
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(date);
  }

  function truthLabel(truth) {
    return truth === "real" ? "Verified clue" : "Noise clue";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
