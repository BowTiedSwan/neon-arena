import GameCard from '@/components/ui/GameCard';
import { games } from '@/lib/game-registry';

export default function Home() {
  const gameList = Object.values(games);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold neon-text-pink mb-4">
            NEON ARENA
          </h1>
          <p className="text-xl text-gray-400">
            Multiplayer Retro Games
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {gameList.map((game) => (
            <GameCard
              key={game.slug}
              title={game.name}
              description={game.description}
              href={`/${game.slug}`}
              icon={game.icon}
            />
          ))}
        </div>

        <footer className="mt-16 text-center text-gray-600 text-sm">
          <p>Click a game to create a room, then share the link with a friend to play!</p>
        </footer>
      </div>
    </main>
  );
}