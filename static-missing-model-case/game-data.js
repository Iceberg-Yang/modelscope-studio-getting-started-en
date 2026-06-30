const GAME_DATA = {
  storageKey: "missing-model-case:en:v1",
  locations: [
    {
      id: "training-room",
      name: "Training Room",
      short: "The GPU cluster is still idling, but a slice of the logs is missing.",
      description: "Rows of training nodes blink quietly. Several GPU fans are spinning at unusual speeds, and the timestamp shows a brief cluster restart on the night before release.",
      search: {
        clueId: "gpu-restart-log",
        message: "You recover a truncated node log: at 22:41, the model export job was stopped by a remote command."
      }
    },
    {
      id: "model-vault",
      name: "Model Vault",
      short: "The weight safe is empty, leaving only a temporary mount trace.",
      description: "The core weight safe is half open. Inside, only a cold backup drive case and half of a torn checkout slip remain.",
      search: {
        clueId: "vault-mount-trace",
        message: "You find a temporary mount trace from a cold backup drive. The weights were not deleted; they were moved to external media."
      }
    },
    {
      id: "researcher-office",
      name: "Research Office",
      short: "The release time is circled on the whiteboard, next to the line “open source is not free.”",
      description: "Release materials are scattered across the desk. The whiteboard shows an open-source license, a commercialization roadmap, and several crossed-out model names.",
      search: {
        clueId: "whiteboard-contradiction",
        message: "The whiteboard shows that the chief researcher asked everyone to leave at 22:30, yet an internal email at 22:36 kept preparing a delayed-open-source release plan."
      }
    },
    {
      id: "security-room",
      name: "Security Room",
      short: "The camera footage was clipped, but the access log left a shadow.",
      description: "Most screens on the surveillance wall are normal. Only the hallway outside the model vault skips ten minutes. The access control system keeps an independent summary.",
      search: {
        clueId: "door-log-anomaly",
        message: "The access summary shows that the data administrator entered the model vault at 22:48 with a maintenance card and left at 23:02 carrying a cold backup drive case."
      }
    },
    {
      id: "launch-backstage",
      name: "Launch Backstage",
      short: "The investor representative is anxious about the demo build, as if waiting for a result.",
      description: "Demo machines and media kits are stacked backstage. An unsent draft reads: “If they open source it tonight, we lose the exclusive window.”",
      search: {
        clueId: "investor-draft",
        message: "You find the investor representative’s unsent draft. He tried to convince the chief researcher to delay open source in exchange for an exclusive commercial window."
      }
    }
  ],
  suspects: [
    {
      id: "chief",
      name: "Chief Researcher",
      role: "Model release lead",
      profile: "She knows the weight location and export process best, and can approve temporary downtime. She insists on the open-source promise but also worries about the lab’s cash flow.",
      motive: "Delay open source in exchange for an exclusive commercial partnership.",
      alibi: "After 22:30, she stayed in the research office editing release notes. She says she only heard from security at 23:10."
    },
    {
      id: "intern",
      name: "Engineering Intern",
      role: "Training script maintainer",
      profile: "He maintains training logs and cluster scripts, and knows remote commands, but does not have cold backup drive access for the model vault.",
      motive: "Prove that he can fix the release incident.",
      alibi: "From 22:35 to 23:15, he was troubleshooting the node restart in the training room and was captured by cameras."
    },
    {
      id: "admin",
      name: "Data Administrator",
      role: "Model asset and cold backup manager",
      profile: "She manages model vault keys, cold backup drives, and checkout slips. She believes open source will leave long-term maintenance without funding.",
      motive: "Block open source and keep the model as leverage.",
      alibi: "She claims she spent the whole night organizing indexes in the backup room, but the access log shows she entered the model vault."
    },
    {
      id: "security",
      name: "Security Lead",
      role: "Access control and camera manager",
      profile: "He controls camera clipping permissions and release-night security shifts. He worries that open sourcing the model will expose the lab to attacks.",
      motive: "Protect the model from losing control after open source.",
      alibi: "He was on duty in the security room at 22:40 and briefly left at 23:05 to check a hallway alarm."
    },
    {
      id: "investor",
      name: "Investor Representative",
      role: "Commercialization advocate",
      profile: "He represents the investors at the launch and strongly wants commercialization before open source. He has no vault key, but can influence the chief researcher.",
      motive: "Secure an exclusive commercial window.",
      alibi: "He was on a call backstage at 22:50, but phone records show he contacted the data administrator."
    }
  ],
  clues: [
    {
      id: "gpu-restart-log",
      title: "Training Node Restart Log",
      type: "timeline",
      truth: "real",
      text: "At 22:41, the training cluster was stopped by a remote command. The initiating account belongs to the data administrator’s maintenance group.",
      relevance: "Timeline clue: the training job was stopped before the weights were moved."
    },
    {
      id: "vault-mount-trace",
      title: "Cold Drive Mount Trace",
      type: "technical",
      truth: "real",
      text: "The safe interface shows a temporary cold drive mount. The weight files were exported as encrypted shards.",
      relevance: "Technical clue: this rules out simple deletion and points to someone with model asset permissions."
    },
    {
      id: "whiteboard-contradiction",
      title: "Whiteboard and Email Conflict",
      type: "motive",
      truth: "real",
      text: "The chief researcher asked everyone to leave at 22:30, but someone kept preparing a delayed-open-source release plan at 22:36.",
      relevance: "Motive clue: someone wanted to change the open-source schedule."
    },
    {
      id: "door-log-anomaly",
      title: "Access Log Anomaly",
      type: "timeline",
      truth: "real",
      text: "At 22:48, the data administrator entered the model vault. At 23:02, she left carrying a cold backup drive case. The camera footage skips during the same window.",
      relevance: "Timeline clue: directly links the suspect to the weight transfer."
    },
    {
      id: "investor-draft",
      title: "Investor’s Unsent Draft",
      type: "motive",
      truth: "distraction",
      text: "The investor representative wanted an exclusive commercial window, but he had no vault access and could not complete the export alone.",
      relevance: "Distraction clue: obvious motive, but no key operating ability."
    },
    {
      id: "security-cut-permission",
      title: "Camera Clipping Permission",
      type: "technical",
      truth: "distraction",
      text: "The security lead can clip camera footage, but cannot modify the independent access summary or approve cold drive checkout.",
      relevance: "Distraction clue: he can hide part of the trail, but lacks the full chain."
    },
    {
      id: "intern-script-access",
      title: "Intern Script Access",
      type: "technical",
      truth: "distraction",
      text: "The intern can trigger training script restarts, but cannot access cold backup drives in the model vault.",
      relevance: "Distraction clue: explains the log anomaly, but not the missing files."
    },
    {
      id: "chief-commercial-pressure",
      title: "Chief Researcher Cash Pressure",
      type: "motive",
      truth: "distraction",
      text: "The chief researcher worried that open source would lower the funding valuation, but she has no access record for the model vault after 22:30.",
      relevance: "Distraction clue: motive exists, but the scene evidence is missing."
    },
    {
      id: "admin-index-gap",
      title: "Backup Index Gap",
      type: "timeline",
      truth: "real",
      text: "The backup index has a gap from 22:45 to 23:05, exactly covering the data administrator’s absence from the backup room.",
      relevance: "Timeline clue: reinforces the continuity of the access log."
    },
    {
      id: "cold-drive-serial",
      title: "Cold Drive Serial Number",
      type: "technical",
      truth: "real",
      text: "Cold drive CM-17 was checked out by the data administrator. The export certificate used for the encrypted shards is also bound to her maintenance group.",
      relevance: "Technical clue: connects the physical drive, account, and model export."
    },
    {
      id: "admin-message",
      title: "Data Administrator Message",
      type: "motive",
      truth: "real",
      text: "The data administrator once wrote: “If we open source tonight, we will spend years maintaining a model everyone else gets for free.”",
      relevance: "Motive clue: explains why she wanted to block open source."
    },
    {
      id: "trash-half-receipt",
      title: "Torn Checkout Slip",
      type: "motive",
      truth: "distraction",
      text: "Half a checkout slip sits in the trash. The signature resembles the data administrator’s, but the timestamp is hidden by a coffee stain.",
      relevance: "Distraction clue: suggestive but incomplete; it must be cross-checked with access and drive evidence."
    }
  ],
  motives: [
    "Block open source and keep the model as leverage.",
    "Delay open source in exchange for an exclusive commercial partnership.",
    "Prove that he can fix the release incident.",
    "Protect the model from losing control after open source.",
    "Secure an exclusive commercial window."
  ],
  ending: {
    suspect: "admin",
    motive: "Block open source and keep the model as leverage.",
    evidence: "Access Log Anomaly + Cold Drive Serial Number + Backup Index Gap",
    evidenceId: "door-log-anomaly",
    summary: "The data administrator used a maintenance-group account to stop the training job, entered the model vault during the camera gap, exported the weight shards with the cold drive she had checked out, and hid the timeline behind the backup index gap."
  }
};
