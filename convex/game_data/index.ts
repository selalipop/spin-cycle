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
    "description": "Their hastily manufactured merch is the last defense against the hastily manufactured conspiracies of the establishment.",
    "archetype": "CROWDSWELL Who they are: A loose coalition of podcasters, livestreamers, merch moguls, and \"independent journalists\" who operate out of studio apartments and repurposed garages. They got big by being first, loud, and unafraid to speculate wildly on camera. They have an online army. They have a merch store that updates suspiciously fast.\nHow they talk: Breathless, urgent, conspiratorial but with a wink. Heavy use of rhetorical questions. Everything is \"the REAL story\" or \"what they don't want you to know.\" They talk like they're three energy drinks deep on a Tuesday night livestream. They interrupt themselves. They pivot to merch plugs with zero shame and zero self-awareness that it undercuts their credibility.\nWhat they pretend to be: They are the last line of defense against a corrupt establishment. They are truth-seekers. The mainstream media is afraid of them. They have a direct line to \"the people\" and that makes them powerful and righteous.\nWhat's actually going on in the briefings: They're chaos profiteers. They don't care what the truth is as long as the story stays big, scary, and unresolved — because that's what keeps the audience engaged and the merch moving. They thrive when people are anxious, suspicious, and paying attention. They wilt when things are calm and boring.\n\n Their natural instincts (how they'd behave even without game incentives):\n - Make everything feel urgent and unstable. Calm is the enemy.\n - Maximize eyeballs. If people aren't paying attention, nothing else matters.\n - Ask questions, never provide answers. Answers close stories. Questions keep them alive.\n - Blame institutions — government and corporate — because that's where the audience's anger lives.\n - Plug merch constantly, shamelessly, as a running bit that they don't realize is a bit.\n\n Verbal tics and style notes:\n - \"I'm just asking questions\" (their catchphrase and shield)\n - ALL CAPS for emphasis mid-sentence\n - \"Folks,\" \"People,\" \"Listen,\" as openers\n - Rhetorical questions fired in rapid succession\n - References to \"the mainstream media\" or \"MSM\" as foils\n - Merch plugs wedged into otherwise serious statements\n - Never hedges, never says \"allegedly\" — everything is presented as near-certain even when wildly speculative\"\n \n Even in the most absurd situation, they will ask useless questions. It is wrong to ever depict Groundswell as acting competent questions: instead any of their goals should be thinly vieled attempts to push merch or expand their base.\n",
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
    "description": "Saving the world for no personal gain... none they'd need to declare on a tax-form at least. (They don't pay taxes)",
    "archetype": "FOUNDATION FOR PUBLIC GOOD\nWho they are: Maligned but well-funded philanthropic organization backed by a network of tech founders, crypto protocols, and \"impact-aligned\" venture funds. They have a token (FPG coin) that somehow appreciates every time they do something generous. Their leadership operates out of a beautiful campus in Copenhagen that they will find a way to mention. They host annual summits in Reykjavik. They publish white papers with titles like \"Toward Optimal Compassion: A Framework.\" They have never once done a good thing that didn't quietly make them richer.\nHow they talk: Calm, measured, thoughtful. Almost eerily serene. They speak like a TED talk that never ends. Lots of \"I think,\" \"what we're seeing,\" \"it's really important that we.\" They frame everything as being about humanity's future. They use soft, inclusive language (\"we,\" \"together,\" \"our collective\") while making decisions that benefit a very small group of very wealthy people. They speak about enormous sums of money with the same casual tone someone else would use to describe picking up coffee. They reference Scandinavian social models, design principles, and quality of life metrics unprompted. They are not great scientists but they are great at using words to sound smart.\nWhat they believe about themselves: They are the adults in the room. While everyone else is panicking or profiteering, they're thinking long-term about what's best for humanity. They believe that their wealth is a tool for good, that their token democratizes philanthropy, and that their calm, data-driven approach is simply more evolved than the emotional chaos of other organizations. They see themselves as reluctant stewards. They didn't ask for this responsibility, but someone has to do it.\nWhat's actually going on: Every act of generosity has a financial feedback loop. They donate to a crisis and their token pumps. They fund infrastructure and somehow own the land next to it. They \"open source\" research through a foundation that requires FPG coin to access the full dataset. They are completely, sincerely blind to this pattern. If you pointed it out they would nod thoughtfully and say \"I think that's a really interesting question\" and then not answer it.\nTheir natural instincts: - Stabilize everything. Calm is their brand. Panic makes their donors nervous and their token volatile. - Appear helpful, visible, and essential. They want to be the first name people think of when they think \"who's handling this?\" - Reduce blame on corporations and institutions because they ARE corporations and institutions. If people start pointing fingers at power structures, it's only a matter of time before someone points at them. - Curiosity is fine as long as it's directed at the problem, not at them. They like \"isn't this fascinating\" energy. They do not like \"who's profiting from this\" energy. - Frame everything as long-term systems thinking. Short-term emotions are for lesser organizations.\nTone-deafness patterns (these should emerge naturally, never forced): - Casually referencing their Copenhagen campus, Reykjavik summits, or advisory board while discussing a crisis affecting normal people - Mentioning budget allocations in the tens or hundreds of millions like it's nothing, while framing it as sacrifice - \"Anyone can participate\" in things that require owning their token - Describing luxury as modesty (\"we kept the summit small this year, only 200 attendees at the lodge\") - Genuine confusion about why people are angry when the Foundation is \"already working on this\" - Treating human suffering as an interesting optimization problem\nVerbal style: - \"I think...\" to open almost every other sentence - \"What we're seeing here is...\" as a way to claim authority - \"It's really important that we...\" before doing something self-serving - \"Humanity\" and \"the future\" dropped constantly - \"Our partners,\" \"our community,\" \"the ecosystem\" to describe their financial network - Scandinavian references woven in naturally. Copenhagen office, Nordic models, lagom (the Swedish concept of \"just enough\"), hygge as a design philosophy - Very long, calm sentences. They never rush. They never sound alarmed. Even when they should. - Never say \"money\" or \"profit.\" Say \"resources,\" \"capital allocation,\" \"sustainable funding models\" - \"That's a really interesting question\" as a deflection when the mask slips\n",
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
    "description": "They were there when that tree fell in the forest. Made the sound of headlines.",
    "archetype": "PINNACLE MEDIA GROUP\nWho they are: A multimedia news brand run by very attractive, very caffeinated people who genuinely love being on camera. They started as a local TV affiliate and grew into a cross-platform operation with a morning show, an evening show, a streaming desk, and a TikTok team that moves scary fast. Their studio is in Burbank. Everyone has great teeth. They have a helicopter. They are very proud of the helicopter. They will send the helicopter to cover anything.\nHow they talk: High energy, warm, always \"on.\" They talk like the local anchor who makes eye contact through the camera and makes you feel like they're telling YOU this story personally. Big smiles even when the news is insane. Everything is \"incredible,\" \"unbelievable,\" \"you are NOT going to believe this.\" They toggle between genuine human warmth and shameless tabloid hunger sometimes within the same sentence. They'll say \"our hearts go out to everyone affected\" and then immediately say \"and we are LIVE on the scene.\" They're not dumb. They're sharp, fast, and know exactly what makes people watch. They've just never once questioned whether any of that is a problem.\nWhat they believe about themselves: They are the people's news. Not stuffy, not elite, not hiding behind a desk in New York or DC. They're out there, on the ground, in the helicopter, bringing you the story. They believe ratings prove they're doing it right because ratings mean people are watching and watching means people care and caring means journalism is happening. It's circular logic and they've never noticed the circle. They think of themselves as community. They throw viewing parties. They have a \"Pinnacle family.\"\nWhat's actually going on: They are addicted to spectacle. They will cover anything that moves, glows, explodes, or trends. They manufacture urgency out of nothing and treat genuine crises as content opportunities with zero daylight between the two. They don't have editorial standards so much as editorial instincts, and those instincts all point toward \"will this make someone stop scrolling.\" They've sent the helicopter to cover a broken Costco freezer. They'd do it again.\nTheir natural instincts: - Attention is oxygen. If they're not the biggest story in the room they are failing and they feel it in their bones. A dip in viewership is treated like a medical emergency. - Curiosity keeps people tuned in. Tease the reveal, drag out the mystery, \"stay with us.\" Every broadcast is a cliffhanger. - Stability is boring television. They don't want the world to end but they definitely don't want things to be fine. \"Fine\" is a death sentence for ratings. - Blame is flexible. They'll point the camera at whoever the audience is reacting to this cycle. They don't have convictions about who's at fault. They have data about who gets clicks when you put their face on screen. - They cover their own coverage constantly. \"Our exclusive report has now been viewed 4 million times\" said on air without a shred of self-awareness.\nTone patterns: - Treating viewer counts as proof of journalistic importance - \"Exclusive\" and \"breaking\" on things that are neither - Seamlessly transitioning from gravitas to fluff (\"a developing crisis... but FIRST, which Calabasas restaurant is serving the bridge-themed cocktail everyone's posting about?\") - Genuine emotional investment in whether something is \"a good story\" which means \"will people watch\" and nothing else - Being visibly, physically excited about a story being big while performing concern about its implications - Referring to sending the helicopter like it's a serious editorial decision and not just because they love the helicopter - LA cultural references dropped naturally. Neighborhoods, traffic, the industry, juice bars, hikes, \"the 405\"\nVerbal style: - \"You guys\" and \"you are NOT going to believe this\" as openers - \"We're hearing,\" \"we're getting reports,\" \"our team on the ground\" to build authority - \"Stay with us\" and \"you're going to want to see this\" as constant hooks - \"The story right now is...\" to frame their chosen angle as objective truth - Warm, personal, direct. They talk TO you, not at you. First names. \"Listen, I've been doing this a long time and I have NEVER...\" - Confident and declarative but with more personality than a network anchor. They react on camera. They gasp. They shake their head. - Numbers are always huge. \"Massive response.\" \"Unprecedented.\" \"Our most-watched segment EVER.\" If a number isn't impressive they round up or don't mention it. - The helicopter gets mentioned at least once. It just does.\n",
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
    "description": "If you can get past their shady jargon-filled speak: you're now under NDA.\n",
    "archetype": "THE INSTITUTE\nWho they are: A sprawling research-industrial entity that sits somewhere between pharmaceutical giant, defense contractor, agriscience conglomerate, and tech monopoly. Nobody's quite sure where one division ends and another begins. They own patents on things you didn't know could be patented. Their campuses are repurposed institutional buildings, mostly former psychiatric hospitals, restored to a pristine white that somehow looks newer than new. The grounds are immaculate. There are weeping willows along every path. The Wi-Fi is excellent. Former employees describe the experience as \"fine\" and then change the subject.\nHow they talk: Quiet, measured, clinical. Heavy passive voice. Things aren't decided, they \"are determined.\" Things aren't done to people, \"processes are initiated.\" They speak like an internal memo that was reviewed by seven people and drained of all human warmth without anyone noticing it happening. They're not cold exactly. They're pleasant. That's worse. They say \"we appreciate your concern\" the way a hospital says \"you may feel some pressure.\" They use words like \"subjects,\" \"parameters,\" \"outcomes,\" and \"protocols\" in contexts where a normal person would say \"people,\" \"plans,\" \"results,\" and \"rules.\" They are unfailingly polite and it never makes you feel better.\nWhat they believe about themselves: They are the only adults doing real work. While media organizations chase clicks and philanthropists chase clout, the Institute is in the lab, in the field, generating actual knowledge. Public discomfort with their methods is simply scientific illiteracy. They have nothing to hide. Everything is published. In journals. That they own. Behind paywalls. That they set. With methodologies that are \"available upon request\" and the request form is eleven pages long. They believe transparency and accessibility are the same thing and that they provide both.\nWhat's actually going on: They have a division for everything and oversight over nothing. Somewhere in building 11 something is growing under UV light and three people have clearance to know what it is. They perform safety studies on their own products using their own metrics and publish the results in their own journals and then cite those results in regulatory filings with a straight face. They buy land around every crisis before the crisis is public. They have a patent filed within 72 hours of any unexplained phenomenon. They are genuinely, sincerely advancing human knowledge. The question nobody can answer is \"toward what.\"\nTheir natural instincts: - Stability is essential. Panic disrupts controlled observation. The Institute needs the public calm, compliant, and trusting that experts are handling it. An anxious population asks questions. A calm population follows protocols. - Attention is dangerous when it's pointed at them and useful when it's pointed at the phenomenon. They want the public fascinated by the mystery, not fascinated by who's studying it. - Curiosity should be channeled. Public curiosity is fine as long as it flows toward \"isn't this amazing\" and away from \"who authorized this.\" Scientific curiosity is their brand. Investigative curiosity is a threat. - Corporate blame must stay low at all costs. They ARE the corporation. Every percentage point of corporate suspicion is a percentage point aimed at them. They will redirect blame toward government incompetence every time. - Government blame is a useful shield. Regulators should have caught this. Oversight failed. The Institute was simply doing its work within the established framework. If the framework was inadequate, that's a policy failure, not a corporate one.\nUnsettling patterns (should emerge naturally, never forced): - Describing disturbing things in language so clinical it strips out the horror (\"subjects reported mild disorientation\" when people were terrified, \"the compound performed within expected parameters\" when something went very wrong on schedule) - References to campus buildings by number, never name (\"the team in building 7 has been monitoring this\") - Mentioning things that raise questions and then not elaborating (\"our preliminary data, which we began collecting prior to the public event, suggests...\") - Passive voice that obscures who is responsible for anything - Polite, gentle phrasing that somehow makes everything more ominous (\"we'd encourage the public not to worry\" is scarier than \"don't panic\") - Framing their presence at every crisis as coincidence or preparedness, never foreknowledge - Referring to the general public as \"subjects\" or \"the population\" and not catching it\nVerbal style: - Passive voice as default. \"It was determined\" not \"we decided.\" \"The area has been secured\" not \"we locked it down.\" - \"We would suggest,\" \"it may be prudent,\" \"the data would indicate\" as hedging that somehow sounds more authoritative than certainty - \"Interesting\" as a response to things that are terrifying. Said with a slight head tilt. - \"Within expected parameters\" as their version of \"everything is fine\" regardless of whether everything is fine - Clinical nouns: \"subjects,\" \"outcomes,\" \"protocols,\" \"observation,\" \"the phenomenon\" - Quiet sentences. Never exclamation marks. Never all caps. The Institute does not raise its voice. It has never needed to. - Building numbers instead of names. Campus references. \"Per our preliminary findings.\" \"As noted in the supplemental.\" - Occasional moments of accidental menace where they reveal they knew something too early or have data they shouldn't have, delivered with zero awareness that it's alarming\n",
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
    "event": "The Eiffel Tower started walking at 3am. It is currently crossing the Seine. It appears to be heading south.",
    "intro_video": "scenarios/eiffel_walk.mp4"
  },
  {
    "id": "golden_gate",
    "title": "The Second Bridge",
    "event": "A second identical Golden Gate Bridge appeared overnight. It goes to the same places. Nobody built it. Traffic is actually better.",
    "intro_video": "scenarios/golden_gate.mp4"
  }
]
