/**
 * cricketFacts.js
 * Collection of interesting cricket facts for display during matches
 */

export const CRICKET_FACTS = [
  // IPL Records & Stats
  "Virat Kohli has scored the most IPL runs with over 7,000 runs",
  "MS Dhoni led CSK to 5 IPL titles, the most by any team",
  "Suresh Raina has played in 200+ IPL matches",
  "The highest individual score in IPL is 175* by Chris Gayle",
  "IPL is the world's most-watched cricket league by viewership",
  
  // Cricket Rules & Facts
  "A cricket match has 11 players per side on the field",
  "In ODI cricket, each side gets 50 overs (300 balls)",
  "In T20 cricket, each side gets 20 overs (120 balls)",
  "A maiden over is when no runs are scored",
  "A duck is when a batsman is out for zero runs",
  
  // Bowling & Fielding
  "Jasprit Bumrah is known for his deadly yorkers",
  "Rashid Khan has the best economy rate in IPL history",
  "A hat-trick in cricket means taking 3 wickets in 3 consecutive deliveries",
  "The fast bowler's average pace in international cricket is around 140+ kmph",
  "A googly is a leg-break bowled by an off-spinner with an off-break action",
  
  // Batting Records
  "Sachin Tendulkar holds the record for most international runs (15,921 in ODIs)",
  "The fastest century in T20 cricket was scored in just 37 balls",
  "A century is 100 runs, a half-century is 50 runs",
  "The longest cricket match ever lasted 12 days",
  "A bowled dismissal happens when the ball hits the stumps",
  
  // IPL Teams & Players
  "Mumbai Indians and CSK have won 10 IPL titles combined",
  "Rohit Sharma captained MI to 5 IPL championships",
  "KKR won the IPL in 2014 under Gautam Gambhir's captaincy",
  "RCB has never won an IPL title despite having Kohli",
  "Delhi Capitals made their first IPL final in 2020",
  
  // Fielding & Catching
  "Jonty Rhodes was famous for his fielding excellence",
  "A caught and bowled dismissal credits both the bowler and fielder",
  "The fielding positions in cricket include: slip, gully, cover, mid-wicket, square leg",
  "A run out happens when a batsman fails to reach the crease while running",
  "A stumped dismissal is only possible for the wicket-keeper",
  
  // Batting Techniques
  "The cover drive is considered the most elegant shot in cricket",
  "A reverse sweep involves batting with the bat handle reversed",
  "The helicopter shot was popularized by MS Dhoni",
  "A slog is an aggressive horizontal bat swing",
  "The defense shot (or straight bat) is the most basic cricket stroke",
  
  // International Cricket
  "India won the 2011 Cricket World Cup under MS Dhoni",
  "The Ashes is the oldest cricket rivalry between England and Australia",
  "Test cricket is the longest format, lasting up to 5 days",
  "The Caribbean West Indies team won the World Cup twice (1975, 1979)",
  "Pakistan's Wasim Akram was one of the greatest fast bowlers ever",
  
  // Cricket Equipment
  "A cricket bat weighs around 1.1 to 1.4 kg",
  "The cricket ball is made of cork and rubber covered in leather",
  "A cricket pitch is 22 yards (20.12 meters) long",
  "The stumps are 28 inches tall in Test and ODI cricket",
  "A cricket ball is replaced every 80 overs in Test cricket",
  
  // Amazing Records
  "Ravi Shastri hit 6 sixes in one over (now happening more in T20s)",
  "Anil Kumble took a hat-trick and scored 110 runs in the same Test match",
  "Chris Gayle has hit 351 sixes in IPL history",
  "Sri Lanka defeated England in the 1996 World Cup final by 7 wickets",
  "The longest ODI was between South Africa and Australia (1999 World Cup)",
  
  // Bowling Variations
  "A bouncer is a short-pitched delivery aimed at the batsman",
  "A yorker is a ball that lands on the batsman's feet",
  "A slower ball is bowled with reduced pace to deceive the batsman",
  "A leg break is bowled by a leg-spinner and spins away from a right-hander",
  "A doosra is a variation of the off-break bowled by off-spinners",
  
  // Cricket Strategy
  "Field placement changes based on whether the batsman is right or left-handed",
  "Death bowling refers to bowling in the final overs when boundaries are expected",
  "The powerplay in ODIs is the first 15 overs with fielding restrictions",
  "T20 cricket has fielding restrictions in the first 6 overs",
  "A 'death bowler' is a specialist in bowling tight overs in the final phase",
  
  // Famous Cricket Moments
  "The 1983 World Cup was won by India, a major upset at the time",
  "Kapil Dev's catch of Viv Richards was a turning point in 1983",
  "The 2019 World Cup final went to a Super Over (first time ever)",
  "Ben Stokes hit 6 runs off the final ball to tie the 2019 World Cup",
  "MS Dhoni's last-ball six won India the 2011 World Cup",
];

/**
 * Get a random cricket fact
 */
export const getRandomFact = () => {
  return CRICKET_FACTS[Math.floor(Math.random() * CRICKET_FACTS.length)];
};

/**
 * Get facts filtered by keyword
 */
export const getFactsByKeyword = (keyword) => {
  const lowerKeyword = keyword.toLowerCase();
  return CRICKET_FACTS.filter(fact => 
    fact.toLowerCase().includes(lowerKeyword)
  );
};
