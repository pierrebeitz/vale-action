import * as github from '@actions/github';
const execa = require('execa');

type GitRef = string;

const cache = {};
export const wasLineTouchedInPR = (filename: string, line: number) => {
  const fromSHA = github.context.payload?.pull_request?.base?.sha;
  if (!fromSHA) {
    return true;
  }

  cache[filename + fromSHA] =
    cache[filename + fromSHA] ||
    execa
      // unified=0 => no context around changed lines.
      .commandSync(`git diff --unified=0 ${fromSHA}...HEAD -- ${filename}`)
      .stdout.toString()
      .split(/(?:\r\n|\r|\n)/g)
      // compute the lines that have been added. e.g: `[1, 42]`.
      .reduce((acc, line) => {
        // lines starting with @@ mark a hunk. the format is like this:
        // @@ -(start of removals),(number of removed lines) +(start of insertions),(number of insertions)
        // here are some examples:
        // @@ -33,0 +42,24 @@ => removes nothing and inserts 24 lines starting at line 42
        // @@ -8 +6 @@        => removes line 8 and adds line 6. if there's no comma it's a single-line change.
        if (!line.startsWith('@@')) return acc;

        // get the `+` portion, as only additions are relevant in order to filter annotations for portions that are changed.
        // afterwards split by `,` (no `,` means a single line addition).
        const [start, numberOfChangedLines = 1] = line.split(' ')[2].split(',');

        const startInt = parseInt(start, 10);
        for (let i = 0; i < numberOfChangedLines; i++) {
          acc.push(startInt + i);
        }
        return acc;
      }, []);

  return cache[filename + fromSHA];
};
