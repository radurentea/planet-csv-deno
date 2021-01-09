import { BufReader } from "../io/bufio.ts";
import { TextProtoReader } from "../textproto/mod.ts";
import { StringReader } from "../io/readers.ts";
import { assert } from "../_util/assert.ts";
export { NEWLINE, stringify, StringifyError } from "./csv_stringify.ts";
const INVALID_RUNE = ["\r", "\n", '"'];
export const ERR_BARE_QUOTE = 'bare " in non-quoted-field';
export const ERR_QUOTE = 'extraneous or missing " in quoted-field';
export const ERR_INVALID_DELIM = "Invalid Delimiter";
export const ERR_FIELD_COUNT = "wrong number of fields";
export class ParseError extends Error {
    constructor(start, line, column, message) {
        super();
        this.startLine = start;
        this.column = column;
        this.line = line;
        if (message === ERR_FIELD_COUNT) {
            this.message = `record on line ${line}: ${message}`;
        }
        else if (start !== line) {
            this.message =
                `record on line ${start}; parse error on line ${line}, column ${column}: ${message}`;
        }
        else {
            this.message =
                `parse error on line ${line}, column ${column}: ${message}`;
        }
    }
}
function chkOptions(opt) {
    if (!opt.separator) {
        opt.separator = ",";
    }
    if (!opt.trimLeadingSpace) {
        opt.trimLeadingSpace = false;
    }
    if (INVALID_RUNE.includes(opt.separator) ||
        (typeof opt.comment === "string" && INVALID_RUNE.includes(opt.comment)) ||
        opt.separator === opt.comment) {
        throw new Error(ERR_INVALID_DELIM);
    }
}
async function readRecord(startLine, reader, opt = { separator: ",", trimLeadingSpace: false }) {
    const tp = new TextProtoReader(reader);
    let line = await readLine(tp);
    let lineIndex = startLine + 1;
    if (line === null)
        return null;
    if (line.length === 0) {
        return [];
    }
    if (opt.comment && line[0] === opt.comment) {
        return [];
    }
    assert(opt.separator != null);
    let fullLine = line;
    let quoteError = null;
    const quote = '"';
    const quoteLen = quote.length;
    const separatorLen = opt.separator.length;
    let recordBuffer = "";
    const fieldIndexes = [];
    parseField: for (;;) {
        if (opt.trimLeadingSpace) {
            line = line.trimLeft();
        }
        if (line.length === 0 || !line.startsWith(quote)) {
            const i = line.indexOf(opt.separator);
            let field = line;
            if (i >= 0) {
                field = field.substring(0, i);
            }
            if (!opt.lazyQuotes) {
                const j = field.indexOf(quote);
                if (j >= 0) {
                    const col = runeCount(fullLine.slice(0, fullLine.length - line.slice(j).length));
                    quoteError = new ParseError(startLine + 1, lineIndex, col, ERR_BARE_QUOTE);
                    break parseField;
                }
            }
            recordBuffer += field;
            fieldIndexes.push(recordBuffer.length);
            if (i >= 0) {
                line = line.substring(i + separatorLen);
                continue parseField;
            }
            break parseField;
        }
        else {
            line = line.substring(quoteLen);
            for (;;) {
                const i = line.indexOf(quote);
                if (i >= 0) {
                    recordBuffer += line.substring(0, i);
                    line = line.substring(i + quoteLen);
                    if (line.startsWith(quote)) {
                        recordBuffer += quote;
                        line = line.substring(quoteLen);
                    }
                    else if (line.startsWith(opt.separator)) {
                        line = line.substring(separatorLen);
                        fieldIndexes.push(recordBuffer.length);
                        continue parseField;
                    }
                    else if (0 === line.length) {
                        fieldIndexes.push(recordBuffer.length);
                        break parseField;
                    }
                    else if (opt.lazyQuotes) {
                        recordBuffer += quote;
                    }
                    else {
                        const col = runeCount(fullLine.slice(0, fullLine.length - line.length - quoteLen));
                        quoteError = new ParseError(startLine + 1, lineIndex, col, ERR_QUOTE);
                        break parseField;
                    }
                }
                else if (line.length > 0 || !(await isEOF(tp))) {
                    recordBuffer += line;
                    const r = await readLine(tp);
                    lineIndex++;
                    line = r ?? "";
                    fullLine = line;
                    if (r === null) {
                        if (!opt.lazyQuotes) {
                            const col = runeCount(fullLine);
                            quoteError = new ParseError(startLine + 1, lineIndex, col, ERR_QUOTE);
                            break parseField;
                        }
                        fieldIndexes.push(recordBuffer.length);
                        break parseField;
                    }
                    recordBuffer += "\n";
                }
                else {
                    if (!opt.lazyQuotes) {
                        const col = runeCount(fullLine);
                        quoteError = new ParseError(startLine + 1, lineIndex, col, ERR_QUOTE);
                        break parseField;
                    }
                    fieldIndexes.push(recordBuffer.length);
                    break parseField;
                }
            }
        }
    }
    if (quoteError) {
        throw quoteError;
    }
    const result = [];
    let preIdx = 0;
    for (const i of fieldIndexes) {
        result.push(recordBuffer.slice(preIdx, i));
        preIdx = i;
    }
    return result;
}
async function isEOF(tp) {
    return (await tp.r.peek(0)) === null;
}
function runeCount(s) {
    return Array.from(s).length;
}
async function readLine(tp) {
    let line;
    const r = await tp.readLine();
    if (r === null)
        return null;
    line = r;
    if ((await isEOF(tp)) && line.length > 0 && line[line.length - 1] === "\r") {
        line = line.substring(0, line.length - 1);
    }
    if (line.length >= 2 &&
        line[line.length - 2] === "\r" &&
        line[line.length - 1] === "\n") {
        line = line.substring(0, line.length - 2);
        line = line + "\n";
    }
    return line;
}
export async function readMatrix(reader, opt = {
    separator: ",",
    trimLeadingSpace: false,
    lazyQuotes: false,
}) {
    const result = [];
    let _nbFields;
    let lineResult;
    let first = true;
    let lineIndex = 0;
    chkOptions(opt);
    for (;;) {
        const r = await readRecord(lineIndex, reader, opt);
        if (r === null)
            break;
        lineResult = r;
        lineIndex++;
        if (first) {
            first = false;
            if (opt.fieldsPerRecord !== undefined) {
                if (opt.fieldsPerRecord === 0) {
                    _nbFields = lineResult.length;
                }
                else {
                    _nbFields = opt.fieldsPerRecord;
                }
            }
        }
        if (lineResult.length > 0) {
            if (_nbFields && _nbFields !== lineResult.length) {
                throw new ParseError(lineIndex, lineIndex, null, ERR_FIELD_COUNT);
            }
            result.push(lineResult);
        }
    }
    return result;
}
export async function parse(input, opt = {
    skipFirstRow: false,
}) {
    let r;
    if (input instanceof BufReader) {
        r = await readMatrix(input, opt);
    }
    else {
        r = await readMatrix(new BufReader(new StringReader(input)), opt);
    }
    if (opt.skipFirstRow || opt.columns) {
        let headers = [];
        let i = 0;
        if (opt.skipFirstRow) {
            const head = r.shift();
            assert(head != null);
            headers = head.map((e) => {
                return {
                    name: e,
                };
            });
            i++;
        }
        if (opt.columns) {
            if (typeof opt.columns[0] !== "string") {
                headers = opt.columns;
            }
            else {
                const h = opt.columns;
                headers = h.map((e) => {
                    return {
                        name: e,
                    };
                });
            }
        }
        return r.map((e) => {
            if (e.length !== headers.length) {
                throw `Error number of fields line:${i}`;
            }
            i++;
            const out = {};
            for (let j = 0; j < e.length; j++) {
                const h = headers[j];
                if (h.parse) {
                    out[h.name] = h.parse(e[j]);
                }
                else {
                    out[h.name] = e[j];
                }
            }
            if (opt.parse) {
                return opt.parse(out);
            }
            return out;
        });
    }
    if (opt.parse) {
        return r.map((e) => {
            assert(opt.parse, "opt.parse must be set");
            return opt.parse(e);
        });
    }
    return r;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3N2LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY3N2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU1BLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUMzQyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ2hELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUU1QyxPQUFPLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQVN4RSxNQUFNLFlBQVksR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFFdkMsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLDRCQUE0QixDQUFDO0FBQzNELE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRyx5Q0FBeUMsQ0FBQztBQUNuRSxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRyxtQkFBbUIsQ0FBQztBQUNyRCxNQUFNLENBQUMsTUFBTSxlQUFlLEdBQUcsd0JBQXdCLENBQUM7QUFNeEQsTUFBTSxPQUFPLFVBQVcsU0FBUSxLQUFLO0lBUW5DLFlBQ0UsS0FBYSxFQUNiLElBQVksRUFDWixNQUFxQixFQUNyQixPQUFlO1FBRWYsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUN2QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUVqQixJQUFJLE9BQU8sS0FBSyxlQUFlLEVBQUU7WUFDL0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxrQkFBa0IsSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDO1NBQ3JEO2FBQU0sSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1lBQ3pCLElBQUks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