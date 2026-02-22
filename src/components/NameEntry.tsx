'use client';

import { useState } from 'react';
import Modal from './ui/Modal';

interface NameEntryProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
}

export default function NameEntry({ isOpen, onSubmit }: NameEntryProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <form onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold neon-text mb-6 text-center">
          Enter Your Name
        </h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name..."
          className="w-full p-3 bg-[#1a1c2c] border-2 border-[#05d9e8] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#ff2a6d] transition-colors"
          maxLength={20}
          autoFocus
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-4 w-full glow-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Join Game
        </button>
      </form>
    </Modal>
  );
}