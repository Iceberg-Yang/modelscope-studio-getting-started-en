# static-missing-model-case

A pure frontend mystery game built with HTML, CSS, and JavaScript. The story is “The Missing Model Weights”: the player acts as an investigator in an AI lab, scans locations, questions suspects, organizes clues, and submits a final deduction.

## How to Open the Game

1. Enter the project directory:

   ```bash
   cd static-missing-model-case
   ```

2. Open `index.html` directly in a browser:

   ```bash
   open index.html
   ```

   You can also use your browser’s “File → Open File” menu and select `index.html`.

This project has no npm dependencies and does not require a build step.

## How to Play

- Switch between five locations: Training Room, Model Vault, Research Office, Security Room, and Launch Backstage.
- Click “Scan Location” to collect clues. Re-scanning a location will not duplicate the same clue.
- Select a suspect and a question to view testimony and investigator notes.
- Review clue type, verified/noise labels, and investigation notes in the collected clues panel.
- Use the suspect files to compare roles, motives, and alibis.
- Use investigation notes to record timelines, contradictions, and your own reasoning.
- Submit a final suspect, motive, and key evidence. The game scores your deduction based on key clues, suspect, motive, and evidence.

## Suggested Demo Flow

1. Open `index.html` and show the investigation console.
2. Visit all five locations and scan each one once to show clue collection.
3. Question the Data Administrator about the cold drive, access log, and backup index gap.
4. Question the Security Lead about the skipped footage and access summary to show how distraction clues are ruled out.
5. Review the suspect files and collected clues to explain why the Investor Representative and Chief Researcher are not the final answer.
6. Write the timeline in the notes: 22:41 training stopped, 22:48 vault entered, 23:02 cold drive carried out, 22:45-23:05 backup index gap.
7. In Final Deduction, choose:
   - Suspect: Data Administrator
   - Motive: Block open source and keep the model as leverage.
   - Key evidence: Access Log Anomaly
8. Submit the deduction and show the Case Closed result.
9. Refresh the page to show `localStorage` progress recovery.
10. Click “Restart” to show state reset.

## Why This Example Fits Static Studios

- It is a complete static web page.
- It runs fully in the browser without a backend.
- It uses structured data and local state to create an interactive experience.
- It can be deployed by uploading `index.html`, `styles.css`, `game-data.js`, and `app.js` to a Static Studio.
