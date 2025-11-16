function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateJigsawPath(seed: number, size: number): string {
  const baseSize = size;
  const nubSize = baseSize * 0.25;
  const nubDepth = baseSize * 0.15;
  
  const rng = (offset: number) => seededRandom(seed + offset);
  
  const topNubDir = rng(1) > 0.5 ? 1 : -1;
  const rightNubDir = rng(2) > 0.5 ? 1 : -1;
  
  const topStart = baseSize * 0.35;
  const topEnd = baseSize * 0.65;
  const topMid = (topStart + topEnd) / 2;
  
  const rightStart = baseSize * 0.35;
  const rightEnd = baseSize * 0.65;
  const rightMid = (rightStart + rightEnd) / 2;
  
  let path = `M 0 0`;
  path += ` L ${topStart} 0`;
  path += ` Q ${topStart} ${-nubDepth * topNubDir * 0.3} ${topMid - nubSize / 2} ${-nubDepth * topNubDir}`;
  path += ` Q ${topMid} ${-nubDepth * topNubDir * 1.2} ${topMid + nubSize / 2} ${-nubDepth * topNubDir}`;
  path += ` Q ${topEnd} ${-nubDepth * topNubDir * 0.3} ${topEnd} 0`;
  path += ` L ${baseSize} 0`;
  path += ` L ${baseSize} ${rightStart}`;
  path += ` Q ${baseSize + nubDepth * rightNubDir * 0.3} ${rightStart} ${baseSize + nubDepth * rightNubDir} ${rightMid - nubSize / 2}`;
  path += ` Q ${baseSize + nubDepth * rightNubDir * 1.2} ${rightMid} ${baseSize + nubDepth * rightNubDir} ${rightMid + nubSize / 2}`;
  path += ` Q ${baseSize + nubDepth * rightNubDir * 0.3} ${rightEnd} ${baseSize} ${rightEnd}`;
  path += ` L ${baseSize} ${baseSize}`;
  path += ` L 0 ${baseSize}`;
  path += ` Z`;
  
  return path;
}
