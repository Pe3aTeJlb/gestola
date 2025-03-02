import { customAlphabet } from 'nanoid';
import { leftNames, rightNames } from './names.js';

export default class DockerNames {

    adjectives: string[];
    surnames: string[];

    constructor() {
        this.adjectives = leftNames;
        this.surnames = rightNames;
    }
    getRandomName(randChar: string | number | undefined): string {
        const randomName = this.generateRandomName(this.adjectives, this.surnames);
        if (!randChar) {
            return randomName;
        }
        const length = typeof randChar === 'number' ? randChar : 6;
        return `${randomName}_${this.getRandomChar(length)}`;
    }
    generateRandomName(leftNames: string[], rightNames: string[]): string {
        const left = leftNames[Math.floor(Math.random() * leftNames.length)];
        const right = rightNames[Math.floor(Math.random() * rightNames.length)];
        const name = `${left}_${right}`;
        /* Steve Wozniak is not boring. This is part of the docker names spec. */
        if (name === 'boring_wozniak') {
            return this.generateRandomName(leftNames, rightNames);
        }
        return name;
    }
    getRandomChar(length: number): string  {
        return customAlphabet('1234567890abcdefghiklmnopqrstuv', length)();
    }
}
