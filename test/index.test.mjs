import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import { transformFileSync } from '@babel/core';
import { describe, expect, it } from 'vitest';

describe('fixtures', () => {
    const fixturesDir = join(__dirname, 'fixtures');

    readdirSync(fixturesDir).map((suiteName) => {
        describe(suiteName, () => {
            const suitePath = join(fixturesDir, suiteName);
            readdirSync(suitePath).map((caseName, i) => {
                if (caseName === '.babelrc') return;

                if (i > 1) return;

                it(caseName.split('-').join(' '), () => {
                    const fixtureDir = join(suitePath, caseName);
                    const actual     = transformFileSync(
                        join(fixtureDir, 'actual.js'),
                    ).code;
                    const expected = readFileSync(join(fixtureDir, 'expected.js')).toString();

                    expect(actual.trim()).toEqual(expected.trim());
                });
            });
        });
    });
});
