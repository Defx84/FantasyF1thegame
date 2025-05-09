import React from 'react';

const Info: React.FC = () => (
  <div className="relative w-full flex items-center justify-center overflow-x-hidden p-4 md:p-8">
    {/* Background image */}
    <div
      className="fixed inset-0 w-full h-full z-0"
      style={{
        backgroundImage: 'url("/background1.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
      }}
    />
    {/* Dark overlay for readability */}
    <div className="fixed inset-0 bg-black bg-opacity-30 z-0" />
    {/* Content wrapper */}
    <div className="relative z-10 w-full max-w-2xl backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/10 shadow-xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        <span className="text-white">Welcome to Fantasy</span>
        <span className="text-red-600">F1</span>
        <span className="text-white">thegame</span>
      </h1>
      <p className="text-white/90 leading-relaxed">
          I'd like to welcome all of you who will try my game. The idea came from just playing on an excel file with my friends, it was fun, but I thought I could do something more.<br /><br />
          I have absolutely no experience in coding, developing an app or a game, therefore everything you see here has been created with the help of AI. I do not consider myself a developer but I did put all my effort into this project. It took hundreds of hours to come up with this first usable version and I hope you and your friends will enjoy it.<br /><br />
          I would like to thank my friend Emanuele for giving me the direction on how to begin and some good tips along the way. And I'd like to thank my wife Martina because she always believes in me and she supported me during the production months, even when I was about to give up. Thank you.<br /><br />
        <b>Ps. The inbox is open for feedback and ideas.</b><br />
        <span className="block mt-2">
          <span className="font-mono text-white/90">thefantasyf1game+support@gmail.com</span> &rarr; <span className="text-white/70">for player support</span><br />
          <span className="font-mono text-white/90">thefantasyf1game+info@gmail.com</span> &rarr; <span className="text-white/70">for general inquiries or public info</span>
        </span><br />
          Thank you.<br />
        <span className="font-semibold">Federico</span>
        </p>
    </div>
  </div>
);

export default Info; 