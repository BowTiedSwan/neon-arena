'use client';

import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

interface GameCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
}

export default function GameCard({ title, description, href, icon }: GameCardProps) {
  const router = useRouter();

  const handleClick = () => {
    const roomId = uuidv4();
    router.push(`${href}/${roomId}`);
  };

  return (
    <div 
      className="group cursor-pointer p-6 rounded-lg neon-border transition-all duration-300 hover:scale-105 bg-gradient-to-br from-[#1a1c2c] to-[#29366f]"
      onClick={handleClick}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h2 className="text-2xl font-bold mb-2 neon-text group-hover:neon-text-pink transition-all">
        {title}
      </h2>
      <p className="text-gray-400 text-sm">{description}</p>
      <button className="mt-4 glow-button w-full" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
        Play Now
      </button>
    </div>
  );
}