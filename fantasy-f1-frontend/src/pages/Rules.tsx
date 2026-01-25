import React, { useState } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const rulesSections = [
  {
    title: '📝 General Rules',
    content: (
      <ul className="list-disc list-outside space-y-1 pl-5">
        <li>Every league has a Driver Championship and a Constructors Championship.</li>
        <li>Join or create a League.</li>
        <li>Build your deck of Power Cards to enhance your performances during the weekends.</li>
        <li>Each player selects a Main Driver, a Reserve Driver and a Team. The deadline is set 5 minutes before the qualifying session (or sprint qualifying if sprint weekend) of each F1 race.</li>
        <li>The main driver will be awarded with the real points scored during the grand prix and if a Power Card has been used this will affect the scored point accordingly.</li>
        <li>On a normal racing weekend the Reserve Driver will only be activated if the main driver cannot start a race "DNS". DQ or DNFs will award no points to the main driver.</li>
        <li>Each race requires the selection of a different main and reserve driver, only when the list has been exhausted all 20 drivers will be available again.</li>
        <li>Each race requires the selection of a different team, only when the list has been exhausted all 10 teams will be available again.</li>
        <li>The selection of drivers, teams and Power Cards can be made and edited until the selection lock is activated.</li>
        <li>If the player forgets to make a selection, an automatic selection of the next available drivers and teams will be made.</li>
      </ul>
    ),
  },
  {
    title: '🏁 Sprint Races',
    content: (
      <ul className="list-disc list-outside space-y-1 pl-5">
        <li>On a sprint race weekend the countdowns will be based on the sprint schedule.</li>
        <li>Selections lock 5 minutes before the sprint qualifying session starts.</li>
        <li>The reserve driver is activated for the sprint race and will be awarded the points for the sprint race.</li>
        <li>No Power Cards can be used during a sprint weekend.</li>
      </ul>
    ),
  },
  {
    title: '🎴 Power Cards',
    content: (
      <ul className="list-disc list-outside space-y-1 pl-5">
        <li>Power Cards are divided into Driver cards and Team cards.</li>
        <li>There are three tiers of cards: Gold, Silver and Bronze.</li>
        <li>Each tier occupies a set number of slots, it differs between Drivers' and Teams' cards.</li>
        <li>Gold cards are limited to 2 for the Drivers' deck and to 1 for the Teams' deck.</li>
        <li>For the Driver's deck the player has 12 slots available for a maximum of 8 cards.</li>
        <li>For the Teams' deck the player has 10 slots available for a maximum of 6 cards.</li>
        <li>All slots have to be used.</li>
        <li>No card can be duplicated inside the deck.</li>
        <li>Each card is single use only.</li>
        <li>The decks can be edited until -5 min to the first qualifying session of 2026.</li>
        <li>Before each race, the players will decide if they want to use a power card for that weekend, this will be done in the selection page.</li>
        <li>The choice can be edited until -5 minutes to the qualifying session.</li>
        <li>Drivers' cards and teams' cards can be played separately.</li>
        <li>Power cards cannot be used during a sprint weekend.</li>
      </ul>
    ),
  },
  {
    title: '🚀 Scoring System',
    content: (
      <ul className="list-disc list-outside space-y-1 pl-5">
        <li>Points awarded match real world F1 points -</li>
        <li>Power Card effects are applied after calculating base points from race results.</li>
        <li>The players will be awarded with the points scored by the main driver for the Drivers Championship.</li>
        <li>The players will be awarded with the points scored by the team for the Constructor championship.</li>
        <li>If the Main Driver does not start the race, then the Reserve Driver is activated.</li>
        <li>Team points are calculated for the team you selected (your driver selection won't influence your team scoring).</li>
        <li>On a sprint race weekend the main driver will be awarded the points for the main race and the reserve driver will be awarded the points for the sprint race.</li>
        <li>On a sprint race weekend the team will collect all the points from both the sprint and the main race.</li>
        <li>Points and standings are updated by the end of the day after each race.</li>
      </ul>
    ),
  },
  {
    title: '🔄 Admin',
    content: (
      <ul className="list-disc list-outside space-y-1 pl-5">
        <li>The player who creates the league will also be the "admin" for the league.</li>
        <li>The admin can modify a selection for a player if needed, this will show on the Race History page as "admin-assigned".</li>
        <li>If the admin assigns a selection after the race has been processed, they can manually trigger a recalculation of points for that player.</li>
      </ul>
    ),
  },
  {
    title: '🔄 Game Flow',
    content: (
      <ul className="list-disc list-outside space-y-1 pl-5">
        <li>Join or create a league.</li>
        <li>Share the league code with your friends to join.</li>
        <li>Build your deck of Powercards</li>
        <li>Select your Main Driver, Reserve Driver, and Team before the selection deadline (5 minutes before qualifying).</li>
        <li>Decide if you want to use any of the Power Cards (unless it's a sprint weekend).</li>
        <li>Watch the race and track your points as drivers and teams score.</li>
        <li>Points and standings update automatically after each race.</li>
        <li>Repeat each race weekend, managing strategy across the season to maximize points.</li>
      </ul>
    ),
  },
];

const Rules: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const total = rulesSections.length;

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-x-hidden px-4 md:px-8 py-4 md:py-8">
      {/* Background image */}
      <div
        className="fixed inset-0 w-full h-full z-0"
        style={{
          backgroundImage: 'url("/Rules.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Content wrapper */}
      <div className="relative z-10 w-full max-w-2xl mx-auto backdrop-blur-sm bg-white/60 rounded-xl p-8 border border-white/20 shadow-lg flex flex-col items-center">
        <h1 className="text-3xl font-bold text-center text-black mb-6">TheFantasy<span className="text-red-500">F1</span>game Rules & Game Flow <span role='img' aria-label='race car'>🏎️</span></h1>
        <div className="w-full text-black text-base space-y-4 min-h-[250px] pb-24 mb-4 flex flex-col items-center justify-center transition-all duration-500">
          <h2 className="font-semibold text-lg mb-2 text-center text-black">{rulesSections[current].title}</h2>
          <div className="w-full pb-4">{rulesSections[current].content}</div>
        </div>
        {/* Navigation fixed at bottom */}
        <div className="flex items-center justify-between w-full px-4 mt-auto pt-2">
          <button
            className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-black disabled:opacity-30 transition"
            onClick={() => setCurrent((prev) => Math.max(prev - 1, 0))}
            disabled={current === 0}
            aria-label="Previous section"
          >
            {FaArrowLeft({ size: 20 })}
          </button>
          <div className="flex gap-1">
            {rulesSections.map((_, idx) => (
              <span
                key={idx}
                className={`inline-block w-2 h-2 rounded-full ${idx === current ? 'bg-red-500' : 'bg-black/30'}`}
              />
            ))}
          </div>
          <button
            className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-black disabled:opacity-30 transition"
            onClick={() => setCurrent((prev) => Math.min(prev + 1, total - 1))}
            disabled={current === total - 1}
            aria-label="Next section"
          >
            {FaArrowRight({ size: 20 })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Rules; 