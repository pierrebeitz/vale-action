"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wasLineTouchedInPR = void 0;
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
const execa = require('execa');
const cache = {};
exports.wasLineTouchedInPR = (filename, line) => {
    var _a, _b, _c;
    console.log('echo 3');
    const fromSHA = (_c = (_b = (_a = github.context.payload) === null || _a === void 0 ? void 0 : _a.pull_request) === null || _b === void 0 ? void 0 : _b.base) === null || _c === void 0 ? void 0 : _c.sha;
    // default to return true when not in the context of a PR. this should never be true.
    if (!fromSHA)
        return true;
    const key = filename + fromSHA;
    console.log('echo 4');
    const lines = cache[key] || touchedLines(filename, fromSHA);
    cache[key] = lines;
    return lines.includes(line);
};
const touchedLines = (filename, fromSHA) => {
    console.log('echo 5');
    // unified=0 => no context around changed lines.
    const cmd = `git diff --unified=0 ${fromSHA} ${filename}`;
    console.log('echo 6', cmd);
    try {
        console.log('echo 7', execa.commandSync(`git status`));
        const out = execa.commandSync(cmd);
        console.log(out.stderr);
        return (out.stdout
            .toString()
            .split(/(?:\r\n|\r|\n)/g)
            // compute the lines that have been added. e.g: `[1, 42]`.
            .reduce((acc, line) => {
            // lines starting with @@ mark a hunk. the format is like this:
            // @@ -(start of removals),(number of removed lines) +(start of insertions),(number of insertions)
            // here are some examples:
            // @@ -33,0 +42,24 @@ => removes nothing and inserts 24 lines starting at line 42
            // @@ -8 +6 @@        => removes line 8 and adds line 6. if there's no comma it's a single-line change.
            if (!line.startsWith('@@'))
                return acc;
            // get the `+` portion, as only additions are relevant in order to filter annotations for portions that are changed.
            // afterwards split by `,` (no `,` means a single line addition).
            const [start, numberOfChangedLines = 1] = line
                .split(' ')[2]
                .split(',');
            const startInt = parseInt(start, 10);
            for (let i = 0; i < numberOfChangedLines; i++) {
                acc.push(startInt + i);
            }
            return acc;
        }, []));
    }
    catch (e) {
        core.warning(`Failed to run "${cmd}: ${e}"`);
        return [];
    }
};
