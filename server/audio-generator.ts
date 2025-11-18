import crypto from "crypto";
import { nanoid } from "nanoid";
import { AUDIO_CONFIG, type AnimalSprite, type AudioChallengeData, type AudioSolution } from "./audio-config";

export type { AudioChallengeData, AnimalSprite, AudioSolution };

/**
 * SECURITY FIX: Cryptographically secure random integer generation
 */
function randomInt(min: number, max: number): number {
  return crypto.randomInt(min, max + 1);
}

/**
 * SECURITY FIX: Fisher-Yates shuffle using cryptographically secure random
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateAudioChallenge(language: string = 'en'): Omit<AudioChallengeData, 'backgroundUrl'> {
  const { canvas, animals: animalTemplates, backgrounds, gridSize, targetAnimalsCount, tolerance } = AUDIO_CONFIG;
  
  // Select random animals (at least targetAnimalsCount + some extras)
  const totalAnimals = gridSize; // 3x3 = 9 animals
  const selectedTemplates = shuffleArray([...animalTemplates]).slice(0, totalAnimals);
  
  // Calculate grid positions (3x3 grid)
  const cols = 3;
  const rows = 3;
  const cellWidth = canvas.width / cols;
  const cellHeight = canvas.height / rows;
  
  // Place animals in grid positions with randomization
  const animalPlacements: AnimalSprite[] = [];
  const shuffledPositions = shuffleArray(Array.from({ length: gridSize }, (_, i) => i));
  
  selectedTemplates.forEach((template, index) => {
    const gridPosition = shuffledPositions[index];
    const row = Math.floor(gridPosition / cols);
    const col = gridPosition % cols;
    
    // Add randomization within each cell (±30% of cell size)
    const randomOffsetX = (randomInt(-30, 30) / 100) * cellWidth;
    const randomOffsetY = (randomInt(-30, 30) / 100) * cellHeight;
    
    // Center of each grid cell with random offset
    const x = col * cellWidth + cellWidth / 2 + randomOffsetX;
    const y = row * cellHeight + cellHeight / 2 + randomOffsetY;
    
    // Ensure positions stay within canvas bounds
    const clampedX = Math.max(40, Math.min(canvas.width - 40, x));
    const clampedY = Math.max(40, Math.min(canvas.height - 40, y));
    
    animalPlacements.push({
      id: nanoid(8),
      x: Math.round(clampedX),
      y: Math.round(clampedY),
      name: template.name,
      path: template.path,
      gridPosition,
    });
  });
  
  // Select target animals (animals to be clicked)
  const targetAnimalIndices = shuffleArray(Array.from({ length: animalPlacements.length }, (_, i) => i))
    .slice(0, targetAnimalsCount);
  
  const targetAnimals = targetAnimalIndices
    .map(index => animalPlacements[index].name)
    .sort(); // Sort for consistent instruction
  
  // Generate audio instruction (will be translated on frontend)
  // We just store the animal names, translation happens on client
  const instruction = targetAnimals.join(',');
  
  const backgroundIndex = randomInt(0, backgrounds.length - 1);
  
  return {
    backgroundIndex,
    animals: animalPlacements,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    tolerance,
    audioInstruction: instruction,
    targetAnimals,
    language,
  };
}

export function getTargetAnimals(challengeData: AudioChallengeData): AnimalSprite[] {
  return challengeData.animals.filter(animal => 
    challengeData.targetAnimals.includes(animal.name)
  );
}

export function validateAudioSolution(
  challengeData: AudioChallengeData,
  clicks: Array<{ x: number; y: number }>
): { valid: boolean; reason?: string; details?: any } {
  const targetAnimals = getTargetAnimals(challengeData);
  const tolerance = challengeData.tolerance;
  
  if (clicks.length === 0) {
    return { valid: false, reason: 'No clicks provided' };
  }
  
  if (clicks.length < targetAnimals.length) {
    return { 
      valid: false, 
      reason: 'Not all target animals were selected',
      details: {
        required: targetAnimals.length,
        provided: clicks.length,
      }
    };
  }
  
  if (clicks.length > targetAnimals.length) {
    return { 
      valid: false, 
      reason: 'Too many clicks - you selected extra animals',
      details: {
        required: targetAnimals.length,
        provided: clicks.length,
      }
    };
  }
  
  // Check if all clicks match target animals (order doesn't matter for better UX)
  const matchedAnimalIds = new Set<string>();
  const unmatchedClicks: number[] = [];
  
  // For each click, try to match it with any unmatched target animal
  for (let i = 0; i < clicks.length; i++) {
    const click = clicks[i];
    let matched = false;
    
    // Try to find any target animal that matches this click and hasn't been matched yet
    for (const animal of targetAnimals) {
      if (matchedAnimalIds.has(animal.id)) continue;
      
      const dx = click.x - animal.x;
      const dy = click.y - animal.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= tolerance) {
        matchedAnimalIds.add(animal.id);
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      unmatchedClicks.push(i);
    }
  }
  
  // Check if all target animals were matched
  if (matchedAnimalIds.size !== targetAnimals.length) {
    // Find which animals were not clicked
    const missedAnimals = targetAnimals
      .filter(animal => !matchedAnimalIds.has(animal.id))
      .map(animal => animal.name);
    
    return { 
      valid: false, 
      reason: `Not all target animals were clicked correctly. Missing: ${missedAnimals.join(', ')}`,
      details: {
        matched: matchedAnimalIds.size,
        required: targetAnimals.length,
        missedAnimals,
        unmatchedClicks,
      }
    };
  }
  
  return { valid: true };
}
