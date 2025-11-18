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

export function generateAudioChallenge(): Omit<AudioChallengeData, 'backgroundUrl'> {
  const { canvas, animals: animalTemplates, backgrounds, gridSize, targetAnimalsCount, tolerance } = AUDIO_CONFIG;
  
  // Select random animals (at least targetAnimalsCount + some extras)
  const totalAnimals = gridSize; // 3x3 = 9 animals
  const selectedTemplates = shuffleArray([...animalTemplates]).slice(0, totalAnimals);
  
  // Calculate grid positions (3x3 grid)
  const cols = 3;
  const rows = 3;
  const cellWidth = canvas.width / cols;
  const cellHeight = canvas.height / rows;
  
  // Place animals in grid positions
  const animalPlacements: AnimalSprite[] = [];
  const shuffledPositions = shuffleArray(Array.from({ length: gridSize }, (_, i) => i));
  
  selectedTemplates.forEach((template, index) => {
    const gridPosition = shuffledPositions[index];
    const row = Math.floor(gridPosition / cols);
    const col = gridPosition % cols;
    
    // Center of each grid cell
    const x = col * cellWidth + cellWidth / 2;
    const y = row * cellHeight + cellHeight / 2;
    
    animalPlacements.push({
      id: nanoid(8),
      x: Math.round(x),
      y: Math.round(y),
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
  
  // Generate audio instruction
  const instruction = `Click on the ${targetAnimals.join(', and the ')} in order.`;
  
  const backgroundIndex = randomInt(0, backgrounds.length - 1);
  
  return {
    backgroundIndex,
    animals: animalPlacements,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    tolerance,
    audioInstruction: instruction,
    targetAnimals,
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
  
  // Check if clicks match target animals in the correct order
  const matchedAnimals = new Set<string>();
  const expectedOrder = [...challengeData.targetAnimals]; // Should match the order in instruction
  
  for (let i = 0; i < clicks.length; i++) {
    const click = clicks[i];
    const expectedAnimalName = expectedOrder[i];
    
    // Find the animal that matches this click
    let matched = false;
    for (const animal of targetAnimals) {
      if (matchedAnimals.has(animal.id)) continue;
      if (animal.name !== expectedAnimalName) continue;
      
      const dx = click.x - animal.x;
      const dy = click.y - animal.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= tolerance) {
        matchedAnimals.add(animal.id);
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      return { 
        valid: false, 
        reason: `Click ${i + 1} does not match the expected animal (${expectedAnimalName}) in the correct position or order`,
        details: {
          clickIndex: i,
          expectedAnimal: expectedAnimalName,
          click,
        }
      };
    }
  }
  
  if (matchedAnimals.size !== targetAnimals.length) {
    return { 
      valid: false, 
      reason: 'Not all target animals were clicked correctly',
      details: {
        matched: matchedAnimals.size,
        required: targetAnimals.length,
      }
    };
  }
  
  return { valid: true };
}
