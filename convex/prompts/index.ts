// AUTO-GENERATED from .liquid templates — do not edit by hand.
// Run: pnpm game-data

export const EXAMPLE_SYSTEM = "You are the game master for Spin Cycle."

export const EXAMPLE_USER = "The current scenario: {{ scenario_title }}\nEvent: {{ event }}\n\nRound {{ round_number }} of {{ max_rounds }}.\n"

export const GENERATE_FACTION_BRIEF_SYSTEM = "You are writing a strategy briefing for a live party game called Newsroom."

export const GENERATE_FACTION_BRIEF_USER = "Players are competing factions trying to shape public sentiment around a breaking event.\n\nScenario: {{ scenario_title }}\nRound: {{ round_number }} of {{ max_rounds }}\nCurrent event state: {{ event }}\n\nCurrent public sentiment axes (0-100):\n{{ sentiments }}\n\nFaction context:\n- Name: {{ faction_name }}\n- One-line description: {{ faction_description }}\n- Archetype/personality: {{ faction_archetype }}\n- Scoring incentives: {{ faction_scoring }}\n- Team size: {{ team_size }}\n\nWrite output as a strict JSON object with exactly:\n{\n  \"goal\": \"1-2 sentence actionable objective for this faction right now\",\n  \"briefing\": \"long-form faction-flavored guidance for this round\"\n}\n\nRequirements:\n- The goal must be tactical and specific to the current event state.\n- The briefing should be 4-7 sentences.\n- The briefing must sound like this faction and reveal their strategic intent.\n- Tie recommendations to the current sentiment landscape and scoring incentives.\n- No markdown. No code fences. Output valid JSON only.\n"

export const SCORE_SUBMITTED_ACTION_SYSTEM = "You are grading a single faction's submitted move in a live party game called Newsroom."

export const SCORE_SUBMITTED_ACTION_USER = "Return valid JSON only.\n\nScenario: {{ scenario_title }}\nRound: {{ round_number }} of {{ max_rounds }}\nCurrent event state: {{ event }}\n\nCurrent public sentiment axes (0-100):\n{{ sentiments }}\n\nFaction context:\n- Name: {{ faction_name }}\n- Description: {{ faction_description }}\n- Archetype/personality: {{ faction_archetype }}\n\nAction context:\n- Action name: {{ action_name }}\n- Action prompt shown to players: {{ action_prompt }}\n\nSubmitted content to grade:\n{{ submission_content }}\n\nScoring criteria:\n{{ scoring_criteria }}\n\nInstructions:\n- Score each criterion from 0 to 10.\n- Use the criterion instructions exactly when scoring.\n- Provide concise reasoning that references strengths and weaknesses.\n- Do not add criteria that are not listed.\n- Output strict JSON only, no markdown, no code fences.\n\nRequired JSON shape:\n{\n  \"grading_rubric\": {\n    \"...criterion_name...\": 0\n  },\n  \"reasoning\": \"1-3 sentences explaining the scoring.\"\n}\n"
