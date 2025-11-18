export const AUDIO_CONFIG = {
  animals: [
    { id: 'animal_001', name: 'tiger', path: '/assets/generated_images/animal_001_compressed_232cc0094da3c80c28196350cf21d603.webp', size: 80 },
    { id: 'animal_002', name: 'cat', path: '/assets/generated_images/animal_002_compressed_d187b6126635b1f648c430ee08973471.webp', size: 80 },
    { id: 'animal_003', name: 'bird', path: '/assets/generated_images/animal_003_compressed_a8bc6da31617c4e855411d235ea804ee.webp', size: 80 },
    { id: 'animal_004', name: 'elephant', path: '/assets/generated_images/animal_004_compressed_129c396210c1e62c83e9191e47792fba.webp', size: 80 },
    { id: 'animal_005', name: 'lion', path: '/assets/generated_images/animal_005_compressed_1818bb6cffa894a50e752664e7d25043.webp', size: 80 },
    { id: 'animal_006', name: 'giraffe', path: '/assets/generated_images/animal_006_compressed_63b0269c635d3e00e3530d40e7038d90.webp', size: 80 },
    { id: 'animal_007', name: 'bear', path: '/assets/generated_images/animal_007_compressed_06002a6749417522d33ae83820567fc8.webp', size: 80 },
    { id: 'animal_008', name: 'monkey', path: '/assets/generated_images/animal_008_compressed_0e9f2d3f34869040c9bff8518d92ae13.webp', size: 80 },
    { id: 'animal_009', name: 'rabbit', path: '/assets/generated_images/animal_009_compressed_74af1e0898c17aa4fac9a106ed08bb10.webp', size: 80 },
    { id: 'animal_010', name: 'fox', path: '/assets/generated_images/animal_010_compressed_e687027ccb94ac8cca9308fcb6babc11.webp', size: 80 },
    { id: 'animal_011', name: 'dog', path: '/assets/generated_images/animal_011_compressed_7bb4788b4dc3dcf75409aa8172347b24.webp', size: 80 },
    { id: 'animal_012', name: 'raccoon', path: '/assets/generated_images/animal_012_compressed_b65b83ad17b23a981ea2430a2bf83cda.webp', size: 80 },
  ],
  backgrounds: [
    '/assets/stock_images/floral_pattern_green_a3b1b488.jpg',
    '/assets/stock_images/floral_pattern_green_7eb03bb9.jpg',
  ],
  canvas: {
    width: 600,
    height: 400,
  },
  tolerance: 50,
  gridSize: 9, // 3x3 grid
  targetAnimalsCount: 3, // Number of animals to identify in audio instruction
} as const;

export interface AnimalSprite {
  id: string;
  x: number;
  y: number;
  name: string;
  path: string;
  gridPosition: number; // Position in 3x3 grid (0-8)
}

export interface AudioChallengeData {
  backgroundIndex: number;
  backgroundUrl: string;
  animals: AnimalSprite[];
  canvasWidth: number;
  canvasHeight: number;
  tolerance: number;
  audioInstruction: string; // Text instruction that will be read via TTS
  targetAnimals: string[]; // Array of animal names that should be clicked in order
  language?: string; // Language for the audio instruction (e.g., 'en', 'id')
}

export interface AudioSolution {
  clicks: Array<{ x: number; y: number }>;
}
