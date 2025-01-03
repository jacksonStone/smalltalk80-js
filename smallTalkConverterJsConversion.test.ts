// Using the Deno Test tool

import { assertEquals } from "@std/assert";
import { convertSmalltalkToJavaScript } from "./smallTalkConverter.ts";

Deno.test("should parse empty string", () => {
  assertEquals(convertSmalltalkToJavaScript(""), "");
});
Deno.test("should parse string", () => {
    assertEquals(convertSmalltalkToJavaScript("`hello`"), "`hello`");
});
Deno.test("should parse string with backticks", () => {
    assertEquals(convertSmalltalkToJavaScript("`hello```"), "`hello\\``");
});
Deno.test("should parse number", () => {
    assertEquals(convertSmalltalkToJavaScript("123"), "123");
});
Deno.test("should parse number with radix", () => {
    assertEquals(convertSmalltalkToJavaScript("2r11e-2"), "0.75");
});
Deno.test("should parse symbol", () => {
    assertEquals(convertSmalltalkToJavaScript("#hello"), "Symbol.for(`hello`)");
});
Deno.test("should parse comment", () => {
    assertEquals(convertSmalltalkToJavaScript(`"123"`), "// 123");
});

Deno.test("should parse addition", () => {
    assertEquals(convertSmalltalkToJavaScript(`123 + 21`), "123 + 21");
});
Deno.test("maintains whitespace", () => {
    assertEquals(convertSmalltalkToJavaScript(`123 +    21`), "123 +    21");
});