"""Rewrites the minigame section of each fun-building page in the design book (docs/design-book/<building>.html)
so it matches the playable prototypes. Run: python3 prototypes/docs.py"""
import re, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs', 'design-book') + os.sep
def ul(items): return '<ul>' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'
def ol(items): return '<ol>' + ''.join(f'<li>{x}</li>' for x in items) + '</ol>'
G = {
'restaurant': dict(file='bistro-rush', game='Bistro Rush', len='Endless (3 hearts)',
  pitch='A fast, cheerful order-matching game that never ends. Hungry squishies sit at the counter, show what they want in a speech bubble, and you cook and serve before their patience runs out. The longer you last, the faster they come.',
  how=['Squishies arrive and sit at the 3 counter seats. Each shows 1 or 2 foods in its bubble, with a patience bar underneath.',
       'Tap a food in the tray to start cooking it in a free pan (3 pans). Each food takes a different time to cook.',
       'When a dish says READY, tap it and then tap the squishy who ordered it (or drag it onto them).',
       'A served customer pays and leaves happy. If a patience bar runs out, the customer leaves sad and you lose a heart.',
       'Lose all 3 hearts and the shift is over. There is no time limit: a great chef can keep going forever.'],
  controls='One finger: tap to cook, tap or drag to serve. Every order is a picture, so no reading is needed.',
  score=['+100 per food served, +50 if the customer was still happy (green bar).', 'Serve 5 customers in a row without losing one: ×2 points, ×3 after 10, up to ×5.', 'Your best score is saved, so the goal is always to beat it.'],
  harder=['Difficulty rises smoothly, a little every second and with every order served (no sudden jumps). It starts brisk: a new guest every ~3.5 s with ~15 s of patience.', 'Guests arrive closer together (down to ~1.5 s apart) and get less patient (down to ~7.5 s), easing toward a hard-but-fair ceiling.', 'Two-item orders become steadily more common, and after a while a fifth food (dumplings, the slowest to cook) joins the menu with a little announcement.'],
  perks=['<b>Pantry Pals</b> chefs cook 20% faster.', '<b>Dumpling Gang</b> chefs make customers 15% more patient.', 'Rarer chefs add a coin bonus: Rare +10%, Epic +20%, Legendary +35%.'],
  rewards='Coins equal to the points ÷ 420, plus a milestone bonus of +10 / +25 / +50 coins when a run passes 15,000 / 30,000 / 50,000 points (you get the highest one reached). That is about 35 coins per minute for a good player, the same as every other minigame. Your best score unlocks building upgrades.'),
'playground': dict(file='sky-bounce', game='Sky Bounce', len='Endless (until you fall)',
  pitch='An endless bouncing game in the style of Doodle Jump. Your squishy bounces upward by itself from cloud to cloud. Steer left and right to land on the next one and climb as high as you can.',
  how=['Your squishy bounces automatically every time it lands on a cloud or leaf.',
       'Steer left and right to land on the next platform. Going off one side of the screen brings you back on the other.',
       'Collect coins on the way up. Springs launch you extra high, and a balloon floats you up for a few seconds.',
       'Crumbly grey clouds break after one bounce, and some leaves slide sideways.',
       'Missing every platform and falling off the bottom ends the run.'],
  controls='Phone: hold or slide a finger on the side you want to go (the real app can also offer tilt steering). PC: arrow keys or A / D.',
  score=['Score is the height reached in metres. A dashed line shows your best height so you can try to beat it.', 'Coins collected are kept even when you fall.'],
  harder=['The higher you climb, the bigger the gaps between platforms.', 'Moving leaves, crumbly clouds and fewer safe clouds appear more and more.', 'The sky changes colour as you go: pink sunset, then a starry night.'],
  perks=['<b>Sky Puffs</b> fall 25% slower (floaty!).', '<b>Sugar Squad</b> bounce 10% higher.', 'Rarer squishies start with a balloon already attached (Epic, Legendary).'],
  rewards='You keep every coin you collect on the way up (coins now appear a bit more often), plus a milestone bonus of +10 / +25 / +50 coins when a run passes 600 / 1,200 / 2,000 m (you get the highest one reached). About 35 coins per minute for a good player.'),
'arcade': dict(file='squish-breaker', game='Squish Breaker', len='Level-based (1–3 min per level)', levels=True, kind='level-based',
  pitch='A level-based “balls versus bricks” game. Your squishies are the balls: you get exactly one ball for every squishy you own. Aim, let go, and they all fly out in a stream, bouncing off the walls and knocking numbers off the bricks. Levels open one after another, so a sharp player can go as far as their aim takes them; more squishies just make it easier.',
  how=['Drag anywhere to aim: a dotted line shows the path to the first bounce. Let go to fire all your squishies, one after another.',
       'Every hit takes 1 off a brick’s number; at 0 it pops. Orange bomb bricks explode and hurt the bricks around them.',
       'Squishies come back to the floor; the first one to land sets where you shoot from next.',
       'When all squishies are back, every brick moves down one row and more come in from the top.',
       'Clear every brick to win. If a brick reaches the red line at the bottom, the level is lost.'],
  controls='Drag and release. A fast-forward button appears while balls are flying. PC: mouse, or ← → to aim and Space to shoot, F = fast forward.',
  score=['Win in few turns for more stars: ★★★ within the turn target shown under the field, ★★ within 3 more turns, ★ for any win.', 'Stars per level are saved, and you can replay any level for more.'],
  harderTitle='Levels that keep getting tougher',
  harder=['Beat a level and the next one opens, always. Your collection never locks a level.', 'Each level is built for a recommended number of squishies: 5 at level 1, 10 at level 10, 16 at level 20, 34 at level 50, up to all 48. Brick numbers are set from that number, so with only the recommended amount a level is a real challenge, and every extra squishy makes it easier.', 'Bricks are tough from the start: on level 1 they carry about 3–8 hits each, and later levels add more rows and bombs. Every 10th level is a Big Level with double coins.'],
  perks=['Each squishy you own is one ball, drawn as that squishy.', '<b>Sky Puffs</b> balls float a little longer at the top.', 'Rarer squishies hit harder: Epic balls take 2 off a brick, Legendary ones 3.'],
  rewards='Coins only when you beat a level: the first time, 30 + 15 per star (45–75 coins; Big Levels pay double). Replaying pays 10 coins + 15 for each new star. The building’s upgrades unlock as you beat more levels.'),
'police': dict(file='lost-and-found', game='Lost & Found', len='Level-based (1–3 min per level)', levels=True,
  pitch='A level-based match-3 puzzle (Candy Crush style). The station\'s lost-property box tipped over and everything is jumbled! Swap neighbouring items to line up 3 or more of a kind. Every level has its own goal and a limited number of moves; beat it to earn 1–3 stars and unlock the next level.',
  how=['The board is a 7 × 8 grid of lost items: balloons, mittens, candies, keys, clovers and bows. Some levels have holes that make fun shapes.',
       'Swipe an item into its neighbour (or tap one, then the other) to swap them. The swap only counts if it makes a line of 3 or more.',
       'Matched items vanish, the ones above fall down, and new ones drop in. Chain reactions score more.',
       'Each level shows its goal at the top: <b>collect</b> a number of certain items, <b>find every paw-print clue</b> (match on top of the paw prints, some need two matches), or <b>pop all the bubble wrap</b> (wrapped items can\'t be swapped; match them to pop the wrap).',
       'Reach the goal before the moves run out to win. Spare moves turn into bonus points. Out of moves = try again (no coins).',
       'Specials: 4 in a row makes a <b>Siren</b> (clears its row or column), an L or T shape makes a <b>Bubble Bomb</b> (clears around it), 5 in a row makes a <b>Gold Badge</b> (swap it with any item to clear every item of that kind). Swap two specials together for a mega combo.'],
  controls='Swipe or tap. Stuck for a few seconds? Two items wiggle to show a possible move. If no move is left, the board shuffles itself. PC: click, or arrow keys + Space.',
  score=['Beating the goal = 1 star. A score bar with two star markers shows the 2- and 3-star scores.', '+30 per item (more in chain reactions), +50 per bubble wrap popped, +60 per paw print found, +300 per spare move.', 'Stars per level are saved, and you can replay any level to get more.'],
  harderTitle='Levels that never run out',
  harder=['Levels 1–8 teach one thing at a time: collecting, paw prints, bubble wrap, then mixed goals.', 'After that, levels keep coming forever: bigger goals, 6 kinds of items instead of 5, board shapes with holes, and two-layer paw prints and bubble wrap.', 'Every level number is the same for every player (it is built from the level number), so friends can compare stars.', 'Every 10th level is a <b>Big Level</b>: a few more moves, a bigger goal, and double coins.'],
  perks=['<b>Pet Pals</b> as your detective start each level with one Siren already on the board.', 'Rarer detectives get +1 / +2 / +3 extra moves (Rare / Epic / Legendary).'],
  rewards='Coins only when you beat a level: the first time, 30 + 15 per star (45–75 coins; Big Levels pay double). Replaying pays 10 coins + 15 for each new star you didn\'t have before. The building\'s upgrades unlock as you beat more levels. Solved cases collect into a sticker book in the station.'),
'salon': dict(file='style-studio', game='Style Studio', len='Endless (3 hearts)',
  pitch='A quick copy-the-look game. Each guest shows a picture of the hairdo they want. Comb, trim a fringe, spray, dye and decorate to match it before their patience runs out. There is no live match meter: you only find out how close you got when you are done. Guests never stop coming, and each one waits a little less.',
  how=['A guest sits in the chair. The Wants card shows the look they want, with 5 things to copy: style, colour, accessory, fringe and finish.',
       'Comb switches between curly, spiky and smooth.',
       'Fringe cycles the bangs (none, straight, side swoop). Spray cycles the finish (plain, shiny, sparkly glitter).',
       'Tap a colour drop to dye the hair and an accessory (bow, flower, star) to pop it on.',
       'The Match box stays a secret “?” while you work. Tap Done! (or let the patience bar run out) to see the final %, plus which things you missed.',
       'A match under 80% (fewer than 4 of 5 right) makes the guest unhappy and costs a heart. 3 hearts and the salon closes for the day.'],
  controls='Tap tools, colours and accessories. Every tool is a picture. PC: keys 1-3 for comb / fringe / spray, Enter for Done.',
  score=['Each happy guest scores match % × 10, plus a speed bonus for patience left. Unhappy guests still score a little (match % × 2).', 'A 100% perfect match adds a bonus that grows with every perfect in a row.', 'Your best score is saved.'],
  harder=['Each guest is less patient than the last.', 'Guests always arrive with a very different hairdo (at most 1 of the 5 things already right), so most looks need 4 or more changes.', 'With no live meter you have to really look: checking your work before tapping Done! is the skill.'],
  perks=['<b>Sugar Squad</b> stylists unlock sprinkle and glitter accessories.', '<b>Sky Puffs</b> stylists give every guest 20% more patience.'],
  rewards='Coins equal to the points ÷ 250, plus a milestone bonus of +10 / +25 / +50 coins at 5,000 / 15,000 / 30,000 points (you get the highest one reached). About 35 coins per minute for a good player. Hairstyles you create can be saved as cosmetic looks for your own squishies.'),
'fire': dict(file='bucket-brigade', game='Bucket Brigade', len='Level-based (1–3 min per level)', levels=True,
  pitch='A level-based colour-sorting puzzle (like the “water sort” games). The coloured water for the Splash Parade got all mixed up between the fire buckets! Pour from bucket to bucket until every bucket holds just one colour. Fewer moves means more stars, and every win unlocks the next level.',
  how=['Each bucket holds 4 layers of coloured water (5 in some later levels). There are always 2 empty buckets to help.',
       'Tap a bucket to pick it up, then tap another bucket to pour into it. The bucket flies over, tips and pours.',
       'You can only pour onto the same colour, or into an empty bucket, and only while there is room. All the matching layers on top pour together.',
       'When a bucket is full of one colour it gets a gold rim and a little firefighter squishy pops on top. Sort every colour to win.',
       'From level 8, some layers are <b>smoky</b> (grey with a “?”): you only see their colour when you uncover them.',
       'Helpers: <b>Undo</b> (free, but the move still counts), <b>Restart</b>, and <b>+ Bucket</b> (one extra empty bucket per level; using it caps that level at 2 stars).'],
  controls='Tap a bucket, then another. Every colour also has its own little symbol (dot, triangle, star, leaf…) so colour-blind players can play too. PC: click, or ← → and Space, U to undo.',
  score=['Every level is checked by a built-in solver when it is made, so it can always be solved, and the solver sets the 3-star move target.', '3 stars: finish within the target. 2 stars: within the target + about 30%. 1 star: any finish. Smoky levels get 2 extra moves on the target.', 'The top panel shows how many stars you would get if you finished right now.'],
  harderTitle='Levels that never run out',
  harder=['Level 1 starts with 3 colours. Every 2 levels add a colour, up to 10 colours (12 buckets) by level 15.', 'From level 8, smoky hidden layers appear, more and more of them (up to 60% of the hidden-able layers).', 'From level 18, every 3rd level uses tall 5-layer buckets.', 'Every 10th level is a <b>Big Level</b> with double coins.'],
  perks=['<b>Sea Squish</b> firefighters give you a second free + Bucket per level.', '<b>Sky Puffs</b> clear the smoke from one bucket at the start of each level.'],
  rewards='Coins only when you beat a level: the first time, 30 + 15 per star (45–75 coins; Big Levels pay double). Replaying pays 10 coins + 15 for each new star you didn\'t have before. The building\'s upgrades unlock as you beat more levels.'),
'post': dict(file='sort-a-lot', game='Sort-a-Lot', len='Endless (3 hearts)',
  pitch='A quick swipe-sorting game. Letters ride along a conveyor belt. Each has a coloured stamp that matches one of the family mail bags. Swipe each letter into the right bag before it falls off the end of the belt.',
  how=['Letters roll along the conveyor belt from left to right.',
       'Each letter has a coloured stamp matching one of the mail bags (each bag has a family squishy on it).',
       'Swipe or drag a letter down into the bag with the same stamp. A quick flick toward a bag is enough.',
       'A letter in the wrong bag, or one that falls off the end of the belt, costs a heart.',
       '3 hearts and the post office closes. Otherwise the letters never stop.'],
  controls='Swipe. That’s it. Great for the youngest players. PC: drag with the mouse, or press 1-6 to send the front letter to that bag.',
  score=['+10 per letter, × your streak multiplier (sort 5 in a row for ×2, up to ×5).', 'Your best score is saved.'],
  harder=['Every 7 letters the belt speeds up and letters come closer together.', 'A new bag opens every couple of levels, up to 6 bags.', 'Later, some stamps get white spots: a spotty pink stamp goes in the spotty pink bag, not the plain one.'],
  perks=['<b>Dumpling Gang</b> sorters slow the belt down by 15%.', '<b>Pet Pals</b> sorters auto-sort one letter every 10 seconds (they fetch it!).'],
  rewards='Coins equal to the points ÷ 55 (no milestone bonus). About 35 coins per minute for a good player. Sorted letters sometimes contain a decor item for a house.'),
'bandstand': dict(file='squeak-beat', game='Squeak Beat', len='One song per track (1–1.5 min)', levels=True, kind='rhythm game with 30 tracks', unlock='cleared enough tracks in Squeak Beat',
  pitch='A Piano Tiles style game with real songs. Your squishies themselves slide down four columns. Tap the lowest one (or anywhere in its column) any time while it is on screen: it just has to be its turn, with no other squishy below it. Long squishies trail a stripe you hold until it ends. Every tap plays the next note of the tune, so you are the one playing the melody.<br><br><b>The music:</b> 30 different tracks, each one complete song (intro, verses, choruses, sometimes a breakdown, and an ending). Every track has its own style (pop, disco, swing, chill or march), tempo, key, chords and band, all made live in the browser: drums, bass, chords, bells, reverb and echo. The melody you play is written to fit the chords, and each band (Dumpling Gang, Sugar Squad, Sea Squish, Pet Pals) has its own voice.',
  how=['Pick a track from the list. Each shows its difficulty, band, tempo and length.',
       'Squishies slide down four columns. The lowest one glows: that is the one to tap, on the squishy or anywhere in its column, as early as you like. Two side by side are both the next one.',
       'A squishy that slides off the bottom is a miss. Tapping a column whose squishy isn’t next, or letting go of a stripe too early, is a mistake. Every miss or mistake costs one of your <b>3 hearts</b>; lose all 3 and the show stops.',
       'Tapping right as a squishy crosses the white line scores a PERFECT bonus, but it’s never required.',
       'Long squishies have a stripe behind them: tap and keep holding until the stripe has passed the line.'],
  controls='Tap or hold the four columns (two fingers for the harder tracks). PC: D F J K, 1 2 3 4 or the arrow keys. Sound on!',
  score=['Each squishy 200 points (300 for a PERFECT right on the line); held stripes add points while you hold. A long combo multiplies points (up to ×2).', 'Stars come from accuracy, the share of squishies you tapped: finish = ★, 85% = ★★, 95% = ★★★.', 'Best stars and best score per track are saved.'],
  harderTitle='Stars open new tracks',
  harder=['Track N opens when you have (N − 1) × 3 stars in total: track 2 needs 3★, track 3 needs 6★, track 10 needs 27★. Every locked track shows how many stars it needs and how many you have.', 'Later tracks are faster (from about 86 to 160 BPM), have more notes per bar, more and longer held stripes, two squishies at once (chords) and a breakdown section.', 'Squishies scroll faster on harder tracks, so you have less time to read ahead.'],
  perks=['Each family has its own squeak voice, so the band you bring changes the sound.', '<b>Sea Squish</b> band members make the timing window a little wider.', 'A full band from one family gets a bonus encore track.'],
  rewards='About 40 coins per minute of music, times your accuracy (a 1:20 song at 90% pays about 48), so it pays like the other minigames. Replays pay the same way, so playing a favourite track again is never wasted. Every new building level unlocks a new set of tracks in the real game.'),
'greenhouse': dict(file='grow-grow-garden', game='Grow Grow Garden', len='Endless (3 hearts)',
  pitch='A busy real-time care game. Seeds sprout in the 3×3 garden all by themselves, on a timer that keeps getting quicker, so you can never slow the garden down. Give each plant what it asks for until it blooms, then harvest it, and shoo away the snails.',
  how=['Seeds pop up in empty beds on their own every few seconds (a little soil wiggle shows where the next one is coming). You cannot plant or pause them: you have to keep up.',
       'Each plant shows a bubble with what it needs: a water drop or a sun. The ring around the bubble shows how long it can wait.',
       'Pick the matching tool and tap the plant. It grows a stage. Three stages later it blooms.',
       'Pick the basket and tap the bloom to harvest it. Golden blooms are worth 3×.',
       'Snails crawl toward your plants: tap them to send them home. A need that waits too long makes the plant wilt and costs a heart. 3 hearts and the garden rests.'],
  controls='Tap a tool (Water, Sun, Harvest), then tap a plant. PC: keys 1-3 pick the tool.',
  score=['+100 per flower harvested (+300 for golden ones), plus a speed bonus.', '+10 for each feed, +20 for each snail sent home.', 'Your best score is saved.'],
  harder=['New seeds sprout faster and faster (from about every 3.5 s down to about every 1.3 s), based on time played and flowers harvested.', 'Every 5 harvests, plants wait less before wilting but also grow faster.', 'Snails come more often and crawl faster. From level 2, golden blooms appear.'],
  perks=['<b>Forest Folk</b> gardeners make plants grow a stage faster 20% of the time.', '<b>Fresh Fruits</b> gardeners get golden blooms twice as often.'],
  rewards='Coins equal to the points ÷ 200, plus a milestone bonus of +10 / +25 / +50 coins at 20 / 40 / 70 flowers harvested in one run (you get the highest one reached). About 35 coins per minute for a good player. Harvested flowers can be placed as garden decor around any house.'),
}
KEEP = {
  'restaurant': 'carry on with 1 heart, and every waiting guest’s patience refills',
  'playground': 'a balloon floats your squishy back up into the clouds',
  'police': 'get 5 more moves for the same case',
  'salon': 'carry on with 1 heart',
  'post': 'carry on with 1 heart, and the letters past the middle are cleared away',
  'bandstand': 'finish the song with 1 heart (the next few squishies are skipped so you can get ready)',
  'greenhouse': 'carry on with 1 heart; every plant’s wait resets and the snails go home',
  'arcade': 'the bricks are pushed 3 rows back up',
}
for bid, g in G.items():
    p = OUT + bid + '.html'; s = open(p).read()
    a = s.index('<p class="eyebrow">The minigame</p>'); a = s.rfind('<section>', 0, a); b = s.index('</section>', a) + len('</section>')
    keep = f'''<h3>Keep going (optional ad)</h3><p>When the run ends, the player can choose to watch a short ad once per run: {KEEP[bid]}. “No thanks” ends the run as normal. See the <a href="guide.html#ads">ad rules</a>.</p>''' if bid in KEEP else ''
    new = f'''<section>
  <div class="sec-head"><p class="eyebrow">The minigame</p><h2>{g['game']}</h2></div>
  <p class="playbar"><a class="play-btn" href="play/{g['file']}.html">&#9654; Play the prototype</a><span>Works on phone and computer. Each minigame is one file you can open on its own: <code>play/{g['file']}.html</code></span></p>
  <div class="game">
    <div class="prose">
      <p class="lede">{g['pitch']}</p>
      <h3>How it plays</h3>{ol(g['how'])}
      <h3>Controls</h3><p>{g['controls']}</p>
      <h3>Scoring</h3>{ul(g['score'])}
      <h3>{g.get('harderTitle', 'It never ends, it just gets harder')}</h3>{ul(g['harder'])}
      <h3>Squishy helpers</h3><p>You always play with squishies you own. Some families are extra good at this game:</p>{ul(g['perks'])}
      <h3>Rewards</h3><p>{g['rewards']}</p>{keep}
    </div>
    <figure class="phone" data-mock="{bid}" style="margin:0"></figure>
  </div>
</section>'''
    s = s[:a] + new + s[b:]
    s = re.sub(r'<li><b>Play time:</b> [^<]*</li>', f'<li><b>Play time:</b> {g["len"]}</li>', s)
    if g.get('levels'):
        s = re.sub(r'each upgrade unlocks when (your best score in [^<]*? is high enough|you have [^,]*?)(?=, and then)', f'each upgrade unlocks when you have {g.get("unlock", "beaten enough levels of " + g["game"])}', s)
        s = re.sub(r'<li><b>Minigame:</b> [^<]*</li>', f'<li><b>Minigame:</b> {g["game"]} ({g.get("kind", "level-based puzzle")})</li>', s)
    open(p, 'w').write(s); print('updated', bid)
