const QUOTE = '"';
export const NEWLINE = "\r\n";
export class StringifyError extends Error {
    constructor() {
        super(...arguments);
        this.name = "StringifyError";
    }
}
function getEscapedString(value, sep) {
    if (value === undefined || value === null)
        return "";
    let str = "";
    if (typeof value === "object")
        str = JSON.stringify(value);
    else
        str = String(value);
    if (str.includes(sep) || str.includes(NEWLINE) || str.includes(QUOTE)) {
        return `${QUOTE}${str.replaceAll(QUOTE, `${QUOTE}${QUOTE}`)}${QUOTE}`;
    }
    return str;
}
function normalizeColumn(column) {
    let fn, header, prop;
    if (typeof column === "object") {
        if (Array.isArray(column)) {
            header = String(column[column.length - 1]);
            prop = column;
        }
        else {
            ({ fn } = column);
            prop = Array.isArray(column.prop) ? column.prop : [column.prop];
            header = typeof column.header === "string"
                ? column.header
                : String(prop[prop.length - 1]);
        }
    }
    else {
        header = String(column);
        prop = [column];
    }
    return { fn, header, prop };
}
async function getValuesFromItem(item, normalizedColumns) {
    const values = [];
    for (const column of normalizedColumns) {
        let value = item;
        for (const prop of column.prop) {
            if (typeof value !== "object" || value === null)
                continue;
            if (Array.isArray(value)) {
                if (typeof prop === "number")
                    value = value[prop];
                else {
                    throw new StringifyError('Property accessor is not of type "number"');
                }
            }
            else
                value = value[prop];
        }
        if (typeof column.fn === "function")
            value = await column.fn(value);
        values.push(value);
    }
    return values;
}
export async function stringify(data, columns, options = {}) {
    const { headers, separator: sep } = {
        headers: true,
        separator: ",",
        ...options,
    };
    if (sep.includes(QUOTE) || sep.includes(NEWLINE)) {
        const message = [
            "Separator cannot include the following strings:",
            '  - U+0022: Quotation mark (")',
            "  - U+000D U+000A: Carriage Return + Line Feed (\\r\\n)",
        ].join("\n");
        throw new StringifyError(message);
    }
    const normalizedColumns = columns.map(normalizeColumn);
    let output = "";
    if (headers) {
        output += normalizedColumns
            .map((column) => getEscapedString(column.header, sep))
            .join(sep);
        output += NEWLINE;
    }
    for (const item of data) {
        const values = await getValuesFromItem(item, normalizedColumns);
        output += values
            .map((value) => getEscapedString(value, sep))
            .join(sep);
        output += NEWLINE;
    }
    return output;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3N2X3N0cmluZ2lmeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNzdl9zdHJpbmdpZnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS0EsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDO0FBQ2xCLE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFFOUIsTUFBTSxPQUFPLGNBQWUsU0FBUSxLQUFLO0lBQXpDOztRQUNXLFNBQUksR0FBRyxnQkFBZ0IsQ0FBQztJQUNuQyxDQUFDO0NBQUE7QUFFRCxTQUFTLGdCQUFnQixDQUFDLEtBQWMsRUFBRSxHQUFXO0lBQ25ELElBQUksS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLEtBQUssSUFBSTtRQUFFLE9BQU8sRUFBRSxDQUFDO0lBQ3JELElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUViLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUTtRQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDOztRQUN0RCxHQUFHLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBSXpCLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDckUsT0FBTyxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxHQUFHLEtBQUssR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDO0tBQ3ZFO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBMkJELFNBQVMsZUFBZSxDQUFDLE1BQWM7SUFDckMsSUFBSSxFQUEwQixFQUM1QixNQUFrQyxFQUNsQyxJQUE4QixDQUFDO0lBRWpDLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFO1FBQzlCLElBQUksS0FBSyxD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