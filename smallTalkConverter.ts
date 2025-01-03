/**
 * Tokenize a string of Smalltalk code.
 * TODO:
 * Handle boolean | Ex: True | False
 * block declaration | Ex: [ :m | m ] vs
 * IDK what  | foo | foo <- 1 ia but I will need to support it.
 */
interface Token {
  // sc = special character
  t:
    | "sc"
    | "number"
    | "string"
    | "symbol"
    | "char"
    | "identifier"
    | "parameter"
    | "blockArgument"
    | "comment"
    | "whitespace";
  v: string;
}
interface TokenizeArrayResult {
  tokens: Token[];
  i: number; // Location moved to
}
export class TokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenError";
  }
}
export class ConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConversionError";
  }
}
export function convertSmalltalkToJavaScript(smallTalkStr: string): string {
  const tokens = tokenizeArray(smallTalkStr, 0, true);
  let jsStr = "";
  for (let i = 0; i < tokens.tokens.length; i++) {
    const token = tokens.tokens[i];
    switch (token.t) {
      case "number":
        jsStr += token.v;
        break;
      case "string":
        jsStr += `\`${token.v.replace(/`/g, "\\`")}\``;
        break;
      case "symbol":
        jsStr += `Symbol.for(${JSON.stringify(token.v)})`;
        break;
      case "comment":
        jsStr += `// ${token.v}`;
        break;
      case "whitespace":
        jsStr += token.v;
        break;
      case "sc":
        switch (token.v) {
          case "+":
          case "-":
          case "*":
          case "/":
            jsStr += token.v;
            break;
          // TODO Double check the semantics here - this may not be the correct operator - may need a custom function
          case "=":
            jsStr += "==";
            break;
          case "==":
            jsStr += "===";
            break;
          default:
            throw new ConversionError(`Unknown operator: ${token.v}`);
        }
        break;
      default:
        throw new ConversionError(`Unknown token: ${JSON.stringify(token)}`);
    }
  }
  return jsStr;
}
export function tokenizeArray(
  str: string,
  start: number = 0,
  includeWhitespace: boolean = false
): TokenizeArrayResult {
  const tokens: Token[] = [];
  let i = start;
  const n = str.length;

  while (i < n) {
    // Skip any leading whitespace
    if (isWhitespace(str[i])) {
      let v = "";
      while (isWhitespace(str[i])) {
        v += str[i];
        i++;
      }
      if (includeWhitespace) {
        tokens.push({ t: "whitespace", v });
      }
      continue;
    }
    if (i >= n) break;

    if (isAlpha(str[i])) {
      let v = "";
      while (isAlphanumeric(str[i])) {
        v += str[i];
        i++;
      }
      if (i < n && str[i] === ":") {
        tokens.push({ t: "parameter", v });
        i++;
        continue;
      }
      tokens.push({ t: "identifier", v });
      continue;
    }
    if ("+>*.;[]()|^&@".includes(str[i])) {
      tokens.push({ t: "sc", v: str[i] });
      i++;
      continue;
    }
    if (str[i] === "=") {
      if (i + 1 < n && str[i + 1] === "=") {
        tokens.push({ t: "sc", v: "==" });
        i += 2;
        continue;
      }
      tokens.push({ t: "sc", v: "=" });
      i++;
      continue;
    }
    // Handle double slash
    if (str[i] === "/") {
      if (i + 1 < n && str[i + 1] === "/") {
        tokens.push({ t: "sc", v: "//" });
        i += 2;
        continue;
      }
      tokens.push({ t: "sc", v: "/" });
      i++;
      continue;
    }
    if (str[i] === "\\") {
      if (i + 1 < n && str[i + 1] === "\\") {
        tokens.push({ t: "sc", v: "\\\\" });
        i += 2;
        continue;
      }
      throw new TokenError(`Ending with a trailing \\, expected \\\\`);
    }
    if (str[i] === ":") {
      if (i + 1 >= n) {
        throw new TokenError(`Ending with a trailing :`);
      }
      if (isAlpha(str[i + 1])) {
        let v = "";
        i++;
        while (isAlphanumeric(str[i])) {
          v += str[i];
          i++;
        }
        tokens.push({ t: "blockArgument", v });
        continue;
      }
    }
    if (str[i] === ">") {
      if (i + 1 >= n) {
        throw new TokenError(`Ending with a trailing >`);
      }
      if (str[i + 1] === "=") {
        tokens.push({ t: "sc", v: ">=" });
        i += 2;
        continue;
      }
    }
    if (str[i] === "<") {
      if (i + 1 >= n) {
        throw new TokenError(`Ending with a trailing <`);
      }
      if (str[i + 1] === "-") {
        tokens.push({ t: "sc", v: "<-" });
        i += 2;
        continue;
      }
      if (str[i + 1] === "=") {
        tokens.push({ t: "sc", v: "<=" });
        i += 2;
        continue;
      }
      tokens.push({ t: "sc", v: "<" });
      i++;
      continue;
    }
    if (str[i] === "$") {
      if (i + 1 < n) {
        tokens.push({ t: "char", v: str[i + 1] });
        i += 2;
        continue;
      }
      throw new TokenError(`Ending with a dollar sign`);
    }
    if (str[i] === "\"") {
      // smalltalk comment
      let v = "";
      i++;
      while (i < n && str[i] !== "\"") {
        v += str[i];
        i++;
      }
      i++;
      tokens.push({ t: "comment", v });
      continue;
    }
    if (str[i] === "`") {
      // Parse a backtick-quoted token (may contain extra backticks inside)
      const token: Token = {
        t: "string",
        v: "",
      };
      tokens.push(token);
      i++;
      while (i < n) {
        if (str[i] === "`" && i + 1 < n && str[i + 1] === "`") {
          // This is a double-backtick => treat as literal inside the string
          token.v += str[i];
          i += 2;
          continue;
        } else if (str[i] === "`") {
          // Single backtick => end of this quoted token
          i++;
          break;
        }
        token.v += str[i];
        i++;
      }
      continue;
    }
    if (str[i] === "#") {
      // if the next charecter is alphanumeric, then we are dealing with a symbol
      if (i + 1 < n && isAlphanumeric(str[i + 1])) {
        let v = "";
        i++;
        // read until whitespace
        while (i < n && !isWhitespace(str[i])) {
          v += str[i];
          i++;
        }
        tokens.push({ t: "symbol", v });
        continue;
      }
      if (i + 1 < n && str[i + 1] === "(") {
        tokens.push({ t: "sc", v: "#(" });
        i += 2;
        continue;
      }
      throw new TokenError(`Expected #( or symbol after # at index ${i}`);
    }
    if (str[i] === "~") {
      if (i + 1 < n && str[i + 1] === "~") {
        tokens.push({ t: "sc", v: "~~" });
        i += 2;
        continue;
      }
      if (i + 1 < n && str[i + 1] === "=") {
        tokens.push({ t: "sc", v: "~=" });
        i += 2;
        continue;
      }
      throw new TokenError(`Expected =~ or ~~ after ~ at index ${i}`);
    }
    // Handle negative numbers
    if (
      isNumber(str[i]) || (str[i] === "-" && i + 1 < n && isNumber(str[i + 1]))
    ) {
      let v = "";
      let foundRadix = false;
      let foundExponent = false;
      let foundDot = false;
      let foundMinus = false;
      while (i < n) {
        if (str[i] === "r") {
          if (foundRadix) {
            throw new TokenError(
              `Multiple radix specifiers in number at index ${i}`,
            );
          }
          foundRadix = true;
          v += "r";
          i++;
          continue;
        }
        if (str[i] === "e") {
          if (foundExponent) {
            throw new TokenError(
              `Multiple exponent specifiers in number at index ${i}`,
            );
          }
          v += "e";
          i++;
          foundExponent = true;
          foundMinus = false; // Allow negative exponents
          continue;
        }
        if (str[i] === "." && i + 1 < n && isAlphanumeric(str[i + 1])) {
          if (foundDot) break;
          foundDot = true;
          v += ".";
          i++;
          continue;
        }
        if (str[i] === "-") {
          if (foundMinus) break;
          foundMinus = true;
          v += "-";
          i++;
          continue;
        }
        if (!isAlphanumeric(str[i])) {
          break;
        }
        v += str[i];
        i++;
      }
      tokens.push({ t: "number", v: parseNumber(v).toString() });
      continue;
    }
    if (str[i] === "-") {
      // After we have checked for negative numbers, we can safely assume that this is a subtraction operator
      tokens.push({ t: "sc", v: "-" });
      i++;
      continue;
    }
    // if we get here, then we have an error
    throw new Error(`Unknown character: ${str[i]} at index ${i}`);
  }
  return { tokens, i };
}
// Converts a string to decimal number format
// Can be the following formats:
// 123
// 123.456
// 123.456e789
// 123.456e-789
// 8r123 where 8 is the radix
// 8r123.456
// 8r123.456e789
// 8r123.456e-789
// 16r1AB
// 16r1AB.CDEF
// 16r1AB.CDEFe789
// 16r1AB.CDEFe-789
function parseNumber(str: string): number {
  // Check if it's a radix number
  const rIndex = str.indexOf("r");
  if (rIndex !== -1) {
    // Parse radix
    const radixStr = str.substring(0, rIndex);
    const radix = parseInt(radixStr, 10);

    // Split remaining parts
    const rest = str.substring(rIndex + 1);
    const eIndex = rest.indexOf("e");
    const dotIndex = rest.indexOf(".");

    // Parse integer part
    let integerPart = eIndex !== -1
      ? rest.substring(0, dotIndex !== -1 ? dotIndex : eIndex)
      : rest.substring(0, dotIndex !== -1 ? dotIndex : rest.length);

    let result = 0;
    let isNegative = false;
    if (integerPart[0] === "-") {
      isNegative = true;
      integerPart = integerPart.substring(1);
    }
    // Convert integer part using the radix
    for (let i = 0; i < integerPart.length; i++) {
      const digit = parseInt(integerPart[i], radix); // Using base36 to convert A-Z
      if (digit >= radix) {
        throw new Error(`Invalid digit for radix ${radix}: ${integerPart[i]}`);
      }
      result = result * radix + digit;
    }

    // Handle fractional part if exists
    if (dotIndex !== -1) {
      const fractionalPart = eIndex !== -1
        ? rest.substring(dotIndex + 1, eIndex)
        : rest.substring(dotIndex + 1);

      for (let i = 0; i < fractionalPart.length; i++) {
        const digit = parseInt(fractionalPart[i], radix);
        if (digit >= radix) {
          throw new Error(
            `Invalid digit for radix ${radix}: ${fractionalPart[i]}`,
          );
        }
        result += digit * Math.pow(radix, -(i + 1));
      }
    }

    // Handle exponent if exists
    if (eIndex !== -1) {
      const exponent = parseInt(rest.substring(eIndex + 1), 10);
      result *= Math.pow(radix, exponent);
    }

    return isNegative ? -result : result;
  }

  // Handle regular decimal numbers
  const eIndex = str.indexOf("e");
  if (eIndex !== -1) {
    const base = parseFloat(str.substring(0, eIndex));
    const exponent = parseInt(str.substring(eIndex + 1), 10);
    return base * Math.pow(10, exponent);
  }

  // Simple decimal number
  return parseFloat(str);
}

function isWhitespace(ch: string) {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

const isAlphanumeric = (char: string): boolean => {
  return /^[a-zA-Z0-9]$/.test(char);
};
const isAlpha = (char: string): boolean => {
  return /^[a-zA-Z]$/.test(char);
};
const isNumber = (char: string): boolean => {
  return /^[0-9]$/.test(char);
};
