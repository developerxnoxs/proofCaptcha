import { nanoid } from "nanoid";
import { UPSIDE_DOWN_CONFIG, type AnimalSprite, type UpsideDownChallengeData, type UpsideDownSolution } from "./upside-down-config";

export type { UpsideDownChallengeData, AnimalSprite, UpsideDownSolution };

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function doSpritesOverlap(
  sprite1: { x: number; y: number; size: number },
  sprite2: { x: number; y: number; size: number },
  minDistance: number = 20
): boolean {
  const dx = sprite1.x - sprite2.x;
  const dy = sprite1.y - sprite2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minRequiredDistance = (sprite1.size + sprite2.size) / 2 + minDistance;
  return distance < minRequiredDistance;
}

export function generateUpsideDownChallenge(): Omit<UpsideDownChallengeData, 'backgroundUrl'> {
  const { canvas, animals: animalTemplates, backgrounds, minAnimals, maxAnimals, upsideDownPercentage, tolerance } = UPSIDE_DOWN_CONFIG;
  
  const numAnimals = randomInt(minAnimals, maxAnimals);
  const numUpsideDown = Math.max(1, Math.floor(numAnimals * upsideDownPercentage));
  
  const backgroundIndex = randomInt(0, backgrounds.length - 1);
  
  const animalPlacements: AnimalSprite[] = [];
  const maxAttempts = 100;
  
  const orientations: Array<'upright' | 'upside_down'> = [
    ...Array(numUpsideDown).fill('upside_down'),
    ...Array(numAnimals - numUpsideDown).fill('upright'),
  ];
  const shuffledOrientations = shuffleArray(orientations);
  
  for (let i = 0; i < numAnimals; i++) {
    const animalTemplate = animalTemplates[randomInt(0, animalTemplates.length - 1)];
    const orientation = shuffledOrientations[i];
    
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < maxAttempts) {
      const padding = animalTemplate.size / 2 + 10;
      const x = randomInt(padding, canvas.width - padding);
      const y = randomInt(padding, canvas.height - padding);
      
      const newSprite = { x, y, size: animalTemplate.size };
      
      const overlaps = animalPlacements.some(existing => 
        doSpritesOverlap(newSprite, { x: existing.x, y: existing.y, size: animalTemplate.size }, 30)
      );
      
      if (!overlaps) {
        animalPlacements.push({
          id: nanoid(8),
          x,
          y,
          orientation,
          animalType: animalTemplate.id,
          path: animalTemplate.path,
        });
        placed = true;
      }
      
      attempts++;
    }
    
    if (!placed) {
      const padding = animalTemplate.size / 2 + 10;
      animalPlacements.push({
        id: nanoid(8),
        x: randomInt(padding, canvas.width - padding),
        y: randomInt(padding, canvas.height - padding),
        orientation,
        animalType: animalTemplate.id,
        path: animalTemplate.path,
      });
    }
  }
  
  return {
    backgroundIndex,
    animals: animalPlacements,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    tolerance,
  };
}

export function getUpsideDownAnimals(challengeData: UpsideDownChallengeData): AnimalSprite[] {
  return challengeData.animals.filter(animal => animal.orientation === 'upside_down');
}

export function validateUpsideDownSolution(
  challengeData: UpsideDownChallengeData,
  clicks: Array<{ x: number; y: number }>
): { valid: boolean; reason?: string; details?: any } {
  const upsideDownAnimals = getUpsideDownAnimals(challengeData);
  const tolerance = challengeData.tolerance;
  
  if (clicks.length === 0) {
    return { valid: false, reason: 'No clicks provided' };
  }
  
  if (clicks.length < upsideDownAnimals.length) {
    return { 
      valid: false, 
      reason: 'Not all upside-down animals were selected',
      details: {
        required: upsideDownAnimals.length,
        provided: clicks.length,
      }
    };
  }
  
  if (clicks.length > upsideDownAnimals.length) {
    return { 
      valid: false, 
      reason: 'Too many clicks - you selected animals that are not upside-down',
      details: {
        required: upsideDownAnimals.length,
        provided: clicks.length,
      }
    };
  }
  
  const matchedAnimals = new Set<string>();
  const unmatchedClicks: Array<{ x: number; y: number }> = [];
  
  for (const click of clicks) {
    let matched = false;
    
    for (const animal of upsideDownAnimals) {
      if (matchedAnimals.has(animal.id)) continue;
      
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
      unmatchedClicks.push(click);
    }
  }
  
  if (matchedAnimals.size !== upsideDownAnimals.length) {
    return { 
      valid: false, 
      reason: 'Some upside-down animals were not clicked correctly',
      details: {
        matched: matchedAnimals.size,
        required: upsideDownAnimals.length,
        unmatchedClicks,
      }
    };
  }
  
  if (unmatchedClicks.length > 0) {
    return { 
      valid: false, 
      reason: 'Some clicks do not match any upside-down animal',
      details: {
        unmatchedClicks,
      }
    };
  }
  
  return { valid: true };
}
