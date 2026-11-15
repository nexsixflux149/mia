// All scenario palettes and authored room surfaces stay in the original world builder.
export const SUPPORTED_THEMES = ['mia','gwimun','ophelia','doll','hospital','camp','west','kimono','clown','park','zombie'];
export function graphicsProfile(theme,chapter){
 const warm=['west','kimono','doll'].includes(theme);
 return {exposure:chapter.outdoor?(warm?1.7:1.58):1.68,ambient:chapter.outdoor?.85:.9,
  directional:.65,fogMultiplier:chapter.outdoor?.9:.94,pointScale:1,
  shadowColor:warm?'#b4a79c':'#a6b5c1',moon:chapter.outdoor?.42:.12};
}
