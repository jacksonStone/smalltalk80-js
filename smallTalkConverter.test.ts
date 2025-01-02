// Using the Deno Test tool

import { assertEquals, assertThrows } from "@std/assert";
import { TokenError, tokenizeArray } from "./smallTalkConverter.ts";

Deno.test("should parse empty string", () => {
  assertEquals(tokenizeArray(""), { tokens: [], i: 0 });
});
Deno.test("should parse symbol", () => {
  assertEquals(tokenizeArray("#bill"), {
    tokens: [{ t: "symbol", v: "bill" }],
    i: 5,
  });
});
Deno.test("should parse string", () => {
  assertEquals(tokenizeArray("`1`"), {
    tokens: [{ t: "string", v: "1" }],
    i: 3,
  });
});
Deno.test("should parse char", () => {
  assertEquals(tokenizeArray("$1"), {
    tokens: [{ t: "char", v: "1" }],
    i: 2,
  });
});
Deno.test("should throw with trailing $", () => {
  assertThrows(
    () => tokenizeArray("$"),
    TokenError,
    "Ending with a dollar sign",
  );
});
Deno.test("should parse char $", () => {
  assertEquals(tokenizeArray("$$"), {
    tokens: [{ t: "char", v: "$" }],
    i: 2,
  });
});
Deno.test("should parse arry of strings", () => {
  const testStr = "#(`1`)";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "sc", v: "#(" },
      { t: "string", v: "1" },
      { t: "sc", v: ")" },
    ],
    i: testStr.length,
  });
});
Deno.test("should parse array of two strings", () => {
  const testStr = "#(`1` `2`)";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "sc", v: "#(" },
      { t: "string", v: "1" },
      { t: "string", v: "2" },
      { t: "sc", v: ")" },
    ],
    i: testStr.length,
  });
});
Deno.test("should parse empty array", () => {
  const testStr = "#()";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "sc", v: "#(" },
      { t: "sc", v: ")" },
    ],
    i: testStr.length,
  });
});
Deno.test("should parse array with empty array", () => {
  const testStr = "#(())";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "sc", v: "#(" },
      { t: "sc", v: "(" },
      { t: "sc", v: ")" },
      { t: "sc", v: ")" },
    ],
    i: testStr.length,
  });
});

Deno.test("should parse identifiers", () => {
  const testStr = "#(bill)";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "sc", v: "#(" },
      { t: "identifier", v: "bill" },
      { t: "sc", v: ")" },
    ],
    i: testStr.length,
  });
});
Deno.test("should parse identifiers with numbers", () => {
  const testStr = "bill2";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "identifier", v: "bill2" },
    ],
    i: testStr.length,
  });
});
Deno.test("should parse number", () => {
  const testStr = "2";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "number", v: "2" },
    ],
    i: testStr.length,
  });
});

Deno.test("should throw with trailing <", () => {
  assertThrows(
    () => tokenizeArray("<"),
    TokenError,
    "Ending with a trailing <",
  );
});

Deno.test("should parse addition", () => {
  const testStr = "2 + 2";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "number", v: "2" },
      { t: "sc", v: "+" },
      { t: "number", v: "2" },
    ],
    i: testStr.length,
  });
});

Deno.test("should parse >", () => {
  const testStr = "2 > 2";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "number", v: "2" },
      { t: "sc", v: ">" },
      { t: "number", v: "2" },
    ],
    i: testStr.length,
  });
});

Deno.test("should parse <", () => {
  const testStr = "2 < 2";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "number", v: "2" },
      { t: "sc", v: "<" },
      { t: "number", v: "2" },
    ],
    i: testStr.length,
  });
});

Deno.test("should parse parameters", () => {
  const testStr = "foo bar: 2";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "identifier", v: "foo" },
      { t: "parameter", v: "bar" },
      { t: "number", v: "2" },
    ],
    i: testStr.length,
  });
});

Deno.test("should parse dot", () => {
  const testStr = "foo <- 1.";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "identifier", v: "foo" },
      { t: "sc", v: "<-" },
      { t: "number", v: "1" },
      { t: "sc", v: "." },
    ],
    i: testStr.length,
  });
});

Deno.test("should parse semicolon", () => {
  const testStr = "Order new add: 1; add: 2";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "identifier", v: "Order" },
      { t: "identifier", v: "new" },
      { t: "parameter", v: "add" },
      { t: "number", v: "1" },
      { t: "sc", v: ";" },
      { t: "parameter", v: "add" },
      { t: "number", v: "2" },
    ],
    i: testStr.length,
  });
});
Deno.test("should parse block argument", () => {
  const testStr = "[ :array | total <- total + array size ]";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "sc", v: "[" },
      { t: "blockArgument", v: "array" },
      { t: "sc", v: "|" },
      { t: "identifier", v: "total" },
      { t: "sc", v: "<-" },
      { t: "identifier", v: "total" },
      { t: "sc", v: "+" },
      { t: "identifier", v: "array" },
      { t: "identifier", v: "size" },
      { t: "sc", v: "]" },
    ],
    i: testStr.length,
  });
});
Deno.test("should parse complex expression: 1", () => {
  const testStr = `
  (number // 2) = 0
      ifTrue: [parity <- 8r377]
      ifFalse: [parity <- 1]
  `;
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "sc", v: "(" },
      { t: "identifier", v: "number" },
      { t: "sc", v: "//" },
      { t: "number", v: "2" },
      { t: "sc", v: ")" },
      { t: "sc", v: "=" },
      { t: "number", v: "0" },
      { t: "parameter", v: "ifTrue" },
      { t: "sc", v: "[" },
      { t: "identifier", v: "parity" },
      { t: "sc", v: "<-" },
      { t: "number", v: "255" },
      { t: "sc", v: "]" },
      { t: "parameter", v: "ifFalse" },
      { t: "sc", v: "[" },
      { t: "identifier", v: "parity" },
      { t: "sc", v: "<-" },
      { t: "number", v: "1" },
      { t: "sc", v: "]" },
    ],
    i: testStr.length,
  });
});

Deno.test("should parse number with radix", () => {
  const testStr = "8r377";
  assertEquals(tokenizeArray(testStr), {
    tokens: [
      { t: "number", v: "255" },
    ],
    i: testStr.length,
  });
});

Deno.test("should parse negative number", () => {
  const testStr = "-123";
  assertEquals(tokenizeArray(testStr), {
    tokens: [{ t: "number", v: "-123" }],
    i: testStr.length,
  });
});

Deno.test("should parse negative number with radix", () => {
  const testStr = "8r-377";
  assertEquals(tokenizeArray(testStr), {
    tokens: [{ t: "number", v: "-255" }],
    i: testStr.length,
  });
});

Deno.test("should parse number with 2 radix and exponent", () => {
  const testStr = "2r11e6";
  assertEquals(tokenizeArray(testStr), {
    tokens: [{ t: "number", v: "192" }],
    i: testStr.length,
  });
});

Deno.test("should parse number with 8 radix", () => {
  const testStr = "8r3";
  assertEquals(tokenizeArray(testStr), {
    tokens: [{ t: "number", v: "3" }],
    i: testStr.length,
  });
});

Deno.test("should parse number with 8 radix and exponent", () => {
  const testStr = "8r3e2";
  assertEquals(tokenizeArray(testStr), {
    tokens: [{ t: "number", v: "192" }],
    i: testStr.length,
  });
});

Deno.test("should parse a negative decimal exponent with 10 radix", () => {
  const testStr = "10r3e-2";
  assertEquals(tokenizeArray(testStr), {
    tokens: [{ t: "number", v: "0.03" }],
    i: testStr.length,
  });
});

Deno.test("should parse a number with radix and a negative value and decimal", () => {
  const testStr = "16r-1.C";
  assertEquals(tokenizeArray(testStr), {
    tokens: [{ t: "number", v: "-1.75" }],
    i: testStr.length,
  });
});
Deno.test("should parse a number with radix and a  value and decimal", () => {
  const testStr = "16rAC.DC";
  assertEquals(tokenizeArray(testStr), {
    tokens: [{ t: "number", v: "172.859375" }],
    i: testStr.length,
  });
});
Deno.test("should parse a negative decimal exponent", () => {
  const testStr = "3e-2";
  assertEquals(tokenizeArray(testStr), {
    tokens: [{ t: "number", v: "0.03" }],
    i: testStr.length,
  });
});