import React, { useState } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const rulesSections = [
  {
    title: '📝 General Rules',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>Join or create a League.</li>
        <li>Every league has a Driver Championship and a Constructors Championship.</li>
        <li>Each player selects a Main Driver, a Reserve Driver and a Team with the deadline set 5 minutes before the qualifying session of each F1 race.</li>
        <li>The main driver will be awarded with the real points scored during the grand prix.</li>
        <li>On a normal racing weekend the Reserve Driver will only be activated if the main driver cannot start a race "DNS". DQ or DNFs will award no points to the main driver.</li>
        <li>Each race requires the selection of a different main driver, only when the list has been exhausted all 20 drivers will be available again.</li>
        <li>Each race requires the selection of a different reserve driver, only when the list has been exhausted all 20 drivers will be available again.</li>
        <li>Each race requires the selection of a different team, only when the list has been exhausted all 10 teams will be available again.</li>
        <li>Selections lock 5 minutes before the qualifying session starts.</li>
        <li>The selection can be made and edited until the selection lock is activated.</li>
      </ul>
    ),
  },
  {
    title: '🔄 Switcheroo',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>Each player has 3 'Switcheroo' opportunities per season.</li>
        <li>It swaps your Main and Reserve Drivers.</li>
        <li>On a regular race weekend the window is open between the end of qualifying and up to 5 minutes before the race starts.</li>
        <li>During sprint weekends the Switcheroo window will be open between sprint qualifying and 5 minutes before the sprint race.</li>
        <li>Switcheroo can only be used if both drivers are still available in both the Main and Reserve list.</li>
      </ul>
    ),
  },
  {
    title: '🏁 Sprint Races',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>On a sprint race weekend the countdowns will be based on the sprint schedule.</li>
        <li>Selections lock 5 minutes before the sprint qualifying session starts.</li>
        <li>The reserve driver is activated for the sprint race and will be awarded the points for the sprint race.</li>
      </ul>
    ),
  },
  {
    title: '🚀 Scoring System',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>Points awarded match real-world F1 points - (unless admin assigns 0 for missing the deadline)</li>
        <li>You will be awarded with the points scored by your main driver for the Drivers Championship.</li>
        <li>You will be awarded with the points scored by your team for the Constructor championship.</li>
        <li>If your Main Driver does not start the race, your Reserve Driver's points are automatically activated.</li>
        <li>Team points are calculated for the team you selected (your driver selection won't influence your team scoring).</li>
        <li>*On a sprint race weekend your main driver will be awarded the points for the main race and your reserve driver will be awarded the points for the sprint race.</li>
        <li>On a sprint race weekend your team will collect all the points from both the sprint and the main race.</li>
      </ul>
    ),
  },
  {
    title: '🔄 Admin',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>The player who creates the the league will also be the "admin" for the league.</li>
        <li>The admin can assign the drivers when a selection has not been made in a past race.</li>
        <li>If a selection has not been made by the deadline the admin can assign drivers and team but award 0 points to the driver as a penalty.</li>
        <li>The admin can also award the real points scored during that weekend, this is done for those who join the league late or are accessing fantasyF1thegame when the season has already started.</li>
        <li>The selections assigned by the admin will be clearly marked for the players to recognize.</li>
      </ul>
    ),
  },
  {
    title: '🔄 Game Flow',
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>Join or create a league.</li>
        <li>Share the league code with your friends to join.</li>
        <li>Select your Main Driver, Reserve Driver, and Team before the selection deadline (5 minutes before qualifying).</li>
        <li>After qualifying, review your selections. If desired, use Switcheroo before the race starts.</li>
        <li>Watch the race and track your points live as drivers and teams score.</li>
        <li>Points and standings update automatically after each race.</li>
        <li>Repeat selections each race weekend, managing strategy across the season to maximize points.</li>
      </ul>
    ),
  },
];

const Rules: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const total = rulesSections.length;

  return (
    <div className="relative w-full flex items-center justify-center overflow-x-hidden p-4 md:p-8">
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
      <div className="relative z-10 w-full max-w-2xl backdrop-blur-sm bg-white/60 rounded-xl p-8 border border-white/20 shadow-lg flex flex-col items-center">
        <h1 className="text-3xl font-bold text-center text-black mb-6">Fantasy<span className="text-red-500">F1</span>thegame Rules & Game Flow <span role='img' aria-label='race car'>🏎️</span></h1>
        <div className="w-full text-black text-base space-y-4 min-h-[250px] flex flex-col items-center justify-center transition-all duration-500">
          <h2 className="font-semibold text-lg mb-2 text-center text-black">{rulesSections[current].title}</h2>
          <div>{rulesSections[current].content}</div>
        </div>
        {/* Navigation fixed at bottom */}
        <div className="flex items-center justify-between w-full px-4 mt-8">
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