export const AUDIO_CONFIG = {
  animals: [
    // Updated with user-selected clear and distinctive images
    { id: 'animal_001', name: 'cat', path: '/assets/generated_images/animal_001_compressed_232cc0094da3c80c28196350cf21d603.webp', size: 80 },
    { id: 'animal_003', name: 'elephant', path: '/assets/generated_images/animal_003_compressed_a8bc6da31617c4e855411d235ea804ee.webp', size: 80 },
    { id: 'animal_004', name: 'dog', path: '/assets/generated_images/animal_004_compressed_129c396210c1e62c83e9191e47792fba.webp', size: 80 },
    { id: 'animal_009', name: 'giraffe', path: '/assets/generated_images/animal_009_compressed_74af1e0898c17aa4fac9a106ed08bb10.webp', size: 80 },
    { id: 'animal_011', name: 'raccoon', path: '/assets/generated_images/animal_011_compressed_7bb4788b4dc3dcf75409aa8172347b24.webp', size: 80 },
    { id: 'animal_013', name: 'bear', path: '/assets/generated_images/animal_013_compressed_a0ae5ebadb4a4078c28b5fd8e74b21ea.webp', size: 80 },
    { id: 'animal_021', name: 'bird', path: '/assets/generated_images/animal_021_compressed_a668067c7119ee73bd248ce3abeb85a7.webp', size: 80 },
    { id: 'animal_022', name: 'cow', path: '/assets/generated_images/animal_022_compressed_c2b9c1108a9f8953df23a128b5ea30b1.webp', size: 80 },
    { id: 'animal_025', name: 'tiger', path: '/assets/generated_images/animal_025_compressed_d724c4aeb538a94e7642507c7e40177d.webp', size: 80 },
    { id: 'animal_028', name: 'monkey', path: '/assets/generated_images/animal_028_compressed_5c496c081e657272a62885af2b30ba28.webp', size: 80 },
    { id: 'animal_031', name: 'rabbit', path: '/assets/generated_images/animal_031_compressed_882005afc0e1ba6a22500d87e74191f6.webp', size: 80 },
    { id: 'animal_041', name: 'duck', path: '/assets/generated_images/animal_041_compressed_53effbb5c8cedd736c2eadd924928d24.webp', size: 80 },
    { id: 'animal_044', name: 'fox', path: '/assets/generated_images/animal_044_compressed_d31baa524e82a101bf3f0656a581fdcb.webp', size: 80 },
    { id: 'animal_046', name: 'lion', path: '/assets/generated_images/animal_046_compressed_96c0f26c5779d2f25a33b2918eb09179.webp', size: 80 },
    { id: 'animal_047', name: 'chicken', path: '/assets/generated_images/animal_047_compressed_abad3849c40521e8cc4c66a15477d970.webp', size: 80 },
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
