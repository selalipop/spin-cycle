// AUTO-GENERATED from YAML — do not edit by hand.
// Run: pnpm game-data

export const SHARED_ACTIONS = [
  {
    "id": "anonymous_leak",
    "name": "Anonymous Leak",
    "cost": 3,
    "prompt": "What is being leaked, and why will people believe it?",
    "repeatable": false,
    "is_special": false,
    "scoring_criteria": [
      {
        "name": "Explosive",
        "description": "Feels consequential.",
        "ai_scoring_instructions": "Reward revelations with clear stakes."
      },
      {
        "name": "Believable",
        "description": "Passes a smell test.",
        "ai_scoring_instructions": "Reward specific, plausible supporting details."
      },
      {
        "name": "Viral Potential",
        "description": "Likely to spread fast.",
        "ai_scoring_instructions": "Reward content that news/social will amplify."
      }
    ]
  },
  {
    "id": "place_story",
    "name": "Place a Story",
    "cost": 2,
    "prompt": "Pitch the story angle you are placing with media outlets.",
    "repeatable": false,
    "is_special": false,
    "scoring_criteria": [
      {
        "name": "Angle",
        "description": "Has a sharp narrative frame.",
        "ai_scoring_instructions": "Reward coherent and distinct story angles."
      },
      {
        "name": "Plausible",
        "description": "Could realistically spread.",
        "ai_scoring_instructions": "Reward realistic sourcing and tone."
      },
      {
        "name": "Impactful",
        "description": "Would move public sentiment.",
        "ai_scoring_instructions": "Reward likely public effect and scale."
      }
    ]
  },
  {
    "id": "public_statement",
    "name": "Public Statement",
    "cost": 1,
    "prompt": "What is your official statement?",
    "repeatable": true,
    "is_special": false,
    "scoring_criteria": [
      {
        "name": "Clear",
        "description": "Easy to understand.",
        "ai_scoring_instructions": "Reward plain language and unambiguous claims."
      },
      {
        "name": "Credible",
        "description": "Sounds trustworthy.",
        "ai_scoring_instructions": "Reward details, accountability, and confidence."
      },
      {
        "name": "Strategic",
        "description": "Helps your faction goals.",
        "ai_scoring_instructions": "Reward framing that advances faction interests."
      }
    ]
  },
  {
    "id": "social_media_post",
    "name": "Social Media Post",
    "cost": 1,
    "prompt": "What are you posting right now?",
    "repeatable": true,
    "is_special": false,
    "scoring_criteria": [
      {
        "name": "Short",
        "description": "Gets to the point fast.",
        "ai_scoring_instructions": "Reward concise copy under 280 chars."
      },
      {
        "name": "Catchy",
        "description": "Memorable and shareable.",
        "ai_scoring_instructions": "Reward hooks that people will repeat."
      },
      {
        "name": "Emotional",
        "description": "Makes people feel something.",
        "ai_scoring_instructions": "Reward emotionally resonant framing."
      }
    ]
  }
]

export const FACTIONS = [
  {
    "code": "crowdswell",
    "name": "Crowdswell",
    "description": "Grassroots firestarters amplifying public suspicion.",
    "archetype": "Populist, memetic, and disruptive. Champions ordinary voices, escalates doubt, and weaponizes virality.",
    "scoring": {
      "stability": [
        5,
        2,
        -1,
        -3
      ],
      "attention": [
        -2,
        1,
        3,
        5
      ],
      "curiosity": [
        -1,
        2,
        4,
        5
      ],
      "corporate_blame": [
        -2,
        1,
        3,
        5
      ],
      "government_blame": [
        -2,
        1,
        3,
        5
      ]
    },
    "faction_actions": [
      {
        "id": "street_interviews",
        "name": "Street Interviews",
        "cost": 2,
        "prompt": "Write the most shareable quote from \"regular people.\"",
        "repeatable": false,
        "is_special": false,
        "scoring_criteria": [
          {
            "name": "Voice",
            "description": "Feels authentic.",
            "ai_scoring_instructions": "Reward natural, colloquial language."
          },
          {
            "name": "Relatability",
            "description": "Connects with broad audiences.",
            "ai_scoring_instructions": "Reward everyday concerns and emotion."
          },
          {
            "name": "Spark",
            "description": "Starts conversation.",
            "ai_scoring_instructions": "Reward provocative but plausible framing."
          }
        ]
      },
      {
        "id": "trend_hijack",
        "name": "Trend Hijack",
        "cost": 3,
        "prompt": "How are you hijacking the current trend to your narrative?",
        "repeatable": false,
        "is_special": false,
        "scoring_criteria": [
          {
            "name": "Timing",
            "description": "Feels of-the-moment.",
            "ai_scoring_instructions": "Reward current-feeling cultural hooks."
          },
          {
            "name": "Memeability",
            "description": "Built to spread.",
            "ai_scoring_instructions": "Reward concise, remixable language."
          },
          {
            "name": "Narrative Pull",
            "description": "Brings attention to your angle.",
            "ai_scoring_instructions": "Reward clear redirection toward faction goals."
          }
        ]
      },
      {
        "id": "people_power_flashmob",
        "name": "People Power Flash Mob",
        "cost": 4,
        "prompt": "Describe the coordinated public action in one dramatic call to action.",
        "repeatable": false,
        "is_special": true,
        "scoring_criteria": [
          {
            "name": "Mobilization",
            "description": "Could move people into action.",
            "ai_scoring_instructions": "Reward urgency and clear calls to act."
          },
          {
            "name": "Visibility",
            "description": "Impossible to ignore.",
            "ai_scoring_instructions": "Reward spectacle and media attractiveness."
          },
          {
            "name": "Momentum",
            "description": "Keeps pressure rising.",
            "ai_scoring_instructions": "Reward sustained narrative escalation."
          }
        ]
      }
    ]
  },
  {
    "code": "foundation_for_public_good",
    "name": "The Foundation for Public Good",
    "description": "Well-funded pragmatists steering order through policy optics.",
    "archetype": "Polished, philanthropic, and paternalistic. Uses institutional partnerships and benevolent framing to direct outcomes.",
    "scoring": {
      "stability": [
        -2,
        1,
        3,
        5
      ],
      "attention": [
        2,
        2,
        1,
        -1
      ],
      "curiosity": [
        3,
        1,
        -1,
        -2
      ],
      "corporate_blame": [
        4,
        2,
        -1,
        -3
      ],
      "government_blame": [
        4,
        2,
        -1,
        -3
      ]
    },
    "faction_actions": [
      {
        "id": "fund_rapid_response",
        "name": "Fund Rapid Response",
        "cost": 2,
        "prompt": "Announce your immediate intervention grant.",
        "repeatable": false,
        "is_special": false,
        "scoring_criteria": [
          {
            "name": "Competence",
            "description": "Feels operationally credible.",
            "ai_scoring_instructions": "Reward concrete logistics and realism."
          },
          {
            "name": "Goodwill",
            "description": "Feels publicly beneficial.",
            "ai_scoring_instructions": "Reward prosocial, reassuring framing."
          },
          {
            "name": "Control",
            "description": "Shows you are shaping events.",
            "ai_scoring_instructions": "Reward proactive command of the narrative."
          }
        ]
      },
      {
        "id": "policy_alignment",
        "name": "Policy Alignment Brief",
        "cost": 3,
        "prompt": "Write the key paragraph from your policy alignment brief.",
        "repeatable": false,
        "is_special": false,
        "scoring_criteria": [
          {
            "name": "Institutional Fit",
            "description": "Matches official priorities.",
            "ai_scoring_instructions": "Reward policy-literate and aligned language."
          },
          {
            "name": "Pragmatism",
            "description": "Sounds implementable now.",
            "ai_scoring_instructions": "Reward feasible and concrete recommendations."
          },
          {
            "name": "Perception",
            "description": "Looks responsible and calm.",
            "ai_scoring_instructions": "Reward tone that signals measured leadership."
          }
        ]
      },
      {
        "id": "national_reassurance_campaign",
        "name": "National Reassurance Campaign",
        "cost": 4,
        "prompt": "Draft the campaign line everyone will hear tomorrow.",
        "repeatable": false,
        "is_special": true,
        "scoring_criteria": [
          {
            "name": "Unity",
            "description": "Pulls the public together.",
            "ai_scoring_instructions": "Reward collective and de-polarizing language."
          },
          {
            "name": "Trust",
            "description": "Builds confidence in institutions.",
            "ai_scoring_instructions": "Reward consistent, credible framing."
          },
          {
            "name": "Narrative Closure",
            "description": "Feels like a path forward.",
            "ai_scoring_instructions": "Reward action-oriented, stabilizing direction."
          }
        ]
      }
    ]
  },
  {
    "code": "pinnacle_media_group",
    "name": "Pinnacle Media Group",
    "description": "Engagement-maxing media pros chasing the biggest story.",
    "archetype": "Ratings-obsessed media machine. Sensational framing, cliffhangers, and relentless audience capture.",
    "scoring": {
      "stability": [
        3,
        1,
        -1,
        -2
      ],
      "attention": [
        -4,
        -1,
        3,
        5
      ],
      "curiosity": [
        -2,
        1,
        3,
        5
      ],
      "corporate_blame": [
        1,
        2,
        2,
        3
      ],
      "government_blame": [
        1,
        2,
        2,
        3
      ]
    },
    "faction_actions": [
      {
        "id": "breaking_banner",
        "name": "Breaking Banner",
        "cost": 2,
        "prompt": "Write the lower-third breaking banner.",
        "repeatable": false,
        "is_special": false,
        "scoring_criteria": [
          {
            "name": "Urgency",
            "description": "Feels immediate.",
            "ai_scoring_instructions": "Reward high urgency without gibberish."
          },
          {
            "name": "Clarity",
            "description": "Understood at a glance.",
            "ai_scoring_instructions": "Reward short, punchy, clear wording."
          },
          {
            "name": "Hook",
            "description": "Makes people stay tuned.",
            "ai_scoring_instructions": "Reward curiosity-inducing framing."
          }
        ]
      },
      {
        "id": "exclusive_segment",
        "name": "Exclusive Segment",
        "cost": 3,
        "prompt": "Pitch the tease for your exclusive segment.",
        "repeatable": false,
        "is_special": false,
        "scoring_criteria": [
          {
            "name": "Exclusivity",
            "description": "Feels like must-watch access.",
            "ai_scoring_instructions": "Reward unique value and rarity cues."
          },
          {
            "name": "Drama",
            "description": "Heightens stakes.",
            "ai_scoring_instructions": "Reward emotionally charged storytelling."
          },
          {
            "name": "Retention",
            "description": "Keeps viewers around.",
            "ai_scoring_instructions": "Reward episodic, cliffhanger cadence."
          }
        ]
      },
      {
        "id": "prime_time_takedown",
        "name": "Prime Time Takedown",
        "cost": 4,
        "prompt": "Write your prime-time opener for a devastating exposé.",
        "repeatable": false,
        "is_special": true,
        "scoring_criteria": [
          {
            "name": "Cinematic",
            "description": "Feels huge and polished.",
            "ai_scoring_instructions": "Reward vivid, high-production language."
          },
          {
            "name": "Narrative Dominance",
            "description": "Defines the story frame.",
            "ai_scoring_instructions": "Reward framing that sets agenda for others."
          },
          {
            "name": "Virality",
            "description": "Clips will spread everywhere.",
            "ai_scoring_instructions": "Reward quotable lines and shareability."
          }
        ]
      }
    ]
  },
  {
    "code": "the_institute",
    "name": "The Institute",
    "description": "Experts pushing calm, controlled messaging.",
    "archetype": "Academic and technocratic. Calm, data-heavy, and authority-first. Prioritizes order and trust in institutions.",
    "scoring": {
      "stability": [
        -3,
        -1,
        2,
        5
      ],
      "attention": [
        -1,
        1,
        2,
        3
      ],
      "curiosity": [
        -2,
        -1,
        1,
        3
      ],
      "corporate_blame": [
        2,
        1,
        -1,
        -3
      ],
      "government_blame": [
        2,
        1,
        -1,
        -4
      ]
    },
    "faction_actions": [
      {
        "id": "expert_panel",
        "name": "Expert Panel",
        "cost": 2,
        "prompt": "Draft the panel talking points.",
        "repeatable": false,
        "is_special": false,
        "scoring_criteria": [
          {
            "name": "Authority",
            "description": "Expert voice feels credible.",
            "ai_scoring_instructions": "Reward institutional expertise and confidence."
          },
          {
            "name": "Reassurance",
            "description": "Calms the audience.",
            "ai_scoring_instructions": "Reward confidence-building framing."
          },
          {
            "name": "Specificity",
            "description": "Contains concrete details.",
            "ai_scoring_instructions": "Reward concrete, verifiable details."
          }
        ]
      },
      {
        "id": "release_whitepaper",
        "name": "Release Whitepaper",
        "cost": 3,
        "prompt": "Write the headline thesis of your emergency whitepaper.",
        "repeatable": false,
        "is_special": false,
        "scoring_criteria": [
          {
            "name": "Depth",
            "description": "Substance over slogans.",
            "ai_scoring_instructions": "Reward nuanced and technical content."
          },
          {
            "name": "Coherence",
            "description": "Argument is internally consistent.",
            "ai_scoring_instructions": "Reward logical structure and rigor."
          },
          {
            "name": "Policy Utility",
            "description": "Supports decisive action.",
            "ai_scoring_instructions": "Reward actionable recommendations."
          }
        ]
      },
      {
        "id": "declare_consensus",
        "name": "Declare Scientific Consensus",
        "cost": 4,
        "prompt": "Make the definitive consensus announcement.",
        "repeatable": false,
        "is_special": true,
        "scoring_criteria": [
          {
            "name": "Finality",
            "description": "Feels definitive.",
            "ai_scoring_instructions": "Reward decisive and complete framing."
          },
          {
            "name": "Legitimacy",
            "description": "Feels institutionally grounded.",
            "ai_scoring_instructions": "Reward reference to methods and consensus."
          },
          {
            "name": "Narrative Control",
            "description": "Re-centers the story.",
            "ai_scoring_instructions": "Reward framing that stabilizes discourse."
          }
        ]
      }
    ]
  }
]

export const SCENARIOS = [
  {
    "id": "eiffel_walk",
    "title": "The Walking Tower",
    "event": "The Eiffel Tower started walking at 3am. It is currently crossing the Seine. It appears to be heading south."
  },
  {
    "id": "golden_gate",
    "title": "The Second Bridge",
    "event": "A second identical Golden Gate Bridge appeared overnight. It goes to the same places. Nobody built it. Traffic is actually better."
  }
]
