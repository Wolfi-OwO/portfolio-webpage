import { siJavascript, siTypescript, siReact, siAngular, siTailwindcss, siNodedotjs, siExpress, siSpringboot, siOpenjdk, siKotlin, siDotnet, siDocker, siGithubactions, siMongodb, siPostgresql, siGit } from 'simple-icons';

// Brand marks from simple-icons. It no longer ships Azure, and "SQL" is a language, not a brand, so those two are drawn here.
const AZURE = { path: 'M13.05 2 6.6 7.9 1 21.7h5.1zm.9 1.6L11 11.3l5.7 7.1-10.6 1.6H23z', hex: '0078D4' };
const SQL = { path: 'M12 2C7.6 2 4 3.3 4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5c0-1.7-3.6-3-8-3zm0 2c3.7 0 6 1 6 1s-2.3 1-6 1-6-1-6-1 2.3-1 6-1zm6 14.6c-.6.5-2.6 1.4-6 1.4s-5.4-.9-6-1.4v-2.3c1.3.7 3.5 1.2 6 1.2s4.7-.5 6-1.2zm0-5c-.6.5-2.6 1.4-6 1.4s-5.4-.9-6-1.4v-2.3c1.3.7 3.5 1.2 6 1.2s4.7-.5 6-1.2zm0-5c-.6.5-2.6 1.4-6 1.4S6.6 9.1 6 8.6V6.4c1.3.7 3.5 1.2 6 1.2s4.7-.5 6-1.2z', hex: '4479A1' };

export const TECH_ICON = {
  'JavaScript': siJavascript, 'TypeScript': siTypescript, 'React': siReact, 'Angular': siAngular, 'Tailwind CSS': siTailwindcss,
  'Node.js': siNodedotjs, 'Express': siExpress, 'Spring Boot': siSpringboot, 'Java': siOpenjdk, 'Kotlin': siKotlin, '.NET Core': siDotnet,
  'Docker': siDocker, 'Azure': AZURE, 'GitHub Actions': siGithubactions, 'MongoDB': siMongodb, 'PostgreSQL': siPostgresql, 'SQL': SQL, 'Git': siGit,
};
